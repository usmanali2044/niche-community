import { create } from 'zustand';
import { apiUrl } from '../config/urls';

const API_URL = apiUrl('/api/invites');

export const useInviteStore = create((set) => ({
    isInviteValidated: false,
    validatedCode: null,
    isLoading: false,
    error: null,

    // Check if there's a validated invite in sessionStorage
    checkInviteStatus: () => {
        const code = sessionStorage.getItem('circlecore_invite_code');
        if (code) {
            set({ isInviteValidated: true, validatedCode: code });
            return true;
        }
        return false;
    },

    // Validate invite code (public — no auth)
    validateInviteCode: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid invite code');
            // Store in sessionStorage so signup page can read it
            sessionStorage.setItem('circlecore_invite_code', code);
            set({ isInviteValidated: true, validatedCode: code, isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Clear invite state (e.g. after successful signup)
    clearInvite: () => {
        sessionStorage.removeItem('circlecore_invite_code');
        set({ isInviteValidated: false, validatedCode: null });
    },

    clearError: () => set({ error: null }),
}));
