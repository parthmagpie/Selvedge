import { ImageResponse } from "next/og";

export const size = { width: 128, height: 128 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 72,
          background: "#1E2C26",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F0EADD",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
