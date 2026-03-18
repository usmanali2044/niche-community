/**
 * Workspace Store — tracks the active community (workspace) the user is viewing.
 * Persists the selection to localStorage so it survives page refreshes.
 */
import { create } from 'zustand';

const STORAGE_KEY = 'circlecore_active_community';

export const useWorkspaceStore = create((set, get) => ({
    activeCommunityId: localStorage.getItem(STORAGE_KEY) || null,

    setActiveCommunity: (communityId) => {
        localStorage.setItem(STORAGE_KEY, communityId);
        set({ activeCommunityId: communityId });
    },

    /**
     * Called once on app boot — sets the activeCommunityId from the user's
     * memberships if nothing is persisted in localStorage yet.
     */
    initFromMemberships: (memberships) => {
        const current = get().activeCommunityId;
        if (current && memberships?.some((m) => {
            const id = m.communityId?._id || m.communityId;
            return id?.toString() === current;
        })) {
            return; // already set and valid
        }
        // Pick the first membership as default
        if (memberships?.length > 0) {
            const firstId = memberships[0].communityId?._id || memberships[0].communityId;
            if (firstId) {
                const id = firstId.toString?.() || firstId;
                localStorage.setItem(STORAGE_KEY, id);
                set({ activeCommunityId: id });
            }
        }
    },

    clearWorkspace: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ activeCommunityId: null });
    },
}));
