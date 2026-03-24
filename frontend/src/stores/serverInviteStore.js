import { create } from 'zustand';
import { apiFetch } from './apiFetch';
import { apiUrl } from '../config/urls';

const API_URL = apiUrl('/api/server-invites');

export const useServerInviteStore = create((set) => ({
    invites: [],
    isLoading: false,
    error: null,

    fetchInvites: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiFetch(API_URL, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch invites');
            set({ invites: data.invites || [], isLoading: false });
            return data.invites || [];
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    acceptInvite: async (inviteId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiFetch(`${API_URL}/${inviteId}/accept`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to accept invite');
            set((state) => ({
                invites: state.invites.filter((inv) => inv._id !== inviteId),
                isLoading: false,
            }));
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    declineInvite: async (inviteId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiFetch(`${API_URL}/${inviteId}/decline`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to decline invite');
            set((state) => ({
                invites: state.invites.filter((inv) => inv._id !== inviteId),
                isLoading: false,
            }));
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
