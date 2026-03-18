import { create } from 'zustand';
import { apiFetch } from './apiFetch';
import { apiUrl } from '../config/urls';

const API_URL = apiUrl('/api/communities/roster');

export const useRosterStore = create((set) => ({
    friends: [],
    dms: [],
    onlineCount: 0,
    isLoading: false,
    error: null,

    fetchRoster: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiFetch(API_URL, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch roster');
            set({ friends: data.friends || [], dms: data.dms || [], onlineCount: data.onlineCount || 0, isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updatePresence: (userId, presence) => set((state) => {
        if (!userId) return state;
        const friends = state.friends.map((f) =>
            f._id === userId ? { ...f, presence: presence || f.presence } : f
        );
        const dms = state.dms.map((d) =>
            d._id === userId ? { ...d, presence: presence || d.presence } : d
        );
        const onlineCount = friends.filter((f) => f.presence === 'online').length;
        return { friends, dms, onlineCount };
    }),

    clearError: () => set({ error: null }),
}));
