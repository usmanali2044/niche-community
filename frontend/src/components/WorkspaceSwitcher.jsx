import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ChevronRight, Users, Gamepad2, Heart, GraduationCap, BookOpen, Sparkles, ImagePlus, Command, Compass, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useFeedStore } from '../stores/feedStore';
import { useChannelStore } from '../stores/channelStore';
import { useEventStore } from '../stores/eventStore';
import { useCommunityStore } from '../stores/communityStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useInviteRequestStore } from '../stores/inviteRequestStore';

const WorkspaceSwitcher = ({ onHomeClick, onServerSelect, openDirectorySignal = 0 }) => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const { activeCommunityId, setActiveCommunity } = useWorkspaceStore();
    const { fetchFeed, uploadFile } = useFeedStore();
    const { fetchChannels, setActiveChannel } = useChannelStore();
    const { fetchEvents } = useEventStore();
    const { createCommunity, fetchAllCommunities, allCommunities, isLoading: isCreating } = useCommunityStore();
    const { notifications } = useNotificationStore();
    const { requestInvite, isLoading: isRequestingInvite, error: inviteRequestError, clearError: clearInviteRequestError } = useInviteRequestStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [step, setStep] = useState('template');
    const [selectedTemplate, setSelectedTemplate] = useState('custom');
    const [serverKind, setServerKind] = useState(null);
    const [serverName, setServerName] = useState('');
    const [serverIcon, setServerIcon] = useState('');
    const [uploading, setUploading] = useState(false);
    const [createError, setCreateError] = useState('');
    const [hoveredServer, setHoveredServer] = useState(null);
    const [showDirectory, setShowDirectory] = useState(false);
    const [directoryQuery, setDirectoryQuery] = useState('');
    const [requestTarget, setRequestTarget] = useState(null);
    const [requestNote, setRequestNote] = useState('');
    const [requestSuccess, setRequestSuccess] = useState('');
    const [requestedIds, setRequestedIds] = useState([]);

    const memberships = user?.memberships || [];
    const membershipIds = useMemo(() => new Set((memberships || []).map((m) => {
        const id = m.communityId?._id || m.communityId;
        return id?.toString?.() || String(id);
    })), [memberships]);

    const unreadByCommunity = useMemo(() => {
        const map = new Map();
        notifications.forEach((notif) => {
            if (notif.readAt) return;
            const communityId = notif.meta?.communityId;
            if (!communityId) return;
            const key = communityId?.toString?.() || String(communityId);
            map.set(key, (map.get(key) || 0) + 1);
        });
        return map;
    }, [notifications]);

    const handleSwitch = (communityId) => {
        if (communityId === activeCommunityId) {
            onServerSelect?.(communityId);
            return;
        }
        setActiveCommunity(communityId);
        setActiveChannel(null);
        onServerSelect?.(communityId);
        setTimeout(() => {
            fetchFeed(1, null, null);
            fetchChannels();
            fetchEvents();
        }, 0);
    };

    const getInitial = (membership) => {
        const community = membership.communityId;
        const name = community?.name || community?.slug || '?';
        return name.charAt(0).toUpperCase();
    };

    const getName = (membership) => {
        const community = membership.communityId;
        return community?.name || community?.slug || 'Community';
    };

    const getIcon = (membership) => {
        const community = membership.communityId;
        return community?.icon || '';
    };

    const getId = (membership) => {
        const community = membership.communityId;
        return community?._id || community;
    };

    const filteredCommunities = useMemo(() => {
        const q = directoryQuery.trim().toLowerCase();
        const list = allCommunities || [];
        if (!q) return list;
        return list.filter((c) => {
            const name = (c.name || '').toLowerCase();
            const slug = (c.slug || '').toLowerCase();
            return name.includes(q) || slug.includes(q);
        });
    }, [allCommunities, directoryQuery]);

    useEffect(() => {
        if (!showDirectory) return;
        fetchAllCommunities().catch(() => {});
    }, [showDirectory, fetchAllCommunities]);

    useEffect(() => {
        if (!showDirectory) {
            setRequestTarget(null);
            setRequestNote('');
            setRequestSuccess('');
            clearInviteRequestError();
        }
    }, [showDirectory, clearInviteRequestError]);

    useEffect(() => {
        if (openDirectorySignal > 0) setShowDirectory(true);
    }, [openDirectorySignal]);

    return (
        <>
            <aside className="workspace-switcher hidden md:flex flex-col items-center w-16 shrink-0 bg-discord-sidebar border-r border-discord-darkest/80 py-3 gap-3 overflow-y-auto">
                <button
                    onClick={() => {
                        onHomeClick?.();
                        navigate('/feed');
                    }}
                    className="w-11 h-11 rounded-3xl bg-blurple flex items-center justify-center shadow-lg shadow-blurple/40 hover:rounded-2xl transition-all cursor-pointer"
                    title="Home"
                >
                    <Command className="w-6 h-6 text-white" strokeWidth={2.4} />
                </button>
                <div className="w-8 h-[2px] bg-discord-border-light/60 rounded-full my-1" />
                <div className="relative group flex items-center justify-center">
                    <button
                        onClick={() => setShowDirectory(true)}
                        className={`w-11 h-11 rounded-3xl bg-discord-darker flex items-center justify-center text-discord-light
                            transition-all duration-300 cursor-pointer hover:rounded-2xl hover:bg-discord-darkest ${showDirectory ? 'rounded-2xl bg-discord-darkest' : ''}`}
                        title="Server Directory"
                    >
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-inner">
                            <Compass className="w-3.5 h-3.5 text-discord-darkest" strokeWidth={2.2} />
                        </div>
                    </button>
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-discord-darkest text-white text-xs font-semibold rounded-lg
                        whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200 pointer-events-none z-50 shadow-xl border border-discord-border">
                        Server Directory
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0
                            border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent
                            border-r-[6px] border-r-discord-darkest" />
                    </div>
                </div>
                {memberships.map((m, i) => {
                    const id = getId(m);
                    const isActive = id === activeCommunityId;
                    const unreadCount = unreadByCommunity.get(id?.toString?.() || String(id)) || 0;

                    return (
                        <div
                            key={id}
                            className="relative group flex items-center justify-center"
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredServer({
                                    id,
                                    name: getName(m),
                                    role: m.role,
                                    top: rect.top + rect.height / 2,
                                });
                            }}
                            onMouseLeave={() => setHoveredServer(null)}
                        >
                            {/* Active pill indicator */}
                            <div className={`absolute left-0 w-1 rounded-r-full bg-white transition-all duration-300
                                ${isActive ? 'h-10' : 'h-0 group-hover:h-5'}`} />

                            <button onClick={() => handleSwitch(id)}
                                className={`w-11 h-11 flex items-center justify-center text-xs font-bold text-discord-light
                                    transition-all duration-300 cursor-pointer select-none
                                    ${isActive
                                        ? 'bg-blurple text-white rounded-2xl shadow-lg'
                                        : 'bg-discord-darker rounded-3xl hover:rounded-2xl hover:bg-blurple/80 hover:text-white'
                                    }`}
                                title={getName(m)}>
                                {getIcon(m) ? (
                                    <img src={getIcon(m)} alt="" className="w-full h-full rounded-2xl object-cover" />
                                ) : (
                                    getInitial(m)
                                )}
                            </button>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-discord-red border-2 border-discord-sidebar" />
                            )}
                        </div>
                    );
                })}

                {/* Create / Join community */}
                <div className="relative group flex items-center justify-center">
                    <button onClick={() => {
                        setShowCreateModal(true);
                        setStep('template');
                        setSelectedTemplate('custom');
                        setServerKind(null);
                        setServerName(`${user?.name || 'My'} server`);
                        setServerIcon('');
                        setCreateError('');
                    }}
                        className="w-11 h-11 rounded-3xl bg-discord-darker flex items-center justify-center text-discord-light
                            transition-all duration-300 cursor-pointer hover:rounded-2xl hover:bg-discord-darkest"
                        title="Create a server">
                        <Plus className="w-5 h-5 text-discord-faint" strokeWidth={2} />
                    </button>

                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-discord-darkest text-white text-xs font-semibold rounded-lg
                        whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200 pointer-events-none z-50 shadow-xl border border-discord-border">
                        Create a Server
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0
                            border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent
                            border-r-[6px] border-r-discord-darkest" />
                    </div>
                </div>
            </aside>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
                    <div
                        className="w-[460px] max-w-[92vw] rounded-2xl bg-[#2b2d31] border border-discord-border/50 shadow-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {step === 'template' && 'Create Your Server'}
                                    {step === 'purpose' && 'Tell Us More About Your Server'}
                                    {step === 'customize' && 'Customize Your Server'}
                                </h2>
                                {step === 'template' && (
                                    <p className="text-sm text-discord-muted mt-2">
                                        Your server is where you and your friends hang out. Make yours and start talking.
                                    </p>
                                )}
                                {step === 'purpose' && (
                                    <p className="text-sm text-discord-muted mt-2">
                                        Is your new server for just a few friends or a larger community?
                                    </p>
                                )}
                                {step === 'customize' && (
                                    <p className="text-sm text-discord-muted mt-2">
                                        Give your new server a personality with a name and an icon. You can always change it later.
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer"
                            >
                                <X className="w-4 h-4 text-discord-faint" />
                            </button>
                        </div>

                        {step === 'template' && (
                            <div className="mt-5 space-y-3">
                                <button
                                    onClick={() => { setSelectedTemplate('custom'); setStep('purpose'); }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-discord-darkest/70 border border-discord-border/50 hover:bg-discord-darkest cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-blurple" />
                                        <span className="text-sm font-semibold text-white">Create My Own</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-discord-faint" />
                                </button>

                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-discord-faint">Start from a template</div>

                                {[{ key: 'gaming', label: 'Gaming', icon: Gamepad2 }, { key: 'friends', label: 'Friends', icon: Heart }, { key: 'study', label: 'Study Group', icon: GraduationCap }, { key: 'school', label: 'School Club', icon: BookOpen }].map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => { setSelectedTemplate(t.key); setStep('purpose'); }}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-discord-darkest/70 border border-discord-border/50 hover:bg-discord-darkest cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <t.icon className="w-5 h-5 text-discord-faint" />
                                            <span className="text-sm font-semibold text-white">{t.label}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-discord-faint" />
                                    </button>
                                ))}

                                <div className="pt-3 border-t border-discord-border/40">
                                    <p className="text-sm text-discord-faint mb-2">Have an invite already?</p>
                                    <button
                                        onClick={() => { setShowCreateModal(false); navigate('/join-community'); }}
                                        className="w-full px-4 py-2 rounded-xl bg-discord-darkest text-sm font-semibold text-discord-white hover:bg-discord-border-light/30 cursor-pointer"
                                    >
                                        Join a Server
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'purpose' && (
                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => { setServerKind('friends'); setStep('customize'); }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-discord-darkest/70 border border-discord-border/50 hover:bg-discord-darkest cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-discord-faint" />
                                        <span className="text-sm font-semibold text-white">For me and my friends</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-discord-faint" />
                                </button>
                                <button
                                    onClick={() => { setServerKind('community'); setStep('customize'); }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-discord-darkest/70 border border-discord-border/50 hover:bg-discord-darkest cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-discord-faint" />
                                        <span className="text-sm font-semibold text-white">For a club or community</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-discord-faint" />
                                </button>
                                <button onClick={() => setStep('template')} className="text-sm text-discord-faint hover:text-white cursor-pointer">Back</button>
                            </div>
                        )}

                        {step === 'customize' && (
                            <div className="mt-6">
                                <div className="flex items-center gap-4">
                                    <label className="relative w-20 h-20 rounded-full border-2 border-dashed border-discord-border/60 flex items-center justify-center cursor-pointer hover:border-blurple">
                                        {serverIcon ? (
                                            <img src={serverIcon} alt="" className="w-20 h-20 rounded-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-[10px] text-discord-faint">
                                                <ImagePlus className="w-5 h-5 mb-1" />
                                                UPLOAD
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploading(true);
                                                try {
                                                    const url = await uploadFile(file);
                                                    setServerIcon(url);
                                                } finally {
                                                    setUploading(false);
                                                }
                                            }}
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-xs text-white">
                                                Uploading…
                                            </div>
                                        )}
                                    </label>
                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-discord-faint">Server Name</label>
                                        <input
                                            value={serverName}
                                            onChange={(e) => setServerName(e.target.value)}
                                            className="mt-2 w-full rounded-lg bg-discord-darkest border border-discord-border/50 px-3 py-2 text-sm text-white focus:outline-none focus:border-blurple"
                                        />
                                    </div>
                                </div>

                                {createError && <div className="mt-3 text-sm text-discord-red">{createError}</div>}

                                <div className="mt-6 flex items-center justify-between">
                                    <button onClick={() => setStep('purpose')} className="text-sm text-discord-faint hover:text-white cursor-pointer">Back</button>
                                    <button
                                        onClick={async () => {
                                            if (!serverName.trim()) {
                                                setCreateError('Server name is required');
                                                return;
                                            }
                                            setCreateError('');
                                            try {
                                                const data = await createCommunity(serverName.trim(), '', undefined, serverIcon, serverKind || 'community', selectedTemplate);
                                                if (data?.user) {
                                                    let nextUser = data.user;
                                                    if (data?.community?._id) {
                                                        nextUser = {
                                                            ...nextUser,
                                                            memberships: (nextUser.memberships || []).map((m) => {
                                                                const id = m.communityId?._id || m.communityId;
                                                                if (id?.toString?.() === data.community._id.toString()) {
                                                                    return { ...m, communityId: data.community };
                                                                }
                                                                return m;
                                                            }),
                                                        };
                                                    }
                                                    setUser(nextUser);
                                                }
                                                if (data?.community?._id) {
                                                    setActiveCommunity(data.community._id);
                                                    setActiveChannel(null);
                                                    fetchChannels();
                                                    fetchFeed(1, null, null);
                                                    fetchEvents();
                                                }
                                                setShowCreateModal(false);
                                            } catch (err) {
                                                setCreateError(err.message || 'Failed to create server');
                                            }
                                        }}
                                        disabled={isCreating}
                                        className="px-5 py-2 rounded-lg bg-blurple text-sm font-semibold text-white hover:bg-blurple-hover disabled:opacity-60 cursor-pointer"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showDirectory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDirectory(false)}>
                    <div
                        className="w-full h-full md:w-[980px] md:max-w-[96vw] md:max-h-[90vh] overflow-y-auto md:rounded-2xl rounded-none bg-[#2b2d31] border border-discord-border/50 shadow-2xl p-4 md:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl md:text-2xl font-bold text-white">Find Your Community</h2>
                                <p className="text-sm text-discord-muted mt-1">Browse the servers available to you.</p>
                            </div>
                            <button
                                onClick={() => setShowDirectory(false)}
                                className="w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer"
                            >
                                <X className="w-4 h-4 text-discord-faint" />
                            </button>
                        </div>

                        <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#3b4bd8] via-[#2c2b7a] to-[#1b1a47] p-4 md:p-6 border border-white/10">
                            <h3 className="text-2xl md:text-3xl font-black text-white tracking-wide">FIND YOUR COMMUNITY</h3>
                            <p className="text-sm text-white/80 mt-2">From gaming to music to learning, there&apos;s a place for you.</p>
                        </div>

                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-faint" />
                                <input
                                    value={directoryQuery}
                                    onChange={(e) => setDirectoryQuery(e.target.value)}
                                    placeholder="Search servers"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-discord-darkest text-sm text-discord-white placeholder:text-discord-faint/60 border border-discord-border/60 focus:outline-none focus:border-blurple"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setShowDirectory(false);
                                    navigate('/join-community');
                                }}
                                className="px-4 py-2.5 rounded-lg bg-discord-darkest text-sm font-semibold text-discord-light hover:bg-discord-border-light/30 cursor-pointer w-full sm:w-auto"
                            >
                                Join a Server
                            </button>
                        </div>

                        <div className="mt-6">
                            <div className="text-sm font-semibold text-discord-light mb-3">
                                Servers ({filteredCommunities.length})
                            </div>
                            {filteredCommunities.length === 0 ? (
                                <div className="text-sm text-discord-faint">No servers match your search.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredCommunities.map((community) => {
                                        const id = community?._id;
                                        const name = community?.name || 'Community';
                                        const icon = community?.icon || '';
                                        const description = community?.description || community?.profileDescription || community?.slug || 'Community';
                                        const isMember = membershipIds.has(id?.toString?.() || String(id));
                                        const isRequested = requestedIds.includes(id?.toString?.() || String(id));
                                        return (
                                            <div
                                                key={id}
                                                onClick={() => {
                                                    if (isMember) {
                                                        handleSwitch(id);
                                                        setShowDirectory(false);
                                                    }
                                                }}
                                                className={`text-left rounded-xl border border-discord-border/50 bg-discord-darkest/60 hover:bg-discord-darkest transition-colors p-4 ${isMember ? 'cursor-pointer' : ''}`}
                                            >
                                                <div className="h-24 w-full rounded-lg bg-discord-darker/80 border border-discord-border/40 flex items-center justify-center overflow-hidden">
                                                    {icon ? (
                                                        <img src={icon} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-2xl bg-discord-border/40 flex items-center justify-center text-lg font-bold text-discord-light">
                                                            {(name || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="text-sm font-semibold text-white truncate">{name}</h4>
                                                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                                            isMember ? 'bg-discord-border/40 text-discord-faint' : isRequested ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blurple/20 text-blurple'
                                                        }`}>
                                                            {isMember ? 'Member' : isRequested ? 'Requested' : 'Invite'}
                                                        </span>
                                                    </div>
                                                    {description && (
                                                        <p className="text-xs text-discord-faint mt-1">{description}</p>
                                                    )}
                                                    {typeof community?.membersCount === 'number' && (
                                                        <p className="text-[11px] text-discord-faint mt-2">{community.membersCount} members</p>
                                                    )}
                                                    {!isMember && (
                                                        <div className="mt-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setRequestTarget(community);
                                                                    setRequestNote('');
                                                                    setRequestSuccess('');
                                                                    clearInviteRequestError();
                                                                }}
                                                                className="px-3 py-1.5 rounded-md bg-blurple text-xs font-semibold text-white hover:bg-blurple-hover cursor-pointer"
                                                            >
                                                                Request Invite
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showDirectory && requestTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRequestTarget(null)}>
                    <div
                        className="w-[420px] max-w-[92vw] rounded-2xl bg-[#2b2d31] border border-discord-border/60 shadow-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-white">Request Invite</h3>
                                <p className="text-sm text-discord-faint mt-1">Ask to join <span className="text-discord-light font-semibold">{requestTarget.name}</span>.</p>
                            </div>
                            <button
                                onClick={() => setRequestTarget(null)}
                                className="w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer"
                            >
                                <X className="w-4 h-4 text-discord-faint" />
                            </button>
                        </div>

                        <div className="mt-4">
                            <label className="text-xs font-semibold text-discord-faint">Message (optional)</label>
                            <textarea
                                value={requestNote}
                                onChange={(e) => setRequestNote(e.target.value)}
                                rows={3}
                                placeholder="Tell the admins why you want to join."
                                className="mt-2 w-full rounded-lg bg-discord-darkest border border-discord-border/60 px-3 py-2 text-sm text-white outline-none placeholder:text-discord-faint/60 resize-none"
                            />
                        </div>

                        {inviteRequestError && (
                            <div className="mt-3 text-xs text-discord-red">{inviteRequestError}</div>
                        )}
                        {requestSuccess && (
                            <div className="mt-3 text-xs text-emerald-300">{requestSuccess}</div>
                        )}

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setRequestTarget(null)}
                                className="px-4 py-2 rounded-lg bg-discord-darkest text-sm font-semibold text-discord-light hover:bg-discord-border-light/40 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const created = await requestInvite(requestTarget._id, requestNote);
                                        const id = created?.communityId?.toString?.() || String(requestTarget._id);
                                        setRequestedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
                                        setRequestSuccess('Request sent. An admin will review it soon.');
                                    } catch { }
                                }}
                                disabled={isRequestingInvite}
                                className="px-4 py-2 rounded-lg bg-blurple text-sm font-semibold text-white hover:bg-blurple-hover disabled:opacity-60 cursor-pointer"
                            >
                                {isRequestingInvite ? 'Sending…' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {hoveredServer && (
                <div
                    className="fixed left-[76px] px-3 py-1.5 bg-discord-darkest text-white text-xs font-semibold rounded-lg
                        whitespace-nowrap transition-all duration-150 pointer-events-none z-[9999] shadow-xl border border-discord-border
                        opacity-100 translate-x-0 scale-100 animate-tooltip-in"
                    style={{ top: hoveredServer.top, transform: 'translateY(-50%)' }}
                >
                    {hoveredServer.name}
                    {hoveredServer.role === 'admin' && (
                        <span className="ml-1.5 text-[10px] text-blurple font-bold uppercase">Admin</span>
                    )}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0
                        border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent
                        border-r-[6px] border-r-discord-darkest" />
                </div>
            )}
        </>
    );
};

export default WorkspaceSwitcher;
