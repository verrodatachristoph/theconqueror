import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Conqueror";

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="9.5" fill="none" stroke="#2f6f6a" stroke-width="1.8"/>
  <path d="M16 6.5a13 13 0 0 1 0 19" fill="none" stroke="#2f6f6a" stroke-width="1.2" opacity="0.6"/>
  <path d="M6.5 16h19" stroke="#2f6f6a" stroke-width="1.2" opacity="0.6"/>
  <path d="M6.8 11.5C11 8 21 8 25.2 11.5" fill="none" stroke="#c2784f" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="2.1" fill="#c2784f"/>
</svg>`;

export default function Image() {
  const logo = `data:image/svg+xml,${encodeURIComponent(LOGO)}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "linear-gradient(135deg, #f7f3ec 0%, #e7edee 55%, #cfe2de 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={150} height={150} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, fontWeight: 700, color: "#2b2723", letterSpacing: "-0.02em" }}>
              The Conqueror
            </div>
            <div style={{ fontSize: 40, color: "#8c8378", marginTop: 8 }}>
              Wo die Familie schon überall war.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "18px", marginTop: "56px", fontSize: 56 }}>
          <span>🗺️</span>
          <span>✈️</span>
          <span>📍</span>
          <span>📸</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
