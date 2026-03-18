import { useState } from 'react';
import { Plus, X, CalendarPlus, MapPin, AlignLeft, Type, Clock } from 'lucide-react';
import EventCard from './EventCard';
import { useEventStore } from '../stores/eventStore';

const EventsDash = () => {
    const { events, isLoading, createEvent } = useEventStore();
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', date: '', location: '' });

    const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.date || submitting) return;
        setSubmitting(true);
        try {
            await createEvent(form);
            setForm({ title: '', description: '', date: '', location: '' });
            setShowForm(false);
        } catch { /* handled in store */ }
        setSubmitting(false);
    };

    return (
        <div className="space-y-5">
            {/* Create Event toggle / form */}
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 border-dashed border-discord-border
                        text-sm font-bold text-discord-muted hover:border-blurple hover:text-discord-light hover:bg-blurple/[0.04]
                        transition-all duration-200 cursor-pointer group"
                >
                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" strokeWidth={2.5} />
                    Create Event
                </button>
            ) : (
                <form
                    onSubmit={handleCreate}
                    className="relative bg-discord-darker/80 rounded-xl p-5 sm:p-6 border border-discord-border/50 space-y-4 animate-scale-in"
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-discord-darkest/80 flex items-center justify-center hover:bg-discord-border transition-colors cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5 text-discord-muted" strokeWidth={2.5} />
                    </button>

                    <h3 className="text-sm font-bold text-discord-white flex items-center gap-2">
                        <CalendarPlus className="w-4 h-4 text-blurple" strokeWidth={2} />
                        New Event
                    </h3>

                    {/* Title */}
                    <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-discord-faint" strokeWidth={2} />
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Event title *"
                            required
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-discord-darkest text-sm text-discord-white font-medium
                                placeholder:text-discord-faint/50 outline-none border border-discord-darkest transition-all duration-200
                                focus:border-blurple focus:ring-2 focus:ring-blurple/30"
                        />
                    </div>

                    {/* Description */}
                    <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 w-3.5 h-3.5 text-discord-faint" strokeWidth={2} />
                        <textarea
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Description (optional)"
                            rows={3}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-discord-darkest text-sm text-discord-white font-medium
                                placeholder:text-discord-faint/50 outline-none border border-discord-darkest transition-all duration-200 resize-none
                                focus:border-blurple focus:ring-2 focus:ring-blurple/30"
                        />
                    </div>

                    {/* Date + Location row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-discord-faint pointer-events-none" strokeWidth={2} />
                            <input
                                type="datetime-local"
                                value={form.date}
                                onChange={(e) => updateField('date', e.target.value)}
                                required
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-discord-darkest text-sm text-discord-white font-medium
                                    outline-none border border-discord-darkest transition-all duration-200
                                    focus:border-blurple focus:ring-2 focus:ring-blurple/30
                                    [color-scheme:dark]"
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-discord-faint" strokeWidth={2} />
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => updateField('location', e.target.value)}
                                placeholder="Location or link"
                                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-discord-darkest text-sm text-discord-white font-medium
                                    placeholder:text-discord-faint/50 outline-none border border-discord-darkest transition-all duration-200
                                    focus:border-blurple focus:ring-2 focus:ring-blurple/30"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!form.title.trim() || !form.date || submitting}
                        className="w-full py-3 rounded-xl bg-blurple text-sm font-bold text-white
                            shadow-sm hover:bg-blurple-hover hover:shadow-md transition-all duration-200 disabled:opacity-40 cursor-pointer"
                    >
                        {submitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                Creating…
                            </div>
                        ) : (
                            'Create Event'
                        )}
                    </button>
                </form>
            )}

            {/* Events list */}
            {isLoading && events.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 rounded-full border-3 border-blurple border-t-transparent animate-spin" />
                </div>
            ) : events.length > 0 ? (
                events.map((event) => (
                    <EventCard key={event._id} event={event} />
                ))
            ) : (
                <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-full bg-discord-darkest flex items-center justify-center mx-auto mb-4">
                        <CalendarPlus className="w-6 h-6 text-discord-faint" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-semibold text-discord-white mb-1">No upcoming events</p>
                    <p className="text-xs text-discord-muted">Create the first event for the community!</p>
                </div>
            )}
        </div>
    );
};

export default EventsDash;
