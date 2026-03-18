import { useState, useRef, useEffect, useCallback } from 'react';
import { AtSign } from 'lucide-react';
import { useFeedStore } from '../stores/feedStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

/**
 * MentionInput — a textarea (or single-line input) that shows a dropdown
 * when the user types `@`, searches community members, and inserts @Name.
 *
 * Props:
 *  - value: string
 *  - onChange: (value, mentions) => void   — receives both text and mentions array
 *  - placeholder: string
 *  - rows: number (default 3)
 *  - singleLine: boolean (default false) — if true renders an <input> instead
 *  - className: string
 *  - mentions: array of { _id, name } already selected
 */
const MentionInput = ({
    value,
    onChange,
    placeholder = '',
    rows = 3,
    singleLine = false,
    className = '',
    mentions = [],
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [cursorPos, setCursorPos] = useState(null);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);

    const { searchMembers } = useFeedStore();
    const { activeCommunityId } = useWorkspaceStore();

    // Detect @ trigger
    const handleInput = useCallback((e) => {
        const val = e.target.value;
        const curPos = e.target.selectionStart;

        // Look backwards from cursor to find an unmatched @
        const textBefore = val.slice(0, curPos);
        const atIndex = textBefore.lastIndexOf('@');

        if (atIndex >= 0) {
            // Make sure the @ isn't preceded by a non-whitespace char (unless it's at position 0)
            const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : ' ';
            if (charBefore === ' ' || charBefore === '\n' || atIndex === 0) {
                const q = textBefore.slice(atIndex + 1);
                // Only show dropdown if there's no space in the query (still typing the name)
                if (!q.includes(' ') && q.length <= 30) {
                    setQuery(q);
                    setCursorPos(curPos);
                    setShowDropdown(true);
                    setSelectedIndex(0);
                    onChange(val, mentions);
                    return;
                }
            }
        }

        setShowDropdown(false);
        setQuery('');
        onChange(val, mentions);
    }, [mentions, onChange]);

    // Debounced search
    useEffect(() => {
        if (!showDropdown || !activeCommunityId) return;
        if (!query) { setResults([]); return; }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            const members = await searchMembers(activeCommunityId, query);
            setResults(members);
            setSearching(false);
        }, 200);

        return () => clearTimeout(debounceRef.current);
    }, [query, showDropdown, activeCommunityId, searchMembers]);

    // Select a member from dropdown
    const selectMember = useCallback((member) => {
        const textBefore = value.slice(0, cursorPos);
        const atIndex = textBefore.lastIndexOf('@');
        const before = value.slice(0, atIndex);
        const after = value.slice(cursorPos);
        const newValue = `${before}@${member.name} ${after}`;

        // Add to mentions if not already included
        const newMentions = mentions.some((m) => m._id === member._id)
            ? mentions
            : [...mentions, { _id: member._id, name: member.name }];

        setShowDropdown(false);
        setQuery('');
        onChange(newValue, newMentions);

        // Re-focus the input
        setTimeout(() => {
            if (inputRef.current) {
                const newPos = atIndex + member.name.length + 2; // @Name + space
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    }, [value, cursorPos, mentions, onChange]);

    // Keyboard navigation in dropdown
    const handleKeyDown = useCallback((e) => {
        if (!showDropdown || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => (i + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => (i - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && showDropdown) {
            e.preventDefault();
            selectMember(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    }, [showDropdown, results, selectedIndex, selectMember]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    const inputProps = {
        ref: inputRef,
        value,
        onChange: handleInput,
        onKeyDown: handleKeyDown,
        placeholder,
        className: `w-full rounded-lg bg-discord-darkest text-sm text-discord-white font-medium placeholder:text-discord-faint/50 outline-none resize-none border border-discord-darkest transition-all duration-200 focus:border-blurple focus:ring-2 focus:ring-blurple/30 px-4 py-3 ${className}`,
    };

    return (
        <div className="relative">
            {singleLine ? (
                <input type="text" {...inputProps} />
            ) : (
                <textarea {...inputProps} rows={rows} />
            )}

            {/* Mention dropdown */}
            {showDropdown && (query.length > 0) && (
                <div ref={dropdownRef}
                    className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-discord-darkest rounded-xl shadow-2xl border border-discord-border z-50 animate-slide-down">
                    {searching ? (
                        <div className="flex items-center justify-center py-3">
                            <div className="w-4 h-4 rounded-full border-2 border-blurple border-t-transparent animate-spin" />
                        </div>
                    ) : results.length > 0 ? (
                        results.map((member, i) => {
                            const initials = member.name
                                ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                            return (
                                <button key={member._id} type="button"
                                    onClick={() => selectMember(member)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer
                                        ${i === selectedIndex ? 'bg-blurple/15' : 'hover:bg-discord-border-light/10'}`}>
                                    {member.avatar ? (
                                        <img src={member.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-discord-border" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blurple to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                                            {initials}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <AtSign className="w-3 h-3 text-blurple" strokeWidth={2} />
                                        <span className="text-xs font-semibold text-discord-white">{member.name}</span>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="px-3 py-3 text-center">
                            <p className="text-xs text-discord-faint">No members found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MentionInput;
