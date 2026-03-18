import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Search, Users, Pin, HelpCircle, User, MessageCircle, Phone, MoreVertical, Mic, Headphones, Settings, Menu, X, Server, Compass } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useFeedStore } from '../stores/feedStore';
import { useProfileStore } from '../stores/profileStore';
import { useRosterStore } from '../stores/rosterStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import WorkspaceSwitcher from '../components/WorkspaceSwitcher';
import Sidebar from '../components/Sidebar';
import { useChannelStore } from '../stores/channelStore';
import { useFriendStore } from '../stores/friendStore';
import ProfilePopout from '../components/ProfilePopout';
import MemberProfilePopout from '../components/MemberProfilePopout';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import NotificationBell from '../components/NotificationBell';
import useSocket from '../hooks/useSocket';
import useVoiceCall from '../hooks/useVoiceCall';
import { useDmStore } from '../stores/dmStore';
import DmPanel from '../components/DmPanel';
import ChannelChat from '../components/ChannelChat';
import VoiceAudioPlayer from '../components/VoiceAudioPlayer';
import VoiceVideoPlayer from '../components/VoiceVideoPlayer';
import { useEventStore } from '../stores/eventStore';

const presenceColor = (presence) => {
    if (presence === 'dnd') return 'bg-red-500';
    if (presence === 'idle') return 'bg-yellow-400';
    if (presence === 'offline') return 'bg-discord-faint/60';
    return 'bg-discord-green';
};

const FeedPage = () => {
    const [viewMode, setViewMode] = useState('server'); // 'server' | 'friends' | 'dm'
    const [showProfilePopout, setShowProfilePopout] = useState(false);
    const [showProfileSettings, setShowProfileSettings] = useState(false);
    const [showPins, setShowPins] = useState(false);
    const [activeTab, setActiveTab] = useState('online');
    const [showMemberList, setShowMemberList] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showMemberPopout, setShowMemberPopout] = useState(false);
    const [friendIdInput, setFriendIdInput] = useState('');
    const [activeFriendMenuId, setActiveFriendMenuId] = useState(null);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [showMobileDmList, setShowMobileDmList] = useState(false);
    const [showMobileServers, setShowMobileServers] = useState(false);
    const [mobileDirectorySignal, setMobileDirectorySignal] = useState(0);
    const [isServerSwitching, setIsServerSwitching] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { uploadFile, fetchFeed } = useFeedStore();
    const { profile, updateProfile } = useProfileStore();
    const { activeCommunityId, setActiveCommunity } = useWorkspaceStore();
    const { friends: rosterFriends, fetchRoster, updatePresence: updateRosterPresence } = useRosterStore();
    const { channels, activeChannelId, fetchChannels, setActiveChannel } = useChannelStore();
    const {
        friends,
        onlineCount,
        incoming,
        outgoing,
        isLoading: isFriendLoading,
        error: friendError,
        success: friendSuccess,
        fetchFriends,
        fetchRequests,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend,
        clearMessages,
        updatePresence: updateFriendPresence,
    } = useFriendStore();
    const { threadId, messages, openThread, fetchMessages, sendMessage, pushMessage } = useDmStore();
    const { fetchEvents, handleNewEvent, handleRsvpUpdate, handleDeleteEvent, handleUpdateEvent, handleStartEvent, handleEndEvent } = useEventStore();
    const [activeDm, setActiveDm] = useState(null);
    const [dmText, setDmText] = useState('');
    const [dmFiles, setDmFiles] = useState([]);
    const [dmSending, setDmSending] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [showStreamViewer, setShowStreamViewer] = useState(true);
    const [showStreamFullscreen, setShowStreamFullscreen] = useState(false);
    const [roles, setRoles] = useState([]);
    const streamVideoRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const prevCommunityIdRef = useRef(activeCommunityId);

    const displayName = profile?.displayName || profile?.name || user?.name || 'Usman';
    const username = user?.username || 'usman1943';
    const statusText = profile?.bio || 'No bio yet';

    useEffect(() => {
        if (!user?.memberships || user.memberships.length === 0) {
            setViewMode('friends');
        }
    }, [user?.memberships?.length]);

    useEffect(() => {
        if (!activeCommunityId) return;
        fetchRoster();
    }, [activeCommunityId, fetchRoster]);

    useEffect(() => {
        if (!activeCommunityId) {
            setRoles([]);
            return;
        }
        let cancelled = false;
        const fetchRoles = async () => {
            try {
                const res = await fetch(`/api/communities/${activeCommunityId}/roles`, {
                    credentials: 'include',
                    headers: { 'x-community-id': activeCommunityId },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to fetch roles');
                if (!cancelled) setRoles(data.roles || []);
            } catch {
                if (!cancelled) setRoles([]);
            }
        };
        fetchRoles();
        return () => { cancelled = true; };
    }, [activeCommunityId]);

    const socket = useSocket(user?._id, activeCommunityId);
    const {
        activeVoiceChannel,
        participants: voiceParticipants,
        remoteMedia,
        remoteVideos,
        isMuted,
        isDeafened,
        isSharing,
        noiseReduction,
        connectedPeerIds,
        elapsed,
        joinVoice,
        leaveVoice,
        toggleMute,
        toggleDeafen,
        toggleNoiseReduction,
        startScreenShare,
        stopScreenShare,
    } = useVoiceCall(socket, user, profile);

    useEffect(() => {
        if (remoteVideos.length > 0) {
            setShowStreamViewer(true);
        }
    }, [remoteVideos.length]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join_events');
        const handlePresence = (payload) => {
            if (payload?.userId === user?._id) {
                useProfileStore.setState((state) => ({
                    profile: {
                        ...(state.profile || {}),
                        presence: payload.presence ?? state.profile?.presence,
                        bio: payload.bio ?? state.profile?.bio,
                        displayName: payload.displayName ?? state.profile?.displayName,
                        avatar: payload.avatar ?? state.profile?.avatar,
                    },
                }));
            }
            if (payload?.userId) {
                updateFriendPresence(payload.userId, payload.presence);
                updateRosterPresence(payload.userId, payload.presence);
            }
        };
        const handleFriends = () => {
            fetchFriends();
            fetchRequests();
        };
        const handleDmMessage = (msg) => {
            pushMessage(msg);
        };
        const handleTyping = ({ threadId: tId, userId, isTyping }) => {
            if (!tId || tId !== threadId) return;
            if (userId !== user?._id) {
                setTypingUser(isTyping ? userId : null);
            }
        };
        const handleNewEventSocket = (event) => handleNewEvent(event);
        const handleRsvpSocket = (payload) => handleRsvpUpdate(payload);
        const handleDeleteSocket = ({ eventId }) => handleDeleteEvent(eventId);
        const handleUpdateSocket = (event) => handleUpdateEvent(event);
        const handleStartSocket = (event) => handleStartEvent(event);
        const handleEndSocket = (event) => handleEndEvent(event);
        socket.on('presence:update', handlePresence);
        socket.on('profile:updated', handlePresence);
        socket.on('friends:updated', handleFriends);
        socket.on('friends:requests:update', handleFriends);
        socket.on('dm:message', handleDmMessage);
        socket.on('dm:typing', handleTyping);
        socket.on('new_event', handleNewEventSocket);
        socket.on('rsvp_update', handleRsvpSocket);
        socket.on('event_deleted', handleDeleteSocket);
        socket.on('event_updated', handleUpdateSocket);
        socket.on('event_started', handleStartSocket);
        socket.on('event_ended', handleEndSocket);
        return () => {
            socket.off('presence:update', handlePresence);
            socket.off('profile:updated', handlePresence);
            socket.off('friends:updated', handleFriends);
            socket.off('friends:requests:update', handleFriends);
            socket.off('dm:message', handleDmMessage);
            socket.off('dm:typing', handleTyping);
            socket.off('new_event', handleNewEventSocket);
            socket.off('rsvp_update', handleRsvpSocket);
            socket.off('event_deleted', handleDeleteSocket);
            socket.off('event_updated', handleUpdateSocket);
            socket.off('event_started', handleStartSocket);
            socket.off('event_ended', handleEndSocket);
        };
    }, [socket, user?._id, updateProfile, fetchFriends, fetchRequests, threadId, handleNewEvent, handleRsvpUpdate, handleDeleteEvent, handleUpdateEvent, handleStartEvent, handleEndEvent, updateFriendPresence, updateRosterPresence]);

    useEffect(() => {
        if (!activeCommunityId) return;
        fetchChannels();
    }, [activeCommunityId, fetchChannels]);

    useEffect(() => {
        fetchFriends();
        fetchRequests();
    }, [fetchFriends, fetchRequests]);

    useEffect(() => {
        setShowMobileSidebar(false);
        setShowMobileDmList(false);
        setShowMobileServers(false);
    }, [viewMode]);

    useEffect(() => {
        const prev = prevCommunityIdRef.current;
        if (prev && activeCommunityId && prev !== activeCommunityId) {
            setIsServerSwitching(true);
            const timer = setTimeout(() => setIsServerSwitching(false), 280);
            prevCommunityIdRef.current = activeCommunityId;
            return () => clearTimeout(timer);
        }
        prevCommunityIdRef.current = activeCommunityId;
    }, [activeCommunityId]);

    const openDmForFriend = async (friend) => {
        if (!friend?._id) return;
        setActiveFriendMenuId(null);
        setActiveDm(friend);
        setViewMode('dm');
        try {
            const tid = await openThread(friend._id);
            socket?.emit('join_dm', tid);
            await fetchMessages(tid);
        } catch { }
    };

    useEffect(() => {
        if (!friendError && !friendSuccess) return;
        const t = setTimeout(() => clearMessages(), 2500);
        return () => clearTimeout(t);
    }, [friendError, friendSuccess, clearMessages]);

    useEffect(() => {
        if (!activeChannelId && channels.length > 0) {
            setActiveChannel(channels[0]._id);
        }
    }, [activeChannelId, channels, setActiveChannel]);

    const activeChannel = useMemo(
        () => channels.find((ch) => ch._id === activeChannelId) || channels[0],
        [channels, activeChannelId]
    );

    const activeMembership = useMemo(() => (
        user?.memberships?.find((m) => {
            const membershipCommunityId = typeof m.communityId === 'string' ? m.communityId : m.communityId?._id;
            return membershipCommunityId === activeCommunityId;
        }) || null
    ), [user?.memberships, activeCommunityId]);

    const memberList = useMemo(() => {
        const current = {
            _id: user?._id || 'me',
            displayName,
            statusText,
            presence: profile?.presence || 'online',
            avatar: profile?.avatar || '',
            bannerColor: profile?.bannerColor || '#3f4f4f',
            bio: profile?.bio || '',
            username: user?.username || (user?.email ? user.email.split('@')[0] : 'user'),
            communityRole: activeMembership?.role || 'member',
            roleIds: activeMembership?.roles || [],
        };
        const others = (rosterFriends || []).map((m) => ({
            ...m,
            presence: m.presence || 'online',
        }));
        return [current, ...others];
    }, [
        user?._id,
        user?.username,
        user?.email,
        displayName,
        statusText,
        profile?.avatar,
        profile?.presence,
        profile?.bannerColor,
        profile?.bio,
        rosterFriends,
        activeMembership?.role,
        activeMembership?.roles,
    ]);

    const rolePermissions = useMemo(() => {
        const map = new Map((roles || []).map((r) => [r._id?.toString?.() || String(r._id), r.permissions || {}]));
        return (activeMembership?.roles || []).reduce((acc, roleId) => {
            const perms = map.get(roleId?.toString?.() || String(roleId));
            if (!perms) return acc;
            Object.keys(perms).forEach((key) => {
                if (perms[key]) acc[key] = true;
            });
            return acc;
        }, {});
    }, [roles, activeMembership?.roles]);

    const canEditChannel = ['admin', 'moderator'].includes(activeMembership?.role) || rolePermissions.manageChannels;

    const groupedMembers = useMemo(() => {
        const presenceOrder = { online: 0, dnd: 1, idle: 2, offline: 3 };
        const sortByPresence = (list) => [...list].sort((a, b) => {
            const diff = (presenceOrder[a.presence] ?? 9) - (presenceOrder[b.presence] ?? 9);
            if (diff !== 0) return diff;
            return (a.displayName || '').localeCompare(b.displayName || '');
        });

        const assigned = new Set();
        const offlineMembers = memberList.filter((m) => m.presence === 'offline');
        const admins = memberList.filter((m) => m.communityRole === 'admin' && m.presence !== 'offline');
        admins.forEach((m) => assigned.add(m._id));
        const moderators = memberList.filter((m) => m.communityRole === 'moderator' && !assigned.has(m._id) && m.presence !== 'offline');
        moderators.forEach((m) => assigned.add(m._id));

        const customGroups = roles.map((role) => {
            const roleId = role._id?.toString?.() || String(role._id);
            const members = memberList.filter((m) => {
                if (assigned.has(m._id)) return false;
                if (m.presence === 'offline') return false;
                const roleIds = (m.roleIds || []).map((id) => id?.toString?.() || String(id));
                return roleIds.includes(roleId);
            });
            members.forEach((m) => assigned.add(m._id));
            return { id: roleId, label: role.name, members: sortByPresence(members) };
        }).filter((g) => g.members.length > 0);

        const everyone = memberList.filter((m) => !assigned.has(m._id) && m.presence !== 'offline');

        return [
            { id: 'admin', label: 'Admins', members: sortByPresence(admins) },
            { id: 'moderator', label: 'Moderators', members: sortByPresence(moderators) },
            ...customGroups,
            { id: 'everyone', label: 'Members', members: sortByPresence(everyone) },
            { id: 'offline', label: 'Offline', members: sortByPresence(offlineMembers) },
        ].filter((g) => g.members.length > 0);
    }, [memberList, roles]);

    const filteredFriends = useMemo(() => {
        if (activeTab === 'online') return friends.filter((f) => f.presence === 'online');
        if (activeTab === 'pending') return [];
        if (activeTab === 'blocked') return [];
        return friends;
    }, [friends, activeTab]);

    const handleSendRequest = async () => {
        if (!friendIdInput.trim()) return;
        await sendRequest(friendIdInput.trim());
        setFriendIdInput('');
        fetchFriends();
        fetchRequests();
    };

    const handleMobileServerSwitch = (communityId) => {
        if (!communityId) return;
        if (communityId === activeCommunityId) {
            setViewMode('server');
            setShowMobileServers(false);
            return;
        }
        setActiveCommunity(communityId);
        setActiveChannel(null);
        setViewMode('server');
        setShowMobileServers(false);
        setTimeout(() => {
            fetchFeed(1, null, null);
            fetchChannels();
            fetchEvents();
        }, 0);
    };

    const memberships = user?.memberships || [];
    const getCommunityId = (membership) => membership?.communityId?._id || membership?.communityId;
    const getCommunityName = (membership) => membership?.communityId?.name || membership?.communityId?.slug || 'Community';
    const getCommunityIcon = (membership) => membership?.communityId?.icon || '';

    const dmSidebarBody = (
        <div className="flex h-full flex-col">
            <div className="h-3 border-b border-discord-darkest/80" />

            <div className="px-3 pt-3 space-y-1 text-xs font-semibold text-discord-faint">
                <button className="w-full text-left px-2 py-1.5 rounded-md bg-discord-darkest text-discord-white flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4 text-discord-faint" />
                    Friends
                </button>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-discord-darkest/80 text-discord-muted cursor-pointer"
                >
                    CircleCore Plus
                </button>
            </div>

            <div className="mt-5 px-3 text-[10px] font-semibold tracking-[0.12em] uppercase text-discord-faint">
                Direct Messages
            </div>

            <div className="mt-1 flex-1 overflow-y-auto px-1.5 pb-2 space-y-0.5">
                {friends.length === 0 && (
                    <div className="px-2 py-3 text-xs text-discord-faint">No direct messages yet.</div>
                )}
                {friends.filter((dm) => dm._id !== user?._id).map((dm) => (
                    <button
                        key={dm._id}
                        onClick={async () => {
                            setActiveDm(dm);
                            setViewMode('dm');
                            setShowMobileDmList(false);
                            const tid = await openThread(dm._id);
                            socket?.emit('join_dm', tid);
                            await fetchMessages(tid);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-sm text-discord-muted hover:bg-discord-darkest/80 hover:text-discord-light cursor-pointer"
                    >
                        <div className="relative w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center text-xs font-semibold text-discord-light">
                            {dm.avatar ? (
                                <img src={dm.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                dm.displayName?.charAt(0).toUpperCase()
                            )}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker ${presenceColor(dm.presence)}`} />
                        </div>
                        <span className="truncate">{dm.displayName}</span>
                    </button>
                ))}
            </div>

            <div className="h-14 px-2 border-t border-discord-darkest/80 flex items-center gap-2 bg-discord-darkest/80 cursor-pointer" onClick={() => setShowProfilePopout(true)}>
                <div className="relative">
                    {profile?.avatar ? (
                        <img src={profile.avatar} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-discord-border" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blurple to-indigo-600 flex items-center justify-center text-xs font-bold">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-darkest ${
                        profile?.presence === 'dnd' ? 'bg-red-500' : profile?.presence === 'idle' ? 'bg-yellow-400' : profile?.presence === 'offline' ? 'bg-discord-faint/60' : 'bg-discord-green'
                    }`} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight truncate">{displayName}</p>
                    <p className="text-[11px] text-discord-faint truncate">{user?._id || username}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <button className="w-7 h-7 rounded-md bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer">
                        <Mic className="w-3.5 h-3.5 text-discord-muted" />
                    </button>
                    <button className="w-7 h-7 rounded-md bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer">
                        <Headphones className="w-3.5 h-3.5 text-discord-muted" />
                    </button>
                    <button className="w-7 h-7 rounded-md bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer">
                        <Settings className="w-3.5 h-3.5 text-discord-muted" />
                    </button>
                </div>
            </div>
        </div>
    );

    const memberListBody = (
        <>
            <div className="px-3 py-4 space-y-5">
                {groupedMembers.map((group) => (
                    <div key={group.id}>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-discord-faint mb-3">
                            {group.label} — {group.members.length}
                        </div>
                        <div className="space-y-2">
                            {group.members.map((m) => (
                                <button
                                    key={m._id}
                                    onClick={() => { setSelectedMember(m); setShowMemberPopout(true); }}
                                    className="w-full flex items-center gap-2 text-sm text-discord-light rounded-lg px-2 py-1.5 hover:bg-discord-darkest/70 transition cursor-pointer text-left"
                                >
                                    <div className="relative w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center text-xs font-semibold">
                                        {m.avatar ? (
                                            <img src={m.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            m.displayName?.charAt(0).toUpperCase()
                                        )}
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker ${presenceColor(m.presence)}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-discord-white">{m.displayName}</p>
                                        <p className="text-[11px] text-discord-faint">{m.statusText}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    const switchAnimClass = isServerSwitching
        ? 'opacity-70 translate-y-1'
        : 'opacity-100 translate-y-0';
    const switchAnimBase = 'transition-all duration-300';

    return (
        <div className="h-screen h-[100dvh] bg-discord-darkest text-discord-white flex overflow-hidden">
            {/* Left server rail */}
            <WorkspaceSwitcher
                onHomeClick={() => setViewMode('friends')}
                onServerSelect={() => setViewMode('server')}
                openDirectorySignal={mobileDirectorySignal}
            />

            {viewMode === 'server' ? (
                <Sidebar
                    isOpen={showMobileSidebar}
                    onClose={() => setShowMobileSidebar(false)}
                    animateClassName={`${switchAnimBase} ${switchAnimClass}`}
                    onProfileClick={() => setShowProfilePopout(true)}
                    onVoiceChannelClick={(channel) => {
                        if (!channel?._id) return;
                        if (activeVoiceChannel?._id === channel._id) {
                            leaveVoice();
                        } else {
                            joinVoice(channel);
                        }
                    }}
                    voiceState={{
                        isConnected: !!activeVoiceChannel,
                        activeChannelId: activeVoiceChannel?._id,
                        activeChannelName: activeVoiceChannel?.name,
                        members: voiceParticipants,
                        connectedPeerIds,
                        memberCount: voiceParticipants.length,
                        elapsed,
                        elapsedLabel: `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
                        isMuted,
                        isDeafened,
                        isSharing,
                        noiseReduction,
                        hasRemoteStream: remoteVideos.length > 0 || remoteMedia.length > 0,
                        onToggleViewer: () => setShowStreamViewer((prev) => !prev),
                        onToggleMute: toggleMute,
                        onToggleDeafen: toggleDeafen,
                        onToggleNoiseReduction: toggleNoiseReduction,
                        onToggleShare: isSharing ? stopScreenShare : startScreenShare,
                        onLeave: leaveVoice,
                    }}
                />
            ) : (
                <>
                    <aside className={`hidden md:flex w-64 bg-discord-darker border-r border-discord-darkest/80 flex-col ${switchAnimBase} ${switchAnimClass}`}>
                        {dmSidebarBody}
                    </aside>
                    {showMobileDmList && (
                        <>
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setShowMobileDmList(false)} />
                            <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-discord-darker z-50 shadow-2xl md:hidden flex flex-col ${switchAnimBase} ${switchAnimClass}`}>
                                <div className="h-12 flex items-center justify-between px-4 border-b border-discord-darkest/80">
                                    <span className="text-sm font-semibold text-discord-light">Direct Messages</span>
                                    <button onClick={() => setShowMobileDmList(false)} className="text-discord-faint hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {dmSidebarBody}
                            </aside>
                        </>
                    )}
                </>
            )}

            {showMobileServers && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setShowMobileServers(false)} />
                    <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-discord-sidebar z-50 shadow-2xl md:hidden flex flex-col ${switchAnimBase} ${switchAnimClass}`}>
                        <div className="h-12 flex items-center justify-between px-4 border-b border-discord-darkest/80">
                            <span className="text-sm font-semibold text-discord-light">Servers</span>
                            <button onClick={() => setShowMobileServers(false)} className="text-discord-faint hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                            <button
                                onClick={() => { setViewMode('friends'); setShowMobileServers(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                                    viewMode === 'friends' ? 'bg-discord-darkest text-white' : 'text-discord-muted hover:bg-discord-darkest/70'
                                }`}
                            >
                                <div className="w-9 h-9 rounded-xl bg-blurple flex items-center justify-center text-white font-bold">
                                    CC
                                </div>
                                <span className="truncate">Home</span>
                            </button>
                            <button
                                onClick={() => { setMobileDirectorySignal((v) => v + 1); setShowMobileServers(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-discord-muted hover:bg-discord-darkest/70"
                            >
                                <div className="w-9 h-9 rounded-xl bg-discord-darkest flex items-center justify-center text-discord-light">
                                    <Compass className="w-4 h-4" />
                                </div>
                                <span className="truncate">Discover</span>
                            </button>
                            {memberships.map((m) => {
                                const id = getCommunityId(m);
                                const isActive = id === activeCommunityId && viewMode === 'server';
                                const icon = getCommunityIcon(m);
                                return (
                                    <button
                                        key={id}
                                        onClick={() => handleMobileServerSwitch(id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                                            isActive ? 'bg-discord-darkest text-white' : 'text-discord-muted hover:bg-discord-darkest/70'
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-discord-darkest flex items-center justify-center text-xs font-bold text-discord-light overflow-hidden">
                                            {icon ? (
                                                <img src={icon} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                getCommunityName(m).charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <div className="truncate text-sm font-semibold">{getCommunityName(m)}</div>
                                            <div className="text-[11px] text-discord-faint capitalize">{m.role || 'member'}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>
                </>
            )}

            <main className={`flex-1 bg-discord-chat flex flex-col ${switchAnimBase} ${switchAnimClass}`}>
                {viewMode === 'server' ? (
                    <>
                <div className="h-12 border-b border-discord-darkest/80 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-discord-light">
                        <button
                            onClick={() => setShowMobileServers(true)}
                            className="md:hidden w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white"
                            title="Open servers"
                        >
                            <Server className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowMobileSidebar(true)}
                            className="md:hidden w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white"
                            title="Open channels"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <Hash className="w-4 h-4" />
                        <span>{activeChannel?.name || 'general'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-discord-faint">
                        <button
                            onClick={() => setMobileDirectorySignal((v) => v + 1)}
                            className="md:hidden hover:text-discord-light cursor-pointer"
                            title="Discover servers"
                        >
                            <Compass className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowMemberList((v) => !v)}
                            className={`hover:text-discord-light cursor-pointer ${showMemberList ? 'text-discord-white' : 'text-discord-faint'}`}
                            title="Toggle members list"
                        >
                            <Users className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowPins(true)} className="hover:text-discord-light cursor-pointer">
                            <Pin className="w-4 h-4" />
                        </button>
                        <NotificationBell />
                        <button onClick={() => navigate('/help')} className="hover:text-discord-light cursor-pointer" title="Help">
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <ChannelChat
                    channel={activeChannel}
                    socket={socket}
                    currentUser={{
                        id: user?._id,
                        displayName,
                        username: user?.username || username,
                        avatar: profile?.avatar || '',
                        communityRole: user?.memberships?.find((m) => {
                            const id = m.communityId?._id || m.communityId;
                            return id?.toString?.() === activeCommunityId;
                        })?.role,
                    }}
                    members={rosterFriends}
                    showPins={showPins}
                    onClosePins={() => setShowPins(false)}
                    canEditChannel={canEditChannel}
                />
                    </>
                ) : viewMode === 'dm' ? (
                    <>
                        {activeDm ? (
                            <DmPanel
                                activeDm={{ ...activeDm, selfId: user?._id, selfInitial: displayName.charAt(0).toUpperCase() }}
                                messages={messages}
                                typing={!!typingUser}
                                typingName={typingUser ? activeDm?.displayName : ''}
                                value={dmText}
                                onChange={setDmText}
                                files={dmFiles}
                                onAddFiles={(fileList) => {
                                    const next = Array.from(fileList || []).map((file) => ({
                                        file,
                                        id: `${file.name}-${file.size}-${file.lastModified}`,
                                        isImage: file.type.startsWith('image/'),
                                        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                                    }));
                                    setDmFiles((prev) => [...prev, ...next]);
                                }}
                                onRemoveFile={(id) => {
                                    setDmFiles((prev) => {
                                        const file = prev.find((f) => f.id === id);
                                        if (file?.preview) URL.revokeObjectURL(file.preview);
                                        return prev.filter((f) => f.id !== id);
                                    });
                                }}
                                sending={dmSending}
                                onTyping={() => {
                                    if (!threadId) return;
                                    socket?.emit('dm:typing', { threadId, userId: user?._id, isTyping: true });
                                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                    typingTimeoutRef.current = setTimeout(() => {
                                        socket?.emit('dm:typing', { threadId, userId: user?._id, isTyping: false });
                                    }, 1200);
                                }}
                                onSend={async () => {
                                    if (!dmText.trim() && dmFiles.length === 0) return;
                                    setDmSending(true);
                                    try {
                                        const mediaURLs = [];
                                        for (const f of dmFiles) {
                                            const url = await uploadFile(f.file);
                                            mediaURLs.push(url);
                                        }
                                        const payload = { content: dmText.trim(), mediaURLs };
                                        const msg = await sendMessage(threadId, payload);
                                        pushMessage(msg);
                                        setDmText('');
                                        dmFiles.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
                                        setDmFiles([]);
                                        socket?.emit('dm:typing', { threadId, userId: user?._id, isTyping: false });
                                    } finally {
                                        setDmSending(false);
                                    }
                                }}
                                onOpenSidebar={() => setShowMobileDmList(true)}
                                onOpenServers={() => setShowMobileServers(true)}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-discord-faint">Select a friend to start chatting.</div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="border-b border-discord-darkest/80 px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                <button
                                    onClick={() => setShowMobileServers(true)}
                                    className="md:hidden w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white"
                                    title="Open servers"
                                >
                                    <Server className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowMobileDmList(true)}
                                    className="md:hidden w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white"
                                    title="Open direct messages"
                                >
                                    <Menu className="w-4 h-4" />
                                </button>
                                <User className="w-5 h-5 text-discord-faint" />
                                <span className="text-discord-white">Friends</span>
                                <span className="text-discord-faint">•</span>
                                <div className="flex items-center gap-1 overflow-x-auto">
                                    <button
                                        onClick={() => setActiveTab('online')}
                                        className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                                            activeTab === 'online' ? 'bg-discord-darkest text-discord-white' : 'text-discord-faint hover:bg-discord-darkest/60'
                                        }`}
                                    >
                                        Online
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                                            activeTab === 'all' ? 'bg-discord-darkest text-discord-white' : 'text-discord-faint hover:bg-discord-darkest/60'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                                            activeTab === 'pending' ? 'bg-discord-darkest text-discord-white' : 'text-discord-faint hover:bg-discord-darkest/60'
                                        }`}
                                    >
                                        Pending
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('add')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                                    activeTab === 'add' ? 'bg-blurple text-white' : 'bg-discord-darkest text-discord-faint hover:bg-discord-darkest/60'
                                }`}
                            >
                                Add Friend
                            </button>
                        </div>

                        {activeTab !== 'add' && (
                            <div className="hidden md:block px-4 py-3 border-b border-discord-darkest/80">
                                <div className="relative w-full max-w-[560px]">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-discord-faint" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        className="w-full pl-8 pr-3 py-2 rounded-md bg-discord-darkest text-xs text-discord-white placeholder:text-discord-faint/60 border border-discord-darkest focus:outline-none focus:border-blurple"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'add' && (
                            <div className="flex-1 overflow-y-auto px-4 py-6">
                                <div className="max-w-3xl">
                                    <h2 className="text-xl font-bold text-white">Add Friend</h2>
                                    <p className="text-sm text-discord-muted mt-1">You can add friends with their user ID.</p>

                                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-discord-darkest/70 border border-discord-border/50 px-3 py-2">
                                        <input
                                            type="text"
                                            value={friendIdInput}
                                            onChange={(e) => setFriendIdInput(e.target.value)}
                                            placeholder="Enter user ID"
                                            className="flex-1 bg-transparent text-sm text-discord-white placeholder:text-discord-faint/60 outline-none"
                                        />
                                        <button
                                            onClick={handleSendRequest}
                                            disabled={isFriendLoading}
                                            className="px-4 py-2 rounded-lg bg-blurple text-sm font-semibold text-white hover:bg-blurple-hover disabled:opacity-60 cursor-pointer"
                                        >
                                            Send Friend Request
                                        </button>
                                    </div>

                                    {(friendError || friendSuccess) && (
                                        <div className={`mt-3 text-sm ${friendError ? 'text-discord-red' : 'text-discord-green'}`}>
                                            {friendError || friendSuccess}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'pending' && (
                            <div className="flex-1 overflow-y-auto px-4 py-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-discord-faint mb-2">
                                    Incoming — {incoming.length}
                                </div>
                                <div className="space-y-1 mb-6">
                                    {incoming.length === 0 && (
                                        <div className="px-3 py-4 text-xs text-discord-faint">No incoming requests.</div>
                                    )}
                                    {incoming.map((friend) => (
                                        <div key={friend._id} className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-discord-darkest/60">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-9 h-9 rounded-full bg-discord-darker flex items-center justify-center text-sm font-semibold text-discord-light">
                                                    {friend.avatar ? (
                                                        <img src={friend.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                                    ) : (
                                                        friend.displayName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-discord-white">{friend.displayName}</p>
                                                    <p className="text-[11px] text-discord-faint">{friend.username}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={async () => { await acceptRequest(friend._id); fetchFriends(); fetchRequests(); }}
                                                    className="px-3 py-1.5 rounded-md bg-discord-green text-xs font-semibold text-discord-darkest hover:bg-discord-green/90 cursor-pointer"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={async () => { await declineRequest(friend._id); fetchRequests(); }}
                                                    className="px-3 py-1.5 rounded-md bg-discord-darkest text-xs font-semibold text-discord-faint hover:bg-discord-border-light/40 cursor-pointer"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-discord-faint mb-2">
                                    Outgoing — {outgoing.length}
                                </div>
                                <div className="space-y-1">
                                    {outgoing.length === 0 && (
                                        <div className="px-3 py-4 text-xs text-discord-faint">No outgoing requests.</div>
                                    )}
                                    {outgoing.map((friend) => (
                                        <div key={friend._id} className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-discord-darkest/60">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-9 h-9 rounded-full bg-discord-darker flex items-center justify-center text-sm font-semibold text-discord-light">
                                                    {friend.avatar ? (
                                                        <img src={friend.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                                    ) : (
                                                        friend.displayName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-discord-white">{friend.displayName}</p>
                                                    <p className="text-[11px] text-discord-faint">Pending</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(activeTab === 'online' || activeTab === 'all') && (
                            <div className="flex-1 overflow-y-auto px-4 py-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-discord-faint mb-2">
                                    Online — {onlineCount}
                                </div>
                                <div className="space-y-1">
                                    {isFriendLoading && (
                                        <div className="px-3 py-6 text-xs text-discord-faint">Loading friends…</div>
                                    )}
                                    {!isFriendLoading && filteredFriends.length === 0 && (
                                        <div className="px-3 py-6 text-xs text-discord-faint">No friends to show.</div>
                                    )}
                                    {activeFriendMenuId && (
                                        <button
                                            onClick={() => setActiveFriendMenuId(null)}
                                            className="fixed inset-0 z-10 cursor-default"
                                        />
                                    )}
                                    {filteredFriends.map((friend) => (
                                        <div
                                            key={friend._id}
                                            className="w-full relative flex items-center justify-between px-3 py-2 rounded-md bg-discord-darkest/60 hover:bg-discord-darkest text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-9 h-9 rounded-full bg-discord-darker flex items-center justify-center text-sm font-semibold text-discord-light">
                                                    {friend.avatar ? (
                                                        <img src={friend.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                                    ) : (
                                                        friend.displayName.charAt(0).toUpperCase()
                                                    )}
                                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-darkest ${presenceColor(friend.presence)}`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-discord-white">{friend.displayName}</p>
                                                    <p className="text-[11px] text-discord-faint">{friend.statusText}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openDmForFriend(friend)}
                                                    className="w-7 h-7 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer"
                                                    title="Message"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5 text-discord-faint" />
                                                </button>
                                                <button
                                                    onClick={() => setActiveFriendMenuId((prev) => (prev === friend._id ? null : friend._id))}
                                                    className="w-7 h-7 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer"
                                                    title="More"
                                                >
                                                    <MoreVertical className="w-3.5 h-3.5 text-discord-faint" />
                                                </button>
                                            </div>
                                            {activeFriendMenuId === friend._id && (
                                                <div className="absolute right-2 top-11 z-20 w-44 rounded-lg border border-discord-border/60 bg-discord-darkest shadow-xl p-1">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await removeFriend(friend._id);
                                                            } catch { }
                                                            setActiveFriendMenuId(null);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm text-discord-red hover:bg-discord-border/40 rounded-md"
                                                    >
                                                        Remove Friend
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {viewMode === 'server' && showMemberList && (
                <>
                    <aside className="hidden lg:flex w-60 border-l border-discord-darkest/80 bg-discord-darker flex-col">
                        {memberListBody}
                    </aside>
                    <div className="lg:hidden">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowMemberList(false)} />
                        <aside className="fixed top-0 right-0 bottom-0 w-72 bg-discord-darker z-50 shadow-2xl flex flex-col">
                            <div className="h-12 flex items-center justify-between px-4 border-b border-discord-darkest/80">
                                <span className="text-sm font-semibold text-discord-light">Members</span>
                                <button onClick={() => setShowMemberList(false)} className="text-discord-faint hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {memberListBody}
                        </aside>
                    </div>
                </>
            )}

            <ProfilePopout
                isOpen={showProfilePopout}
                onClose={() => setShowProfilePopout(false)}
                profile={profile}
                user={user}
                onUpdatePresence={(presence) => {
                    if (!user?._id) return;
                    updateProfile(user._id, { presence });
                }}
                onEditProfile={() => setShowProfileSettings(true)}
                anchorClassName={viewMode === 'friends' ? 'md:left-[272px]' : 'md:left-[300px]'}
            />

            <MemberProfilePopout
                isOpen={showMemberPopout}
                onClose={() => setShowMemberPopout(false)}
                member={selectedMember}
                anchorClassName="md:top-24 md:right-[260px]"
            />

            <ProfileSettingsModal
                isOpen={showProfileSettings}
                onClose={() => setShowProfileSettings(false)}
                profile={profile}
                user={user}
                onSave={async (payload) => {
                    if (!user?._id) return;
                    await updateProfile(user._id, payload);
                }}
            />

            {remoteMedia.map((item) => (
                <VoiceAudioPlayer key={item.socketId} stream={item.stream} muted={isDeafened} />
            ))}

            {remoteVideos.length > 0 && showStreamViewer && (
                <div className="fixed bottom-6 right-6 z-40 w-[320px] max-w-[90vw] rounded-2xl bg-discord-darkest/90 border border-discord-border/60 shadow-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-discord-faint">Screen Share</p>
                        <button
                            onClick={() => setShowStreamFullscreen(true)}
                            className="text-[11px] px-2 py-1 rounded-md bg-discord-darkest text-discord-light hover:bg-discord-border-light/40"
                        >
                            Fullscreen
                        </button>
                    </div>
                    <div className="space-y-2">
                        {remoteVideos.map((item, idx) => (
                            <div key={item.socketId} className="w-full aspect-video rounded-xl bg-black/60 overflow-hidden">
                                <VoiceVideoPlayer
                                    stream={item.stream}
                                    muted
                                    ref={idx === 0 ? streamVideoRef : undefined}
                                    id={idx === 0 ? 'cc-screen-share-video' : undefined}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {remoteVideos.length > 0 && showStreamFullscreen && (
                <div
                    className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center"
                    onClick={() => setShowStreamFullscreen(false)}
                >
                    <div className="w-[92vw] h-[92vh] max-w-[1400px] max-h-[880px] rounded-2xl bg-black/80 border border-discord-border/60 shadow-2xl p-3">
                        <VoiceVideoPlayer
                            stream={remoteVideos[0].stream}
                            muted
                            className="w-full h-full object-contain rounded-xl bg-black"
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default FeedPage;
