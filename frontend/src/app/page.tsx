"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import { api } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      
      <section id="latest-arrivals" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Latest Arrivals</h2>
          <p className="text-muted-foreground text-lg">Designed for power. Engineered for elegance.</p>
        </motion.div>
        
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.09 } },
          }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted/50" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-1/4 bg-muted/50 rounded" />
                  <div className="h-6 w-3/4 bg-muted/50 rounded" />
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-5 w-1/4 bg-muted/50 rounded" />
                    <div className="h-8 w-24 bg-muted/50 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            products.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 26, scale: 0.98 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <Link href={`/products/${product.id}`} className="group rounded-2xl glassmorphism border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 block">
                <div className="aspect-square bg-secondary/20 relative flex items-center justify-center p-8">
                  {product.image_url ? (
                    <motion.img
                      src={product.image_url}
                      alt={product.name}
                      className="object-contain w-full h-full"
                      whileHover={{ scale: 1.06, rotate: -0.4 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center border border-border/20">
                      <span className="text-zinc-500 text-sm tracking-widest uppercase font-medium">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="text-xs font-semibold text-primary mb-2 tracking-wider uppercase">{product.category}</div>
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-lg font-medium">${product.price.toFixed(2)}</span>
                    <button className="text-sm font-medium bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-full transition-colors pointer-events-none">
                      Learn More
                    </button>
                  </div>
                </div>
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>
        {!loading && products.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No products available yet. Add some from the Admin Dashboard!
          </div>
        )}
      </section>
    </div>
  );
}
