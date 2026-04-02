import { Headphones, Mic, PhoneOff, Radio, ScreenShare, AudioLines } from 'lucide-react';

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(1, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const VoiceConnectedBar = ({
    channelName,
    elapsed,
    isMuted,
    isDeafened,
    isSharing,
    noiseReduction,
    hasRemoteStream,
    memberCount = 0,
    connectedCount = 0,
    onToggleViewer,
    onToggleMute,
    onToggleDeafen,
    onToggleNoiseReduction,
    onToggleShare,
    onLeave,
    displayName,
    avatar,
}) => {
    const totalMembers = Math.max(1, memberCount || 1);
    const others = Math.max(0, totalMembers - 1);
    let connectionLabel = 'Waiting for others…';
    if (others === 0) {
        connectionLabel = 'Only you here';
    } else if (connectedCount >= others) {
        connectionLabel = `Connected to ${others}`;
    } else {
        connectionLabel = `Connecting (${connectedCount}/${others})`;
    }

    return (
        <div className="mx-3 mb-2 rounded-xl bg-discord-darkest/90 border border-discord-border/60 px-3 py-3 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-discord-green/15 flex items-center justify-center text-discord-green">
                    <Radio className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-discord-green truncate">Voice Connected</p>
                    <p className="text-xs text-discord-faint truncate">{channelName}</p>
                    <p className="text-[11px] text-discord-faint mt-0.5">{connectionLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                    <AudioLines className="w-5 h-5 text-discord-faint" />
                    <button
                        onClick={onLeave}
                        className="w-9 h-9 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30"
                    >
                        <PhoneOff className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={onToggleMute}
                    className={`h-9 rounded-md flex items-center justify-center transition-colors ${
                        isMuted ? 'bg-red-500/20 text-red-400' : 'bg-discord-darkest text-discord-faint hover:bg-discord-border-light/40'
                    }`}
                >
                    <Mic className="w-4 h-4" />
                </button>
                {onToggleShare && (
                    <button
                        onClick={onToggleShare}
                        className={`h-9 rounded-md flex items-center justify-center transition-colors ${
                            isSharing ? 'bg-discord-green/20 text-discord-green' : 'bg-discord-darkest text-discord-faint hover:bg-discord-border-light/40'
                        }`}
                        title={isSharing ? 'Stop sharing' : 'Share screen'}
                    >
                        <ScreenShare className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={onToggleDeafen}
                    className={`h-9 rounded-md flex items-center justify-center transition-colors ${
                        isDeafened ? 'bg-yellow-400/20 text-yellow-300' : 'bg-discord-darkest text-discord-faint hover:bg-discord-border-light/40'
                    }`}
                >
                    <Headphones className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-discord-darkest/80 px-2.5 py-2">
                <div className="relative w-9 h-9 rounded-full bg-discord-darkest flex items-center justify-center text-xs font-semibold">
                    {avatar ? (
                        <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                        (displayName || 'U').charAt(0).toUpperCase()
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-darkest bg-discord-green" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-discord-white truncate">{displayName || 'User'}</p>
                    <p className="text-xs text-discord-faint">In voice · {formatDuration(elapsed)}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <Mic className={`w-4 h-4 ${isMuted ? 'text-red-400' : 'text-discord-faint'}`} />
                    <Headphones className={`w-4 h-4 ${isDeafened ? 'text-yellow-300' : 'text-discord-faint'}`} />
                </div>
            </div>
        </div>
    );
};

export default VoiceConnectedBar;
