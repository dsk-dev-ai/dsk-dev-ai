import { ImageResponse } from "next/og";
import { SITE, data } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#070b14",
          color: "#e7edf8",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                border: "2px solid #6c8cff",
                background: "#6c8cff26",
                color: "#6c8cff",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              dk
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#93a4c3" }}>
              {SITE.domain}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: 9999,
              border: "1px solid #34d39966",
              background: "#34d3991a",
              color: "#34d399",
              fontSize: 24,
            }}
          >
            open source
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -3,
            }}
          >
            Darshan Kachare
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 46,
              color: "#8aa4ff",
              fontWeight: 600,
            }}
          >
            builds AI infrastructure &amp; systems
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #1e2a44",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", gap: 44, fontSize: 30, color: "#93a4c3" }}>
            <div style={{ display: "flex" }}>{data.stats.merged_prs_total} merged PRs</div>
            <div style={{ display: "flex" }}>{data.profile.public_repos} public repos</div>
            <div style={{ display: "flex" }}>
              {data.profile.stars} stars
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#6c8cff" }}>
            {SITE.title}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
