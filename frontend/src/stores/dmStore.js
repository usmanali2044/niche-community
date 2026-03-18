import { create } from 'zustand';
import { apiFetch } from './apiFetch';
import { apiUrl } from '../config/urls';

const API_URL = apiUrl('/api/dm');

export const useDmStore = create((set) => ({
    threadId: null,
    messages: [],
    isLoading: false,
    error: null,

    openThread: async (userId) => {
        set({ isLoading: true, error: null });
        const res = await apiFetch(`${API_URL}/thread/${userId}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to open thread');
        set({ threadId: data.threadId, isLoading: false });
        return data.threadId;
    },

    fetchMessages: async (threadId) => {
        set({ isLoading: true, error: null });
        const res = await apiFetch(`${API_URL}/messages/${threadId}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load messages');
        set({ messages: data.messages || [], isLoading: false });
        return data.messages || [];
    },

    sendMessage: async (threadId, payload) => {
        const res = await apiFetch(`${API_URL}/messages/${threadId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to send message');
        return data.message;
    },

    pushMessage: (msg) => set((state) => {
        if (state.messages.some((m) => m._id === msg._id)) return state;
        return { messages: [...state.messages, msg] };
    }),
}));
