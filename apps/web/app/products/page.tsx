import { ProductListing } from "../../src/components/products/ProductListing";
import { listPublicProducts } from "../../src/lib/products";
import type { ProductCardData } from "../../src/components/products/ProductCard";

export const dynamic = "force-dynamic";

function formatDashboardPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ProductsPage() {
  let initialProducts: ProductCardData[] = [];

  try {
    const result = await listPublicProducts({
      page: 1,
      limit: 12,
      sort: "newest",
    });

    if (result.products.length > 0) {
      initialProducts = result.products.map((product) => ({
        id: product.id,
        slug: product.slug,
        label: product.categories[0] || "",
        category: product.categories[0] || "",
        name: product.title,
        price: formatDashboardPrice(product.price),
        thumbnail: product.thumbnail || product.image,
      }));
    }
  } catch (error) {
    console.error("Error fetching products", error);
  }

  return <ProductListing initialProducts={initialProducts} />;
}
