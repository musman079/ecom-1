/**
 * @deprecated Use POST /api/checkout instead.
 * This route is kept for backwards compatibility only.
 */
import { POST as canonicalCheckoutPost } from "../../checkout/route";

export async function POST(request: Request) {
  const response = await canonicalCheckoutPost(request);
  response.headers.set("X-Deprecated", "Use POST /api/checkout instead");
  return response;
}
