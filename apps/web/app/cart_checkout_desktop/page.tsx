import { redirect } from "next/navigation";

/**
 * This route is kept for backwards compatibility.
 * The desktop checkout experience is now unified with the main checkout page.
 */
export default function CartCheckoutDesktopPage() {
  redirect("/cart_checkout");
}
