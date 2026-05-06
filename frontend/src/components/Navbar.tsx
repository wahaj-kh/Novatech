"use client";

import Link from "next/link";
import { User, ShoppingBag, LayoutDashboard, LogOut } from "lucide-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { token, role, logout } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    clearCart();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-semibold tracking-tight hover:text-primary transition-colors">
              NovaTech
            </Link>
          </div>

          {/* Center nav links */}
          <div className="hidden md:flex items-baseline space-x-8 text-sm font-medium">
            {["Smartphones", "Laptops", "Tablets", "Wearables"].map((cat) => (
              <Link
                key={cat}
                href={`/?category=${cat}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-5">
            {/* Cart — only visible to customers */}
            {role === "customer" && (
              <Link
                href="/cart"
                className="relative hover:text-primary transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-in zoom-in-50 duration-200">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>
            )}

            {/* Auth button */}
            {token ? (
              <div className="flex items-center gap-4">
                {role === "admin" && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
