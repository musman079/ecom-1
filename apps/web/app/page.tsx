import { HomePageClient } from "../src/components/home/home-page-client";
import { listPublicProducts } from "../src/lib/products";
import type { ProductCardData } from "../src/components/product-card";

function formatDashboardPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function Home() {
  let newArrivals: ProductCardData[] = [];
  let bestSellers: ProductCardData[] = [];

  try {
    const result = await listPublicProducts({
      page: 1,
      limit: 16,
      sort: "newest",
    });

    const products = result.products;
    if (products.length > 0) {
      const mapped: ProductCardData[] = products.map((product) => ({
        id: product.id,
        slug: product.slug,
        label: product.categories[0] || "Kinetic Catalog",
        category: product.categories[0] || "Collection",
        name: product.title,
        price: formatDashboardPrice(product.price),
        thumbnail: product.thumbnail || product.image,
      }));

      newArrivals = mapped.slice(0, 4);
      bestSellers = (mapped.length > 4 ? mapped.slice(4, 7) : mapped.slice(0, 3)).map((item) => ({
        ...item,
        label: "Featured",
      }));
    }
  } catch {
    newArrivals = [];
    bestSellers = [];
  }

  return <HomePageClient newArrivals={newArrivals} bestSellers={bestSellers} />;
}
