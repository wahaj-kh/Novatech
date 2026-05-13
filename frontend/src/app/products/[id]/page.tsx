"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore, useCartStore } from "@/lib/store";
import { ShoppingBag, ChevronLeft, Minus, Plus, Check, Star, Shield, Truck } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const { token, role } = useAuthStore();
  const { addToCart, removeFromCart, setQuantity: updateCartQuantity } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch {
        toast({ title: "Error", description: "Product not found", variant: "destructive" });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, router, toast]);

  const handleAddToCart = async () => {
    if (!token || role !== "customer") {
      toast({
        title: "Sign in required",
        description: "Please sign in as a customer to add items to your cart.",
      });
      router.push("/login");
      return;
    }
    if (!product) return;

    setIsAdding(true);
    try {
      // 1. Optimistic update — cart badge increments instantly
      addToCart(
        { product_id: product.id, name: product.name, price: product.price, image_url: product.image_url },
        quantity
      );
      // 2. Sync to backend
      const formData = new FormData();
      formData.append("product_id", product.id.toString());
      formData.append("quantity", quantity.toString());
      await api.post("/cart/items", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAdded(true);
      toast({ title: "Added to Cart ✓", description: `${quantity}× ${product.name}` });
      setTimeout(() => setAdded(false), 2500);
    } catch {
      const currentItem = useCartStore.getState().items.find((item) => item.product_id === product.id);
      if (currentItem) {
        const rolledBackQty = currentItem.quantity - quantity;
        if (rolledBackQty > 0) {
          updateCartQuantity(product.id, rolledBackQty);
        } else {
          removeFromCart(product.id);
        }
      }
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const adjustQty = (delta: number) => {
    setQuantity((q) => Math.max(1, Math.min(product?.stock ?? 1, q + delta)));
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-pulse">
            <div className="order-2 lg:order-1 space-y-6">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-12 w-3/4 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
              <div className="h-10 w-32 bg-muted rounded" />
              <div className="h-14 w-48 bg-muted rounded-full" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-square bg-muted rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen pt-24 pb-28 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-12 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Product Info ── */}
          <div className="order-2 lg:order-1 animate-in slide-in-from-left-8 duration-700">

            {/* Category badge */}
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-5">
              {product.category}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
              {product.name}
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              {product.description ||
                "Experience the next level of performance with our premium design and engineering. Built for those who demand the best."}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-semibold tracking-tight">
                ${product.price.toFixed(2)}
              </span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                inStock
                  ? "bg-green-500/10 text-green-500"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {inStock ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>

            {/* Quantity selector */}
            {inStock && (
              <div className="flex items-center gap-4 mb-8">
                <span className="text-sm font-medium text-muted-foreground">Qty</span>
                <div className="flex items-center border border-border rounded-full overflow-hidden bg-secondary/30">
                  <button
                    onClick={() => adjustQty(-1)}
                    disabled={quantity <= 1}
                    className="p-2.5 hover:bg-secondary/80 disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => adjustQty(1)}
                    disabled={quantity >= product.stock}
                    className="p-2.5 hover:bg-secondary/80 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock || isAdding}
              className={`flex items-center justify-center gap-2.5 px-10 py-4 rounded-full text-base font-semibold transition-all duration-300 w-full sm:w-auto
                ${added
                  ? "bg-green-500 text-white scale-95"
                  : inStock
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
            >
              {added ? (
                <><Check className="w-5 h-5" /> Added!</>
              ) : (
                <><ShoppingBag className="w-5 h-5" /> {inStock ? "Add to Cart" : "Out of Stock"}</>
              )}
            </button>

            {/* Trust badges */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary shrink-0" />
                Free shipping on orders over $99
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                1-year warranty included
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary shrink-0" />
                30-day returns
              </div>
            </div>
          </div>

          {/* ── Right: Product Image ── */}
          <div className="order-1 lg:order-2 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="aspect-square relative rounded-3xl bg-gradient-to-br from-secondary/40 to-secondary/10 border border-border/50 flex items-center justify-center p-10 shadow-2xl overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/10 pointer-events-none" />
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="object-contain w-full h-full drop-shadow-2xl hover:scale-[1.04] transition-transform duration-700"
                />
              ) : (
                <div className="text-center space-y-2">
                  <div className="text-5xl font-bold text-border">{product.name[0]}</div>
                  <div className="text-muted-foreground text-sm tracking-widest uppercase font-medium">
                    No Preview
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/90 backdrop-blur-xl p-4 flex items-center gap-4">
        <div>
          <div className="text-xs text-muted-foreground">{product.name}</div>
          <div className="text-lg font-semibold">${product.price.toFixed(2)}</div>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!inStock || isAdding}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200
            ${added ? "bg-green-500 text-white" : inStock ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
        >
          {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          {added ? "Added!" : inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
