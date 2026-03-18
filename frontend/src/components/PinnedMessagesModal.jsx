import { X, Pin } from 'lucide-react';

const PinnedMessagesModal = ({ isOpen, onClose, messages = [], resolveSender, isLoading = false }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="w-[560px] max-w-[92vw] max-h-[80vh] overflow-y-auto rounded-2xl bg-[#2b2d31] border border-discord-border/60 shadow-2xl p-6 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Pin className="w-4 h-4 text-discord-faint" />
                        Pinned Messages
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer">
                        <X className="w-4 h-4 text-discord-faint" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-sm text-discord-faint">Loading pinned messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-sm text-discord-faint">No pinned messages yet.</div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((m) => {
                            const sender = resolveSender?.(m.senderId) || {};
                            return (
                                <div key={m._id} className="rounded-xl border border-discord-border/50 bg-discord-darkest/70 p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-discord-border/40 overflow-hidden flex items-center justify-center text-xs font-semibold text-discord-light">
                                            {sender.avatar ? (
                                                <img src={sender.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                (sender.displayName || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-discord-light">{sender.displayName || 'Member'}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-discord-white">{m.content || 'Attachment'}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PinnedMessagesModal;
