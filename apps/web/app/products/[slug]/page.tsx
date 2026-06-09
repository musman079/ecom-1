import { ProductDetail } from "@/components/products/ProductDetail";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Fetch product or use dummy data if db not seeded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let product: any = null;

  try {
    product = await prisma.product.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error("Failed to fetch product", error);
  }

  // Use a fallback dummy product for the mockup if not found
  if (!product) {
    product = {
      id: "dummy-1",
      slug,
      title: "Cashmere Turtleneck Sweater",
      description: "The ultimate luxury staple. Knitted from the finest Mongolian cashmere, this turtleneck sweater offers unparalleled softness and warmth. The relaxed silhouette and ribbed trims provide a modern, effortless look that transitions seamlessly from day to night.",
      price: 495,
      compareAtPrice: 550,
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop"
      ],
      categories: ["Clothing", "Knitwear"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
  }

  return <ProductDetail product={product} />;
}
