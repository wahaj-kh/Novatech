"use client";

import { useEffect, Suspense, useRef } from "react";
import Hero from "@/components/Hero";
import Carousel from "@/components/Carousel";
import FeatureSpotlight from "@/components/FeatureSpotlight";
import Footer from "@/components/Footer";
import { useProductStore } from "@/lib/productStore";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

function ProductGrid() {
  const { products, isLoading, fetchProducts } = useProductStore();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const sectionRef = useRef<HTMLElement>(null);
  const didScrollRef = useRef(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // When a category filter is applied, scroll to the grid smoothly
  useEffect(() => {
    if (categoryParam && !didScrollRef.current) {
      didScrollRef.current = true;
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
    if (!categoryParam) {
      didScrollRef.current = false;
    }
  }, [categoryParam]);

  const displayedProducts = categoryParam
    ? products.filter(p => p.category.toLowerCase() === categoryParam.toLowerCase())
    : products;

  return (
    <section ref={sectionRef} id="latest-arrivals" className="relative bg-black py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="mb-16 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
              {categoryParam ? "Category" : "Catalog"}
            </p>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.04em] text-white leading-[1.05]">
              {categoryParam ? categoryParam : "Latest Arrivals"}
            </h2>
          </div>
          {categoryParam && (
            <Link
              href="/"
              scroll={false}
              className="flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-white"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </motion.div>

        {/* Category pills */}
        <motion.div
          className="mb-12 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {["Smartphones", "Laptops", "Tablets", "Wearables", "Accessories"].map((cat) => (
            <Link
              key={cat}
              href={`/?category=${cat}`}
              scroll={false}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                categoryParam === cat
                  ? "border-[#2997ff] bg-[#2997ff]/10 text-[#2997ff]"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </Link>
          ))}
          {categoryParam && (
            <Link
              href="/"
              scroll={false}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              All
            </Link>
          )}
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] animate-pulse">
                <div className="aspect-square bg-white/[0.04]" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-1/4 rounded-full bg-white/10" />
                  <div className="h-5 w-3/4 rounded-full bg-white/10" />
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-4 w-1/4 rounded-full bg-white/10" />
                    <div className="h-8 w-24 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {displayedProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-24 text-center text-white/30"
              >
                <p className="text-lg">No products found in this category.</p>
                <Link href="/" scroll={false} className="mt-4 inline-flex items-center gap-2 text-sm text-[#2997ff] hover:underline">
                  Browse all products <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key={categoryParam || "all"}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.07 } },
                  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
                }}
              >
                {displayedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 40, scale: 0.96 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 90, damping: 18 } },
                      exit: { opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.18 } },
                    }}
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0d0d0d] transition-all duration-500 hover:border-white/[0.12] hover:bg-[#111]"
                    >
                      {/* Image area */}
                      <div className="relative aspect-square overflow-hidden bg-[#0a0a0a] flex items-center justify-center p-10">
                        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ background: "radial-gradient(circle at 50% 60%, rgba(41,151,255,0.08) 0%, transparent 70%)" }}
                        />
                        {product.image_url ? (
                          <motion.img
                            src={product.image_url}
                            alt={product.name}
                            className="relative z-10 h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.06]"
                            style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/[0.06]">
                            <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/20">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Info area */}
                      <div className="flex flex-1 flex-col p-6">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2997ff]">
                          {product.category}
                        </p>
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-white mb-1">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-white/40 line-clamp-2 mb-4 leading-relaxed">
                            {product.description}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/[0.06]">
                          <span className="text-lg font-semibold tracking-[-0.02em] text-white">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-semibold text-white/70 transition-all group-hover:bg-[#2997ff] group-hover:border-[#2997ff] group-hover:text-white">
                            View
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Hero />
      <Carousel />
      <Suspense fallback={
        <div className="bg-black py-28 text-center text-white/30">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      }>
        <ProductGrid />
      </Suspense>
      <div id="feature-spotlight">
        <FeatureSpotlight />
      </div>
      <Footer />
    </div>
  );
}
