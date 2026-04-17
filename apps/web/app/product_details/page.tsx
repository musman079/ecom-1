"use client";

import { useEffect, useState } from "react";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";

const completeLookItems = [
  {
    name: 'PLEATED TROUSERS',
    price: '$145.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuACwmbls4cAdaHeQFav2FLho0KhG_4rTwcxN6BpaWWZfmDoxU8wXzLApq1yqLoyJcR03QD9eU8QdnnmKzeNCCoYvFTTMv24A3VOZUiM1EvFn3_iQK-J-Sqz1mJWevj8YAh2-7L8AhguMJFJpxXqLThdeQENns5ULbtnXMG_mf5Z2rbQ5SXG_xbv5mIg_oaeq2nkw0CK7OoWuCxNKhDZtqjx0VfiXY-vUS9gB2Ls5-lYUw7EgNtEqjyxNg_ORfYceqKwyLv0i8dGjxfu',
  },
  {
    name: 'HEAVY TEE',
    price: '$65.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCw2L9HpNAu2ITJSHybiVBi9OF78rJfNBaI6u_g_yTn8dPZ1ZWffQUuq-AwK_ZeGnp89BaW1SpfO23Po1yXylhUQt64JFazyEmUoF8uzQk3G2KevzZpI_bMy7HevTvbVdae-S1DapLtsPIzLnpXsfUh7w6STsI5Sj9Ic-fPqCsW2FLIqwfjtERY2-yeDGnIafgJbsRL3d5V5gA6n3VPzcJBZiwX5CBQWOrTSAgnDgA4EJ1eU84xINyy1SOFWt8qfRfiwjm6_a6HQJwu',
  },
  {
    name: 'METRIC SNEAKER',
    price: '$210.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJic7o07KRw0ex9QruabUxlpZPcyD8jrpnDaf__bPhZ7v_87Kpu6C2PI5eu6_Oohdm0lGaUcU6JYvJUmD_TU_yuVcSS5kgBUItlqc9Is_2Fwb2slU0ZEFblHKHY_fVL9zLA7BkTovXicJ4BJRtIcLBlIL_5ksPnTgrPWeSJsszQ4K3BGedwAyZDDKXhBfRRuc8xi-04rXLS2eAkZIk1QftaGIH_tJFIwjO5f01iFXeTJIjkhBCoFm81PhbWmFrnGE4gd7BBYbB87kX',
  },
  {
    name: 'VECTOR TIMEPIECE',
    price: '$450.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDby6it9jUTogQZHX_Jo3DM5SEgz1K33mZ0u-OyeToQi7XlvwzdXzph08LiQCWioIkJMpiIdS8KKYwbGy232oeIheEDlSxI6HLrO_85y2NtDrH7NfWjdGFTIK-If4Iy3ChxjDEC8RxMr1aoAwYeh-MlQHi49KEuZG7yedoXIIIhDwIGFnunI9mT__Aqv1qM6kDvQqTJJkG4vUULv38UhTAAXS4vmrQ7gk07qHrpOorJ_hpMmRNOZ6XewyrQ17ZWsFVkql3FpMx_KhDD',
  },
];

const galleryImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAOxZYhTmNSexvgQ6GDh54igLjroBcQ7ioVBk6V4cw1VWP5L_A07-e8MKl8pt4jrETKY9Z-DCde7pecXAb-DFFz0tXmldwELRkd5DgizmRWPGX_xk0RlHaUWtdC56aBQmd8YRW45CgkqWay8pfR_X_aUdIJBpx4qXbSWjl5zC0rt-5LYt6i6v4bPVjzxo6eYEE-7NpQPwlq_TGCKzqydUc6v226wrKpbehfYbvAcO626HVe8aels6ez-mt3Xqa_6cJYLWz2Y1jzSolz',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqzBOVRs961H-JV4sKABbjnDcfGTcw-nhKnqT15XS7Ky6t9CushYMSMcrnP-e5iE-3cwDLds-060c2SdjiYDXA0qxk-3HvEPh6HgdIzEiwiKju-BT60ZGEYW8EvNfm8DAlCP8mgjpDuSVlG_Wo8SJACnva0IYh8jH2XG1GYusCAsI9SVeixoEC9vusy555YUVuBei0iF_UTrlaF6R-5XeTcB_K3-EAEiPkuXkNoJswHCVhvhow-ib4mYnm7lnOj5zMeEqsdRD3CD_6',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANi6A0HugCdIAKHk9SyXx10b-5gYEURdntuDnoZtvo7OQ6OnVQG9529u3C6Bu_hiEIvx06rhrr3SMURHZO0k_oICjmd3lwepp3RXd55UpXG0EDAtRSfymaBio6dE4eS3vOGcSufZzQLgUVm2AqzQmJx0QcFqAX0xrI-Q8XlJOdMFKPJevvHGhdLarWbWPFEVbrkHSjaQroiJLgi-NiheChFgZoNFcGTrEpKVqU4SskuS_FikYIPgSFKrKAKaQDKbZlghRbfi2iAh-p',
];

const thumbImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDTXCK3byKC19SgofEhINcytFHMnxlWAW1G-iD7NLK8V6gEq3ufPTk6eumDOUjYvve-yZUy1rqgdeFac06OYSSId8Ahc8zFwq2lOQCD3U6kh1nJUmp4BfDIvHfe6CC1NTSd4pW1uowKvChNBhdzT1sFpPtixiYggUwL1Ohe4U9XxPIrL_x0kkhCwRZgu6MP_BT9teyVlsfw0S6tsJYafFZ1f4HLwEEr2RydF7QYOc-DXZ9y_EDsG37eMQN_uBAz-LXO6KhUMIHfXR91',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDXKur_C7NKAQgbdXvb-T2Zb6J9RzwxESaTxu6nALCgLR6Dd3ZtucwKopQWQ5ddNIhpZRNVSM7okjBoNdCZdbRUHPEy5vLDO1U_UwHth-opLGPMSpdl132FRovmAzyJYLa1AieffHMuial58bg1GsHQ5Ag3b7-jVlB1XKnT-j6lb3iNaRvDnUaBrZuYUfVnYi0_cCqftG0HQ2SCPpdZ0Z9ZoN9nhEwfYW7HXcw2cekb6NS6MLSjZHEcJn-wbEqoeNMbm1VykCUZmBMZ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDrtAM4T4eOTX4R9uf9ZhfaEDkCW67NbdhbDRnJrm3aPPXUs6lG66FcznHMBbVN8ceVkQt_o6IVmoJEa7WPCMEmVU0smQa9y2JLuMNZpnA99cepVQ5bq1oManB-8CRd-JE3TPoSATbUZIwHDJFvtGSvIBy3oxVnE0kPYg1CDHgRRbu_o7HcAVXfILQ7zr_arR3DP9Ax6msBskJv6_9hRhBSBoacrCfublXZJMuETcLL_GU8Yc2n0t5_RQv7H8ImwzlVoscSVzmMTAd9',
];

export default function ProductDetailsPage() {
  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedSize, setSelectedSize] = useState("M");
  const [featuredProductId, setFeaturedProductId] = useState<string | null>(null);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedProduct = async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          products?: Array<{
            id: string;
          }>;
        };

        const firstProductId = payload.products?.[0]?.id;
        if (firstProductId) {
          setFeaturedProductId(firstProductId);
        }
      } catch {
        // Keep UX usable even if featured product fetch fails.
      }
    };

    void loadFeaturedProduct();
  }, []);

  const addToCart = async () => {
    setAddToCartError(null);
    setAddToCartMessage(null);

    if (!featuredProductId) {
      setAddToCartError("No published product is available to add right now.");
      return;
    }

    setAddToCartLoading(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: featuredProductId,
          quantity: 1,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (response.status === 401) {
        setAddToCartError("Please login first to add products into cart.");
        return;
      }

      if (!response.ok) {
        setAddToCartError(payload.error ?? "Unable to add product to cart.");
        return;
      }

      setAddToCartMessage("Added to cart successfully.");
    } catch {
      setAddToCartError("Unable to add product due to network issue.");
    } finally {
      setAddToCartLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <a href={CUSTOMER_ROUTES.HOME} aria-label="Menu" className="transition hover:opacity-70 active:scale-95">
              <span className="material-symbols-outlined">menu</span>
            </a>
            <span className="text-xl font-black uppercase tracking-tight">KINETIC</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-8 md:flex">
              <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-sm font-bold uppercase tracking-tight">Shop</a>
              <a href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="text-sm uppercase tracking-tight text-neutral-500 hover:opacity-70">Editorial</a>
              <a href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="text-sm uppercase tracking-tight text-neutral-500 hover:opacity-70">Archive</a>
            </nav>
            <a href={CUSTOMER_ROUTES.CART_CHECKOUT} aria-label="Bag" className="transition hover:opacity-70 active:scale-95">
              <span className="material-symbols-outlined">shopping_bag</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-36 pt-24 md:px-8">
        <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-20">
          <section className="w-full space-y-6 lg:w-3/5">
            <div className="relative">
              <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-xl bg-[#f3f3f4]">
                {galleryImages.map((image, idx) => (
                  <div key={image} className="relative aspect-[4/5] w-full shrink-0 snap-center md:aspect-square">
                    <img src={image} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                <span className="h-2 w-2 rounded-full bg-black" />
                <span className="h-2 w-2 rounded-full bg-black/20" />
                <span className="h-2 w-2 rounded-full bg-black/20" />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 md:gap-4">
              {thumbImages.map((image, idx) => (
                <button
                  key={image}
                  className={`aspect-square overflow-hidden rounded-lg transition hover:opacity-80 ${
                    idx === 0 ? 'ring-1 ring-black ring-offset-2' : ''
                  }`}
                >
                  <img src={image} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </section>

          <section className="w-full lg:sticky lg:top-32 lg:w-2/5">
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">New Arrival - FW24</span>
                <h1 className="text-4xl font-extrabold uppercase leading-none tracking-tighter md:text-5xl">KINETIC MONO SWEATER</h1>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm">star_half</span>
                  </div>
                  <span className="text-sm text-neutral-600">(42 Reviews)</span>
                </div>
              </div>

              <p className="text-4xl font-light tracking-tight">$285.00</p>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-widest">Select Color</span>
                    <span className="text-xs text-neutral-500">{selectedColor === "Black" ? "Obsidian Black" : selectedColor}</span>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setSelectedColor("Black")} className={`h-10 w-10 rounded-full bg-black ${selectedColor === "Black" ? "ring-2 ring-black ring-offset-2" : "ring-1 ring-neutral-300 ring-offset-2"}`} aria-label="Black" />
                    <button type="button" onClick={() => setSelectedColor("White")} className={`h-10 w-10 rounded-full bg-white ${selectedColor === "White" ? "ring-2 ring-black ring-offset-2" : "ring-1 ring-neutral-300 ring-offset-2"}`} aria-label="White" />
                    <button type="button" onClick={() => setSelectedColor("Blue")} className={`h-10 w-10 rounded-full bg-[#2563EB] ${selectedColor === "Blue" ? "ring-2 ring-black ring-offset-2" : ""}`} aria-label="Blue" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-widest">Select Size</span>
                    <a href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="text-xs text-neutral-500 underline">Size Guide</a>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["S", "M", "L", "XL"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-lg py-4 text-sm uppercase ${
                          selectedSize === size ? "bg-black font-bold text-white" : "bg-[#eeeeee]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-neutral-300/40 pt-8">
                <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
                  Crafted from premium Italian merino wool, the Kinetic Mono Sweater features an avant-garde oversized silhouette with dropped shoulders and technical ribbing.
                </p>
                <ul className="space-y-3 pt-2 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    100% Responsibly sourced Merino Wool
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Anti-pilling architectural knit
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Made in Portugal
                  </li>
                </ul>
              </div>

              <div className="hidden lg:block pt-6">
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={addToCartLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-6 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                >
                  Add to Cart
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
                {addToCartError ? <p className="mt-3 text-xs font-bold text-red-600">{addToCartError}</p> : null}
                {addToCartMessage ? <p className="mt-3 text-xs font-bold text-emerald-700">{addToCartMessage}</p> : null}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-24 space-y-12">
          <h2 className="text-center text-3xl font-black uppercase tracking-tighter">Complete the Look</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {completeLookItems.map((item) => (
              <article key={item.name} className="group cursor-pointer space-y-4">
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#f3f3f4]">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider">{item.name}</h3>
                  <p className="text-sm text-neutral-600">{item.price}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white/90 px-6 pb-8 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total</span>
            <span className="text-lg font-black">$285.00</span>
          </div>
          <button
            type="button"
            onClick={addToCart}
            disabled={addToCartLoading}
            className="flex-1 rounded-full bg-black py-4 text-center text-xs font-bold uppercase tracking-widest text-white transition active:scale-95 disabled:opacity-40"
          >
            Add to Cart
          </button>
        </div>
        {addToCartError ? <p className="mt-3 text-xs font-bold text-red-600">{addToCartError}</p> : null}
        {addToCartMessage ? <p className="mt-3 text-xs font-bold text-emerald-700">{addToCartMessage}</p> : null}
      </div>

      <footer className="mt-24 bg-[#f3f3f4] px-8 py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-6">
            <span className="text-2xl font-black tracking-tighter">KINETIC</span>
            <p className="max-w-xs text-sm leading-relaxed text-neutral-600">
              Redefining contemporary wardrobe through architectural silhouettes and technical craftsmanship.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest">Support</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>Shipping &amp; Returns</li>
              <li>Sustainability</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest">Follow</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>Instagram</li>
              <li>Tiktok</li>
              <li>Journal</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest">Newsletter</h4>
            <div className="flex border-b border-neutral-300 py-2">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="w-full border-none bg-transparent text-sm uppercase tracking-widest placeholder:text-neutral-400 focus:outline-none"
              />
              <a href={CUSTOMER_ROUTES.AUTH} className="material-symbols-outlined text-xl">arrow_forward</a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 flex max-w-7xl flex-col gap-4 border-t border-neutral-300/40 pt-8 text-[10px] font-medium uppercase tracking-widest text-neutral-600 md:flex-row md:items-center md:justify-between">
          <span>© 2024 Kinetic Collective</span>
          <div className="flex gap-8">
            <a href={CUSTOMER_ROUTES.PRIVACY_POLICY}>Privacy Policy</a>
            <a href={CUSTOMER_ROUTES.TERMS_OF_SERVICE}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
