import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useProductStore } from "@/lib/productStore";
import Link from "next/link";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { products, fetchProducts } = useProductStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      // Focus the input slightly after it mounts
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden"; // Prevent scrolling when overlay is open
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, fetchProducts]);

  const filteredProducts = query.trim() === ""
    ? []
    : products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex flex-col items-center pt-[20vh] px-4 backdrop-blur-2xl bg-black/5 dark:bg-white/10"
        >
          <div className="absolute inset-0 z-0" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-2xl bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-10"
          >
            <div className="flex items-center px-4 py-4 border-b border-border/50">
              <Search className="w-6 h-6 text-muted-foreground mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products, categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xl placeholder:text-muted-foreground/60"
              />
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {query.trim() !== "" && (
              <div className="max-h-[50vh] overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <ul className="py-2">
                    {filteredProducts.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/products/${product.id}`}
                          onClick={onClose}
                          className="flex items-center px-6 py-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-12 h-12 bg-secondary/30 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                              <Search className="w-5 h-5 text-muted-foreground/50" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.category} &middot; ${product.price.toFixed(2)}</div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-12 text-center text-muted-foreground">
                    No results found for "{query}"
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
