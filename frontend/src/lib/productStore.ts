import { create } from 'zustand';
import { api } from './api';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string;
  description?: string;
  is_featured?: boolean;
}

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  isLoading: boolean;
  hasFetched: boolean;
  hasFetchedFeatured: boolean;
  fetchProducts: () => Promise<void>;
  fetchFeatured: () => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  featuredProducts: [],
  isLoading: false,
  hasFetched: false,
  hasFetchedFeatured: false,

  fetchProducts: async () => {
    // If already fetched or currently loading, skip to avoid redundant requests
    if (get().hasFetched || get().isLoading) return;

    set({ isLoading: true });
    try {
      const res = await api.get('/products');
      set({ products: res.data, hasFetched: true });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFeatured: async () => {
    if (get().hasFetchedFeatured) return;

    try {
      const res = await api.get('/products/featured');
      set({ featuredProducts: res.data, hasFetchedFeatured: true });
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
    }
  },
}));
