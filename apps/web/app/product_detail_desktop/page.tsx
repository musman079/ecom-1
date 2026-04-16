"use client";

import { useState } from "react";

const navLinks = [
  { label: 'New Arrivals', href: '/' },
  { label: 'Designers', href: '/product_details' },
  { label: 'Editorial', href: '/kinetic_luxury_fashion_e_commerce' },
  { label: 'Archive', href: '/product_detail_desktop' },
  { label: 'Sustainability', href: '/kinetic_luxury_fashion_e_commerce' },
];

const lookItems = [
  {
    category: 'Pants',
    name: 'KINETIC STRAIGHT TROUSERS',
    price: '$480.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB8JH5dsxI0_qeqPeR3coZPfuN4vJY-q9voRoFDD25eyjolXEi0neoV2l5UOZC1-1ItxyRn94M-9QGT9FBXLBX8aW7PuKvLYsRR2AKhecsiy4gYy4K7LrNOLc_SC6SR_v2Fgf2JVI_xPlmiLumkQ8WRaMttCLiqKDF9j_p0abxQnZpdC5CF8hkySyO_Z2bvKmCA-UhSN0GYll7SS-VjU8Ed_3CcnDhEIfxzJBUZymXiLaAyjtglKsXwVXiZaHmY8dnlNTcOZTWleQap',
  },
  {
    category: 'Footwear',
    name: 'KINETIC 0.2 SNEAKER',
    price: '$620.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_dTvGKU_cyi3jj3qtcUp90hSyZ8Qfjre3dWkXsVmVcPdqC0wB9MzLL0N3byYuFSxxS5z4nrju2NncudNW0T8Uwhxd_GC_qMJK8GU6PsCil1J9Jj5AZmeCySVSM3iw40qO01ApJU2Cbs2Xp1lHqGZvaAM3eDmKARct7j-3jxrWS8CoaH4lCWMLNJj5HeVIFuqMBRlLuiXEpwDimb9aCx7KSPHKN9z1Neilkm0hqrk5rMukD2pVjbLg5lOEeoIXbc2ub3QkDPnXqplw',
  },
  {
    category: 'Accessories',
    name: 'MODULAR LEATHER TOTE',
    price: '$890.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUMq7WEFpTbAAaz6R6BfNEy-an0lMnNDsoMMWRQIr4gFjB19gl3O7XTDDUQOaG1ReFJSuY0NCAB5xpUOUFVrXAuA1k21_IILUkFCbpo9Ra6Zfd4I594s5e-6UcEkAZGPW8QYYbewFI1NQfCJ3Bw48_g1Jobf1VlCyj73Q6FlLxhP4nnc5nA9SOkAH7jzJ0G6TkKlHhxW_MU3sqdUGYPs56w05pOxFU0VCrYMC-3QzRcDttVgqqGqvys5W7QxY_pOIAfo3KgT1SyTId',
  },
];

export default function ProductDetailDesktopPage() {
  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedSize, setSelectedSize] = useState("S");

  return (
    <div className="min-h-screen bg-[#f3f3f4] text-[#1a1c1c]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:h-20 sm:px-6 xl:px-12">
          <h1 className="text-2xl font-black tracking-[-0.06em] sm:text-3xl">KINETIC</h1>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="border-b border-transparent pb-1 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <a href="/profile" aria-label="Favorite">
              <span className="material-symbols-outlined">favorite</span>
            </a>
            <a href="/cart_checkout_desktop" className="relative" aria-label="Shopping Bag">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#497cff] text-[8px] font-bold text-white">
                2
              </span>
            </a>
            <a href="/profile" aria-label="Profile">
              <span className="material-symbols-outlined">person</span>
            </a>
          </div>
        </div>
      </header>

      <main className="pt-16 sm:pt-20">
        <nav className="px-4 py-6 sm:px-6 sm:py-8 xl:px-12">
          <ul className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            <li>Archive</li>
            <li>/</li>
            <li>Outerwear</li>
            <li>/</li>
            <li className="text-black">Kinetic 01-Tech Coat</li>
          </ul>
        </nav>

        <section className="grid grid-cols-1 gap-0 px-0 pb-16 sm:pb-24 lg:grid-cols-12 lg:px-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="group aspect-[3/4] w-full overflow-hidden bg-neutral-200">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuDny4SKGJzALRE-iBCUljuB6J14e_79v6rmOm-aKOvGN5ba95nlmi2t80un8qrFw5P1H_s-S35tS9XrALh0fozYfvG7eS86LCyo8rwdr3IHghH6PkU9qBrLHitSA4UBOdYtZYJApFJ5Wf_Lks_LPzY3cqD9kiZXEMzG0GSyEAKV1BYsRj2yl6hZ9wpEGREJRy97EO2woy5yqNYqtoaKuQzwWuqdUGwOQq3PleW4Z9SQhfFfknRczdZmwnuSVjdCSO0Mk0w9DapB8q"
                alt="Kinetic 01 Tech Coat"
                className="h-full w-full object-cover transition duration-1000 group-hover:scale-105"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] overflow-hidden bg-neutral-200">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA9ShVaVLTG2YsQuVR0EprDeGe37jQdqq7Pf_zGGRK9_IbVwPPjur6zrPT3VzeN7lL1DZulT6WuxGnk1sAgqj2qzLpkZsHUJJMwndSu4KHZSObrc_T1nswnkER1FrlU81rHJX6bXAEKiOsKzYS3Z-WUZ-pVLNregowMb4xqGrRbu2VMct4LLcJMZmHAr6w2daV_5ghqCoZjnSLdJAcqfijo6NZ6hhbO_4AZ7edrTO7RZS00v4IFiHaE0oCYtWTeu1dNl5LjFT7YZyH"
                  alt="Detail View"
                  className="h-full w-full object-cover transition duration-700 hover:scale-110"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden bg-neutral-200">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM3yobJAQ9iFc0l4NY8udyzkfIF4blCC2z0eW9tfbZO1sGAPk_mmUTP6mX3R3n_WXYNnwe-XbX3UdTD-loNuuDccacs7W0w0tNUaVcKMsryGRxTUttOsZvYP3yYNg6vnP1f0M-8_m5KL-Y1gcMZpWUoq52hDpIADxMam3Vw4qmUQrViLDh-0WX-Q0sDHiMtd8mpEIQAwj9h1MDOr7VMHtipZxzr8j82qxWvCOzO4BS25Dmf2eTrDXWeXOP8-xZVXqR0Pnz-gsKMViM"
                  alt="Styling Shot"
                  className="h-full w-full object-cover transition duration-700 hover:scale-110"
                />
              </div>
            </div>
          </div>

          <div className="px-4 pt-10 sm:px-6 sm:pt-12 lg:col-span-5 lg:px-0 lg:pl-20 lg:pt-0">
            <div className="lg:sticky lg:top-32 lg:max-w-md">
              <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.3em] text-[#497cff]">
                New Season Collection
              </span>
              <h2 className="mb-4 text-4xl font-black uppercase leading-[0.86] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                KINETIC 01-TECH
                <br />
                COAT
              </h2>
              <p className="mb-8 text-3xl font-light text-neutral-600 sm:text-4xl">$1,250.00</p>

              <div className="mb-12 space-y-8">
                <div>
                  <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.2em]">Color - {selectedColor === "Black" ? "Obsidian Black" : selectedColor}</span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setSelectedColor("Black")} className={`h-8 w-8 rounded-full bg-black ${selectedColor === "Black" ? "ring-2 ring-black ring-offset-2" : ""}`} aria-label="Black" />
                    <button type="button" onClick={() => setSelectedColor("Grey")} className={`h-8 w-8 rounded-full bg-neutral-400 transition-all hover:ring-2 hover:ring-neutral-300 hover:ring-offset-2 ${selectedColor === "Grey" ? "ring-2 ring-black ring-offset-2" : ""}`} aria-label="Grey" />
                    <button type="button" onClick={() => setSelectedColor("White")} className={`h-8 w-8 rounded-full bg-neutral-200 transition-all hover:ring-2 hover:ring-neutral-200 hover:ring-offset-2 ${selectedColor === "White" ? "ring-2 ring-black ring-offset-2" : ""}`} aria-label="White" />
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Size - International</span>
                    <a href="/product_details" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 underline underline-offset-4">
                      Size Guide
                    </a>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["XS", "S", "M", "L"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`h-12 rounded-xl border text-xs font-semibold ${
                          selectedSize === size ? "border-black bg-black font-bold text-white" : "border-neutral-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <a href="/cart_checkout_desktop" className="block w-full rounded-full bg-black py-5 text-center text-sm font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-black/10 transition-transform hover:scale-[1.01]">
                    Add to Cart
                  </a>
                  <a href="/profile" className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 py-5 text-sm font-bold uppercase tracking-[0.2em] transition-colors hover:bg-neutral-200">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    Add to Wishlist
                  </a>
                </div>
              </div>

              <div className="space-y-6 border-t border-neutral-300/60 pt-8">
                <details className="group cursor-pointer">
                  <summary className="flex list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                    Fabric &amp; Composition
                    <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <p className="pt-4 text-sm leading-relaxed text-neutral-600">
                    100% Recycled Polyamide. Our Graphene-infused shell offers technical weather protection while maintaining breathable comfort.
                  </p>
                </details>

                <details className="group cursor-pointer">
                  <summary className="flex list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                    Shipping &amp; Returns
                    <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <p className="pt-4 text-sm leading-relaxed text-neutral-600">
                    Complimentary express shipping worldwide with a 14-day return window and low-impact packaging.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-neutral-200/50 px-4 py-16 sm:px-6 sm:py-24 xl:px-12">
          <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-5xl">Complete The Look</h3>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] text-neutral-500">Curated by Kinetic Editorial</p>
            </div>
            <a href="/product_details" className="self-start border-b-2 border-black pb-1 text-xs font-bold uppercase tracking-[0.2em] md:self-auto">
              Shop All Recommendations
            </a>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
            {lookItems.map((item) => (
              <article key={item.name} className="group cursor-pointer">
                <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-xl bg-white">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <a href="/cart_checkout_desktop" className="absolute bottom-4 right-4 translate-y-2 rounded-full bg-white p-3 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100" aria-label="Add To Cart">
                    <span className="material-symbols-outlined">add</span>
                  </a>
                </div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">{item.category}</p>
                <h4 className="mb-2 text-sm font-bold tracking-tight">{item.name}</h4>
                <p className="text-xs font-medium text-neutral-600">{item.price}</p>
              </article>
            ))}

            <article className="relative overflow-hidden rounded-xl bg-black p-8 text-white">
              <div className="relative z-10">
                <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">The Edit</span>
                <h4 className="mb-8 text-4xl font-black uppercase italic leading-[0.9] tracking-[-0.05em] sm:text-5xl">
                  The Art of
                  <br />
                  Layering:
                  <br />
                  Techwear
                  <br />
                  for the
                  <br />
                  Modern
                  <br />
                  Nomad.
                </h4>
                <a href="/kinetic_luxury_fashion_e_commerce" className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Read Story
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </article>
          </div>
        </section>

        <footer className="border-t border-black/5 bg-white">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-4 xl:px-12">
            <div className="flex flex-col gap-6">
              <div className="text-2xl font-black tracking-[-0.04em]">KINETIC</div>
              <p className="max-w-xs text-xs leading-7 tracking-[0.08em] text-neutral-400">
                Redefining the digital editorial experience through a fusion of high-fashion aesthetics and technical performance.
              </p>
            </div>

            <div className="space-y-3 text-xs tracking-[0.14em] text-neutral-400">
              <h5 className="mb-2 font-bold uppercase text-black">Customer Care</h5>
              <p>Shipping &amp; Returns</p>
              <p>Size Guide</p>
              <p>Order Tracking</p>
            </div>

            <div className="space-y-3 text-xs tracking-[0.14em] text-neutral-400">
              <h5 className="mb-2 font-bold uppercase text-black">Connect</h5>
              <p>Instagram</p>
              <p>Twitter</p>
              <p>Store Locator</p>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold uppercase tracking-[0.2em] text-black text-[10px]">Newsletter</h5>
              <div className="relative">
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  className="w-full border-b border-neutral-300 bg-transparent pb-2 text-[10px] tracking-[0.2em] uppercase focus:border-black focus:outline-none"
                />
                <a href="/auth" className="absolute bottom-2 right-0 text-[10px] font-bold uppercase tracking-[0.2em]">Join</a>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 border-t border-black/5 px-6 py-8 md:flex-row md:items-center md:justify-between xl:px-12">
            <span className="text-xs uppercase tracking-[0.14em] text-neutral-400">© 2024 Kinetic Editorial. All Rights Reserved.</span>
            <div className="flex gap-8 text-xs tracking-[0.14em] text-neutral-400">
              <a href="/auth" className="underline underline-offset-4">Privacy Policy</a>
              <a href="/auth" className="underline underline-offset-4">Terms of Use</a>
            </div>
          </div>
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[560px] gap-2">
          <a href="/profile" className="flex-1 rounded-full border border-neutral-300 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em]">
            Wishlist
          </a>
          <a href="/cart_checkout_desktop" className="flex-1 rounded-full bg-black py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white">
            Add to Cart
          </a>
        </div>
      </div>
    </div>
  );
}
