"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useProductStore } from "@/lib/productStore";
import { api } from "@/lib/api";

const CARD_WIDTH_VW = 82;
const CARD_MAX_PX = 1000;
const GAP_PX = 8;
const AUTOPLAY_MS = 4000;
const SCROLL_MS = 1100;

function resolveImageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = api.defaults.baseURL?.replace(/\/$/, "") ?? "";
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function animateScroll(
  el: HTMLElement,
  to: number,
  duration: number,
  onDone?: () => void
): () => void {
  const from = el.scrollLeft;
  const delta = to - from;
  if (Math.abs(delta) < 1) { el.scrollLeft = to; onDone?.(); return () => {}; }
  let start: number | null = null;
  let raf: number;
  function tick(ts: number) {
    if (!start) start = ts;
    const t = Math.min((ts - start) / duration, 1);
    el.scrollLeft = from + delta * easeInOutQuart(t);
    if (t < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      el.scrollLeft = to;
      onDone?.();
    }
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

type SlideProduct = {
  id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
};

const SLIDE_THEMES = [
  { bg: "from-[#0a0a0a] via-[#0d1117] to-[#0a0a0a]", accent: "#2997ff", glow: "rgba(41,151,255,0.22)" },
  { bg: "from-[#0d0a14] via-[#120d1a] to-[#0a0a0f]", accent: "#a78bfa", glow: "rgba(167,139,250,0.18)" },
  { bg: "from-[#0a0f0d] via-[#0d1410] to-[#0a0a0a]", accent: "#34d399", glow: "rgba(52,211,153,0.18)" },
  { bg: "from-[#0f0a0a] via-[#160d0d] to-[#0a0a0a]", accent: "#f87171", glow: "rgba(248,113,113,0.18)" },
];

// ─── Slide Card ───────────────────────────────────────────────────────────────

type CarouselSlideProps = {
  product: SlideProduct;
  theme: typeof SLIDE_THEMES[0];
  isActive: boolean;
  imagePriority: boolean;
};

function CarouselSlide({ product, theme, isActive, imagePriority }: CarouselSlideProps) {
  const src = resolveImageSrc(product.image_url);
  return (
    <div
      style={{
        width: `min(${CARD_WIDTH_VW}vw, ${CARD_MAX_PX}px)`,
        height: "min(70vh, 580px)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: isActive ? "scale(1)" : "scale(0.93)",
          transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
        className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${theme.bg} border border-white/[0.06] shadow-[0_32px_80px_rgba(0,0,0,0.6)]`}
      >
        <div
          className="pointer-events-none absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/4 rounded-full blur-[100px]"
          style={{ background: theme.glow }}
        />
        <div className="relative z-10 flex h-full flex-col md:flex-row">
          <div className="flex flex-1 flex-col justify-end p-8 md:justify-center md:p-14 md:pr-6">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ borderColor: `${theme.accent}30`, color: theme.accent, background: `${theme.accent}10` }}
            >
              <span className="h-1 w-1 rounded-full" style={{ background: theme.accent }} />
              Featured
            </div>
            <h2 className="text-[clamp(1.75rem,4vw,3.5rem)] font-bold tracking-[-0.04em] leading-[1.05] text-white mb-4">
              {product.name}
            </h2>
            <p className="text-[clamp(0.875rem,1.5vw,1.125rem)] text-white/50 font-light leading-relaxed max-w-md mb-8">
              {product.description || "Incredible performance. Beautiful design. Built for what's next."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/products/${product.id}`}
                className="rounded-full px-7 py-3 text-sm font-semibold tracking-[-0.02em] text-black transition-all active:scale-[0.97]"
                style={{ background: theme.accent, boxShadow: `0 0 30px ${theme.glow}` }}
              >
                Buy Now
              </Link>
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold tracking-[-0.02em] text-white backdrop-blur-md transition-colors hover:bg-white/10 active:scale-[0.97]"
              >
                Learn More <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="relative flex min-h-[220px] flex-1 items-center justify-center px-8 pb-10 pt-4 md:min-h-0 md:px-10 md:py-12">
            <div className="relative aspect-square w-full max-w-[min(100%,420px)]">
              {src ? (
                <img
                  src={src}
                  alt={product.name}
                  loading={imagePriority ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.6))" }}
                />
              ) : (
                <div className="flex size-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/25">No Image</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonSlide() {
  return (
    <div
      className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-[#0d0d0d]"
      style={{ width: `min(${CARD_WIDTH_VW}vw, ${CARD_MAX_PX}px)`, height: "min(70vh, 580px)", flexShrink: 0 }}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.03] to-transparent" />
      <div className="relative z-10 flex h-full flex-col md:flex-row items-center p-12 gap-8">
        <div className="flex-1 space-y-4">
          <div className="h-3 w-20 rounded-full bg-white/10" />
          <div className="h-10 w-3/4 rounded-2xl bg-white/10" />
          <div className="h-4 w-full rounded-full bg-white/[0.06]" />
          <div className="h-4 w-2/3 rounded-full bg-white/[0.06]" />
          <div className="flex gap-3 pt-4">
            <div className="h-11 w-28 rounded-full bg-white/10" />
            <div className="h-11 w-28 rounded-full bg-white/[0.06]" />
          </div>
        </div>
        <div className="flex-1 aspect-square max-w-[320px] rounded-3xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ─── Dot Indicators ───────────────────────────────────────────────────────────

type DotNavProps = {
  count: number;
  activeIndex: number;
  products: SlideProduct[];
  themes: typeof SLIDE_THEMES;
  onDotClick: (i: number) => void;
};

function DotNav({ count, activeIndex, products, themes, onDotClick }: DotNavProps) {
  return (
    <div className="flex items-end justify-center gap-0 px-4 mt-2">
      {Array.from({ length: count }).map((_, i) => {
        const theme = themes[i % themes.length];
        const isActive = i === activeIndex;
        return (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            className="flex flex-col items-center px-3 pb-1 pt-4 cursor-pointer"
            aria-label={`Go to slide ${i + 1}`}
          >
            <motion.div
              className="rounded-full overflow-hidden"
              animate={{ width: isActive ? 44 : 12, height: isActive ? 4 : 3 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              {isActive && (
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: theme.accent }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                  key={`fill-${activeIndex}`}
                />
              )}
            </motion.div>
            <motion.p
              animate={{ opacity: isActive ? 0.4 : 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-[10px] font-medium text-white truncate max-w-[80px] text-center"
            >
              {products[i]?.name ?? ""}
            </motion.p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Carousel ────────────────────────────────────────────────────────────
//
// Infinite loop strategy: render slides THREE times: [...originals, ...originals, ...originals]
// We always live in the MIDDLE copy (copy index 1, dom offset = count).
// When autoplay reaches the end of the middle copy it animates into the start of the third copy,
// then silently resets to the matching position in the middle copy — the jump is by exactly
// one full "copy width" so the visual position is pixel-identical. No flash, no glitch.
//
// DOM layout:  [copy0: slide0..n-1] [copy1: slide0..n-1] [copy2: slide0..n-1]
// We start at copy1[0]. After reaching copy1[n-1] we animate to copy2[0], then jump back to copy1[0].
// The jump distance = count * (cardWidth + gap), which is off-screen and invisible.

export default function Carousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelScrollRef = useRef<(() => void) | undefined>(undefined);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef(false);
  const userPausedRef = useRef(false);
  // Offsets for every DOM child (3×count slides)
  const offsetsRef = useRef<number[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const { featuredProducts, fetchFeatured, hasFetchedFeatured } = useProductStore();

  const productKey = useMemo(
    () => featuredProducts.map((p) => p.id).join(","),
    [featuredProducts]
  );

  useEffect(() => { fetchFeatured(); }, [fetchFeatured]);

  // ── measure all child offsets ───────────────────────────────────────────────
  const measureOffsets = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    offsetsRef.current = (Array.from(el.children) as HTMLElement[]).map(
      (child) => child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2
    );
  }, []);

  useLayoutEffect(() => { measureOffsets(); }, [measureOffsets, hasFetchedFeatured, productKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measureOffsets());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureOffsets]);

  // ── scroll to a specific DOM child index ────────────────────────────────────
  const scrollToChild = useCallback((childIndex: number, animated: boolean, onDone?: () => void) => {
    const el = containerRef.current;
    if (!el) return;
    const target = offsetsRef.current[childIndex];
    if (target === undefined) { onDone?.(); return; }

    cancelScrollRef.current?.();

    if (!animated) {
      // Disable scroll events for this instant jump
      isAnimatingRef.current = true;
      el.scrollLeft = target;
      // One rAF is enough for the browser to process the scroll
      requestAnimationFrame(() => {
        isAnimatingRef.current = false;
        onDone?.();
      });
      return;
    }

    isAnimatingRef.current = true;
    cancelScrollRef.current = animateScroll(el, target, SCROLL_MS, () => {
      isAnimatingRef.current = false;
      onDone?.();
    });
  }, []);

  // ── autoplay ────────────────────────────────────────────────────────────────
  // We always navigate within copy1 (indices count..2*count-1).
  // After the last slide of copy1 we animate to copy2[0] (index 2*count),
  // then instantly jump back to copy1[0] (index count) — same visual position.
  const scheduleNext = useCallback(
    (currentRealIndex: number) => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = setTimeout(() => {
        if (userPausedRef.current) return;
        const count = featuredProducts.length;
        if (count < 2) return;

        const el = containerRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) {
            scheduleNext(currentRealIndex);
            return;
          }
        }

        const nextReal = (currentRealIndex + 1) % count;

        if (currentRealIndex === count - 1) {
          // Last slide of copy1 → animate to copy2[0], then jump to copy1[0]
          const copy2FirstIndex = count * 2; // first child of copy2
          setActiveIndex(0);
          scrollToChild(copy2FirstIndex, true, () => {
            // Jump to copy1[0] — pixel-identical position, zero visual difference
            scrollToChild(count, false, () => scheduleNext(0));
          });
        } else {
          // Normal advance within copy1
          const copy1NextIndex = count + nextReal;
          setActiveIndex(nextReal);
          scrollToChild(copy1NextIndex, true, () => scheduleNext(nextReal));
        }
      }, AUTOPLAY_MS);
    },
    [featuredProducts.length, scrollToChild]
  );

  // Initialise: start at copy1[0]
  useEffect(() => {
    if (!hasFetchedFeatured || featuredProducts.length < 1) return;
    const t = setTimeout(() => {
      measureOffsets();
      const count = featuredProducts.length;
      scrollToChild(count, false); // copy1[0], no animation
      if (count >= 2) scheduleNext(0);
    }, 0);
    return () => {
      clearTimeout(t);
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFetchedFeatured, productKey]);

  // ── dot click ───────────────────────────────────────────────────────────────
  const handleDotClick = useCallback(
    (index: number) => {
      userPausedRef.current = true;
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      const count = featuredProducts.length;
      const copy1Index = count + index;
      setActiveIndex(index);
      scrollToChild(copy1Index, true, () => {
        autoplayTimerRef.current = setTimeout(() => {
          userPausedRef.current = false;
          scheduleNext(index);
        }, 3000);
      });
    },
    [featuredProducts.length, scrollToChild, scheduleNext]
  );

  // ── cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelScrollRef.current?.();
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
  }, []);

  const count = hasFetchedFeatured ? featuredProducts.length : 3;
  const showSkeleton = !hasFetchedFeatured;
  const showEmpty = hasFetchedFeatured && featuredProducts.length === 0;

  // Three full copies of the slides for seamless infinite loop
  const tripleSlides = useMemo(() => {
    if (!hasFetchedFeatured || featuredProducts.length === 0) return [];
    return [...featuredProducts, ...featuredProducts, ...featuredProducts];
  }, [hasFetchedFeatured, featuredProducts]);

  return (
    <section className="relative w-full bg-black py-16 md:py-24 overflow-hidden">
      <div className="mb-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs font-semibold tracking-[0.2em] uppercase text-white/30"
        >
          Featured Products
        </motion.p>
      </div>

      <div
        ref={containerRef}
        className="flex w-full overflow-x-scroll pb-12 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          gap: `${GAP_PX}px`,
          scrollSnapType: "none",
          overscrollBehaviorX: "contain",
          paddingLeft: `max(16px, calc(50% - min(${CARD_WIDTH_VW / 2}vw, ${CARD_MAX_PX / 2}px)))`,
          paddingRight: `max(16px, calc(50% - min(${CARD_WIDTH_VW / 2}vw, ${CARD_MAX_PX / 2}px)))`,
        }}
      >
        {showEmpty ? (
          <div
            className="flex min-h-[320px] items-center justify-center rounded-[2.5rem] border border-white/[0.06] bg-white/[0.02] px-8 text-center text-white/25"
            style={{ width: `min(${CARD_WIDTH_VW}vw, ${CARD_MAX_PX}px)`, flexShrink: 0 }}
          >
            <p className="text-sm">Featured products will appear here.</p>
          </div>
        ) : showSkeleton ? (
          <><SkeletonSlide /><SkeletonSlide /><SkeletonSlide /></>
        ) : (
          tripleSlides.map((product, i) => {
            const realIndex = i % count;
            const isActive = realIndex === activeIndex;
            return (
              <CarouselSlide
                key={`${i}-${product.id}`}
                product={product}
                theme={SLIDE_THEMES[realIndex % SLIDE_THEMES.length]}
                isActive={isActive}
                imagePriority={i === count} // first slide of copy1
              />
            );
          })
        )}
      </div>

      {!showEmpty && (
        <DotNav
          count={count}
          activeIndex={activeIndex}
          products={hasFetchedFeatured ? featuredProducts : []}
          themes={SLIDE_THEMES}
          onDotClick={handleDotClick}
        />
      )}
    </section>
  );
}
