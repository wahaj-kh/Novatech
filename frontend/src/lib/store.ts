import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

// ─── Auth Store ──────────────────────────────────────────────────────────────

interface AuthState {
  token: string | null;
  role: string | null;
  setAuth: (token: string, role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      setAuth: (token, role) => set({ token, role }),
      logout: () => set({ token: null, role: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// ─── Cart Store ───────────────────────────────────────────────────────────────

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  // Adds an item or increments quantity if it already exists
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  // Removes an item entirely from local state
  removeFromCart: (product_id: number) => void;
  // Set a specific quantity; removes item if quantity <= 0
  setQuantity: (product_id: number, quantity: number) => void;
  // Wipe the cart (on logout)
  clearCart: () => void;
  // Fetch the live cart from the backend and overwrite local state
  syncFromBackend: () => Promise<void>;
  // Computed: total number of items (sum of all quantities)
  totalItems: () => number;
  // Computed: total price
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addToCart: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === item.product_id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      removeFromCart: (product_id) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== product_id),
        }));
      },

      setQuantity: (product_id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(product_id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === product_id ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      syncFromBackend: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get('/cart/');
          const backendItems: CartItem[] = res.data.items;
          set({ items: backendItems });
        } catch {
          // If unauthenticated or error, silently ignore
        } finally {
          set({ isLoading: false });
        }
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);
