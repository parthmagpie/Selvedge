declare module "sharp" {
  interface SharpInstance {
    resize(options: {
      width?: number;
      height?: number;
      fit?: "cover" | "contain" | "fill" | "inside" | "outside";
      withoutEnlargement?: boolean;
    }): SharpInstance;
    toFile(path: string): Promise<{ width: number; height: number; size: number }>;
  }

  function sharp(input?: string | Buffer): SharpInstance;
  export = sharp;
}
