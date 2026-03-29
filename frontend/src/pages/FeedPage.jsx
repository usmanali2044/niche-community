import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Hash, Search, Users, Pin, HelpCircle, User, MessageCircle, Phone, MoreVertical, Settings, Menu, X, Server, Compass } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useFeedStore } from '../stores/feedStore';
import { useProfileStore } from '../stores/profileStore';
import { useRosterStore } from '../stores/rosterStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import WorkspaceSwitcher from '../components/WorkspaceSwitcher';
import Sidebar from '../components/Sidebar';
import { useChannelStore } from '../stores/channelStore';
import { useFriendStore } from '../stores/friendStore';
import { useServerInviteStore } from '../stores/serverInviteStore';
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
import { apiFetch } from '../stores/apiFetch';

const presenceColor = (presence) => {
    if (presence === 'dnd') return 'bg-red-500';
    if (presence === 'idle') return 'bg-yellow-400';
    if (presence === 'offline') return 'bg-discord-faint/60';
    return 'bg-discord-green';
};

const filterStatusText = (text) => {
    const value = (text || '').trim();
    if (!value) return '';
    if (value.toLowerCase() === 'eat sleep code repeat') return '';
    return value;
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
    const [editChannelSignal, setEditChannelSignal] = useState(0);
    const [pendingEditChannelId, setPendingEditChannelId] = useState(null);
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { uploadFile, fetchFeed } = useFeedStore();
    const { profile, updateProfile } = useProfileStore();
    const { activeCommunityId, setActiveCommunity } = useWorkspaceStore();
    const { friends: rosterFriends, fetchRoster, updatePresence: updateRosterPresence } = useRosterStore();
    const { channels, activeChannelId, fetchChannels, setActiveChannel, clearChannels } = useChannelStore();
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
        removeOutgoing,
    } = useFriendStore();
    const {
        invites,
        isLoading: isInviteLoading,
        error: inviteError,
        fetchInvites,
        acceptInvite,
        declineInvite,
        clearError: clearInviteError,
    } = useServerInviteStore();
    const {
        threadId,
        messages,
        threads: dmThreads,
        openThread,
        setThreadId,
        fetchThreads,
        fetchThreadInfo,
        createGroupThread,
        addParticipants: addParticipantsToThread,
        leaveThread,
        removeThread,
        fetchMessages,
        sendMessage,
        pushMessage,
        upsertThread,
    } = useDmStore();
    const { fetchEvents, handleNewEvent, handleRsvpUpdate, handleDeleteEvent, handleUpdateEvent, handleStartEvent, handleEndEvent } = useEventStore();
    const [activeDm, setActiveDm] = useState(null);
    const [dmText, setDmText] = useState('');
    const [dmFiles, setDmFiles] = useState([]);
    const [dmSending, setDmSending] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [showStreamViewer, setShowStreamViewer] = useState(true);
    const [fullscreenStream, setFullscreenStream] = useState(null);
    const [showGroupAdd, setShowGroupAdd] = useState(false);
    const [groupSearch, setGroupSearch] = useState('');
    const [groupSelection, setGroupSelection] = useState([]);
    const [groupError, setGroupError] = useState('');
    const [roles, setRoles] = useState([]);
    const streamVideoRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const prevCommunityIdRef = useRef(activeCommunityId);
    const [incomingCall, setIncomingCall] = useState(null);
    const [outgoingCall, setOutgoingCall] = useState(null);
    const [activeDmCall, setActiveDmCall] = useState(null);
    const [ongoingDmCalls, setOngoingDmCalls] = useState(() => new Set());
    const [voicePresence, setVoicePresence] = useState({});
    const ringtoneRef = useRef({ ctx: null, timer: null });

    const displayName = profile?.displayName || profile?.name || user?.name || 'Usman';
    const username = user?.username || 'usman1943';
    const statusText = profile?.bio || 'No bio yet';

    const buildDmEntry = useCallback((thread) => {
        if (!thread) return null;
        const participants = thread.participants || [];
        const others = participants.filter((p) => p._id !== user?._id);
        const isGroup = !!thread.isGroup || others.length > 1;
        const displayName = isGroup
            ? `${others.slice(0, 2).map((p) => p.displayName).join(', ')}${others.length > 2 ? ` +${others.length - 2}` : ''}`
            : (others[0]?.displayName || thread.displayName || 'Direct Message');
        const subtitle = isGroup ? `${participants.length} Members` : (others[0]?.username || '');
        return {
            ...thread,
            participants,
            others,
            isGroup,
            displayName,
            subtitle,
            avatar: !isGroup ? (others[0]?.avatar || '') : '',
            presence: !isGroup ? (others[0]?.presence || 'offline') : 'online',
        };
    }, [user?._id]);

    const playRingtone = useCallback(() => {
        if (ringtoneRef.current.timer) return;
        const ringOnce = () => {
            try {
                if (!ringtoneRef.current.ctx) {
                    ringtoneRef.current.ctx = new (window.AudioContext || window.webkitAudioContext)();
                }
                const ctx = ringtoneRef.current.ctx;
                const gain = ctx.createGain();
                gain.gain.value = 0.0;
                gain.connect(ctx.destination);

                const toneA = ctx.createOscillator();
                toneA.type = 'sine';
                toneA.frequency.value = 523.25;
                toneA.connect(gain);

                const toneB = ctx.createOscillator();
                toneB.type = 'sine';
                toneB.frequency.value = 659.25;
                toneB.connect(gain);

                const now = ctx.currentTime;
                gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
                gain.gain.linearRampToValueAtTime(0.0, now + 0.42);

                toneA.start(now);
                toneB.start(now);
                toneA.stop(now + 0.45);
                toneB.stop(now + 0.45);
            } catch {
                // ignore audio errors
            }
        };
        ringOnce();
        ringtoneRef.current.timer = setInterval(ringOnce, 1400);
    }, []);

    const stopRingtone = useCallback(() => {
        if (ringtoneRef.current.timer) {
            clearInterval(ringtoneRef.current.timer);
            ringtoneRef.current.timer = null;
        }
    }, []);

    useEffect(() => {
        if (!user?.memberships || user.memberships.length === 0) {
            setViewMode('friends');
        }
    }, [user?.memberships?.length]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['online', 'all', 'pending', 'invites', 'add'].includes(tab)) {
            setViewMode('friends');
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!activeCommunityId) return;
        fetchRoster();
    }, [activeCommunityId, fetchRoster]);

    useEffect(() => {
        if (!user?._id) return;
        fetchThreads();
    }, [user?._id, fetchThreads]);

    useEffect(() => {
        if (!pendingEditChannelId || pendingEditChannelId !== activeChannelId) return;
        setEditChannelSignal((v) => v + 1);
        setPendingEditChannelId(null);
    }, [pendingEditChannelId, activeChannelId]);

    useEffect(() => {
        if (!activeCommunityId) {
            setRoles([]);
            return;
        }
        let cancelled = false;
        const fetchRoles = async () => {
            try {
                const res = await apiFetch(`/api/communities/${activeCommunityId}/roles`, {
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
        remoteScreenStreams,
        remoteCameraStreams,
        localScreenStream,
        localCameraStream,
        isMuted,
        isDeafened,
        isSharing,
        isCameraOn,
        noiseReduction,
        connectedPeerIds,
        elapsed,
        joinVoice,
        leaveVoice,
        toggleMute,
        toggleDeafen,
        toggleNoiseReduction,
        startCamera,
        stopCamera,
        startScreenShare,
        stopScreenShare,
    } = useVoiceCall(socket, user, profile);

    useEffect(() => {
        if (remoteScreenStreams.length > 0) {
            setShowStreamViewer(true);
        }
    }, [remoteScreenStreams.length]);

    const remoteScreenStream = remoteScreenStreams[0]?.stream || null;
    const remoteCameraStream = remoteCameraStreams[0]?.stream || null;
    const screenShareTiles = useMemo(() => {
        const tiles = [];
        if (localScreenStream) {
            tiles.push({
                id: 'local-share',
                stream: localScreenStream,
                ownerName: displayName || 'You',
                isLocal: true,
            });
        }
        remoteScreenStreams.forEach((item) => {
            const name = voiceParticipants.find((p) => p.socketId === item.socketId)?.displayName || 'Someone';
            tiles.push({
                id: `remote-share-${item.socketId}`,
                stream: item.stream,
                ownerName: name,
                isLocal: false,
            });
        });
        return tiles;
    }, [localScreenStream, remoteScreenStreams, voiceParticipants, displayName]);
    const screenShareStream = screenShareTiles[0]?.stream || null;
    const isRemoteScreenShare = screenShareTiles.some((t) => !t.isLocal);
    const showStreamFullscreen = !!fullscreenStream;

    useEffect(() => {
        if (!fullscreenStream) return;
        const activeStreams = new Set([screenShareStream, remoteCameraStream, localCameraStream].filter(Boolean));
        if (activeStreams.size === 0 || !activeStreams.has(fullscreenStream)) {
            setFullscreenStream(null);
        }
    }, [fullscreenStream, screenShareStream, remoteCameraStream, localCameraStream]);

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
        const handleNotification = (notification) => {
            const action = notification?.meta?.action;
            if (action === 'server_invite') {
                fetchInvites().catch(() => { });
            }
            if (notification?.type === 'friend' || action === 'request') {
                fetchRequests().catch(() => { });
                fetchFriends().catch(() => { });
            }
        };
        const handleThreadUpdated = (thread) => {
            if (!thread?._id) return;
            upsertThread(thread);
        };
        const handleThreadRemoved = ({ threadId: removedId }) => {
            if (!removedId) return;
            removeThread(removedId);
            if (activeDmCall?.threadId === removedId) {
                setActiveDmCall(null);
                if (isSharing) stopScreenShare();
                leaveVoice();
            }
            if (activeDm?._id === removedId) {
                setActiveDm(null);
                setThreadId(null);
                setViewMode('dm');
            }
        };
        const handleCommunityMemberJoined = ({ communityId }) => {
            if (!communityId) return;
            const current = activeCommunityId?.toString?.() || String(activeCommunityId || '');
            const incoming = communityId?.toString?.() || String(communityId);
            if (current && current === incoming) {
                fetchRoster();
            }
        };
        const handleCommunityMemberKicked = ({ communityId }) => {
            if (!communityId) return;
            const current = activeCommunityId?.toString?.() || String(activeCommunityId || '');
            const incoming = communityId?.toString?.() || String(communityId);
            if (current && current === incoming) {
                fetchRoster();
            }
        };
        const handleCommunityKicked = ({ communityId }) => {
            if (!communityId) return;
            const current = activeCommunityId?.toString?.() || String(activeCommunityId || '');
            const incoming = communityId?.toString?.() || String(communityId);
            if (current && current === incoming) {
                clearChannels();
                setActiveChannel(null);
                setActiveCommunity(null);
                setViewMode('friends');
            }
        };
        const handleRequestDeclined = ({ byUserId }) => {
            if (byUserId) {
                removeOutgoing(byUserId);
            }
        };
        const handleIncomingCall = (payload) => {
            if (!payload?.threadId || !payload?.fromUser) return;
            if (activeDmCall || outgoingCall) {
                socket.emit('dm:call:decline', { toUserId: payload.fromUser.userId, threadId: payload.threadId });
                return;
            }
            setOngoingDmCalls((prev) => {
                const next = new Set(prev);
                next.add(payload.threadId);
                return next;
            });
            setIncomingCall(payload);
            playRingtone();
        };
        const handleCallAccepted = ({ threadId: tId }) => {
            if (!outgoingCall || outgoingCall.threadId !== tId) return;
            stopRingtone();
            setOutgoingCall(null);
            setActiveDmCall({ threadId: tId, peer: outgoingCall.toUser, isGroup: outgoingCall.toUser?.isGroup });
            setOngoingDmCalls((prev) => {
                const next = new Set(prev);
                next.add(tId);
                return next;
            });
            if (outgoingCall.threadMeta?.participants) {
                const threadEntry = buildDmEntry({
                    _id: tId,
                    participants: outgoingCall.threadMeta.participants,
                    displayName: outgoingCall.threadMeta.displayName,
                    isGroup: true,
                });
                if (threadEntry) {
                    setActiveDm(threadEntry);
                    setThreadId(tId);
                }
            } else {
                setActiveDm(outgoingCall.toUser);
            }
            setViewMode('dm');
            if (activeVoiceChannel?._id) {
                leaveVoice();
            }
            joinVoice({ _id: `dm-${tId}`, name: 'Direct Call' });
        };
        const handleCallDeclined = ({ threadId: tId }) => {
            if (!outgoingCall || outgoingCall.threadId !== tId) return;
            if (outgoingCall.toUsers?.length) return;
            stopRingtone();
            setOutgoingCall(null);
            setOngoingDmCalls((prev) => {
                const next = new Set(prev);
                next.delete(tId);
                return next;
            });
        };
        const handleCallCancelled = ({ threadId: tId }) => {
            if (!incomingCall || incomingCall.threadId !== tId) return;
            stopRingtone();
            setIncomingCall(null);
            setOngoingDmCalls((prev) => {
                const next = new Set(prev);
                next.delete(tId);
                return next;
            });
        };
        const handleCallEnded = ({ threadId: tId }) => {
            if (activeDmCall?.threadId !== tId) return;
            setActiveDmCall(null);
            leaveVoice();
            setOngoingDmCalls((prev) => {
                const next = new Set(prev);
                next.delete(tId);
                return next;
            });
        };
        const handleVoicePresence = ({ channelId, members }) => {
            if (!channelId) return;
            const channelKey = channelId?.toString?.() || String(channelId);
            if (channelKey.startsWith('dm-')) return;
            if (!Array.isArray(members) || members.length === 0) {
                setVoicePresence((prev) => {
                    if (!prev[channelKey]) return prev;
                    const next = { ...prev };
                    delete next[channelKey];
                    return next;
                });
                return;
            }
            setVoicePresence((prev) => ({
                ...prev,
                [channelKey]: members,
            }));
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
        socket.on('dm:thread:updated', handleThreadUpdated);
        socket.on('dm:thread:removed', handleThreadRemoved);
        socket.on('new_notification', handleNotification);
        socket.on('friends:request:declined', handleRequestDeclined);
        socket.on('community:member_joined', handleCommunityMemberJoined);
        socket.on('community:member_kicked', handleCommunityMemberKicked);
        socket.on('community:kicked', handleCommunityKicked);
        socket.on('dm:call:incoming', handleIncomingCall);
        socket.on('dm:call:accepted', handleCallAccepted);
        socket.on('dm:call:declined', handleCallDeclined);
        socket.on('dm:call:cancelled', handleCallCancelled);
        socket.on('dm:call:ended', handleCallEnded);
        socket.on('voice:members', handleVoicePresence);
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
        socket.off('dm:thread:updated', handleThreadUpdated);
        socket.off('dm:thread:removed', handleThreadRemoved);
        socket.off('new_notification', handleNotification);
        socket.off('friends:request:declined', handleRequestDeclined);
        socket.off('community:member_joined', handleCommunityMemberJoined);
        socket.off('community:member_kicked', handleCommunityMemberKicked);
        socket.off('community:kicked', handleCommunityKicked);
        socket.off('dm:call:incoming', handleIncomingCall);
        socket.off('dm:call:accepted', handleCallAccepted);
        socket.off('dm:call:declined', handleCallDeclined);
        socket.off('dm:call:cancelled', handleCallCancelled);
        socket.off('dm:call:ended', handleCallEnded);
        socket.off('voice:members', handleVoicePresence);
        socket.off('new_event', handleNewEventSocket);
        socket.off('rsvp_update', handleRsvpSocket);
        socket.off('event_deleted', handleDeleteSocket);
        socket.off('event_updated', handleUpdateSocket);
        socket.off('event_started', handleStartSocket);
            socket.off('event_ended', handleEndSocket);
        };
    }, [
        socket,
        user?._id,
        updateProfile,
        fetchFriends,
        fetchRequests,
        threadId,
        handleNewEvent,
        handleRsvpUpdate,
        handleDeleteEvent,
        handleUpdateEvent,
        handleStartEvent,
        handleEndEvent,
        updateFriendPresence,
        updateRosterPresence,
        upsertThread,
        activeDmCall,
        outgoingCall,
        incomingCall,
        activeCommunityId,
        fetchRoster,
        clearChannels,
        setActiveChannel,
        setActiveCommunity,
        setViewMode,
        joinVoice,
        leaveVoice,
        stopScreenShare,
        isSharing,
        activeVoiceChannel?._id,
        playRingtone,
        stopRingtone,
        buildDmEntry,
        setThreadId,
        fetchInvites,
        removeThread,
        activeDm,
    ]);

    useEffect(() => {
        if (!activeCommunityId) return;
        fetchChannels();
    }, [activeCommunityId, fetchChannels]);

    useEffect(() => {
        if (!activeCommunityId) return;
        clearChannels();
        setActiveChannel(null);
    }, [activeCommunityId, clearChannels, setActiveChannel]);

    useEffect(() => {
        fetchFriends();
        fetchRequests();
    }, [fetchFriends, fetchRequests]);

    useEffect(() => {
        if (viewMode !== 'friends' || activeTab !== 'invites') return;
        fetchInvites().catch(() => { });
        clearInviteError();
    }, [viewMode, activeTab, fetchInvites, clearInviteError]);

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

    useEffect(() => {
        setVoicePresence({});
    }, [activeCommunityId]);

    const openDmForFriend = async (friend) => {
        if (!friend?._id) return;
        setActiveFriendMenuId(null);
        setViewMode('dm');
        try {
            const tid = await openThread(friend._id);
            setThreadId(tid);
            socket?.emit('join_dm', tid);
            await fetchMessages(tid);
            const threadInfo = await fetchThreadInfo(tid);
            const entry = buildDmEntry(threadInfo);
            if (entry) setActiveDm(entry);
        } catch { }
    };

    const sendGroupCallInvite = useCallback((targetIds, threadEntry) => {
        if (!socket || !Array.isArray(targetIds) || targetIds.length === 0) return;
        const meta = {
            threadId: threadEntry._id,
            fromUser: {
                userId: user?._id,
                displayName,
                avatar: profile?.avatar || '',
            },
            threadMeta: {
                isGroup: true,
                participants: threadEntry.participants || [],
                displayName: threadEntry.displayName,
            },
        };
        targetIds.forEach((id) => {
            socket.emit('dm:call:start', { toUserId: id, ...meta });
        });
    }, [socket, user?._id, displayName, profile?.avatar]);

    const startCallForFriend = useCallback(async (friend) => {
        if (!socket || !friend?._id) return;
        if (incomingCall || outgoingCall || activeDmCall) return;
        try {
            const tid = await openThread(friend._id);
            setThreadId(tid);
            socket.emit('join_dm', tid);
            await fetchMessages(tid);
            const threadInfo = await fetchThreadInfo(tid);
            const entry = buildDmEntry(threadInfo);
            if (entry) setActiveDm(entry);
            setViewMode('dm');
            const toUser = {
                _id: friend._id,
                displayName: friend.displayName || 'Friend',
                avatar: friend.avatar || '',
            };
            setOutgoingCall({ threadId: tid, toUser });
            socket.emit('dm:call:start', {
                toUserId: friend._id,
                threadId: tid,
                fromUser: {
                    userId: user?._id,
                    displayName,
                    avatar: profile?.avatar || '',
                },
                threadMeta: entry ? {
                    isGroup: entry.isGroup,
                    participants: entry.participants || [],
                    displayName: entry.displayName,
                } : undefined,
            });
        } catch { }
    }, [socket, incomingCall, outgoingCall, activeDmCall, openThread, fetchMessages, fetchThreadInfo, buildDmEntry, user?._id, displayName, profile?.avatar, setThreadId]);

    const startDmCall = useCallback(() => {
        if (!socket || !activeDm || !threadId) return;
        if (incomingCall || outgoingCall || activeDmCall) return;
        if (activeDm.isGroup && ongoingDmCalls.has(threadId)) {
            setActiveDmCall({ threadId, peer: { displayName: activeDm.displayName, isGroup: true }, isGroup: true });
            setViewMode('dm');
            if (activeVoiceChannel?._id) {
                leaveVoice();
            }
            joinVoice({ _id: `dm-${threadId}`, name: 'Group Call' });
            return;
        }
        const callMeta = {
            threadId,
            fromUser: {
                userId: user?._id,
                displayName,
                avatar: profile?.avatar || '',
            },
            threadMeta: {
                isGroup: activeDm.isGroup,
                participants: activeDm.participants || [],
                displayName: activeDm.displayName,
            },
        };

        if (activeDm.isGroup) {
            const recipients = (activeDm.participants || []).filter((p) => p._id !== user?._id);
            if (recipients.length === 0) return;
            setOutgoingCall({
                threadId,
                toUser: { displayName: activeDm.displayName, isGroup: true },
                toUsers: recipients.map((p) => p._id),
                threadMeta: callMeta.threadMeta,
            });
            sendGroupCallInvite(recipients.map((p) => p._id), {
                _id: threadId,
                participants: activeDm.participants || [],
                displayName: activeDm.displayName,
            });
            setOngoingDmCalls((prev) => {
                const next = new Set(prev);
                next.add(threadId);
                return next;
            });
            return;
        }

        const peer = activeDm.others?.[0] || (activeDm.participants || []).find((p) => p._id !== user?._id);
        const toUser = {
            _id: peer?._id,
            displayName: peer?.displayName || activeDm.displayName,
            avatar: peer?.avatar || activeDm.avatar || '',
        };
        if (!toUser._id) return;
        setOutgoingCall({ threadId, toUser });
        socket.emit('dm:call:start', {
            toUserId: toUser._id,
            ...callMeta,
        });
    }, [socket, activeDm, threadId, incomingCall, outgoingCall, activeDmCall, user?._id, displayName, profile?.avatar, sendGroupCallInvite, ongoingDmCalls, activeVoiceChannel?._id, leaveVoice, joinVoice]);

    const openGroupAddModal = useCallback(() => {
        setGroupSearch('');
        setGroupSelection([]);
        setGroupError('');
        setShowGroupAdd(true);
    }, []);


    const groupCandidateList = useMemo(() => {
        const activeIds = new Set((activeDm?.participants || []).map((p) => p._id));
        const candidates = friends
            .filter((f) => f._id !== user?._id && !activeIds.has(f._id))
            .filter((f) => {
                if (!groupSearch.trim()) return true;
                const query = groupSearch.trim().toLowerCase();
                return (f.displayName || '').toLowerCase().includes(query)
                    || (f.username || '').toLowerCase().includes(query);
            });
        return candidates;
    }, [friends, activeDm?.participants, groupSearch, user?._id]);

    const maxGroupSize = 5;
    const currentGroupSize = activeDm?.participants?.length || 0;
    const remainingSlots = Math.max(0, maxGroupSize - currentGroupSize);

    const toggleGroupSelection = (id) => {
        setGroupError('');
        setGroupSelection((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (remainingSlots <= prev.length) {
                setGroupError(`Group limit is ${maxGroupSize} members.`);
                return prev;
            }
            return [...prev, id];
        });
    };

    const handleAddGroupMembers = async () => {
        if (!activeDm?._id || groupSelection.length === 0) return;
        if (groupSelection.length > remainingSlots) {
            setGroupError(`Group limit is ${maxGroupSize} members.`);
            return;
        }
        try {
            let updated = null;
            if (activeDm?.isGroup) {
                updated = await addParticipantsToThread(activeDm._id, groupSelection);
            } else {
                const existing = (activeDm.participants || [])
                    .map((p) => p._id)
                    .filter((id) => id && id !== user?._id);
                const ids = Array.from(new Set([...existing, ...groupSelection]));
                updated = await createGroupThread(ids);
            }
            const entry = buildDmEntry(updated);
            if (entry) {
                setActiveDm(entry);
                setViewMode('dm');
                setThreadId(entry._id);
                socket?.emit('join_dm', entry._id);
                await fetchMessages(entry._id);
                if (activeDmCall?.threadId === entry._id) {
                    sendGroupCallInvite(groupSelection, entry);
                }
            }
        } catch { }
        setShowGroupAdd(false);
        setGroupSelection([]);
        setGroupError('');
    };

    const acceptDmCall = useCallback(async () => {
        if (!incomingCall) return;
        stopRingtone();
        const { threadId: incomingThreadId, fromUser, threadMeta } = incomingCall;
        setIncomingCall(null);
        setViewMode('dm');
        if (threadMeta?.isGroup) {
            setThreadId(incomingThreadId);
            socket?.emit('join_dm', incomingThreadId);
            await fetchMessages(incomingThreadId);
            let entry = null;
            if (threadMeta?.participants) {
                entry = buildDmEntry({
                    _id: incomingThreadId,
                    participants: threadMeta.participants,
                    displayName: threadMeta.displayName,
                    isGroup: true,
                });
            }
            if (!entry) {
                const threadInfo = await fetchThreadInfo(incomingThreadId);
                entry = buildDmEntry(threadInfo);
            }
            if (entry) setActiveDm(entry);
        } else {
            const nextDm = {
                _id: fromUser.userId,
                displayName: fromUser.displayName || 'Friend',
                avatar: fromUser.avatar || '',
            };
            setActiveDm(nextDm);
            try {
                const tid = await openThread(fromUser.userId);
                setThreadId(tid);
                socket?.emit('join_dm', tid);
                await fetchMessages(tid);
                const threadInfo = await fetchThreadInfo(tid);
                const entry = buildDmEntry(threadInfo);
                if (entry) setActiveDm(entry);
            } catch { }
        }
        setActiveDmCall({ threadId: incomingThreadId, peer: fromUser, isGroup: threadMeta?.isGroup });
        socket?.emit('dm:call:accept', { toUserId: fromUser.userId, threadId: incomingThreadId });
        if (activeVoiceChannel?._id) {
            leaveVoice();
        }
        joinVoice({ _id: `dm-${incomingThreadId}`, name: 'Direct Call' });
    }, [incomingCall, stopRingtone, openThread, fetchMessages, fetchThreadInfo, buildDmEntry, socket, joinVoice, leaveVoice, activeVoiceChannel?._id, setThreadId]);

    const declineDmCall = useCallback(() => {
        if (!incomingCall) return;
        stopRingtone();
        socket?.emit('dm:call:decline', { toUserId: incomingCall.fromUser.userId, threadId: incomingCall.threadId });
        setIncomingCall(null);
    }, [incomingCall, socket, stopRingtone]);

    const cancelDmCall = useCallback(() => {
        if (!outgoingCall) return;
        if (Array.isArray(outgoingCall.toUsers) && outgoingCall.toUsers.length > 0) {
            outgoingCall.toUsers.forEach((id) => {
                socket?.emit('dm:call:cancel', { toUserId: id, threadId: outgoingCall.threadId });
            });
        } else if (outgoingCall.toUser?._id) {
            socket?.emit('dm:call:cancel', { toUserId: outgoingCall.toUser._id, threadId: outgoingCall.threadId });
        }
        setOutgoingCall(null);
        setOngoingDmCalls((prev) => {
            const next = new Set(prev);
            next.delete(outgoingCall.threadId);
            return next;
        });
    }, [outgoingCall, socket]);

    const endDmCall = useCallback(() => {
        if (!activeDmCall) return;
        if (activeDmCall.isGroup) {
            const participantCount = voiceParticipants?.length || 1;
            if (participantCount <= 2 && activeDm?.participants?.length) {
                activeDm.participants
                    .filter((p) => p._id !== user?._id)
                    .forEach((p) => {
                        socket?.emit('dm:call:end', { toUserId: p._id, threadId: activeDmCall.threadId });
                    });
                setOngoingDmCalls((prev) => {
                    const next = new Set(prev);
                    next.delete(activeDmCall.threadId);
                    return next;
                });
            }
        } else {
            const peerId = activeDmCall.peer?.userId || activeDmCall.peer?._id;
            socket?.emit('dm:call:end', { toUserId: peerId, threadId: activeDmCall.threadId });
            setOngoingDmCalls((prev) => {
                const next = new Set(prev);
                next.delete(activeDmCall.threadId);
                return next;
            });
        }
        setActiveDmCall(null);
        if (isSharing) stopScreenShare();
        leaveVoice();
    }, [activeDmCall, activeDm?.participants, user?._id, socket, leaveVoice, isSharing, stopScreenShare, voiceParticipants]);

    const handleLeaveGroup = useCallback(async () => {
        if (!activeDm?.isGroup || !activeDm?._id) return;
        if (activeDmCall?.threadId === activeDm._id) {
            endDmCall();
        }
        try {
            await leaveThread(activeDm._id);
        } catch (error) {
            console.log('Failed to leave group:', error);
        } finally {
            removeThread(activeDm._id);
            setActiveDm(null);
            setThreadId(null);
            setDmText('');
            setDmFiles([]);
            setViewMode('dm');
        }
    }, [activeDm, activeDmCall?.threadId, endDmCall, leaveThread, removeThread, setThreadId]);

    const exitDmCallForVoice = useCallback(() => {
        if (incomingCall) {
            declineDmCall();
            return;
        }
        if (outgoingCall) {
            cancelDmCall();
            return;
        }
        if (activeDmCall) {
            endDmCall();
        }
    }, [incomingCall, outgoingCall, activeDmCall, declineDmCall, cancelDmCall, endDmCall]);

    const handleVoiceBarLeave = useCallback(() => {
        if (activeDmCall) {
            endDmCall();
            return;
        }
        leaveVoice();
    }, [activeDmCall, endDmCall, leaveVoice]);

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

    const handleOpenChannelSettings = (channel) => {
        if (!channel?._id || !canEditChannel) return;
        if (channel._id !== activeChannelId) {
            setPendingEditChannelId(channel._id);
            setActiveChannel(channel._id);
            return;
        }
        setEditChannelSignal((v) => v + 1);
    };

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

    const pendingCount = incoming.length + outgoing.length;

    const dmThreadEntries = useMemo(() => {
        return (dmThreads || []).map((thread) => buildDmEntry(thread)).filter(Boolean);
    }, [dmThreads, buildDmEntry]);

    const directDmEntries = useMemo(() => dmThreadEntries.filter((dm) => !dm.isGroup), [dmThreadEntries]);
    const groupDmEntries = useMemo(() => dmThreadEntries.filter((dm) => dm.isGroup), [dmThreadEntries]);

    useEffect(() => {
        if (!activeDm?._id) return;
        const updated = dmThreadEntries.find((t) => t._id === activeDm._id);
        if (updated) {
            setActiveDm(updated);
        }
    }, [dmThreadEntries, activeDm?._id]);

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
        clearChannels();
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
                {directDmEntries.length === 0 && (
                    <div className="px-2 py-3 text-xs text-discord-faint">No direct messages yet.</div>
                )}
                {directDmEntries.map((dm) => (
                    <button
                        key={dm._id}
                        onClick={async () => {
                            setActiveDm(dm);
                            setViewMode('dm');
                            setShowMobileDmList(false);
                            setThreadId(dm._id);
                            socket?.emit('join_dm', dm._id);
                            await fetchMessages(dm._id);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-sm text-discord-muted hover:bg-discord-darkest/80 hover:text-discord-light cursor-pointer"
                    >
                        <div className="relative w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center text-xs font-semibold text-discord-light">
                            {dm.avatar ? (
                                <img src={dm.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                dm.displayName?.charAt(0).toUpperCase()
                            )}
                            {!dm.isGroup && (
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker ${presenceColor(dm.presence)}`} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate">{dm.displayName}</span>
                            <span className="block text-[11px] text-discord-faint truncate">{dm.subtitle}</span>
                        </div>
                    </button>
                ))}
                {groupDmEntries.length > 0 && (
                    <>
                        <div className="mt-3 px-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-discord-faint">
                            Group Messages
                        </div>
                        {groupDmEntries.map((dm) => (
                            <button
                                key={dm._id}
                                onClick={async () => {
                                    setActiveDm(dm);
                                    setViewMode('dm');
                                    setShowMobileDmList(false);
                                    setThreadId(dm._id);
                                    socket?.emit('join_dm', dm._id);
                                    await fetchMessages(dm._id);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-sm text-discord-muted hover:bg-discord-darkest/80 hover:text-discord-light cursor-pointer"
                            >
                                <div className="relative w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center text-xs font-semibold text-discord-light">
                                    {dm.avatar ? (
                                        <img src={dm.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        dm.displayName?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <span className="block truncate">{dm.displayName}</span>
                                    <span className="block text-[11px] text-discord-faint truncate">{dm.subtitle}</span>
                                </div>
                            </button>
                        ))}
                    </>
                )}
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
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowProfileSettings(true);
                        }}
                        className="w-7 h-7 rounded-md bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer"
                        title="Settings"
                    >
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
                                        {filterStatusText(m.statusText) && (
                                            <p className="text-[11px] text-discord-faint">{filterStatusText(m.statusText)}</p>
                                        )}
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
                    onSettingsClick={() => setShowProfileSettings(true)}
                    onFriendsClick={() => {
                        setViewMode('friends');
                        setActiveTab('all');
                        setShowMobileSidebar(false);
                        setShowMobileServers(false);
                    }}
                    onOpenChannelSettings={handleOpenChannelSettings}
                    onVoiceChannelClick={(channel) => {
                        if (!channel?._id) return;
                        if (incomingCall || outgoingCall || activeDmCall) {
                            exitDmCallForVoice();
                        }
                        if (activeVoiceChannel?._id === channel._id) {
                            leaveVoice();
                        } else {
                            joinVoice({ ...channel, communityId: activeCommunityId });
                        }
                    }}
                    voiceState={{
                        isConnected: !!activeVoiceChannel,
                        activeChannelId: activeVoiceChannel?._id,
                        activeChannelName: activeVoiceChannel?.name,
                        members: voiceParticipants,
                        voicePresence,
                        connectedPeerIds,
                        memberCount: voiceParticipants.length,
                        elapsed,
                        elapsedLabel: `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
                        isMuted,
                        isDeafened,
                        isSharing,
                        noiseReduction,
                        hasRemoteStream: remoteScreenStreams.length > 0 || remoteMedia.length > 0,
                        onToggleViewer: () => setShowStreamViewer((prev) => !prev),
                        onToggleMute: toggleMute,
                        onToggleDeafen: toggleDeafen,
                        onToggleNoiseReduction: toggleNoiseReduction,
                        onToggleShare: isSharing ? stopScreenShare : startScreenShare,
                        onLeave: handleVoiceBarLeave,
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
                        {activeChannel?.name ? (
                            <>
                                <Hash className="w-4 h-4" />
                                <span>{activeChannel.name}</span>
                            </>
                        ) : (
                            <span className="text-discord-faint text-xs uppercase tracking-[0.2em]">Loading channel</span>
                        )}
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
                    editSignal={editChannelSignal}
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
                                onCall={startDmCall}
                                onAddToGroup={openGroupAddModal}
                                onLeaveGroup={handleLeaveGroup}
                                canAddToGroup={!!activeDm}
                                callDisabled={!threadId || !!outgoingCall || !!incomingCall || !!activeDmCall}
                                activeCall={activeDmCall}
                                selfProfile={{ avatar: profile?.avatar || '', displayName }}
                                onToggleMute={toggleMute}
                                onToggleCamera={() => {
                                    if (isCameraOn) stopCamera();
                                    else startCamera();
                                }}
                                onToggleShare={() => {
                                    if (isSharing) stopScreenShare();
                                    else startScreenShare();
                                }}
                                onEndCall={endDmCall}
                                isMuted={isMuted}
                                isSharing={isSharing}
                                isCameraOn={isCameraOn}
                                screenShareStream={screenShareStream}
                                screenShareStreams={screenShareTiles}
                                localCameraStream={localCameraStream}
                                remoteCameraStream={remoteCameraStream}
                                remoteCameraStreams={remoteCameraStreams}
                                participants={voiceParticipants}
                                isRemoteScreenShare={isRemoteScreenShare}
                                onOpenStreamFullscreen={(stream) => setFullscreenStream(stream)}
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
                                        {pendingCount > 0 && (
                                            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-blurple/80 text-[10px] font-semibold text-white">
                                                {pendingCount}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('invites')}
                                        className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                                            activeTab === 'invites' ? 'bg-discord-darkest text-discord-white' : 'text-discord-faint hover:bg-discord-darkest/60'
                                        }`}
                                    >
                                        Invites
                                        {invites.length > 0 && (
                                            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-blurple/80 text-[10px] font-semibold text-white">
                                                {invites.length}
                                            </span>
                                        )}
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

                        {activeTab === 'invites' && (
                            <div className="flex-1 overflow-y-auto px-4 py-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-discord-faint mb-2">
                                    Server Invites — {invites.length}
                                </div>
                                {inviteError && (
                                    <div className="px-3 py-2 mb-3 text-xs text-discord-red bg-discord-red/10 border border-discord-red/20 rounded-md">
                                        {inviteError}
                                    </div>
                                )}
                                {isInviteLoading && (
                                    <div className="px-3 py-4 text-xs text-discord-faint">Loading invites…</div>
                                )}
                                {!isInviteLoading && invites.length === 0 && (
                                    <div className="px-3 py-4 text-xs text-discord-faint">No server invites yet.</div>
                                )}
                                <div className="space-y-1">
                                    {invites.map((invite) => (
                                        <div key={invite._id} className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-discord-darkest/60">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-9 h-9 rounded-full bg-discord-darker flex items-center justify-center text-sm font-semibold text-discord-light">
                                                    {invite.community?.icon ? (
                                                        <img src={invite.community.icon} alt="" className="w-9 h-9 rounded-full object-cover" />
                                                    ) : (
                                                        (invite.community?.name || 'S').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-discord-white">{invite.community?.name || 'Server'}</p>
                                                    <p className="text-[11px] text-discord-faint">Invited by {invite.inviter?.name || 'Admin'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={async () => {
                                                        const data = await acceptInvite(invite._id);
                                                        if (data?.user) setUser(data.user);
                                                    }}
                                                    className="px-3 py-1.5 rounded-md bg-discord-green text-xs font-semibold text-discord-darkest hover:bg-discord-green/90 cursor-pointer"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={async () => { await declineInvite(invite._id); }}
                                                    className="px-3 py-1.5 rounded-md bg-discord-darkest text-xs font-semibold text-discord-faint hover:bg-discord-border-light/40 cursor-pointer"
                                                >
                                                    Decline
                                                </button>
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
                                                    {filterStatusText(friend.statusText) && (
                                                        <p className="text-[11px] text-discord-faint">{filterStatusText(friend.statusText)}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => startCallForFriend(friend)}
                                                    className="w-7 h-7 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer"
                                                    title="Call"
                                                >
                                                    <Phone className="w-3.5 h-3.5 text-discord-faint" />
                                                </button>
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

            {incomingCall && (
                <div className="dm-call-modal fixed inset-0 z-[80] flex items-center justify-center">
                    <div className="dm-call-card dm-call-card--incoming w-[360px] rounded-3xl border border-discord-border/60 shadow-2xl p-7 text-center space-y-5">
                        <div className="dm-call-card__ambient" aria-hidden="true">
                            <span className="dm-call-card__orb dm-call-card__orb--one" />
                            <span className="dm-call-card__orb dm-call-card__orb--two" />
                            <span className="dm-call-card__ring dm-call-card__ring--one" />
                            <span className="dm-call-card__ring dm-call-card__ring--two" />
                        </div>
                        <div className="dm-call-card__content space-y-4">
                            <div className="dm-call-avatar-wrap">
                                <div className="dm-call-avatar w-20 h-20 rounded-full bg-discord-darkest mx-auto flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                                    {incomingCall.threadMeta?.isGroup ? (
                                        (incomingCall.threadMeta?.displayName || 'G').charAt(0).toUpperCase()
                                    ) : incomingCall.fromUser?.avatar ? (
                                        <img src={incomingCall.fromUser.avatar} alt="" className="w-20 h-20 object-cover" />
                                    ) : (
                                        (incomingCall.fromUser?.displayName || 'F').charAt(0).toUpperCase()
                                    )}
                                </div>
                                <span className="dm-call-avatar-pulse" aria-hidden="true" />
                                <span className="dm-call-avatar-pulse dm-call-avatar-pulse--delay" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm text-discord-faint uppercase tracking-[0.3em]">Incoming</p>
                                <p className="text-xl font-semibold text-white mt-2">
                                    {incomingCall.threadMeta?.displayName || incomingCall.fromUser?.displayName || 'Friend'}
                                </p>
                            </div>
                            <div className="dm-call-actions flex items-center justify-center gap-4">
                                <button
                                    onClick={declineDmCall}
                                    className="dm-call-action dm-call-action--decline w-12 h-12 rounded-full text-white flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={acceptDmCall}
                                    className="dm-call-action dm-call-action--accept w-12 h-12 rounded-full text-white flex items-center justify-center"
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showGroupAdd && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-[520px] max-w-[92vw] rounded-2xl border border-discord-border/60 bg-discord-darker shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-discord-darkest/80">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Add Friends to Group DM</h3>
                                <p className="text-xs text-discord-faint mt-1">
                                    Select friends to add to this group conversation.
                                </p>
                                <p className="text-[11px] text-discord-faint mt-1">
                                    {remainingSlots} slots left (max {maxGroupSize} members).
                                </p>
                            </div>
                            <button
                                onClick={() => setShowGroupAdd(false)}
                                className="w-8 h-8 rounded-full bg-discord-darkest/70 text-discord-faint hover:text-white flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="px-6 pt-4 pb-2">
                            <div className="flex items-center gap-3">
                                <input
                                    value={groupSearch}
                                    onChange={(e) => setGroupSearch(e.target.value)}
                                    placeholder="Search for friends"
                                    className="flex-1 px-3 py-2 rounded-xl bg-discord-darkest text-sm text-discord-light border border-discord-border/60 focus:outline-none focus:ring-2 focus:ring-blurple/60"
                                />
                                <button
                                    onClick={handleAddGroupMembers}
                                    disabled={groupSelection.length === 0 || remainingSlots === 0}
                                    className="px-4 py-2 rounded-xl bg-blurple text-white text-sm font-semibold disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        <div className="px-6 pb-5 max-h-[360px] overflow-y-auto space-y-1">
                            {groupError && (
                                <div className="px-3 py-2 rounded-lg text-xs text-discord-red bg-discord-red/10 border border-discord-red/30">
                                    {groupError}
                                </div>
                            )}
                            {groupCandidateList.length === 0 && (
                                <div className="py-8 text-center text-sm text-discord-faint">No friends available.</div>
                            )}
                            {groupCandidateList.map((friend) => (
                                (() => {
                                    const atLimit = remainingSlots <= groupSelection.length;
                                    const isSelected = groupSelection.includes(friend._id);
                                    const disabled = !isSelected && atLimit;
                                    return (
                                <button
                                    key={friend._id}
                                    onClick={() => !disabled && toggleGroupSelection(friend._id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left ${
                                        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-discord-darkest/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-full bg-discord-darkest flex items-center justify-center text-sm font-semibold text-discord-light">
                                            {friend.avatar ? (
                                                <img src={friend.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                friend.displayName?.charAt(0).toUpperCase()
                                            )}
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker ${presenceColor(friend.presence)}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-discord-light font-semibold">{friend.displayName}</p>
                                            <p className="text-xs text-discord-faint">{friend.username}</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md border ${isSelected ? 'bg-blurple border-blurple' : 'border-discord-border/60'}`} />
                                </button>
                                    );
                                })()
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {outgoingCall && (
                <div className="dm-call-modal dm-call-modal--soft fixed inset-0 z-[70] flex items-center justify-center">
                    <div className="dm-call-card dm-call-card--outgoing w-[300px] rounded-3xl border border-discord-border/60 shadow-2xl p-6 text-center space-y-4">
                        <div className="dm-call-card__ambient" aria-hidden="true">
                            <span className="dm-call-card__orb dm-call-card__orb--one" />
                            <span className="dm-call-card__orb dm-call-card__orb--two" />
                        </div>
                        <div className="dm-call-card__content space-y-3">
                            <p className="dm-call-status text-xs text-discord-faint uppercase tracking-[0.35em]">
                                Calling
                                <span className="dm-call-dots" aria-hidden="true">
                                    <span />
                                    <span />
                                    <span />
                                </span>
                            </p>
                            <p className="text-xl font-semibold text-white">{outgoingCall.toUser?.displayName || 'Friend'}</p>
                            <button
                                onClick={cancelDmCall}
                                className="dm-call-action dm-call-action--decline px-6 py-2.5 rounded-full text-white text-sm font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {remoteMedia.map((item) => (
                <VoiceAudioPlayer key={item.socketId} stream={item.stream} muted={isDeafened} />
            ))}

            {remoteScreenStreams.length > 0 && showStreamViewer && (
                <div className="fixed bottom-6 right-6 z-40 w-[320px] max-w-[90vw] rounded-2xl bg-discord-darkest/90 border border-discord-border/60 shadow-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-discord-faint">Screen Share</p>
                        <button
                            onClick={() => setFullscreenStream(remoteScreenStreams[0]?.stream || null)}
                            className="text-[11px] px-2 py-1 rounded-md bg-discord-darkest text-discord-light hover:bg-discord-border-light/40"
                        >
                            Fullscreen
                        </button>
                    </div>
                    <div className="space-y-2">
                        {remoteScreenStreams.map((item, idx) => (
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

            {fullscreenStream && showStreamFullscreen && (
                <div
                    className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center"
                    onClick={() => setFullscreenStream(null)}
                >
                    <div className="w-[92vw] h-[92vh] max-w-[1400px] max-h-[880px] rounded-2xl bg-black/80 border border-discord-border/60 shadow-2xl p-3">
                        <VoiceVideoPlayer
                            stream={fullscreenStream}
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
