import { getLikeCount, incrementLikeCount } from "@/lib/services/likes";
import { jsonResponse } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: { type: string; id: string } }
) {
  const count = await getLikeCount(params.type, params.id);
  return jsonResponse({ ok: true, count });
}

export async function POST(
  _request: Request,
  { params }: { params: { type: string; id: string } }
) {
  const count = await incrementLikeCount(params.type, params.id);
  return jsonResponse({ ok: true, count });
}
