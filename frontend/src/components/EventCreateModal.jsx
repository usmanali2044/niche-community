import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Calendar, Clock, Upload } from 'lucide-react';
import { useEventStore } from '../stores/eventStore';
import { useFeedStore } from '../stores/feedStore';

const steps = ['Location', 'Event Info', 'Review'];

const toDateTime = (date, time) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}`);
};

const formatPreview = (date, time) => {
    if (!date || !time) return '';
    const d = toDateTime(date, time);
    if (!d || Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const EventCreateModal = ({ isOpen, onClose, initialEvent }) => {
    const { createEvent, updateEvent, isLoading } = useEventStore();
    const { uploadFile } = useFeedStore();
    const [step, setStep] = useState(0);
    const [location, setLocation] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const isValidRange = useMemo(() => {
        const start = toDateTime(startDate, startTime);
        const end = toDateTime(endDate, endTime);
        if (!start || !end) return false;
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        return end.getTime() > start.getTime();
    }, [startDate, startTime, endDate, endTime]);

    const canNext = useMemo(() => {
        if (step === 0) return !!location.trim();
        if (step === 1) return !!title.trim() && !!startDate && !!startTime && !!endDate && !!endTime && isValidRange;
        return true;
    }, [step, location, title, startDate, startTime, endDate, endTime, isValidRange]);

    const handleCreate = async () => {
        setError('');
        try {
            const start = toDateTime(startDate, startTime);
            const end = toDateTime(endDate, endTime);
            if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                setError('Start and end time are required');
                return;
            }
            if (end.getTime() <= start.getTime()) {
                setError('End time must be after start time');
                return;
            }
            let res;
            if (initialEvent?._id) {
                res = await updateEvent(initialEvent._id, {
                    title,
                    description,
                    location,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    coverImage,
                });
                if (res?.event) {
                    useEventStore.getState().handleUpdateEvent(res.event);
                }
            } else {
                res = await createEvent({
                    title,
                    description,
                    location,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    coverImage,
                    locationType: 'somewhere_else',
                });
                if (res?.event) {
                    useEventStore.getState().handleNewEvent(res.event);
                }
            }
            onClose?.();
            setStep(0);
            setLocation('');
            setTitle('');
            setDescription('');
            setStartDate('');
            setStartTime('');
            setEndDate('');
            setEndTime('');
            setCoverImage('');
        } catch (err) {
            setError(err.message || 'Failed to create event');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-[94vw] max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-[#2b2d31] border border-discord-border/60 shadow-2xl p-5 sm:p-6 animate-scale-in">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-3 text-xs font-semibold uppercase tracking-[0.14em] w-full">
                        {steps.map((s, idx) => (
                            <div key={s} className={`flex items-center gap-3 ${idx === step ? 'text-blurple' : 'text-discord-faint'}`}>
                                <span className={`flex-1 h-1 rounded-full ${idx <= step ? 'bg-blurple' : 'bg-discord-border/40'}`} />
                                <span className="whitespace-nowrap">{s}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center hover:bg-discord-border-light/40 cursor-pointer">
                        <X className="w-4 h-4 text-discord-faint" />
                    </button>
                </div>

                {step === 0 && (
                    <div className="mt-6 space-y-4">
                        <h2 className="text-2xl font-bold text-white">Where is your event?</h2>
                        <p className="text-sm text-discord-muted">So no one gets lost on where to go.</p>

                        <div className="mt-5 flex items-center gap-3 rounded-xl border border-blurple/40 bg-discord-darkest/80 px-4 py-3">
                            <div className="w-5 h-5 rounded-full border-2 border-blurple flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-blurple" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-white">Somewhere Else</div>
                                <div className="text-xs text-discord-faint">Text channel, external link, or in-person location.</div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-discord-light">Enter a location <span className="text-discord-red">*</span></label>
                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-discord-border/60 bg-discord-darkest px-3 py-2">
                                <MapPin className="w-4 h-4 text-discord-faint" />
                                <input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Add a location, link, or something."
                                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-discord-faint/60"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="mt-6 space-y-4">
                        <h2 className="text-2xl font-bold text-white">What&apos;s your event about?</h2>
                        <p className="text-sm text-discord-muted">Fill out the details of your event.</p>

                        <div>
                            <label className="text-sm font-semibold text-discord-light">Event Topic <span className="text-discord-red">*</span></label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What's your event?"
                                className="mt-2 w-full rounded-lg bg-discord-darkest border border-discord-border/60 px-3 py-2 text-sm text-white outline-none placeholder:text-discord-faint/60"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-discord-light">Start Date <span className="text-discord-red">*</span></label>
                                <div className="mt-2 flex items-center gap-2 rounded-lg border border-discord-border/60 bg-discord-darkest px-3 py-2">
                                    <Calendar className="w-4 h-4 text-discord-faint" />
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-discord-light">Start Time <span className="text-discord-red">*</span></label>
                                <div className="mt-2 flex items-center gap-2 rounded-lg border border-discord-border/60 bg-discord-darkest px-3 py-2">
                                    <Clock className="w-4 h-4 text-discord-faint" />
                                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-discord-light">End Date <span className="text-discord-red">*</span></label>
                                <div className="mt-2 flex items-center gap-2 rounded-lg border border-discord-border/60 bg-discord-darkest px-3 py-2">
                                    <Calendar className="w-4 h-4 text-discord-faint" />
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-discord-light">End Time <span className="text-discord-red">*</span></label>
                                <div className="mt-2 flex items-center gap-2 rounded-lg border border-discord-border/60 bg-discord-darkest px-3 py-2">
                                    <Clock className="w-4 h-4 text-discord-faint" />
                                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-discord-light">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell people a little more about your event."
                                rows={4}
                                className="mt-2 w-full rounded-lg bg-discord-darkest border border-discord-border/60 px-3 py-2 text-sm text-white outline-none placeholder:text-discord-faint/60 resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-discord-light">Cover Image</label>
                            <div className="mt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('event-cover-upload')?.click()}
                                    className="px-4 py-2 rounded-lg bg-blurple text-sm font-semibold text-white hover:bg-blurple-hover cursor-pointer"
                                >
                                    Upload Cover Image
                                </button>
                                <input
                                    id="event-cover-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploading(true);
                                        try {
                                            const url = await uploadFile(file);
                                            setCoverImage(url);
                                        } finally {
                                            setUploading(false);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                {uploading && <span className="text-xs text-discord-faint">Uploading…</span>}
                                {coverImage && (
                                    <div className="flex items-center gap-2 text-xs text-discord-faint">
                                        <Upload className="w-3.5 h-3.5" />
                                        Image attached
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="mt-6 space-y-4">
                        <div className="rounded-xl border border-discord-border/60 bg-discord-darkest/80 overflow-hidden">
                            {coverImage && (
                                <div className="h-36 w-full">
                                    <img src={coverImage} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-4 space-y-2">
                                <div className="text-xs text-discord-faint">
                                    {formatPreview(startDate, startTime)}
                                </div>
                                <h3 className="text-xl font-semibold text-white">{title || 'Event'}</h3>
                                <div className="flex items-center gap-2 text-xs text-discord-faint">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{location}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="text-xl font-bold text-white">Here&apos;s a preview of your event.</h4>
                            <p className="text-sm text-discord-muted mt-2">This event will auto start when it&apos;s time.</p>
                        </div>
                    </div>
                )}

                {error && <div className="mt-4 text-sm text-discord-red">{error}</div>}

                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                        className={`text-sm font-semibold ${step === 0 ? 'text-discord-faint cursor-not-allowed' : 'text-discord-light hover:text-white cursor-pointer'}`}
                        disabled={step === 0}
                    >
                        Back
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-discord-darkest text-sm font-semibold text-discord-light hover:bg-discord-border-light/40 cursor-pointer w-full sm:w-auto">
                            Cancel
                        </button>
                        {step < 2 ? (
                            <button
                                onClick={() => setStep((s) => Math.min(2, s + 1))}
                                disabled={!canNext}
                                className="px-5 py-2 rounded-lg bg-blurple text-sm font-semibold text-white hover:bg-blurple-hover disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleCreate}
                                disabled={isLoading}
                                className="px-5 py-2 rounded-lg bg-blurple text-sm font-semibold text-white hover:bg-blurple-hover disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                            >
                                {initialEvent?._id ? 'Save Changes' : 'Create Event'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EventCreateModal;
