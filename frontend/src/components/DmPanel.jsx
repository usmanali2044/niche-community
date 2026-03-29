import { useMemo, useState } from 'react';
import { Phone, Smile, Send, Plus, Image as ImageIcon, X, Menu, Server, Mic, ScreenShare, Video, VideoOff, UserPlus, LogOut } from 'lucide-react';
import VoiceVideoPlayer from './VoiceVideoPlayer';
import EmojiPicker from './EmojiPicker';

const formatTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
};


const DmPanel = ({
    activeDm,
    messages,
    typing,
    typingName,
    onSend,
    onTyping,
    value,
    onChange,
    files,
    onAddFiles,
    onRemoveFile,
    sending,
    onOpenSidebar,
    onOpenServers,
    onCall,
    onAddToGroup,
    onLeaveGroup,
    canAddToGroup = false,
    callDisabled,
    activeCall,
    selfProfile,
    onToggleMute,
    onToggleCamera,
    onToggleShare,
    onEndCall,
    isMuted,
    isSharing,
    isCameraOn,
    screenShareStream,
    screenShareStreams = [],
    localCameraStream,
    remoteCameraStream,
    remoteCameraStreams = [],
    participants = [],
    screenShareOwnerName,
    isRemoteScreenShare = false,
    onOpenStreamFullscreen,
}) => {
    const headerTitle = activeDm?.displayName || 'Direct Messages';
    const username = activeDm?.subtitle || activeDm?.username || '';
    const [showEmoji, setShowEmoji] = useState(false);
    const hasLocalCamera = !!localCameraStream;
    const hasRemoteCamera = !!remoteCameraStream;
    const cameraStreamMap = useMemo(() => {
        const map = new Map();
        remoteCameraStreams.forEach((item) => {
            if (item?.socketId) map.set(item.socketId, item.stream);
        });
        return map;
    }, [remoteCameraStreams]);
    const fallbackParticipants = useMemo(() => {
        const list = [];
        list.push({
            socketId: 'local',
            displayName: selfProfile?.displayName || 'You',
            avatar: selfProfile?.avatar || '',
            isLocal: true,
        });
        if (activeDm && !activeDm.isGroup) {
            list.push({
                socketId: activeDm._id || 'remote',
                displayName: activeDm.displayName || headerTitle,
                avatar: activeDm.avatar || '',
                isLocal: false,
            });
        }
        return list;
    }, [activeDm, headerTitle, selfProfile?.avatar, selfProfile?.displayName]);
    const participantTiles = useMemo(() => {
        const base = participants.length > 0 ? participants : fallbackParticipants;
        return base.map((p) => {
            const isLocal = !!p.isLocal;
            const stream = isLocal ? localCameraStream : cameraStreamMap.get(p.socketId);
            return {
                id: p.socketId || p.userId || p._id,
                isLocal,
                displayName: p.displayName || 'Member',
                avatar: p.avatar || '',
                stream,
            };
        });
    }, [participants, fallbackParticipants, localCameraStream, cameraStreamMap]);
    const shareTiles = useMemo(() => {
        if (Array.isArray(screenShareStreams) && screenShareStreams.length > 0) {
            return screenShareStreams;
        }
        if (screenShareStream) {
            return [{
                id: 'screen-share',
                stream: screenShareStream,
                ownerName: isRemoteScreenShare ? 'Screen Share' : 'Your Screen',
                isLocal: !isRemoteScreenShare,
            }];
        }
        return [];
    }, [screenShareStreams, screenShareStream, isRemoteScreenShare]);
    const participantGridClass = participantTiles.length <= 2
        ? 'grid-cols-2'
        : participantTiles.length === 3
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    const shareGridClass = shareTiles.length <= 1
        ? 'grid-cols-1'
        : shareTiles.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    const participantMap = useMemo(() => {
        const map = new Map();
        (activeDm?.participants || []).forEach((p) => {
            if (p?._id) map.set(p._id?.toString?.() || String(p._id), p);
        });
        return map;
    }, [activeDm?.participants]);

    const hasHistory = messages.length > 0;

    const intro = useMemo(() => ({
        title: headerTitle,
        subtitle: username,
        text: `This is the beginning of your direct message history with ${headerTitle}.`,
    }), [headerTitle, username]);

    const handleEmoji = (emoji) => {
        onChange?.(`${value || ''}${emoji}`);
        setShowEmoji(false);
        onTyping?.();
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            {!activeCall && (
                <div className="h-12 border-b border-discord-darkest/80 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-discord-light">
                        <button
                            onClick={() => onOpenServers?.()}
                            className="md:hidden w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white"
                            title="Open servers"
                        >
                            <Server className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onOpenSidebar?.()}
                            className="md:hidden w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white"
                            title="Open direct messages"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <div className="w-6 h-6 rounded-full bg-discord-darkest flex items-center justify-center text-xs font-bold">
                            {activeDm?.avatar ? (
                                <img src={activeDm.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                headerTitle.charAt(0).toUpperCase()
                            )}
                        </div>
                        <span>{headerTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {canAddToGroup && (
                            <button
                                onClick={() => onAddToGroup?.()}
                                className="w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white"
                                title="Add friends to group"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        )}
                        {activeDm?.isGroup && (
                            <button
                                onClick={() => onLeaveGroup?.()}
                                className="w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white"
                                title="Leave group"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onCall?.()}
                            disabled={callDisabled}
                            className="w-8 h-8 rounded-md bg-discord-darkest/70 flex items-center justify-center text-discord-faint hover:text-white disabled:opacity-50"
                            title="Call"
                        >
                            <Phone className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6">
                {activeCall && (
                    <div className="dm-call rounded-2xl border border-discord-border/60 p-6 mb-8">
                        <div className="dm-call__orbs" aria-hidden="true">
                            <span className="dm-call__orb dm-call__orb--one" />
                            <span className="dm-call__orb dm-call__orb--two" />
                            <span className="dm-call__spark dm-call__spark--one" />
                            <span className="dm-call__spark dm-call__spark--two" />
                        </div>
                        {shareTiles.length > 0 && (
                            <div className={`grid gap-3 ${shareGridClass} mb-4`}>
                                {shareTiles.map((share) => (
                                    <button
                                        key={share.id}
                                        type="button"
                                        onClick={() => onOpenStreamFullscreen?.(share.stream)}
                                        className="dm-call__tile dm-call__tile--screen relative rounded-xl border border-discord-border/60 h-[230px] md:h-[260px] overflow-hidden focus:outline-none focus:ring-2 focus:ring-blurple/70"
                                        title="Open screen share"
                                    >
                                        <VoiceVideoPlayer stream={share.stream} muted className="w-full h-full object-cover" />
                                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-500 text-[10px] font-semibold text-white">
                                            LIVE
                                        </span>
                                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-[10px] font-semibold text-white">
                                            {share.ownerName || 'Screen Share'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className={`dm-call__tiles grid gap-3 ${participantGridClass}`}>
                            {participantTiles.map((tile) => (
                                <button
                                    key={tile.id}
                                    type="button"
                                    disabled={!tile.stream}
                                    onClick={() => tile.stream && onOpenStreamFullscreen?.(tile.stream)}
                                    className={`dm-call__tile rounded-xl border h-[190px] flex items-center justify-center overflow-hidden focus:outline-none
                                        ${tile.isLocal ? 'border-emerald-400/40 focus:ring-2 focus:ring-emerald-300/60' : 'border-discord-border/60 focus:ring-2 focus:ring-blurple/70'}`}
                                    title={tile.stream ? `Open ${tile.isLocal ? 'your' : tile.displayName}'s camera` : tile.displayName}
                                >
                                    {tile.stream ? (
                                        <VoiceVideoPlayer stream={tile.stream} muted={tile.isLocal} className="w-full h-full object-cover" />
                                    ) : tile.avatar ? (
                                        <img src={tile.avatar} alt="" className="dm-call__avatar w-20 h-20 rounded-full object-cover" />
                                    ) : (
                                        <div className="dm-call__avatar w-20 h-20 rounded-full bg-discord-darkest flex items-center justify-center text-2xl font-bold text-white">
                                            {tile.displayName?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="dm-call__controls mt-4 flex items-center justify-center gap-3">
                            <button
                                onClick={onToggleMute}
                                className={`dm-call__btn w-11 h-11 rounded-full flex items-center justify-center ${isMuted ? 'bg-amber-500/20 text-amber-200' : 'bg-discord-darkest text-discord-light'}`}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onToggleCamera}
                                className={`dm-call__btn w-11 h-11 rounded-full flex items-center justify-center ${isCameraOn ? 'bg-sky-500/20 text-sky-200' : 'bg-discord-darkest text-discord-light'}`}
                                title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                            >
                                {isCameraOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={onToggleShare}
                                className={`dm-call__btn w-11 h-11 rounded-full flex items-center justify-center ${isSharing ? 'bg-emerald-500/20 text-emerald-200' : 'bg-discord-darkest text-discord-light'}`}
                                title={isSharing ? 'Stop streaming' : 'Share screen'}
                            >
                                <ScreenShare className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onEndCall}
                                className="dm-call__btn dm-call__end w-11 h-11 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500"
                                title="End call"
                            >
                                <Phone className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
                {!hasHistory && (
                    <div className="max-w-2xl">
                        <div className="w-16 h-16 rounded-full bg-discord-darkest flex items-center justify-center text-2xl text-discord-faint mb-4">
                            {activeDm?.avatar ? (
                                <img src={activeDm.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                headerTitle.charAt(0).toUpperCase()
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-white">{intro.title}</h2>
                        <p className="text-sm text-discord-faint mt-1">{intro.subtitle}</p>
                        <p className="text-sm text-discord-muted mt-3">{intro.text}</p>
                        <div className="mt-4 text-xs text-discord-faint">
                            No servers in common
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {messages.map((m) => {
                        const senderKey = m.senderId?.toString?.() || String(m.senderId);
                        const isMe = senderKey === (activeDm?.selfId?.toString?.() || String(activeDm?.selfId));
                        const sender = participantMap.get(senderKey);
                        const senderName = isMe ? 'You' : (sender?.displayName || headerTitle);
                        const senderAvatar = isMe
                            ? (selfProfile?.avatar || '')
                            : (sender?.avatar || activeDm?.avatar || '');
                        return (
                            <div key={m._id} className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-discord-darkest flex items-center justify-center text-xs font-semibold text-discord-light">
                                    {isMe ? (
                                        senderAvatar
                                            ? <img src={senderAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                            : (activeDm?.selfInitial || 'U')
                                    ) : (
                                        senderAvatar
                                            ? <img src={senderAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                            : (senderName || headerTitle).charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">{senderName}</span>
                                        <span className="text-[11px] text-discord-faint">{formatTime(m.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-discord-light">{m.content}</p>
                                    {m.mediaURLs?.length > 0 && (
                                        <div className="mt-2 grid grid-cols-2 gap-2 max-w-md">
                                            {m.mediaURLs.map((url) => (
                                                <div key={url} className="rounded-lg border border-discord-border/40 overflow-hidden bg-discord-darkest">
                                                    {url.match(/\.(png|jpe?g|gif|webp|bmp)$/i) || url.includes('image/upload') ? (
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <a href={url} className="block p-3 text-xs text-blurple hover:underline" target="_blank" rel="noreferrer">
                                                            Download file
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {typing && (
                        <div className="text-xs text-discord-faint">{typingName ? `${typingName} is typing…` : 'Typing…'}</div>
                    )}
                </div>
            </div>

            <div className="px-4 pb-4">
                {files?.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {files.map((f) => (
                            <div key={f.id} className="relative w-20 h-20 rounded-lg border border-discord-border/40 bg-discord-darkest overflow-hidden">
                                {f.preview ? (
                                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-xs text-discord-faint">
                                        <ImageIcon className="w-4 h-4 mb-1" />
                                        <span className="px-2 text-center truncate">{f.file.name}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => onRemoveFile?.(f.id)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-discord-darkest/80 flex items-center justify-center hover:bg-discord-border/60"
                                >
                                    <X className="w-3 h-3 text-discord-light" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative flex items-center gap-2 bg-discord-darkest/80 border border-discord-border/40 rounded-xl px-3 py-2">
                    <label className="w-8 h-8 rounded-md hover:bg-discord-border-light/20 flex items-center justify-center cursor-pointer">
                        <Plus className="w-4 h-4 text-discord-faint" />
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                onAddFiles?.(e.target.files);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    <input
                        value={value}
                        onChange={(e) => { onChange(e.target.value); onTyping?.(); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                if (e.nativeEvent?.isComposing) return;
                                e.preventDefault();
                                onSend?.();
                            }
                        }}
                        placeholder={`Message @${headerTitle}`}
                        className="flex-1 bg-transparent text-sm text-discord-white placeholder:text-discord-faint/60 outline-none"
                    />
                    <div className="flex items-center gap-1.5 text-discord-faint">
                        <button
                            onClick={() => setShowEmoji((s) => !s)}
                            className="w-8 h-8 rounded-md hover:bg-discord-border-light/20 flex items-center justify-center cursor-pointer"
                        >
                            <Smile className="w-4 h-4" />
                        </button>
                        <Send
                            className={`w-4 h-4 cursor-pointer ${sending ? 'opacity-50' : ''}`}
                            onClick={() => onSend?.()}
                        />
                    </div>

                    {showEmoji && (
                        <EmojiPicker
                            onSelect={handleEmoji}
                            onClose={() => setShowEmoji(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DmPanel;
