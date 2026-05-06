import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      <motion.div
        className="pointer-events-none absolute -top-20 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            NovaTech. <br className="hidden md:block" />
            <span className="text-primary">Premium. Performance.</span>
          </motion.h1>
          <motion.p
            className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.7 }}
          >
            Discover our latest lineup of ultra-thin, high-performance smart devices designed to elevate your everyday workflow.
          </motion.p>
          <motion.div
            className="flex justify-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.65 }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/" className="inline-flex bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors">
              Buy Now
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/#latest-arrivals" className="inline-flex bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-medium hover:bg-secondary/80 transition-colors">
              Learn More
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
        
        <motion.div
          className="mt-20 relative mx-auto max-w-5xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* A glowing backdrop effect for a 3D-feeling aesthetic */}
          <motion.div
            className="absolute inset-0 -z-10 bg-primary/20 blur-[100px] rounded-full"
            animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.75, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.div
            className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl glassmorphism aspect-[16/9]"
            whileHover={{ scale: 1.01, y: -4 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
          >
            {/* High-resolution placeholder gradient if no image */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center"
              animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "180% 180%" }}
            >
              <span className="text-zinc-500 font-medium tracking-widest uppercase">Smart Device Preview</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
