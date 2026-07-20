import type { Metadata, ResolvingMetadata } from "next";
import { ProductDetail } from "@/components/products/ProductDetail";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  const dbProduct = await prisma.product.findUnique({
    where: { slug },
  });

  if (!dbProduct) {
    return {
      title: "Product Not Found",
    };
  }

  const previousImages = (await parent).openGraph?.images || [];
  const imageUrl = dbProduct.images?.[0] || previousImages[0];

  return {
    title: dbProduct.title,
    description: dbProduct.description.substring(0, 160),
    openGraph: {
      title: dbProduct.title,
      description: dbProduct.description.substring(0, 160),
      url: `https://usolstice.store/products/${slug}`,
      images: imageUrl ? [imageUrl] : previousImages,
    },
    twitter: {
      card: "summary_large_image",
      title: dbProduct.title,
      description: dbProduct.description.substring(0, 160),
      images: imageUrl ? [imageUrl] : previousImages,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  // Fetch product or use dummy data if db not seeded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let product: any = null;

  try {
    const dbProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        categories: { include: { category: true } }
      }
    });

    if (dbProduct) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mainVariant: any = dbProduct.variants?.[0] || {};
      product = {
        id: dbProduct.id,
        slug: dbProduct.slug,
        title: dbProduct.title,
        description: dbProduct.description,
        price: mainVariant.priceInCents ? mainVariant.priceInCents / 100 : 0,
        compareAtPrice: mainVariant.compareAtPriceInCents ? mainVariant.compareAtPriceInCents / 100 : null,
        image: dbProduct.images?.[0] || "",
        images: dbProduct.images || [],
        categories: dbProduct.categories?.map(c => c.category.name) || [],
        brand: dbProduct.collection || "USOLSTICE Exclusive",
        stock: mainVariant.stockQuantity || 0
      };
    }
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
