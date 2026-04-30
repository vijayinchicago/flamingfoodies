import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "FlamingFoodies";
  const eyebrow = searchParams.get("eyebrow") || "FlamingFoodies";
  const subtitle = searchParams.get("subtitle") || "Recipes, reviews, and guides for real kitchens";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "radial-gradient(circle at top left, rgba(244,99,30,0.45), transparent 40%), radial-gradient(circle at bottom right, rgba(230,57,70,0.45), transparent 35%), linear-gradient(135deg, #1A1A1A 0%, #2B1310 55%, #401413 100%)",
          color: "white"
        }}
      >
        <div style={{ fontSize: 44, letterSpacing: 8, textTransform: "uppercase", opacity: 0.82 }}>
          {eyebrow}
        </div>
        <div style={{ fontSize: 86, lineHeight: 1.04, fontWeight: 700, maxWidth: "80%" }}>
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, opacity: 0.8 }}>
          <span>{subtitle}</span>
          <span>flamingfoodies.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
