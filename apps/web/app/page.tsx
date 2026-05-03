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
  category: string;
  name: string;
  price: string;
  thumbnail?: string | null;
};
const cardTones = [
  "from-[#15233b] via-[#101b31] to-[#0e1728]",
  "from-[#1a2340] via-[#111a31] to-[#0c1527]",
  "from-[#143039] via-[#10242d] to-[#0b1b23]",
  "from-[#261a3f] via-[#191230] to-[#100c21]",
] as const;

function formatDashboardPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function getCardTone(index: number) {
  return cardTones[index % cardTones.length];
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
      const mapped = products.map((product) => ({
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

  return (
    <div className="min-h-screen bg-[#070d17] text-[#eaf2ff]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1627]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 xl:px-12">
          <h1 className="text-3xl font-black tracking-[-0.06em] text-white">KINETIC</h1>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link, idx) => (
              <Link
                key={link}
                href={navRoutes[link]}
                className={`border-b pb-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                  idx === 0
                    ? "border-[#65f3de] text-white"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                {link}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-lg">
            <Link href={CUSTOMER_ROUTES.CART_CHECKOUT} aria-label="Bag">
              <span className="material-symbols-outlined">shopping_bag</span>
            </Link>
            <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} aria-label="Favorites">
              <span className="material-symbols-outlined">favorite</span>
            </Link>
            <Link href={CUSTOMER_ROUTES.PROFILE} aria-label="Profile">
              <span className="material-symbols-outlined">person</span>
            </Link>
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
          <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-72 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl lg:flex lg:flex-col">
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.24em]">Filters</h3>
              <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-white/50">Refine Selection</p>
            </div>

            <div className="space-y-2">
              {filters.map((item, idx) => (
                <a
                  key={item}
                  href={`${CUSTOMER_ROUTES.BROWSE_PRODUCTS}?filter=${encodeURIComponent(item.toLowerCase())}`}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    idx === 0 ? "text-white" : "text-white/55 hover:bg-white/5"
                  }`}
                >
                  <span>{idx === 0 ? "◈" : "◻"}</span>
                  <span>{item}</span>
                </a>
              ))}
            </div>

            <div className="mt-auto rounded-lg border border-white/10 bg-[#081222] p-4 text-white">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">Join the movement</p>
              <p className="mt-2 text-xs font-bold">Member access to private sales.</p>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-24">
            <section>
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <h3 className="text-4xl font-black uppercase tracking-[-0.05em] text-white">New Arrivals</h3>
                  <div className="mt-2 h-1 w-12 bg-[#65f3de]" />
                </div>
                <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-xs font-bold uppercase tracking-[0.2em] text-[#65f3de] underline underline-offset-8">
                  Explore All
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
                {newArrivals.map((item, idx) => (
                  <Link
                    key={item.id || item.name}
                    href={`/product_detail_desktop?product=${encodeURIComponent(item.slug || item.id || item.name)}`}
                    className="group cursor-pointer"
                  >
                    <div className={`relative mb-6 flex aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br ${getCardTone(idx)} p-6`}>
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                            No Image
                          </div>
                        </div>
                      )}
                      <div className={`absolute inset-0 ${item.thumbnail ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent" : "bg-black/10"}`} />
                      <div className="relative flex h-full w-full flex-col justify-between rounded-[1.25rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-500 group-hover:-translate-y-0.5">
                        <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
                          <span>{item.label}</span>
                          <span>{item.price}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">{item.category}</p>
                          <h4 className="mt-3 text-2xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-white">
                            {item.name}
                          </h4>
                        </div>
                      </div>
                    </div>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/55">{item.label}</p>
                    <h4 className="mb-2 text-base font-bold tracking-tight text-white">{item.name}</h4>
                    <p className="text-sm font-medium text-white/85">{item.price}</p>
                  </Link>
                ))}
                {newArrivals.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-8 text-sm text-neutral-600">
                    No published products available right now. Publish items in admin to populate this section.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="-mx-6 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20 backdrop-blur-xl xl:-mx-12 xl:px-12">
              <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                <div className="w-full lg:w-[34%]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Curated Selection</p>
                  <h3 className="mt-4 text-6xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white">Featured Picks</h3>
                  <p className="mt-6 max-w-md text-sm leading-7 text-white/70">
                    The foundation of the modern wardrobe. These pieces are pulled directly from published catalog data, so the storefront feels aligned with the inventory behind it.
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
                        className={`group min-w-[280px] ${idx === 2 ? "opacity-40" : ""}`}
                    >
                        <div className={`mb-4 relative flex aspect-[4/5] items-end overflow-hidden rounded-xl bg-gradient-to-br ${getCardTone(idx + 1)} p-5`}>
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                                loading="lazy"
                                decoding="async"
                              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                                  No Image
                                </div>
                              </div>
                            )}
                            <div className={`absolute inset-0 ${item.thumbnail ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent" : "bg-black/10"}`} />
                          <div className="relative rounded-[1.1rem] border border-white/10 bg-white/5 p-4 text-white backdrop-blur-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">{item.label}</p>
                            <h4 className="mt-2 text-lg font-black uppercase leading-[0.95] tracking-[-0.05em]">{item.name}</h4>
                            <p className="mt-3 text-sm font-medium">{item.price}</p>
                          </div>
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-white">{item.name}</h4>
                      <p className="text-xs text-white/60">{item.price}</p>
                    </Link>
                  ))}
                  {bestSellers.length === 0 ? (
                      <div className="min-w-[280px] rounded-xl border border-dashed border-neutral-300 bg-white/70 p-6 text-sm text-neutral-600">
                        No featured products are live yet.
                      </div>
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

              <article className="rounded-xl border border-white/10 bg-[#081222] p-10 text-white lg:col-span-4">
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

        <footer className="border-t border-white/10 bg-[#0d1627]">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-4 xl:px-12">
            <div>
              <h5 className="text-2xl font-black">KINETIC</h5>
              <p className="mt-6 max-w-xs text-xs leading-7 tracking-[0.08em] text-white/55">
                Defining the future of digital commerce through editorial excellence and motion design.
              </p>
            </div>

            <div className="space-y-4 text-xs tracking-[0.14em] text-white/55">
              <h6 className="mb-2 font-bold uppercase text-white">Service</h6>
              <p>Customer Care</p>
              <p>Shipping &amp; Returns</p>
              <p>Privacy Policy</p>
            </div>

            <div className="space-y-4 text-xs tracking-[0.14em] text-white/55">
              <h6 className="mb-2 font-bold uppercase text-white">Company</h6>
              <p>Store Locator</p>
              <p>Careers</p>
              <p>Sustainability</p>
            </div>

            <div>
              <h6 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Newsletter</h6>
              <div className="mt-6 flex items-center border-b border-white/20 pb-2">
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="w-full bg-transparent text-[10px] font-medium uppercase tracking-[0.2em] text-white placeholder:text-white/45 focus:outline-none"
                />
                <a href={CUSTOMER_ROUTES.AUTH} className="text-sm">→</a>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between border-t border-white/10 px-6 py-7 xl:px-12">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">© 2024 Kinetic Editorial. All Rights Reserved.</p>
            <div className="flex gap-4 text-white/45">
              <span className="material-symbols-outlined text-sm">lens_blur</span>
              <span className="material-symbols-outlined text-sm">north_east</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
