import { create } from "zustand";

export const useToastStore = create((set) => ({
  toasts: [],
  pushToast: (message, icon = "✨") => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, icon, message }]
    }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  }
}));
