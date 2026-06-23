import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Conqueror — a family travel map";

const logo = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "theConqueror_logo_dark.png"),
).toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f7f3ec 0%, #e7edee 55%, #cfe2de 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={560} height={560} alt="" />
      </div>
    ),
    { ...size },
  );
}
