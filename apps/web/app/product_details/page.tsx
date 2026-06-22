import { redirect } from "next/navigation";

/**
 * This route is kept for backwards compatibility.
 * All product detail pages are now served via /product_detail_desktop
 */
export default function ProductDetailsPage() {
  redirect("/product_detail_desktop");
}
