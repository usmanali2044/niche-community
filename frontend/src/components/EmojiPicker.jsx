import { X } from 'lucide-react';

const EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😂', '🤣', '😊',
    '😉', '😍', '😘', '😎', '🤩', '🥳', '😇', '🙂',
    '🙃', '😅', '😴', '🤔', '😭', '😡', '🤯', '😱',
    '👍', '👎', '👏', '🙏', '🔥', '💯', '✨', '🎉',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
];

const EmojiPicker = ({ onSelect, onClose }) => (
    <div className="absolute right-2 bottom-12 w-56 rounded-xl bg-discord-darkest border border-discord-border/60 shadow-xl p-3 z-40 animate-scale-in">
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-discord-faint">Emojis</span>
            <button
                onClick={onClose}
                className="w-6 h-6 rounded-md hover:bg-discord-border/50 flex items-center justify-center"
            >
                <X className="w-3.5 h-3.5 text-discord-faint" />
            </button>
        </div>
        <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => onSelect?.(emoji)}
                    className="w-6 h-6 rounded-md hover:bg-discord-border/40 text-base"
                >
                    {emoji}
                </button>
            ))}
        </div>
    </div>
);

export default EmojiPicker;
