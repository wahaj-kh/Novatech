"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Monitor, HardDrive, Search, Plus, LogOut, Menu, X, Trash2, PackageX, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string;
}

const EMPTY_PRODUCT = { name: "", description: "", price: "", category: "", image_url: "", stock: "0" };

export default function AdminDashboard() {
  const { role, logout } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (role === "admin") fetchProducts();
  }, [role, fetchProducts]);

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Unauthorized. Redirecting...</p>
      </div>
    );
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/admin/products", {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
      });
      setIsModalOpen(false);
      setNewProduct(EMPTY_PRODUCT);
      await fetchProducts();
      toast({ title: "✓ Product Added", description: `"${newProduct.name}" is now live.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add product. Check your session.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "✓ Product Deleted", description: "The product has been removed." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const field = (label: string, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground font-sans pt-14 md:pt-16">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-background/50 backdrop-blur-xl shrink-0 z-40">
        <span className="font-semibold tracking-wide">Admin</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? "flex fixed inset-0 top-[56px] z-30" : "hidden"} md:flex w-full md:w-64 border-r border-border/50 bg-secondary/80 md:bg-secondary/30 backdrop-blur-3xl flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]`}>
        <div className="p-4 pt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Management</div>
          <nav className="space-y-1 px-2">
            {[
              { id: "products", label: "Products", Icon: Monitor },
              { id: "orders", label: "Orders", Icon: HardDrive },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary/80"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-border/50">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-destructive hover:opacity-80 transition-opacity">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isSidebarOpen ? "hidden md:flex" : "flex"} flex-1 flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] relative`}>
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-background/50 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold">{activeTab === "products" ? "Products" : "Orders"}</h1>
            {activeTab === "products" && (
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {products.length} items
              </span>
            )}
          </div>
          {activeTab === "products" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-secondary/50 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium w-12"></th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <PackageX className="h-10 w-10 opacity-30" />
                          <p className="text-sm">{searchQuery ? "No products match your search." : "No products yet. Add your first one!"}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-secondary/20 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden border border-border/30">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-bold">{product.name[0]}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                        <td className="px-4 py-3">${product.price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${product.stock === 0 ? "text-destructive" : product.stock < 10 ? "text-yellow-500" : "text-green-500"}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {confirmDeleteId === product.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-muted-foreground">Sure?</span>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={deletingId === product.id}
                                className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                              >
                                {deletingId === product.id ? "Deleting…" : "Yes, delete"}
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-medium text-muted-foreground hover:underline">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-secondary/20">
              <div>
                <h3 className="font-semibold text-base">Add New Product</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Fill in all required fields to publish.</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setNewProduct(EMPTY_PRODUCT); }} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary/50">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {field("Product Name *",
                <input required type="text" placeholder="e.g. MacBook Pro 16-inch"
                  value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className={inputClass} />
              )}

              {field("Description",
                <textarea rows={3} placeholder="Describe the product's key features…"
                  value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className={`${inputClass} resize-none`} />
              )}

              {field("Category *",
                <select required value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className={inputClass}>
                  <option value="">Select a category</option>
                  <option value="Smartphones">Smartphones</option>
                  <option value="Laptops">Laptops</option>
                  <option value="Tablets">Tablets</option>
                  <option value="Wearables">Wearables</option>
                  <option value="Accessories">Accessories</option>
                </select>
              )}

              <div className="grid grid-cols-2 gap-4">
                {field("Price (USD) *",
                  <input required type="number" step="0.01" min="0" placeholder="0.00"
                    value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className={inputClass} />
                )}
                {field("Stock *",
                  <input required type="number" min="0" placeholder="0"
                    value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className={inputClass} />
                )}
              </div>

              {field("Image URL",
                <input type="url" placeholder="https://…"
                  value={newProduct.image_url} onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  className={inputClass} />
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-border/50">
                <button type="button" onClick={() => { setIsModalOpen(false); setNewProduct(EMPTY_PRODUCT); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Saving…" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
