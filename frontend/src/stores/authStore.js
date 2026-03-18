import { create } from 'zustand';
import { useWorkspaceStore } from './workspaceStore';
import { apiUrl } from '../config/urls';

const API_URL = apiUrl('/api/auth');

export const useAuthStore = create((set) => ({
    user: null,
    tier: 'free',
    isLoading: false,
    error: null,
    message: null,
    isCheckingAuth: true,

    signup: async (name, email, password, inviteCode) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, email, password, inviteCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Signup failed');
            set({ user: data.user, tier: data.user?.tier || 'free', isLoading: false });
            // Initialise the active workspace from memberships
            if (data.user?.memberships) {
                useWorkspaceStore.getState().initFromMemberships(data.user.memberships);
            }
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');
            set({ user: data.user, tier: data.user?.tier || 'free', isLoading: false });
            // Initialise the active workspace from memberships
            if (data.user?.memberships) {
                useWorkspaceStore.getState().initFromMemberships(data.user.memberships);
            }
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            useWorkspaceStore.getState().clearWorkspace();
            set({ user: null, tier: 'free', isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
            const res = await fetch(`${API_URL}/check-auth`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            set({ user: data.user, tier: data.user?.tier || 'free', isCheckingAuth: false });
            // Restore / initialise workspace from persisted memberships
            if (data.user?.memberships) {
                useWorkspaceStore.getState().initFromMemberships(data.user.memberships);
            }
        } catch {
            set({ user: null, tier: 'free', isCheckingAuth: false });
        }
    },

    verifyEmail: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Verification failed');
            set({ user: data.user, tier: data.user?.tier || 'free', isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    forgotPassword: async (email) => {
        set({ isLoading: true, error: null, message: null });
        try {
            const res = await fetch(`${API_URL}/forgotpassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
            set({ message: data.message, isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    resetPassword: async (token, password) => {
        set({ isLoading: true, error: null, message: null });
        try {
            const res = await fetch(`${API_URL}/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to reset password');
            set({ message: data.message, isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    googleLogin: async (credential, inviteCode) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ credential, inviteCode: inviteCode || undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Google login failed');
            set({ user: data.user, tier: data.user?.tier || 'free', isLoading: false });
            if (data.user?.memberships) {
                useWorkspaceStore.getState().initFromMemberships(data.user.memberships);
            }
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    setUser: (user) => {
        set({ user, tier: user?.tier || 'free' });
        if (user?.memberships) {
            useWorkspaceStore.getState().initFromMemberships(user.memberships);
        }
    },

    clearError: () => set({ error: null, message: null }),
    setTier: (tier) => set({ tier: tier || 'free' }),
}));
