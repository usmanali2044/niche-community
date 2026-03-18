import { create } from 'zustand';

export const useInviteRequestStore = create((set, get) => ({
    requests: [],
    isLoading: false,
    error: null,

    requestInvite: async (communityId, message = '') => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`/api/communities/${communityId}/invite-requests`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to request invite');
            set({ isLoading: false });
            return data.request;
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    fetchRequests: async (communityId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`/api/communities/${communityId}/invite-requests`, {
                credentials: 'include',
                headers: { 'x-community-id': communityId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch invite requests');
            set({ requests: data.requests || [], isLoading: false });
            return data.requests || [];
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    approveRequest: async (communityId, requestId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`/api/communities/${communityId}/invite-requests/${requestId}/approve`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'x-community-id': communityId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to approve invite request');
            set((state) => ({
                requests: state.requests.map((r) => (r._id === requestId ? data.request : r)),
                isLoading: false,
            }));
            return data.request;
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    rejectRequest: async (communityId, requestId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`/api/communities/${communityId}/invite-requests/${requestId}/reject`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'x-community-id': communityId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to reject invite request');
            set((state) => ({
                requests: state.requests.map((r) => (r._id === requestId ? data.request : r)),
                isLoading: false,
            }));
            return data.request;
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    clearError: () => set({ error: null }),
}));
