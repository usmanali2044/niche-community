import { useState } from 'react';
import { Copy, Sparkles } from 'lucide-react';

const presenceColor = (presence) => {
    if (presence === 'dnd') return 'bg-red-500';
    if (presence === 'idle') return 'bg-yellow-400';
    if (presence === 'offline') return 'bg-discord-faint/60';
    return 'bg-discord-green';
};

const MemberProfilePopout = ({ isOpen, onClose, member, anchorClassName = '' }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !member) return null;

    const displayName = member.displayName || 'Member';
    const username = member.username || 'user';
    const rawStatus = member.bio || member.statusText || '';
    const cleanedStatus = rawStatus.trim().toLowerCase() === 'eat sleep code repeat' ? '' : rawStatus;
    const statusText = cleanedStatus || 'No bio yet';
    const presence = member.presence || 'offline';
    const bannerColor = member.bannerColor || '#3f4f4f';
    const isPremium = ['premium', 'enterprise'].includes(member.tier || 'free');

    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(member._id || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // no-op
        }
    };

    return (
        <div className="fixed inset-0 z-[70]" onClick={onClose}>
            <div
                className={`absolute left-1/2 -translate-x-1/2 w-[92vw] max-w-[320px] md:w-[320px] md:left-auto md:translate-x-0 rounded-2xl bg-discord-darker border border-discord-border shadow-2xl overflow-hidden animate-scale-in ${anchorClassName}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-24 relative" style={{ backgroundColor: bannerColor }}>
                    <div className="absolute -bottom-10 left-5">
                        {member.avatar ? (
                            <img
                                src={member.avatar}
                                alt=""
                                className="w-20 h-20 rounded-full object-cover border-4 border-discord-darker shadow-lg"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-discord-darkest flex items-center justify-center text-xl font-bold border-4 border-discord-darker shadow-lg">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-4 border-discord-darker ${presenceColor(presence)}`} />
                    </div>
                </div>

                <div className="pt-12 px-5 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-lg font-semibold text-discord-white">{displayName}</p>
                            <div className="flex items-center gap-2 text-sm text-discord-faint">
                                <span>{username}</span>
                                <button
                                    onClick={handleCopyId}
                                    className="flex items-center gap-1 text-xs text-discord-faint hover:text-white"
                                >
                                    <Copy className="w-3 h-3" />
                                    {copied ? 'Copied' : 'Copy ID'}
                                </button>
                            </div>
                            {isPremium && (
                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/25 text-[11px] font-semibold text-amber-200">
                                    <Sparkles className="w-3 h-3" />
                                    Premium
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-discord-darkest text-sm text-discord-light">
                        <span className={`w-2.5 h-2.5 rounded-full ${presenceColor(presence)}`} />
                        {statusText}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberProfilePopout;
