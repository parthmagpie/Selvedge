import { ImageResponse } from "next/og";

export const alt = "Selvedge — Premium Deadstock Textile Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1E2C26 0%, #2A3F36 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: "#F0EADD",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Selvedge
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#C99A4E",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Premium Deadstock, By the Yard
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#F0EADD",
              opacity: 0.8,
              maxWidth: 700,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Rescue pristine fabric from the world&apos;s best mills. Rare
            textiles for indie designers and sustainable brands.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: "#B4623F",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              fontSize: 14,
              color: "#F0EADD",
              opacity: 0.6,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            selvedge.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
