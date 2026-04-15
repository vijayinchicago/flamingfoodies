import { ImageResponse } from "next/og";

export const runtime = "edge";

const cuisinePalettes = {
  american: {
    background: "linear-gradient(135deg, #1a0f0b 0%, #5b2112 45%, #9a3412 100%)",
    glow: "#fb923c",
    accent: "#fde68a",
    surface: "#2d160f",
    garnish: "#86efac",
    sauce: "#f97316"
  },
  mexican: {
    background: "linear-gradient(135deg, #1a1510 0%, #4d2715 45%, #9a3412 100%)",
    glow: "#f97316",
    accent: "#fef08a",
    surface: "#30160d",
    garnish: "#6ee7b7",
    sauce: "#dc2626"
  },
  thai: {
    background: "linear-gradient(135deg, #102018 0%, #1d4d35 45%, #0f766e 100%)",
    glow: "#34d399",
    accent: "#fde68a",
    surface: "#0f241c",
    garnish: "#86efac",
    sauce: "#f59e0b"
  },
  korean: {
    background: "linear-gradient(135deg, #160c0d 0%, #571c1f 48%, #b91c1c 100%)",
    glow: "#fb7185",
    accent: "#fecaca",
    surface: "#250d10",
    garnish: "#fcd34d",
    sauce: "#ef4444"
  },
  jamaican: {
    background: "linear-gradient(135deg, #17150d 0%, #3f3a0f 40%, #166534 100%)",
    glow: "#facc15",
    accent: "#fef08a",
    surface: "#162010",
    garnish: "#86efac",
    sauce: "#f97316"
  },
  szechuan: {
    background: "linear-gradient(135deg, #150f16 0%, #3b1d4f 40%, #7c2d12 100%)",
    glow: "#fb7185",
    accent: "#e9d5ff",
    surface: "#24122a",
    garnish: "#c4b5fd",
    sauce: "#ef4444"
  },
  italian: {
    background: "linear-gradient(135deg, #16120f 0%, #3f2318 40%, #7c2d12 100%)",
    glow: "#fb923c",
    accent: "#fecaca",
    surface: "#241612",
    garnish: "#86efac",
    sauce: "#dc2626"
  },
  filipino: {
    background: "linear-gradient(135deg, #1a100d 0%, #5b2915 42%, #0f766e 100%)",
    glow: "#fb923c",
    accent: "#fef08a",
    surface: "#24140f",
    garnish: "#99f6e4",
    sauce: "#f97316"
  },
  greek: {
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 44%, #0f766e 100%)",
    glow: "#93c5fd",
    accent: "#e0f2fe",
    surface: "#132033",
    garnish: "#bbf7d0",
    sauce: "#f59e0b"
  },
  turkish: {
    background: "linear-gradient(135deg, #180d0d 0%, #7f1d1d 44%, #b45309 100%)",
    glow: "#fca5a5",
    accent: "#fde68a",
    surface: "#2b1212",
    garnish: "#fcd34d",
    sauce: "#ef4444"
  },
  brazilian: {
    background: "linear-gradient(135deg, #102018 0%, #166534 42%, #f59e0b 100%)",
    glow: "#86efac",
    accent: "#fef08a",
    surface: "#143122",
    garnish: "#fde68a",
    sauce: "#f97316"
  },
  nigerian: {
    background: "linear-gradient(135deg, #160d0c 0%, #7c2d12 42%, #166534 100%)",
    glow: "#fb923c",
    accent: "#fef08a",
    surface: "#251310",
    garnish: "#86efac",
    sauce: "#dc2626"
  },
  malaysian: {
    background: "linear-gradient(135deg, #15120d 0%, #7c2d12 42%, #1d4d35 100%)",
    glow: "#f59e0b",
    accent: "#fde68a",
    surface: "#221712",
    garnish: "#86efac",
    sauce: "#ef4444"
  },
  cajun: {
    background: "linear-gradient(135deg, #17130f 0%, #4a2711 40%, #92400e 100%)",
    glow: "#f59e0b",
    accent: "#fde68a",
    surface: "#27160d",
    garnish: "#bbf7d0",
    sauce: "#f97316"
  },
  other: {
    background: "linear-gradient(135deg, #111318 0%, #1f2937 42%, #4b5563 100%)",
    glow: "#f59e0b",
    accent: "#f8fafc",
    surface: "#161b22",
    garnish: "#a7f3d0",
    sauce: "#fb923c"
  }
} as const;

type Palette = (typeof cuisinePalettes)[keyof typeof cuisinePalettes];

function normalizeCuisine(value: string | null) {
  const normalized = value?.toLowerCase().replace(/\s+/g, "_");
  return (normalized && normalized in cuisinePalettes
    ? normalized
    : "other") as keyof typeof cuisinePalettes;
}

function detectDishKind(title: string) {
  const value = title.toLowerCase();

  if (value.includes("taco")) return "tacos";
  if (value.includes("noodle") || value.includes("ramen") || value.includes("pasta"))
    return "noodles";
  if (value.includes("sandwich")) return "sandwich";
  if (value.includes("burger")) return "burger";
  if (value.includes("skewer")) return "skewers";
  if (value.includes("salmon") || value.includes("fish") || value.includes("seafood"))
    return "seafood";
  if (value.includes("dumpling")) return "dumplings";
  if (value.includes("meatball")) return "meatballs";
  if (value.includes("cauliflower") || value.includes("traybake")) return "traybake";
  if (value.includes("curry")) return "curry";

  return "plate";
}

function heatBadgeLabel(value: string | null) {
  switch ((value || "").toLowerCase()) {
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

function renderDish(kind: string, palette: Palette) {
  const plateBase = {
    position: "absolute" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999
  };

  if (kind === "tacos") {
    return (
      <div style={{ position: "relative", width: 420, height: 300, display: "flex" }}>
        {[0, 1, 2].map((index) => (
          <div
            key={`taco-${index}`}
            style={{
              ...plateBase,
              width: 170,
              height: 110,
              top: 96 + index * 18,
              left: 26 + index * 90,
              background: "#f8d38d",
              border: "10px solid rgba(0,0,0,0.08)",
              transform: `rotate(${index * 8 - 10}deg)`,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 130,
                height: 54,
                borderRadius: 999,
                background: "#7c2d12",
                top: 30
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 120,
                height: 20,
                borderRadius: 999,
                background: palette.garnish,
                top: 22
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 90,
                height: 18,
                borderRadius: 999,
                background: "#fef3c7",
                top: 55
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (kind === "noodles") {
    return (
      <div style={{ position: "relative", width: 420, height: 320 }}>
        <div
          style={{
            ...plateBase,
            width: 320,
            height: 320,
            left: 50,
            top: 0,
            background: "#f5efe8",
            border: "16px solid rgba(0,0,0,0.12)"
          }}
        />
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={`noodle-${index}`}
            style={{
              position: "absolute",
              width: 190 + index * 12,
              height: 84 - index * 8,
              left: 108 - index * 6,
              top: 90 + index * 22,
              borderRadius: 999,
              border: `10px solid ${index % 2 === 0 ? "#f59e0b" : palette.sauce}`,
              borderColor: `${index % 2 === 0 ? "#f59e0b" : palette.sauce} transparent transparent transparent`,
              transform: `rotate(${index * 9 - 18}deg)`
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 16,
            left: 152,
            top: 126,
            borderRadius: 999,
            background: palette.garnish,
            transform: "rotate(18deg)"
          }}
        />
      </div>
    );
  }

  if (kind === "sandwich" || kind === "burger") {
    return (
      <div style={{ position: "relative", width: 400, height: 300 }}>
        <div
          style={{
            ...plateBase,
            width: 320,
            height: 220,
            left: 40,
            top: 50,
            background: "#f3f4f6",
            border: "12px solid rgba(0,0,0,0.12)"
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 70,
            left: 90,
            top: 88,
            borderRadius: "999px 999px 120px 120px",
            background: "#f4c270"
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 210,
            height: 24,
            left: 95,
            top: 150,
            borderRadius: 999,
            background: palette.garnish
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 208,
            height: 34,
            left: 96,
            top: 171,
            borderRadius: 16,
            background: "#7c2d12"
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 28,
            left: 90,
            top: 208,
            borderRadius: 16,
            background: "#f4c270"
          }}
        />
      </div>
    );
  }

  if (kind === "skewers") {
    return (
      <div style={{ position: "relative", width: 420, height: 300 }}>
        {[0, 1, 2].map((index) => (
          <div
            key={`skewer-${index}`}
            style={{
              position: "absolute",
              width: 260,
              height: 10,
              left: 88 - index * 8,
              top: 90 + index * 54,
              background: "#c08457",
              transform: `rotate(${index * 8 - 10}deg)`
            }}
          />
        ))}
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2, 3].map((index) => (
            <div
              key={`piece-${row}-${index}`}
              style={{
                position: "absolute",
                width: 46,
                height: 46,
                left: 118 + index * 48 - row * 10,
                top: 70 + row * 54 + (index % 2) * 4,
                borderRadius: 16,
                background: index % 2 === 0 ? palette.sauce : "#fb923c",
                transform: `rotate(${index * 7 - 10}deg)`,
                border: "4px solid rgba(255,255,255,0.15)"
              }}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: 420, height: 320 }}>
      <div
        style={{
          ...plateBase,
          width: 320,
          height: 320,
          left: 50,
          top: 0,
          background: "#f5efe8",
          border: "16px solid rgba(0,0,0,0.12)"
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 120,
          left: 100,
          top: 112,
          borderRadius: 48,
          background: palette.sauce,
          transform: "rotate(-8deg)"
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 140,
          height: 30,
          left: 138,
          top: 104,
          borderRadius: 999,
          background: palette.garnish,
          transform: "rotate(8deg)"
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 118,
          height: 24,
          left: 150,
          top: 220,
          borderRadius: 999,
          background: "#fde68a"
        }}
      />
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "FlamingFoodies Recipe";
  const cuisineKey = normalizeCuisine(searchParams.get("cuisine"));
  const cuisineLabel = searchParams.get("cuisine") || "Recipe";
  const heat = searchParams.get("heat") || "Flavor First";
  const subtitle = searchParams.get("subtitle") || "Spicy cooking done right";
  const palette = cuisinePalettes[cuisineKey];
  const dishKind = detectDishKind(title);

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
              "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.08), transparent 24%), radial-gradient(circle at 84% 14%, rgba(255,255,255,0.06), transparent 22%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.18), transparent 30%)"
          }}
        />

        <div
          style={{
            width: "47%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.9
            }}
          >
            <span>{cuisineLabel}</span>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: palette.accent
              }}
            />
            <span>Recipe Hero</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 72,
                lineHeight: 1,
                fontWeight: 800,
                maxWidth: "92%"
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                maxWidth: "92%",
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
              {heatBadgeLabel(heat)}
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
            width: "43%",
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
              width: 380,
              height: 380,
              borderRadius: 999,
              background: palette.glow,
              opacity: 0.18,
              filter: "blur(18px)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 420,
              height: 420,
              borderRadius: 999,
              background: palette.surface,
              opacity: 0.58
            }}
          />
          {renderDish(dishKind, palette)}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
