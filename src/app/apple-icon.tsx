import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="9.5" fill="none" stroke="#2f6f6a" stroke-width="1.8"/>
  <path d="M16 6.5a13 13 0 0 1 0 19" fill="none" stroke="#2f6f6a" stroke-width="1.2" opacity="0.6"/>
  <path d="M6.5 16h19" stroke="#2f6f6a" stroke-width="1.2" opacity="0.6"/>
  <path d="M6.8 11.5C11 8 21 8 25.2 11.5" fill="none" stroke="#c2784f" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="2.1" fill="#c2784f"/>
</svg>`;

export default function AppleIcon() {
  const logo = `data:image/svg+xml,${encodeURIComponent(LOGO)}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f4f0e9 0%, #cfe2de 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={120} height={120} alt="" />
      </div>
    ),
    { ...size },
  );
}
