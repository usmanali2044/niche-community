import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { apiUrl } from '../config/urls';

const API_URL = apiUrl('/api/profile');

export const useProfileStore = create((set) => ({
    profile: null,
    isLoading: false,
    error: null,

    fetchProfile: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch profile');
            set({ profile: data.profile, isLoading: false });
            useAuthStore.getState().setTier(data.profile?.tier || 'free');
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateProfile: async (id, profileData) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(profileData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update profile');
            set({ profile: data.profile, isLoading: false });
            useAuthStore.getState().setTier(data.profile?.tier || 'free');
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
