"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore, useCartStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, PackageX } from "lucide-react";

export default function CartPage() {
  const { token, role } = useAuthStore();
  const { items, removeFromCart, setQuantity, syncFromBackend, totalPrice, isLoading } = useCartStore();
  const { toast } = useToast();

  // Sync backend state on mount (in case localStorage is stale)
  useEffect(() => {
    if (token && role === "customer") {
      syncFromBackend();
    }
  }, [token, role, syncFromBackend]);

  if (!token || role !== "customer") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
        <div>
          <h1 className="text-2xl font-semibold mb-2">Your cart is waiting</h1>
          <p className="text-muted-foreground mb-6">Sign in as a customer to view and manage your cart.</p>
          <Link href="/login" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleRemove = async (product_id: number) => {
    // Optimistic
    removeFromCart(product_id);
    try {
      await api.delete(`/cart/items/${product_id}`);
    } catch {
      toast({ title: "Error", description: "Could not remove item.", variant: "destructive" });
      syncFromBackend(); // re-sync on failure
    }
  };

  const handleQtyChange = async (product_id: number, newQty: number) => {
    setQuantity(product_id, newQty);
    try {
      if (newQty <= 0) {
        await api.delete(`/cart/items/${product_id}`);
      } else {
        const formData = new FormData();
        formData.append("quantity", newQty.toString());
        await api.patch(`/cart/items/${product_id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
    } catch {
      syncFromBackend();
    }
  };

  const total = totalPrice();

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-1">Your Cart</h1>
          <p className="text-muted-foreground">
            {items.length === 0 ? "Nothing here yet." : `${items.reduce((s, i) => s + i.quantity, 0)} items`}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border/50 animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <PackageX className="w-16 h-16 text-muted-foreground/25" />
            <div>
              <p className="text-xl font-semibold mb-2">Your cart is empty</p>
              <p className="text-muted-foreground mb-6">Browse our latest arrivals and add something you love.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card hover:border-border transition-colors group"
                >
                  {/* Image */}
                  <Link href={`/products/${item.product_id}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-xl bg-secondary/40 border border-border/30 flex items-center justify-center p-2 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">{item.name[0]}</span>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.product_id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      ${item.price.toFixed(2)} each
                    </p>
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleQtyChange(item.product_id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary/60 disabled:opacity-30 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(item.product_id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary/60 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal + remove */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      className="mt-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-border/50 bg-card p-6 space-y-5">
                <h2 className="font-semibold text-lg">Order Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-green-500">{total >= 99 ? "Free" : "$9.99"}</span>
                  </div>
                  {total < 99 && (
                    <p className="text-xs text-primary pt-1">
                      Add ${(99 - total).toFixed(2)} more for free shipping!
                    </p>
                  )}
                </div>

                <div className="border-t border-border/50 pt-4 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${(total + (total >= 99 ? 0 : 9.99)).toFixed(2)}</span>
                </div>

                <button
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  onClick={() => toast({ title: "Coming soon!", description: "Checkout flow is under construction." })}
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </button>

                <Link href="/" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
