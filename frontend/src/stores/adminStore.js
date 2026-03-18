import { create } from 'zustand';
import { apiUrl } from '../config/urls';

const BASE = apiUrl('/api/moderate');

const moderateHeaders = (communityId) => ({
    'Content-Type': 'application/json',
    ...(communityId ? { 'x-community-id': communityId } : {}),
});

export const useAdminStore = create((set, get) => ({
    queue: [],
    total: 0,
    auditLogs: [],
    isLoading: false,
    isLogsLoading: false,
    error: null,

    // ── Fetch moderation queue ───────────────────────────────────────────────
    fetchQueue: async (communityId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${BASE}/queue`, {
                credentials: 'include',
                headers: communityId ? { 'x-community-id': communityId } : {},
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch queue');
            set({ queue: data.queue, total: data.total, isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // ── Fetch audit logs ─────────────────────────────────────────────────────
    fetchAuditLogs: async (communityId) => {
        set({ isLogsLoading: true, error: null });
        try {
            const res = await fetch(`${BASE}/logs`, {
                credentials: 'include',
                headers: { 'x-community-id': communityId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch audit logs');
            set({ auditLogs: data.logs, isLogsLoading: false });
            return data;
        } catch (error) {
            set({ error: error.message, isLogsLoading: false });
            throw error;
        }
    },

    // ── Dismiss flag (optimistic) ────────────────────────────────────────────
    resolveFlag: async (postId, communityId) => {
        const prev = get().queue;
        set((s) => ({ queue: s.queue.filter((p) => p._id !== postId), total: s.total - 1 }));
        try {
            const res = await fetch(`${BASE}/resolve/${postId}`, {
                method: 'POST',
                credentials: 'include',
                headers: communityId ? { 'x-community-id': communityId } : {},
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to resolve flag');
            return data;
        } catch (error) {
            set({ queue: prev, total: prev.length, error: error.message });
            throw error;
        }
    },

    // ── Delete post (optimistic) ─────────────────────────────────────────────
    deletePost: async (postId, communityId, reason = '') => {
        const prev = get().queue;
        set((s) => ({ queue: s.queue.filter((p) => p._id !== postId), total: s.total - 1 }));
        try {
            const res = await fetch(`${BASE}/post/${postId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: moderateHeaders(communityId),
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to delete post');
            return data;
        } catch (error) {
            set({ queue: prev, total: prev.length, error: error.message });
            throw error;
        }
    },

    // ── Warn user ────────────────────────────────────────────────────────────
    warnUser: async (userId, communityId, reason = '') => {
        try {
            const res = await fetch(`${BASE}/warn/${userId}`, {
                method: 'POST',
                credentials: 'include',
                headers: moderateHeaders(communityId),
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to warn user');
            return data;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // ── Suspend user ─────────────────────────────────────────────────────────
    suspendUser: async (userId, communityId, duration = '24h', reason = '') => {
        try {
            const res = await fetch(`${BASE}/suspend/${userId}`, {
                method: 'POST',
                credentials: 'include',
                headers: moderateHeaders(communityId),
                body: JSON.stringify({ duration, reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to suspend user');
            return data;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // ── Ban user ─────────────────────────────────────────────────────────────
    banUser: async (userId, communityId, reason = '') => {
        try {
            const res = await fetch(`${BASE}/ban/${userId}`, {
                method: 'POST',
                credentials: 'include',
                headers: moderateHeaders(communityId),
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to ban user');
            return data;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
