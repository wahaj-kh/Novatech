"use client";

import Link from "next/link";
import { User, ShoppingBag, LayoutDashboard, LogOut, Search, Menu, X } from "lucide-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchOverlay from "./SearchOverlay";

export default function Navbar() {
  const { token, role, logout } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();
  const pathname = usePathname();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    clearCart();
    router.push("/");
  };

  const categories = ["Smartphones", "Laptops", "Tablets", "Wearables"];

  const navBg = isHomePage && !isScrolled
    ? "bg-transparent"
    : "bg-black/80 backdrop-blur-xl border-b border-white/[0.06]";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -ml-2 text-white/60 hover:text-white transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0 flex-1 md:flex-none text-center md:text-left">
              <Link href="/" className="text-xl font-semibold tracking-tight text-white hover:text-white/80 transition-colors">
                NovaTech
              </Link>
            </div>

            {/* Center nav links */}
            <div className="hidden md:flex items-baseline space-x-8 text-sm font-medium">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/?category=${cat}`}
                  scroll={false}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center space-x-4 md:space-x-5">
              
              {/* Search Button */}
              {!isSearchOpen && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Cart — only visible to customers */}
              {role === "customer" && (
                <Link
                  href="/cart"
                  className="relative text-white/60 hover:text-white transition-colors"
                  aria-label="Shopping cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#2997ff] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-in zoom-in-50 duration-200">
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
                      className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-red-400 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Slide-in Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-b border-white/[0.06] bg-black/95 backdrop-blur-md"
            >
              <div className="px-4 py-4 space-y-3 flex flex-col">
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/?category=${cat}`}
                    scroll={false}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base font-medium text-white/60 hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
                {!token && (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-base font-medium text-white/60 hover:text-white transition-colors pt-2 border-t border-white/[0.06]"
                  >
                    <User className="w-5 h-5" />
                    <span>Sign In</span>
                  </Link>
                )}
                {token && role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-base font-medium text-white/60 hover:text-white transition-colors pt-2 border-t border-white/[0.06]"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Overlay component, handles its own AnimatePresence */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
