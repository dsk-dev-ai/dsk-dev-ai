import { data } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  return Response.json(data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
