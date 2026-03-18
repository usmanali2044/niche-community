import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, Users } from 'lucide-react';

const formatEndsAt = (event) => {
    const end = event?.endDate || event?.endedAt;
    if (!end) return '';
    const d = new Date(end);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const EventDetailsModal = ({ isOpen, event, onClose, onEnd, canEnd, rosterMembers = [], communityName = '' }) => {
    const [tab, setTab] = useState('info');

    const interestedUsers = useMemo(() => {
        const rosterMap = new Map((rosterMembers || []).map((m) => [m._id, m]));
        return (event?.rsvpList || []).map((id) => {
            const member = rosterMap.get(id);
            return {
                id,
                name: member?.displayName || member?.name || 'Member',
                avatar: member?.avatar || '',
            };
        });
    }, [event?.rsvpList, rosterMembers]);

    if (!isOpen || !event) return null;

    const endsAt = formatEndsAt(event);
    const statusLabel = event.status === 'live'
        ? `Happening Now${endsAt ? ` — Ends ${endsAt}` : ''}`
        : 'Scheduled';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="w-[720px] max-w-[94vw] rounded-2xl bg-[#2b2d31] border border-discord-border/60 shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-discord-border/40">
                    <h2 className="text-xl font-semibold text-discord-white">{event.title}</h2>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer">
                        <X className="w-4 h-4 text-discord-faint" />
                    </button>
                </div>

                <div className="px-6 pt-4">
                    <div className="flex items-center gap-4 border-b border-discord-border/40">
                        <button
                            onClick={() => setTab('info')}
                            className={`pb-3 text-sm font-semibold ${tab === 'info' ? 'text-discord-white border-b-2 border-white' : 'text-discord-faint'}`}
                        >
                            Event Info
                        </button>
                        <button
                            onClick={() => setTab('interested')}
                            className={`pb-3 text-sm font-semibold ${tab === 'interested' ? 'text-discord-white border-b-2 border-white' : 'text-discord-faint'}`}
                        >
                            {interestedUsers.length} Interested
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6">
                    {tab === 'info' ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-discord-green">
                                <span className="w-2.5 h-2.5 rounded-full bg-discord-green" />
                                <span className="font-semibold">{statusLabel}</span>
                            </div>

                            {communityName && (
                                <div className="text-sm text-discord-faint">
                                    {communityName}
                                </div>
                            )}

                            {event.description && (
                                <p className="text-sm text-discord-light">{event.description}</p>
                            )}

                            <div className="flex items-center gap-2 text-sm text-discord-faint">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location || 'Somewhere else'}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-discord-faint">
                                <Users className="w-4 h-4" />
                                <span>{interestedUsers.length} person{interestedUsers.length === 1 ? '' : 's'} interested</span>
                            </div>

                            <div className="text-sm text-discord-faint">
                                Created by {event.creator?.name || 'Unknown'}
                            </div>

                            {canEnd && event.status === 'live' && (
                                <div className="pt-2 flex items-center justify-end">
                                    <button
                                        onClick={onEnd}
                                        className="px-4 py-2 rounded-lg bg-discord-border/30 text-sm font-semibold text-discord-white hover:bg-discord-border/50"
                                    >
                                        End Event
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {interestedUsers.length === 0 && (
                                <div className="text-sm text-discord-faint">No interested members yet.</div>
                            )}
                            {interestedUsers.map((member) => (
                                <div key={member.id} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-discord-darkest flex items-center justify-center overflow-hidden">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-discord-light">{(member.name || 'M').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-discord-light">{member.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EventDetailsModal;
