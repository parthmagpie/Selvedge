import { fal } from "@fal-ai/client";
import { writeFile, mkdir, copyFile } from "fs/promises";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";
import sharp from "sharp";

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 2000;
const PUBLIC_IMAGES_DIR = join(process.cwd(), "public", "images");
const CANDIDATES_DIR = join(process.cwd(), ".runs", "image-candidates");
const MAX_DIMENSION = 1920; // Dimension cap per #957

const FALLBACK_MODEL = "fal-ai/flux-2-pro";

// --- Model Configuration ---

export type ImageType = "hero" | "feature" | "logo" | "og" | "mockup" | "empty-state";

interface ModelConfig {
  modelId: string;
  defaultParams: Record<string, unknown>;
  outputFormat: "jpeg" | "png" | "webp" | "svg";
}

const MODEL_CONFIGS: Record<ImageType, ModelConfig> = {
  hero: {
    modelId: "fal-ai/flux-2-pro",
    defaultParams: { output_format: "jpeg", safety_tolerance: "2" },
    outputFormat: "jpeg",
  },
  feature: {
    modelId: "fal-ai/recraft/v4/pro/text-to-image",
    defaultParams: {},
    outputFormat: "webp",
  },
  logo: {
    modelId: "fal-ai/recraft/v4/pro/text-to-vector",
    defaultParams: {},
    outputFormat: "svg",
  },
  og: {
    modelId: "fal-ai/gpt-image-2",
    defaultParams: { quality: "high", output_format: "png" },
    outputFormat: "png",
  },
  mockup: {
    modelId: "fal-ai/gpt-image-2",
    defaultParams: { quality: "high", output_format: "png" },
    outputFormat: "png",
  },
  "empty-state": {
    modelId: "fal-ai/recraft/v4/pro/text-to-image",
    defaultParams: {},
    outputFormat: "webp",
  },
};

// --- Types ---

export interface GenerateImageOptions {
  type: ImageType;
  prompt: string;
  width: number;
  height: number;
  filename: string;
  altText: string;
  colors?: Array<{ r: number; g: number; b: number }>; // For Recraft models
  outputDir?: string; // Override output directory (default: public/images)
}

export interface ImageResult {
  path: string;
  publicPath: string;
  altText: string;
  fallback: boolean;
  model: string;
  seed?: number;
  prompt?: string;
}

// --- Internal ---

function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.FAL_KEY) return false;
  // Check persistent key file (matches bootstrap preflight detection in state-8)
  try {
    const keyPath = join(homedir(), ".fal", "key");
    const key = readFileSync(keyPath, "utf-8").trim();
    if (key && !key.startsWith("placeholder")) {
      process.env.FAL_KEY = key; // Bridge to env var for fal client
      return false;
    }
  } catch {
    /* ~/.fal/key not readable */
  }
  return true;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDir(dir: string = PUBLIC_IMAGES_DIR): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function callModel(
  modelId: string,
  input: Record<string, unknown>
): Promise<{ url: string; seed?: number }> {
  const result = await fal.subscribe(modelId, { input });
  const data = result.data as { images?: { url: string }[]; seed?: number };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error(`No image URL from ${modelId}`);
  return { url, seed: data.seed };
}

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
}

/**
 * Apply dimension cap (max 1920px longest side) to raster images.
 * SVGs are skipped. Writes to the same path.
 */
async function applyDimensionCap(filePath: string): Promise<void> {
  if (filePath.endsWith(".svg")) return;

  const tempPath = filePath + ".tmp";
  await sharp(filePath)
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFile(tempPath);

  // Rename temp to final
  const fs = await import("fs/promises");
  await fs.rename(tempPath, filePath);
}

/**
 * Write provenance JSON sidecar for a generated candidate (#1272).
 */
function writeProvenance(
  candidatePath: string,
  model: string,
  prompt: string,
  seed: number | undefined
): void {
  const provenance = {
    model,
    prompt,
    prompt_hash: createHash("sha256").update(prompt).digest("hex").slice(0, 16),
    seed: seed ?? null,
    generated_at: new Date().toISOString(),
  };
  const provenancePath = candidatePath.replace(/\.\w+$/, ".provenance.json");
  writeFileSync(provenancePath, JSON.stringify(provenance, null, 2));
}

/**
 * Log fal API error to .runs/fal-api-errors.jsonl (#1261).
 */
function logFalError(
  slot: string,
  model: string,
  httpStatus: number,
  errorBody: string
): void {
  const errorsPath = join(process.cwd(), ".runs", "fal-api-errors.jsonl");
  const entry = {
    slot,
    model,
    http_status: httpStatus,
    error_body: errorBody.slice(0, 500),
    attempted_at: new Date().toISOString(),
  };
  const fs = require("fs");
  fs.appendFileSync(errorsPath, JSON.stringify(entry) + "\n");
}

// --- Public API ---

/**
 * Generate an image using the optimal model for the image type.
 * Falls back to FLUX.2 Pro if the specialized model fails,
 * then to SVG placeholder if all API calls fail.
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<ImageResult> {
  const { type, prompt, width, height, filename, altText, colors, outputDir } = options;
  const config = MODEL_CONFIGS[type];
  const targetDir = outputDir ?? PUBLIC_IMAGES_DIR;
  const filePath = join(targetDir, filename);
  const publicPath = outputDir ? `${outputDir}/${filename}` : `/images/${filename}`;

  await ensureDir(targetDir);

  if (isDemoMode()) {
    return generateSvgPlaceholder({ width, height, filename, altText, outputDir: targetDir });
  }

  // Build model-specific input
  const input: Record<string, unknown> = {
    prompt,
    ...config.defaultParams,
  };

  // Align to 16-pixel multiples (required by GPT-Image-2; harmless for other models)
  const alignedW = Math.round(width / 16) * 16;
  const alignedH = Math.round(height / 16) * 16;
  input.image_size = { width: alignedW, height: alignedH };

  // Recraft color support
  if (colors && config.modelId.includes("recraft")) {
    input.colors = colors;
  }

  // Try specialized model, then fallback to FLUX, then SVG
  const modelsToTry =
    config.modelId === FALLBACK_MODEL
      ? [config.modelId]
      : [config.modelId, FALLBACK_MODEL];

  for (const modelId of modelsToTry) {
    const modelInput =
      modelId === FALLBACK_MODEL && modelId !== config.modelId
        ? {
            prompt,
            image_size: { width: alignedW, height: alignedH },
            output_format: "jpeg",
            safety_tolerance: "2",
          }
        : input;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { url: imageUrl, seed } = await callModel(modelId, modelInput);
        await downloadToFile(imageUrl, filePath);
        await applyDimensionCap(filePath);

        // Write provenance for candidates
        if (outputDir) {
          writeProvenance(filePath, modelId, prompt, seed);
        }

        return {
          path: filePath,
          publicPath,
          altText,
          fallback: false,
          model: modelId,
          seed,
          prompt,
        };
      } catch (error) {
        const err = error as Error & { status?: number };
        if (err.status) {
          logFalError(filename.split("-")[0], modelId, err.status, err.message);
        }

        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
        } else if (modelId !== FALLBACK_MODEL) {
          console.warn(`${modelId} failed for ${filename}, trying fallback...`);
          break; // Move to fallback model
        }
      }
    }
  }

  console.warn(`All models failed for ${filename}, using SVG placeholder`);
  return generateSvgPlaceholder({ width, height, filename, altText, outputDir: targetDir });
}

/**
 * Generate a themed SVG placeholder at the same file path.
 */
export async function generateSvgPlaceholder(options: {
  width: number;
  height: number;
  filename: string;
  altText: string;
  outputDir?: string;
}): Promise<ImageResult> {
  const { width, height, filename, altText, outputDir } = options;
  const targetDir = outputDir ?? PUBLIC_IMAGES_DIR;
  const svgFilename = filename.replace(/\.\w+$/, ".svg");
  const filePath = join(targetDir, svgFilename);
  const publicPath = outputDir ? `${outputDir}/${svgFilename}` : `/images/${svgFilename}`;

  await ensureDir(targetDir);

  // Selvedge-themed placeholder with brand colors
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E2C26;stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:#1E2C26;stop-opacity:0.05"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#F0EADD"/>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width * 0.3}" cy="${height * 0.4}" r="${Math.min(width, height) * 0.15}" fill="#B4623F" opacity="0.12"/>
  <circle cx="${width * 0.7}" cy="${height * 0.6}" r="${Math.min(width, height) * 0.2}" fill="#C99A4E" opacity="0.08"/>
</svg>`;

  await writeFile(filePath, svg, "utf-8");
  return {
    path: filePath,
    publicPath,
    altText,
    fallback: true,
    model: "svg-placeholder",
  };
}

/**
 * Copy winning candidate to public/images with dimension cap applied.
 */
export async function copyWinnerToPublic(
  candidatePath: string,
  publicFilename: string
): Promise<void> {
  await ensureDir(PUBLIC_IMAGES_DIR);
  const destPath = join(PUBLIC_IMAGES_DIR, publicFilename);
  await copyFile(candidatePath, destPath);
  await applyDimensionCap(destPath);
}
