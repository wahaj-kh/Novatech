"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Monitor, HardDrive, Search, Plus, LogOut, Menu, X, Trash2, PackageX, Loader2, Image as ImageIcon, Star, PencilLine, RefreshCw, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string;
  is_featured?: boolean;
}

interface Order {
  id: number;
  customer_id: number;
  customer_email: string;
  total_amount: number;
  status: string;
}

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-500",
  processing: "bg-blue-500/10 text-blue-500",
  shipped:    "bg-purple-500/10 text-purple-500",
  delivered:  "bg-green-500/10 text-green-500",
  cancelled:  "bg-red-500/10 text-red-500",
};

const EMPTY_PRODUCT = { name: "", description: "", price: "", category: "", image_url: "", stock: "0", is_featured: false };

export default function AdminDashboard() {
  const { role, logout } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("products");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [originalProduct, setOriginalProduct] = useState<typeof EMPTY_PRODUCT | null>(null);
  const [editLookupId, setEditLookupId] = useState("");
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await api.get("/orders/admin/all");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load orders.", variant: "destructive" });
    } finally {
      setIsLoadingOrders(false);
    }
  }, [toast]);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await api.patch(`/orders/admin/${orderId}/status?status=${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: "✓ Status Updated", description: `Order #${orderId} is now ${newStatus}.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      await api.delete(`/orders/admin/${orderId}`);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast({ title: "✓ Deleted", description: `Order #${orderId} has been removed.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete order.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (role === "admin") fetchProducts();
  }, [role, fetchProducts]);

  useEffect(() => {
    if (role === "admin" && activeTab === "orders") fetchOrders();
  }, [role, activeTab, fetchOrders]);

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
      if (modalMode === "edit" && editingProductId) {
        if (!originalProduct) {
          toast({ title: "Error", description: "Load product first before updating.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }

        const payload: Record<string, string | number | boolean | null> = {};
        if (newProduct.name !== originalProduct.name) payload.name = newProduct.name;
        if (newProduct.description !== originalProduct.description) payload.description = newProduct.description || null;
        if (newProduct.price !== originalProduct.price) payload.price = parseFloat(newProduct.price);
        if (newProduct.category !== originalProduct.category) payload.category = newProduct.category;
        if (newProduct.stock !== originalProduct.stock) payload.stock = parseInt(newProduct.stock, 10);
        if (newProduct.image_url !== originalProduct.image_url) payload.image_url = newProduct.image_url || null;
        if (newProduct.is_featured !== originalProduct.is_featured) payload.is_featured = newProduct.is_featured;

        if (Object.keys(payload).length === 0) {
          toast({ title: "No changes", description: "Update at least one field before saving." });
          setIsSubmitting(false);
          return;
        }

        await api.patch(`/admin/products/${editingProductId}`, payload);
        await fetchProducts();
        setIsModalOpen(false);
        setEditingProductId(null);
        setOriginalProduct(null);
        setModalMode("add");
        setNewProduct(EMPTY_PRODUCT);
        toast({ title: "✓ Updated Successfully", description: "Product details were saved." });
        return;
      }

      const isFeatured = activeTab === "carousel" ? true : newProduct.is_featured;
      
      const formData = new FormData();
      formData.append("name", newProduct.name);
      if (newProduct.description) formData.append("description", newProduct.description);
      formData.append("price", newProduct.price);
      formData.append("category", newProduct.category);
      formData.append("stock", newProduct.stock);
      if (newProduct.image_url) formData.append("image_url", newProduct.image_url);
      formData.append("is_featured", isFeatured.toString());

      await api.post("/admin/products", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setIsModalOpen(false);
      setNewProduct(EMPTY_PRODUCT);
      await fetchProducts();
      toast({ title: "✓ Added Successfully", description: `"${newProduct.name}" is now live.` });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;

      if (status === 401 || status === 403) {
        toast({
          title: "Session expired",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive",
        });
        logout();
        router.push("/login");
        return;
      }

      toast({
        title: "Error",
        description: detail ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = async (productId: number) => {
    setIsLoadingEdit(true);
    try {
      const res = await api.get(`/products/${productId}`);
      const product: Product = res.data;
      setEditingProductId(product.id);
      setModalMode("edit");
      setLoadedProduct(product);
      setNewProduct({
        name: product.name ?? "",
        description: product.description ?? "",
        price: product.price?.toString() ?? "",
        category: product.category ?? "",
        image_url: product.image_url ?? "",
        stock: product.stock?.toString() ?? "0",
        is_featured: Boolean(product.is_featured),
      });
      setOriginalProduct({
        name: product.name ?? "",
        description: product.description ?? "",
        price: product.price?.toString() ?? "",
        category: product.category ?? "",
        image_url: product.image_url ?? "",
        stock: product.stock?.toString() ?? "0",
        is_featured: Boolean(product.is_featured),
      });
      setIsModalOpen(true);
      toast({
        title: "Product loaded",
        description: `Loaded #${product.id}${product.name ? ` - ${product.name}` : ""}. You can edit now.`,
      });
    } catch (err) {
      setLoadedProduct(null);
      toast({ title: "Error", description: "Product not found for this ID.", variant: "destructive" });
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleEditLookup = async () => {
    const id = parseInt(editLookupId, 10);
    if (!id || id < 1) {
      toast({ title: "Invalid ID", description: "Enter a valid numeric product ID.", variant: "destructive" });
      return;
    }
    await openEditModal(id);
  };

  const handleDeleteProduct = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "✓ Deleted", description: "The item has been removed." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await api.patch(`/admin/products/${product.id}`, { is_featured: !product.is_featured });
      setProducts(products.map(p => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p));
      toast({ title: "✓ Updated", description: `"${product.name}" carousel status updated.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  let filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (activeTab === "carousel") {
    filteredProducts = filteredProducts.filter(p => p.is_featured);
  }

  const field = (label: string, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  const getTabTitle = () => {
    if (activeTab === "products") return "Products";
    if (activeTab === "carousel") return "Carousel Items";
    return "Orders";
  };

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
              placeholder="Search…"
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
              { id: "carousel", label: "Carousel", Icon: ImageIcon },
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
            <h1 className="font-semibold">{getTabTitle()}</h1>
            {(activeTab === "products" || activeTab === "carousel") && (
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {filteredProducts.length} items
              </span>
            )}
            {activeTab === "orders" && (
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {orders.length} orders
              </span>
            )}
          </div>
          {(activeTab === "products" || activeTab === "carousel") && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={editLookupId}
                    onChange={(e) => setEditLookupId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleEditLookup();
                      }
                    }}
                    placeholder="Product ID"
                    className="w-28 rounded-lg border border-input bg-background/70 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={handleEditLookup}
                    disabled={isLoadingEdit}
                    className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors disabled:opacity-60"
                  >
                    {isLoadingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                    Edit by ID
                  </button>
                </div>
                <button
                  onClick={() => {
                    setModalMode("add");
                    setEditingProductId(null);
                    setOriginalProduct(null);
                    setNewProduct(EMPTY_PRODUCT);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add {activeTab === "carousel" ? "Carousel Item" : "Product"}</span>
                </button>
              </div>
          )}
          {activeTab === "orders" && (
            <button
              onClick={fetchOrders}
              disabled={isLoadingOrders}
              className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {(activeTab === "products" || activeTab === "carousel") && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditLookup();
                }}
                className="mb-4 rounded-xl border border-border/60 bg-secondary/20 p-3 md:p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Edit Product by ID</p>
                    <p className="text-xs text-muted-foreground">
                      Enter product ID and press Enter. Current values load into edit form.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={editLookupId}
                      onChange={(e) => setEditLookupId(e.target.value)}
                      placeholder="Product ID"
                      className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingEdit}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary/60 transition-colors disabled:opacity-60"
                    >
                      {isLoadingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                      Load
                    </button>
                  </div>
                </div>
                {loadedProduct && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Loaded: #{loadedProduct.id} {loadedProduct.name || "(no name)"} | {loadedProduct.category || "(no category)"} | ${loadedProduct.price?.toFixed(2) ?? "0.00"}
                  </p>
                )}
              </form>

              <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-secondary/50 text-muted-foreground border-b border-border/50">
                      <tr>
                        <th className="px-4 py-3 font-medium w-12"></th>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium text-center">Carousel</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                              <PackageX className="h-10 w-10 opacity-30" />
                              <p className="text-sm">{searchQuery ? "No items match your search." : "No items yet. Add your first one!"}</p>
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
                            <td className="px-4 py-3 text-center">
                              <button 
                                onClick={() => handleToggleFeatured(product)}
                                className={`p-1.5 rounded-full transition-colors ${product.is_featured ? 'text-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:bg-secondary'}`}
                                title={product.is_featured ? "Remove from Carousel" : "Add to Carousel"}
                              >
                                <Star className="h-4 w-4" fill={product.is_featured ? "currentColor" : "none"} />
                              </button>
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
                                <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditModal(product.id)}
                                    className="text-muted-foreground hover:text-foreground p-1 rounded"
                                    title="Edit item"
                                  >
                                    <PencilLine className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(product.id)}
                                    className="text-muted-foreground hover:text-destructive p-1 rounded"
                                    title="Delete item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "orders" && (
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/20">
                <div>
                  <h3 className="font-semibold text-sm">All Orders</h3>
                  <p className="text-xs text-muted-foreground">{orders.length} total orders</p>
                </div>
                <button
                  onClick={fetchOrders}
                  disabled={isLoadingOrders}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-secondary/50 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Order ID</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {isLoadingOrders ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-10 w-10 opacity-30 animate-spin" />
                            <p className="text-sm">Loading orders...</p>
                          </div>
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <HardDrive className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No orders yet.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-secondary/20 transition-colors group">
                          <td className="px-4 py-3 font-mono text-xs">#{order.id}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-sm">{order.customer_email}</p>
                              <p className="text-xs text-muted-foreground">ID: {order.customer_id}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold">${order.total_amount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <div className="relative inline-block">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                disabled={updatingOrderId === order.id}
                                className={`appearance-none rounded-full px-3 py-1 pr-7 text-xs font-medium border-0 cursor-pointer transition-colors disabled:opacity-50 ${STATUS_STYLES[order.status] || 'bg-secondary/50'}`}
                              >
                                {ORDER_STATUSES.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Delete order #${order.id}?`)) {
                                  handleDeleteOrder(order.id);
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive p-1 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              title="Delete order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-secondary/20">
              <div>
                <h3 className="font-semibold text-base">
                  {modalMode === "edit"
                    ? `Edit Product #${editingProductId ?? ""}`
                    : `Add New ${activeTab === "carousel" ? "Carousel Item" : "Product"}`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {modalMode === "edit"
                    ? "Current values are loaded. Update any fields and save."
                    : "Fill in all required fields to publish."}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setModalMode("add"); setEditingProductId(null); setOriginalProduct(null); setNewProduct(EMPTY_PRODUCT); }} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary/50">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {field(activeTab === "carousel" ? "Title / Name *" : "Product Name *",
                <input required type="text" placeholder="e.g. MacBook Pro 16-inch"
                  value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className={inputClass} />
              )}

              {field(activeTab === "carousel" ? "Tagline / Description" : "Description",
                <textarea rows={3} placeholder={activeTab === "carousel" ? "Power that defies gravity." : "Describe the product's key features…"}
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
              
              {activeTab === "products" && (
                <label className="flex items-center gap-3 p-3 border border-border/50 rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newProduct.is_featured} 
                    onChange={(e) => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" 
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Feature in Carousel</span>
                    <span className="text-xs text-muted-foreground">Show this product on the homepage hero</span>
                  </div>
                </label>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-border/50">
                <button type="button" onClick={() => { setIsModalOpen(false); setModalMode("add"); setEditingProductId(null); setOriginalProduct(null); setNewProduct(EMPTY_PRODUCT); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Saving…" : modalMode === "edit" ? "Update Item" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
