import { useMemo, useState } from 'react';
import { Phone, Video, Pin, UserPlus, Search, MoreVertical, Gift, Sticker, Smile, Send, UserX, Plus, Image as ImageIcon, X, Menu, Server } from 'lucide-react';
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
}) => {
    const headerTitle = activeDm?.displayName || 'Direct Messages';
    const username = activeDm?.username || '';
    const [showEmoji, setShowEmoji] = useState(false);

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
                <div />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6">
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
                        const isMe = m.senderId === activeDm?.selfId;
                        return (
                            <div key={m._id} className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-discord-darkest flex items-center justify-center text-xs font-semibold text-discord-light">
                                    {isMe ? (activeDm?.selfInitial || 'U') : (activeDm?.avatar
                                        ? <img src={activeDm.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                        : headerTitle.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">{isMe ? 'You' : headerTitle}</span>
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
                        placeholder={`Message @${headerTitle}`}
                        className="flex-1 bg-transparent text-sm text-discord-white placeholder:text-discord-faint/60 outline-none"
                    />
                    <div className="flex items-center gap-1.5 text-discord-faint">
                        <Gift className="w-4 h-4" />
                        <Sticker className="w-4 h-4" />
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
