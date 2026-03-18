import { create } from 'zustand';
import { apiFetch } from './apiFetch';
import { apiUrl } from '../config/urls';

const API_URL = apiUrl('/api/billing');

export const useBillingStore = create((set) => ({
    isLoading: false,
    error: null,

    createCheckoutSession: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiFetch(`${API_URL}/create-checkout-session`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create checkout session');
            set({ isLoading: false });
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
