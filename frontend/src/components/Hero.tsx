"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const scrollToProducts = () => {
    const section = document.getElementById("latest-arrivals");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToSpotlight = () => {
    const section = document.getElementById("feature-spotlight");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(41,151,255,0.18) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(120,80,255,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,200,150,0.08) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <motion.div style={{ y, opacity }} className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-widest text-white/50 uppercase backdrop-blur-sm mb-8"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#2997ff] animate-pulse" />
          New Collection 2025
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-[clamp(3rem,10vw,7rem)] font-bold tracking-[-0.04em] leading-[0.95] text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Think
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #2997ff 0%, #a78bfa 50%, #34d399 100%)" }}
          >
            Different.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-[clamp(1rem,2.5vw,1.375rem)] text-white/50 font-light tracking-[-0.01em] max-w-2xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
           Impossibly fast. Designed to elevate every moment of your day.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <button
              onClick={scrollToProducts}
              className="inline-flex items-center gap-2 rounded-full bg-[#2997ff] px-8 py-3.5 text-sm font-semibold tracking-[-0.02em] text-white shadow-[0_0_40px_rgba(41,151,255,0.35)] transition-shadow hover:shadow-[0_0_60px_rgba(41,151,255,0.5)]"
            >
              Shop Now
            </button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <button
              onClick={scrollToSpotlight}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold tracking-[-0.02em] text-white backdrop-blur-md transition-colors hover:bg-white/10"
            >
              Learn More
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToProducts}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 hover:text-white/50 transition-colors cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.button>
    </section>
  );
}
