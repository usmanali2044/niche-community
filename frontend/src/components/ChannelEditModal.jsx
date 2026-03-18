import { useEffect, useMemo, useState } from 'react';
import { Hash, X } from 'lucide-react';

const ChannelEditModal = ({ isOpen, onClose, channelName, onSave, onDelete, isSaving, isDeleting, error }) => {
    const [name, setName] = useState(channelName || '');

    useEffect(() => {
        if (!isOpen) return;
        setName(channelName || '');
    }, [isOpen, channelName]);

    const normalized = useMemo(() => name.trim(), [name]);
    const canSave = normalized.length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="absolute inset-[8vh] rounded-2xl bg-[#2f3136] shadow-2xl border border-discord-border/60 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-full w-full grid grid-cols-[260px_1fr]">
                    <aside className="h-full bg-[#2b2d31] border-r border-discord-border/50 px-4 py-5 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-discord-faint">
                            <Hash className="w-3.5 h-3.5" />
                            Channel Settings
                        </div>
                        <button className="w-full text-left px-3 py-2 rounded-lg text-sm bg-discord-darkest text-white">
                            Overview
                        </button>
                    </aside>

                    <main className="h-full overflow-y-auto">
                        <div className="sticky top-0 z-10 bg-[#2f3136]/90 backdrop-blur border-b border-discord-border/60 px-8 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-lg font-semibold text-white">Overview</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full bg-discord-darkest/60 border border-discord-border/60 text-discord-faint hover:text-white"
                            >
                                <X className="w-4 h-4 mx-auto" />
                            </button>
                        </div>

                        <div className="px-8 py-8 max-w-2xl">
                            <label className="text-sm font-semibold text-discord-light">Channel Name</label>
                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-discord-darkest border border-discord-border/60 px-3 py-2">
                                <Hash className="w-4 h-4 text-discord-faint" />
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-discord-white placeholder:text-discord-faint/60 outline-none"
                                    placeholder="channel-name"
                                />
                            </div>
                            {error && <p className="mt-3 text-xs font-semibold text-discord-red">{error}</p>}

                            <div className="mt-6 flex items-center gap-3">
                                <button
                                    onClick={() => onSave?.(normalized)}
                                    disabled={!canSave || isSaving}
                                    className="px-4 py-2 rounded-lg bg-blurple text-white text-sm font-semibold hover:bg-blurple/90 disabled:opacity-60"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg bg-discord-darkest text-discord-light text-sm font-semibold hover:bg-discord-border-light/40"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                                <p className="text-sm font-semibold text-red-300">Delete Channel</p>
                                <p className="text-xs text-red-200/70 mt-1">
                                    This action removes the channel and its messages. Posts tied to this channel will remain in the feed.
                                </p>
                                <button
                                    onClick={onDelete}
                                    disabled={isDeleting}
                                    className="mt-3 px-4 py-2 rounded-lg bg-red-500/80 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Channel'}
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ChannelEditModal;
