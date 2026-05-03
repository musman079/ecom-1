/**
 * @deprecated Use DELETE /api/cart?productId=... instead.
 * This route is kept for backwards compatibility only.
 */
import { DELETE as canonicalCartDelete } from "../route";

export async function POST(request: Request) {
  let productId: string | undefined;
  try {
    const payload = (await request.json()) as { productId?: string };
    productId = payload.productId;
  } catch {
    productId = undefined;
  }

  const url = new URL(request.url);
  if (productId) {
    url.searchParams.set("productId", productId);
  }

  const canonicalRequest = new Request(url, {
    method: "DELETE",
    headers: request.headers,
  });

  const response = await canonicalCartDelete(canonicalRequest);
  response.headers.set("X-Deprecated", "Use DELETE /api/cart?productId=... instead");
  return response;
}
