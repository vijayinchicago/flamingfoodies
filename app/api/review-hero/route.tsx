import { ImageResponse } from "next/og";

export const runtime = "edge";

const palettes = [
  {
    background:
      "linear-gradient(135deg, #1a1414 0%, #2f120f 42%, #581813 100%)",
    glow: "#ff7a18",
    bottle: "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)",
    cap: "#fef3c7",
    labelBg: "#fff7ed",
    labelFg: "#431407",
    accent: "#fb923c"
  },
  {
    background:
      "linear-gradient(135deg, #10161f 0%, #13293d 45%, #1f4e5f 100%)",
    glow: "#38bdf8",
    bottle: "linear-gradient(180deg, #34d399 0%, #0f766e 100%)",
    cap: "#dbeafe",
    labelBg: "#ecfeff",
    labelFg: "#0f172a",
    accent: "#67e8f9"
  },
  {
    background:
      "linear-gradient(135deg, #23130d 0%, #4a2412 45%, #7c2d12 100%)",
    glow: "#fb7185",
    bottle: "linear-gradient(180deg, #ef4444 0%, #991b1b 100%)",
    cap: "#fde68a",
    labelBg: "#fff7ed",
    labelFg: "#3b0a00",
    accent: "#fdba74"
  },
  {
    background:
      "linear-gradient(135deg, #140f1f 0%, #2b1a45 45%, #4c1d95 100%)",
    glow: "#c084fc",
    bottle: "linear-gradient(180deg, #fb7185 0%, #7c3aed 100%)",
    cap: "#f5d0fe",
    labelBg: "#faf5ff",
    labelFg: "#2e1065",
    accent: "#f0abfc"
  }
] as const;

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash);
}

function pickPalette(seed: string) {
  return palettes[hashString(seed) % palettes.length];
}

function formatTitle(value: string) {
  return value.replace(/\s+review$/i, "").trim();
}

function formatCategory(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function getHeatBadge(value: string) {
  switch (value) {
    case "mild":
      return "Mild Heat";
    case "medium":
      return "Medium Heat";
    case "hot":
      return "Hot Heat";
    case "inferno":
      return "Inferno Heat";
    case "reaper":
      return "Reaper Heat";
    default:
      return "Flavor First";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = formatTitle(searchParams.get("title") || "FlamingFoodies Hot Sauce");
  const brand = searchParams.get("brand") || "FlamingFoodies";
  const category = formatCategory(searchParams.get("category") || "hot-sauce");
  const heat = searchParams.get("heat") || "medium";
  const subtitle = searchParams.get("subtitle") || `${category} • ${getHeatBadge(heat)}`;
  const palette = pickPalette(`${brand}:${title}:${category}:${heat}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: palette.background,
          color: "white",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.08), transparent 28%), radial-gradient(circle at 78% 14%, rgba(255,255,255,0.06), transparent 22%), radial-gradient(circle at 50% 100%, rgba(0,0,0,0.18), transparent 35%)"
          }}
        />

        <div
          style={{
            width: "46%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.9
            }}
          >
            <span>{brand}</span>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: palette.accent
              }}
            />
            <span>{category}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 78,
                lineHeight: 1,
                fontWeight: 800,
                maxWidth: "90%"
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.35,
                maxWidth: "90%",
                opacity: 0.82
              }}
            >
              {subtitle}
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 22
              }}
            >
              {getHeatBadge(heat)}
            </div>
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 22
              }}
            >
              flamingfoodies.com
            </div>
          </div>
        </div>

        <div
          style={{
            width: "44%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 360,
              height: 360,
              borderRadius: 999,
              background: palette.glow,
              opacity: 0.22,
              filter: "blur(12px)"
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 66,
              width: 420,
              height: 52,
              borderRadius: 999,
              background: "rgba(0,0,0,0.28)"
            }}
          />
          <div
            style={{
              width: 250,
              height: 610,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start"
            }}
          >
            <div
              style={{
                width: 92,
                height: 84,
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                background: palette.cap,
                border: "3px solid rgba(255,255,255,0.35)",
                borderBottom: "none"
              }}
            />
            <div
              style={{
                width: 70,
                height: 54,
                background: "rgba(255,255,255,0.18)",
                borderLeft: "3px solid rgba(255,255,255,0.2)",
                borderRight: "3px solid rgba(255,255,255,0.2)"
              }}
            />
            <div
              style={{
                width: 248,
                height: 438,
                borderRadius: 34,
                background: palette.bottle,
                border: "3px solid rgba(255,255,255,0.24)",
                boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  top: 22,
                  width: 56,
                  height: 360,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)"
                }}
              />
              <div
                style={{
                  width: 178,
                  minHeight: 196,
                  borderRadius: 24,
                  background: palette.labelBg,
                  color: palette.labelFg,
                  padding: "22px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  textAlign: "center",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.16)"
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    opacity: 0.82
                  }}
                >
                  {brand}
                </div>
                <div
                  style={{
                    fontSize: 30,
                    lineHeight: 1.1,
                    fontWeight: 800
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    textTransform: "uppercase",
                    letterSpacing: 2.5,
                    opacity: 0.8
                  }}
                >
                  {getHeatBadge(heat)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1400,
      height: 900
    }
  );
}
