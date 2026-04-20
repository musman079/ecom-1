import Link from "next/link";
import { CUSTOMER_ROUTES } from "../src/constants/routes";
import { listPublicProducts } from "../src/lib/products";

const navLinks = ["New Arrivals", "Designers", "Editorial", "Archive", "Sustainability"] as const;

const navRoutes: Record<(typeof navLinks)[number], string> = {
  "New Arrivals": CUSTOMER_ROUTES.BROWSE_PRODUCTS,
  Designers: CUSTOMER_ROUTES.BROWSE_PRODUCTS,
  Editorial: CUSTOMER_ROUTES.PRODUCT_DETAILS,
  Archive: CUSTOMER_ROUTES.PRODUCT_DETAILS,
  Sustainability: CUSTOMER_ROUTES.BROWSE_PRODUCTS,
};

const filters = ["Category", "Size", "Color", "Price Range", "Material"];

type DisplayProductCard = {
  id?: string;
  slug?: string;
  label: string;
  name: string;
  price: string;
  image: string;
};

const fallbackNewArrivals: DisplayProductCard[] = [
  {
    label: "Kinetic Lab",
    name: "Structured Wool Blazer",
    price: "$495",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYCbArsFOqPxGlq03JSdqhQIOoQU6vbuIAZ8YlyEadaXVRd7JPq56MexLgniTm5J0O1VbnwSD8wwGc_V91OEumnzsiCuQYU9uwpd2W87PjGvq1IX2e7ZSlz9OvlRNILGlLaMjWOYYy-X5WNwcFS3bys2n04uoveFQwri9I-aiPnwMYKgCdL1lHa2V3MgvB_Yc-jh6ZC8vkZqldFySMYZYYKKU3qryheXIg9GCeqtzkl-kR157bYdMTDUsn6yOurowgtYm2f6_ypZyt",
  },
  {
    label: "Archive Series",
    name: "Polished Chelsea Boots",
    price: "$320",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDxyOv6DIo8zAm5VCuTWNPPCqt_67myzLrpo0181uyDcokg13jBTmPp2vkuSaTTV2M5nIOvOcM5RCzYt7UhjX_2oWs7qjM6KIFuBtTD0PqDTbsufqf-GjgFw2K-UM9KJMHNje9FnuSdfifPPdPrKGscOuzPNVnBv_VphdDqHKAOKHkcAk40mbCUHgtWXMOpi4O62ixACHEZU5dUTBndX5yzpale23YuW2gzB_nSK28LdU_LFNaoM-S2bAhyzH96pmEtqIKf7R8jJRqy",
  },
  {
    label: "Sustainability First",
    name: "Organic Cotton Knit",
    price: "$185",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuASccMpb35t429bezXDi4EhKuOieCSpaAGu73_vPUkC2RVwr2aR5-7xTbA5lJxEaz9Db65gXA7dEA4irVM9Ni-v59XD1li0mMjhQI8LwF08cBgs4sC3OA43sV1EMCm46x_QqLZwDxuUD--fyxbhqIoKOhw1cdzxSjuTARqHxbGqdBhxF5K5kn_DaHImKeuXYRBwRyKFvEWpU8XQ18VJRhmG_YQKJha5hKVLvDqTIQFyYkaOFRCmuXVcQOlYtdlaY7WQvTqZLe6vOJsB",
  },
  {
    label: "Kinetic Lab",
    name: "Raw Indigo Selvedge",
    price: "$210",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDr4tvf-0RRKrgc4NIRHUnTX9E1qyxH2RvrXJ9JQxFsGp8DluhrNdFIJgn3Twrh3N29nGcBIlKJp1NcVNeIsrq2cfY8nyreBmJ6N_pJACkSC_Lr16u8QF9Y2bEoe7Ya02MjnNvhcBhAlv8eIA23fPSWH2RRYzORGX6L_nFifEtEJ4Eblcq2L-6fL02Lo3bJhcV0f-2YWx4yAUQ6gPQdp2S3OTOxmjv7KT4OKKepFQ4-aYDpZQ6gwEgY7l-Iq8xNwhIrxf4apZT-ek2S",
  },
];

const fallbackBestSellers: DisplayProductCard[] = [
  {
    label: "Best Seller",
    name: "Heavy Box Tee",
    price: "$85",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD46zSzWfWyIFbs_U595J3GkOBwqYglYgB6BXQf0w2Ru-HKLQd-TVhQCBZHCqtZvkSeY5Bkl4wb1KTuROse_t2VhEetdB4kS74VJa4NvyKra4RBDTYtYnaAruB5mAO4iaGl3wiPNMwG-An1Sm0s2bEG22VaAisQyD98wEy_yGQm77avKkV5DzeBc5_O2D-UYzhtw_q2aonNmttEx7wDQgfUq8aaG3vBfsnDYpUlFWEbaZMqFVbbp9rN85cuEHye_BlAwKaADswV0atD",
  },
  {
    label: "Best Seller",
    name: "Orbital Frame",
    price: "$240",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA2WsTompm8zco7Euqews9CnE-lsEx6nw_7ouXE_pTL_dYRyZ5jFli2oT_OEtCEciX0GW7ih9xf-WbvNSxGX_ap6hC1cg3e2JdnZVpuoglvZhMtpEN_yBBhDwjdK-RCPpF79D6xsudLQMHaNPdKeAHsp7ZMIf0F_OhxbUAp-rNkt4oFpIE-OU1-nC2v7xND3bV7Xnud9Cs-Cw5nX3iI8Grcc8OOx3vJp_hMVd70v4AEXIGpQBRN7kMS-Y5lCGnkQJAnZiCCn1MxenVl",
  },
  {
    label: "Best Seller",
    name: "Shell L3 Jacket",
    price: "$375",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnZuQKFOihQYtVC2N0zM53U17J7M2KYMKRSWSVJIgFQfNssAM_M0lk5de2dfcPLqmGJthcmCyKsBBlI6iK8a6xxbR1j7IwOD2J0jRRmXd5hUfgTHBvA-fYcJbNfuyks2E5VLYyiGPLq9y1tq8wNEbE7XK-JVRaXR11fJ7S39oZf8I0lzcyqdAvOyi83Dacws4iCRC3qZnInWMDLT7LkF6zQkWdsEHwq_RluCiTVxI8ukFBgrE1tNE7yzviwBPnDd5pHyQD5vnrEeWC",
  },
];

const fallbackImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDYCbArsFOqPxGlq03JSdqhQIOoQU6vbuIAZ8YlyEadaXVRd7JPq56MexLgniTm5J0O1VbnwSD8wwGc_V91OEumnzsiCuQYU9uwpd2W87PjGvq1IX2e7ZSlz9OvlRNILGlLaMjWOYYy-X5WNwcFS3bys2n04uoveFQwri9I-aiPnwMYKgCdL1lHa2V3MgvB_Yc-jh6ZC8vkZqldFySMYZYYKKU3qryheXIg9GCeqtzkl-kR157bYdMTDUsn6yOurowgtYm2f6_ypZyt",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDxyOv6DIo8zAm5VCuTWNPPCqt_67myzLrpo0181uyDcokg13jBTmPp2vkuSaTTV2M5nIOvOcM5RCzYt7UhjX_2oWs7qjM6KIFuBtTD0PqDTbsufqf-GjgFw2K-UM9KJMHNje9FnuSdfifPPdPrKGscOuzPNVnBv_VphdDqHKAOKHkcAk40mbCUHgtWXMOpi4O62ixACHEZU5dUTBndX5yzpale23YuW2gzB_nSK28LdU_LFNaoM-S2bAhyzH96pmEtqIKf7R8jJRqy",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuASccMpb35t429bezXDi4EhKuOieCSpaAGu73_vPUkC2RVwr2aR5-7xTbA5lJxEaz9Db65gXA7dEA4irVM9Ni-v59XD1li0mMjhQI8LwF08cBgs4sC3OA43sV1EMCm46x_QqLZwDxuUD--fyxbhqIoKOhw1cdzxSjuTARqHxbGqdBhxF5K5kn_DaHImKeuXYRBwRyKFvEWpU8XQ18VJRhmG_YQKJha5hKVLvDqTIQFyYkaOFRCmuXVcQOlYtdlaY7WQvTqZLe6vOJsB",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDr4tvf-0RRKrgc4NIRHUnTX9E1qyxH2RvrXJ9JQxFsGp8DluhrNdFIJgn3Twrh3N29nGcBIlKJp1NcVNeIsrq2cfY8nyreBmJ6N_pJACkSC_Lr16u8QF9Y2bEoe7Ya02MjnNvhcBhAlv8eIA23fPSWH2RRYzORGX6L_nFifEtEJ4Eblcq2L-6fL02Lo3bJhcV0f-2YWx4yAUQ6gPQdp2S3OTOxmjv7KT4OKKepFQ4-aYDpZQ6gwEgY7l-Iq8xNwhIrxf4apZT-ek2S",
];

function formatDashboardPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function getCardImage(images: string[] | undefined, index: number) {
  const fromProduct = Array.isArray(images) ? images[0] : null;
  return fromProduct || fallbackImages[index % fallbackImages.length] || fallbackImages[0] || "";
}

export default async function Home() {
  let newArrivals: DisplayProductCard[] = [];
  let bestSellers: DisplayProductCard[] = [];

  try {
    const result = await listPublicProducts({
      page: 1,
      limit: 16,
      sort: "newest",
    });

    const products = result.products;
    if (products.length > 0) {
      const mapped = products.map((product, index) => ({
        id: product.id,
        slug: product.slug,
        label: product.categories[0] || "Kinetic Catalog",
        name: product.title,
        price: formatDashboardPrice(product.price),
        image: getCardImage(product.thumbnail ? [product.thumbnail] : undefined, index),
      }));

      newArrivals = mapped.slice(0, 4);
      bestSellers = (mapped.length > 4 ? mapped.slice(4, 7) : mapped.slice(0, 3)).map((item) => ({
        ...item,
        label: "Best Seller",
      }));
    }
  } catch {
    newArrivals = [];
    bestSellers = [];
  }

  return (
    <div className="min-h-screen bg-[#f3f3f4] text-[#1a1c1c]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 xl:px-12">
          <h1 className="text-3xl font-black tracking-[-0.06em]">KINETIC</h1>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link, idx) => (
              <Link
                key={link}
                href={navRoutes[link]}
                className={`border-b pb-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                  idx === 0
                    ? "border-black text-black"
                    : "border-transparent text-neutral-500 hover:text-black"
                }`}
              >
                {link}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-lg">
            <Link href={CUSTOMER_ROUTES.CART_CHECKOUT} aria-label="Bag">👜</Link>
            <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} aria-label="Favorites">♥</Link>
            <Link href={CUSTOMER_ROUTES.PROFILE} aria-label="Profile">◉</Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        <section className="relative flex h-[88vh] min-h-[700px] items-end overflow-hidden px-6 pb-14 lg:px-16 xl:px-24">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQMt_kCMH_abOeQ2xzVnsFWupcEIh_lmmj-aXsWtqoJXCyJTtKACTzoABStQLENCQkPZ78MJIKvA19LxhatzzCH_W_UJN1Xh9Zo5ULV1t2yMKhvkpNJCsD7xm7luMStpjx2yHxlZxdPT_ivcEO9gSeGoUSUn4CmkA-yYxJqWixH1Z5KycjVVR6SOPK20otzIRIBSNiAV2tX3AEx_EnYXVWA1zv7n3hjJxK5nWZCcw6b2DQHfGRoaXDeqcpeC30-hiOwXbGDTtNlz_C"
            alt="Editorial model"
            className="absolute inset-0 h-full w-full scale-[1.03] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-black/10 to-black/45" />

          <div className="relative max-w-4xl text-white">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
              FW24 Collection
            </p>
            <h2 className="mb-8 text-6xl font-black uppercase italic leading-[0.9] tracking-[-0.06em] sm:text-7xl md:text-8xl xl:text-9xl">
              Kinetic
              <br />
              Energy
            </h2>

            <div className="flex flex-wrap gap-4">
              <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="rounded-full bg-white px-10 py-4 text-sm font-bold text-black transition hover:scale-105">
                Shop Collection
              </Link>
              <Link href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="rounded-full border border-white/20 bg-white/5 px-10 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/15">
                View Editorial
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-[1400px] gap-12 px-6 py-12 xl:px-12">
          <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-72 shrink-0 rounded-xl bg-neutral-50 p-8 lg:flex lg:flex-col">
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.24em]">Filters</h3>
              <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-neutral-400">Refine Selection</p>
            </div>

            <div className="space-y-2">
              {filters.map((item, idx) => (
                <a
                  key={item}
                  href={`${CUSTOMER_ROUTES.BROWSE_PRODUCTS}?filter=${encodeURIComponent(item.toLowerCase())}`}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    idx === 0 ? "text-black" : "text-neutral-400 hover:bg-white"
                  }`}
                >
                  <span>{idx === 0 ? "◈" : "◻"}</span>
                  <span>{item}</span>
                </a>
              ))}
            </div>

            <div className="mt-auto rounded-lg bg-black p-4 text-white">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">Join the movement</p>
              <p className="mt-2 text-xs font-bold">Member access to private sales.</p>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-24">
            <section>
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <h3 className="text-4xl font-black uppercase tracking-[-0.05em]">New Arrivals</h3>
                  <div className="mt-2 h-1 w-12 bg-black" />
                </div>
                <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-xs font-bold uppercase tracking-[0.2em] underline underline-offset-8">
                  Explore All
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
                {newArrivals.map((item) => (
                  <Link
                    key={item.id || item.name}
                    href={`/product_detail_desktop?product=${encodeURIComponent(item.slug || item.id || item.name)}`}
                    className="group cursor-pointer"
                  >
                    <div className="mb-6 aspect-[3/4] overflow-hidden rounded-xl bg-neutral-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-neutral-400">{item.label}</p>
                    <h4 className="mb-2 text-base font-bold tracking-tight">{item.name}</h4>
                    <p className="text-sm font-medium">{item.price}</p>
                  </Link>
                ))}
                {newArrivals.length === 0 ? (
                  <p className="col-span-full text-sm text-neutral-500">No published products available right now.</p>
                ) : null}
              </div>
            </section>

            <section className="-mx-6 bg-neutral-200/50 px-6 py-20 xl:-mx-12 xl:px-12">
              <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                <div className="w-full lg:w-[34%]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">Curated Selection</p>
                  <h3 className="mt-4 text-6xl font-black uppercase leading-[0.9] tracking-[-0.06em]">Best Sellers</h3>
                  <p className="mt-6 max-w-md text-sm leading-7 text-neutral-600">
                    The foundation of the modern wardrobe. These pieces have defined our narrative this season, blending timeless silhouettes with technical mastery.
                  </p>
                  <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="mt-8 inline-block rounded-full bg-gradient-to-br from-[#497cff] to-[#003ea8] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-700/20">
                    View Favorites
                  </Link>
                </div>

                <div className="no-scrollbar flex w-full gap-8 overflow-x-auto pb-2 lg:w-[66%]">
                  {bestSellers.map((item, idx) => (
                    <Link
                      key={item.id || item.name}
                      href={`/product_detail_desktop?product=${encodeURIComponent(item.slug || item.id || item.name)}`}
                      className={`min-w-[280px] ${idx === 2 ? "opacity-40" : ""}`}
                    >
                      <div className="mb-4 aspect-[4/5] overflow-hidden rounded-xl bg-white">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-[0.15em]">{item.name}</h4>
                      <p className="text-xs text-neutral-500">{item.price}</p>
                    </Link>
                  ))}
                  {bestSellers.length === 0 ? (
                    <p className="min-w-[280px] text-sm text-neutral-500">No best-seller data available yet.</p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="grid h-auto grid-cols-1 gap-4 lg:h-[620px] lg:grid-cols-12">
              <article className="group relative overflow-hidden rounded-xl lg:col-span-8">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRPLN47M4q7COyjhEncmHWR2rJa0q6aJcrs6Jbs9P3u05HKz8QDfYvvGWNiAQDaUDwI1eq61JOHWVV67zP7rXJgHktWGSUeTY3iztfTMvKaGHVgDUNq-FAEgg_ioF2Kf15IBR4iP9CY81_YLU2V8_BP0bLBxw1moZc_ajPrXVVdaxZghN_F_CR3JjyiTK5dZP_-0ZQbw9hrA2v7mawcTnOE4PzFKHw3-PdqMAy0wjGq34uGRBq3dwsvevXOsRXurSeFlimI2EWhjsF"
                  alt="Metropolis nomads"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 to-transparent p-10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Editorial</p>
                    <h4 className="mt-2 text-5xl font-black uppercase leading-[0.85] tracking-[-0.05em] text-white">
                      Metropolis
                      <br />
                      Nomads
                    </h4>
                    <Link href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="mt-4 inline-block border-b border-white text-xs font-bold text-white">Read The Story</Link>
                  </div>
                </div>
              </article>

              <article className="rounded-xl bg-black p-10 text-white lg:col-span-4">
                <p className="text-5xl">✦</p>
                <h4 className="mt-6 text-5xl font-black uppercase leading-[0.85] tracking-[-0.05em]">
                  Designed For
                  <br />
                  Motion
                </h4>
                <p className="mt-6 text-sm leading-7 text-white/70">
                  Every stitch is a conscious decision to move forward. Explore the technology behind our FW24 textile selection.
                </p>
                <Link href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="mt-8 inline-block text-xs font-bold uppercase tracking-[0.18em]">
                  Discover Technicals +
                </Link>
              </article>
            </section>
          </div>
        </div>

        <footer className="border-t border-black/5 bg-white">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-4 xl:px-12">
            <div>
              <h5 className="text-2xl font-black">KINETIC</h5>
              <p className="mt-6 max-w-xs text-xs leading-7 tracking-[0.08em] text-neutral-400">
                Defining the future of digital commerce through editorial excellence and motion design.
              </p>
            </div>

            <div className="space-y-4 text-xs tracking-[0.14em] text-neutral-400">
              <h6 className="mb-2 font-bold uppercase text-black">Service</h6>
              <p>Customer Care</p>
              <p>Shipping &amp; Returns</p>
              <p>Privacy Policy</p>
            </div>

            <div className="space-y-4 text-xs tracking-[0.14em] text-neutral-400">
              <h6 className="mb-2 font-bold uppercase text-black">Company</h6>
              <p>Store Locator</p>
              <p>Careers</p>
              <p>Sustainability</p>
            </div>

            <div>
              <h6 className="text-xs font-bold uppercase tracking-[0.2em] text-black">Newsletter</h6>
              <div className="mt-6 flex items-center border-b border-neutral-300 pb-2">
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="w-full bg-transparent text-[10px] font-medium uppercase tracking-[0.2em] placeholder:text-neutral-400 focus:outline-none"
                />
                <a href={CUSTOMER_ROUTES.AUTH} className="text-sm">→</a>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between border-t border-black/5 px-6 py-7 xl:px-12">
            <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400">© 2024 Kinetic Editorial. All Rights Reserved.</p>
            <div className="flex gap-4 text-neutral-400">
              <span>◌</span>
              <span>↗</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
