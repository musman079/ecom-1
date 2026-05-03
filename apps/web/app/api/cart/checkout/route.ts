/**
 * @deprecated Use POST /api/checkout instead.
 * This route is kept for backwards compatibility only.
 */
import { POST as canonicalCheckoutPost } from "../../checkout/route";

type CheckoutPayload = {
  address?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  paymentMethod?: "card" | "cod";
  notes?: string;
  couponCode?: string;
};

export async function POST(request: Request) {
  let payload: CheckoutPayload;
  try {
    payload = (await request.clone().json()) as CheckoutPayload;
  } catch {
    const response = await canonicalCheckoutPost(request);
    response.headers.set("X-Deprecated", "Use POST /api/checkout instead");
    return response;
  }

  const canonicalPayload = {
    ...payload,
    shippingAddress: payload.shippingAddress ?? payload.address,
  };

  const canonicalRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(canonicalPayload),
  });

  const response = await canonicalCheckoutPost(canonicalRequest);
  response.headers.set("X-Deprecated", "Use POST /api/checkout instead");
  return response;
}
