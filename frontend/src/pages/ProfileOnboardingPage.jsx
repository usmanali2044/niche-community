import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Sparkles, User, FileText, Tags, ArrowRight, ArrowLeft, Check, Camera } from 'lucide-react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useProfileStore } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import { useFeedStore } from '../stores/feedStore';

const STEPS = [
    { id: 1, title: 'Basic Info', icon: User },
    { id: 2, title: 'Bio', icon: FileText },
    { id: 3, title: 'Skills & Interests', icon: Tags },
];

const SKILL_SUGGESTIONS = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
    'Go', 'Rust', 'Design', 'DevOps', 'Data Science',
    'Machine Learning', 'Mobile Dev', 'Cloud', 'Security',
];

const INTEREST_SUGGESTIONS = [
    'Open Source', 'Startups', 'AI/ML', 'Web3', 'Gaming',
    'Music', 'Photography', 'Writing', 'Fitness', 'Travel',
    'Investing', 'Film', 'Cooking', 'Podcasts',
];

const ProfileOnboardingPage = () => {
    const [step, setStep] = useState(1);
    const [mounted, setMounted] = useState(false);
    const [avatar, setAvatar] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [errors, setErrors] = useState({});
    const [completing, setCompleting] = useState(false);
    const navigate = useNavigate();

    const { updateProfile, isLoading, error, clearError } = useProfileStore();
    const { user } = useAuthStore();
    const { uploadFile } = useFeedStore();

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (user?.name) setDisplayName(user.name);
    }, [user]);

    // ── Avatar Dropzone ──────────────────────────────────────────────────────
    const onAvatarDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        setAvatarUploading(true);
        try {
            const url = await uploadFile(acceptedFiles[0]);
            setAvatar(url);
        } catch (err) {
            setErrors((p) => ({ ...p, avatar: 'Upload failed. Try again.' }));
        }
        setAvatarUploading(false);
    }, [uploadFile]);

    const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps, isDragActive: isAvatarDragActive } = useDropzone({
        onDrop: onAvatarDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
        maxSize: 10 * 1024 * 1024,
        maxFiles: 1,
        multiple: false,
    });

    const toggleTag = (tag, list, setter) => {
        setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
    };

    const validateStep = () => {
        const errs = {};
        if (step === 1 && !displayName.trim()) errs.displayName = 'Display name is required';
        if (step === 2 && !bio.trim()) errs.bio = 'Tell us a bit about yourself';
        if (step === 3 && selectedSkills.length === 0 && selectedInterests.length === 0) {
            errs.tags = 'Select at least one skill or interest';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        setErrors({});
        setStep((s) => Math.min(s + 1, 3));
    };

    const handleBack = () => {
        setErrors({});
        setStep((s) => Math.max(s - 1, 1));
    };

    const handleComplete = async () => {
        if (!validateStep()) return;
        clearError();

        try {
            setCompleting(true);
            await updateProfile(user._id, {
                displayName: displayName.trim(),
                avatar,
                bio,
                skills: selectedSkills,
                interests: selectedInterests,
            });
            setTimeout(() => navigate('/feed'), 1000);
        } catch {
            setCompleting(false);
        }
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                    <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                            ${step > s.id
                                ? 'bg-discord-green text-discord-darkest shadow-md'
                                : step === s.id
                                    ? 'bg-blurple text-white shadow-md shadow-blurple/30'
                                    : 'bg-discord-darkest text-discord-faint border-2 border-discord-border'
                            }`}
                    >
                        {step > s.id ? <Check className="w-4 h-4" strokeWidth={3} /> : s.id}
                    </div>
                    {i < STEPS.length - 1 && (
                        <div
                            className={`w-10 h-0.5 rounded-full transition-all duration-500 ${step > s.id ? 'bg-discord-green' : 'bg-discord-border'
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    const TagGrid = ({ suggestions, selected, onToggle, label }) => (
        <div>
            <p className="text-sm font-semibold text-white mb-3">{label}</p>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((tag) => (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => onToggle(tag)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none
                            ${selected.includes(tag)
                                ? 'bg-blurple text-white shadow-sm shadow-blurple/30'
                                : 'bg-discord-darkest text-discord-light border-2 border-discord-border hover:border-blurple/40 hover:bg-discord-darkest/80'
                            }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen min-h-[100dvh] bg-discord-darkest relative overflow-hidden flex flex-col">
            {/* ── Ambient background ── */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-28 -left-24 w-72 h-72 rounded-full bg-blurple/[0.08] blur-[100px]" />
                <div className="absolute bottom-[20%] -right-20 w-56 h-56 rounded-full bg-indigo-600/[0.05] blur-[80px]" />
            </div>

            {/* ── Header ── */}
            <header
                className={`relative z-10 flex items-center justify-between px-5 sm:px-8 py-4
                    transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
            >
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blurple flex items-center justify-center shadow-md shadow-blurple/20">
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-white">CircleCore</span>
                </Link>
                <span className="text-xs font-semibold text-discord-faint uppercase tracking-wider">
                    Step {step} of 3
                </span>
            </header>

            {/* ── Main ── */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-10">
                {/* Heading */}
                <div className={`text-center mb-4 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                        Set up your profile
                    </h1>
                    <p className="text-sm sm:text-base text-discord-muted font-medium">
                        {STEPS[step - 1].title} — let the community know who you are.
                    </p>
                </div>

                {/* ── Card ── */}
                <section
                    className={`w-full max-w-[480px] mx-auto transition-all duration-700 delay-200
                        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    <div className="relative bg-discord-darker rounded-3xl p-6 sm:p-8 shadow-xl border border-discord-border/50">
                        {/* Glow edge */}
                        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-blurple/20 via-transparent to-transparent -z-10 blur-sm" />

                        <StepIndicator />

                        {/* Server error */}
                        {error && (
                            <div className="mb-5 px-4 py-3 bg-discord-red/10 border border-discord-red/25 rounded-xl text-sm text-discord-red font-medium text-center animate-shake">
                                {error}
                            </div>
                        )}

                        {/* ── Step 1: Basic Info ── */}
                        {step === 1 && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Avatar Dropzone */}
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-sm font-semibold text-white">Avatar</p>
                                    <div
                                        {...getAvatarRootProps()}
                                        className={`relative w-24 h-24 rounded-full border-3 border-dashed flex items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden group
                                            ${isAvatarDragActive
                                                ? 'border-blurple bg-blurple/10 scale-105'
                                                : avatar
                                                    ? 'border-blurple/40'
                                                    : 'border-discord-border hover:border-blurple/50 bg-discord-darkest/30'
                                            }`}
                                    >
                                        <input {...getAvatarInputProps()} />
                                        {avatarUploading ? (
                                            <div className="w-6 h-6 rounded-full border-2 border-blurple border-t-transparent animate-spin" />
                                        ) : avatar ? (
                                            <>
                                                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors duration-200">
                                                    <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <Camera className="w-6 h-6 text-discord-faint" strokeWidth={1.5} />
                                                <span className="text-[9px] text-discord-faint font-medium">Upload</span>
                                            </div>
                                        )}
                                    </div>
                                    {errors.avatar && (
                                        <p className="text-xs font-medium text-discord-red">{errors.avatar}</p>
                                    )}
                                    <p className="text-[10px] text-discord-faint">Click or drag to upload</p>
                                </div>

                                <InputField
                                    id="onboarding-name"
                                    label="Display Name"
                                    type="text"
                                    placeholder="Your name"
                                    value={displayName}
                                    onChange={(e) => {
                                        setDisplayName(e.target.value);
                                        setErrors((p) => ({ ...p, displayName: '' }));
                                    }}
                                    error={errors.displayName}
                                    icon={<User className="w-4 h-4" strokeWidth={2} />}
                                />
                            </div>
                        )}

                        {/* ── Step 2: Bio ── */}
                        {step === 2 && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="w-full">
                                    <label className="block text-sm font-semibold text-white mb-1.5">Bio</label>
                                    <textarea
                                        id="onboarding-bio"
                                        placeholder="Tell us about yourself, what you're working on, what drives you…"
                                        value={bio}
                                        maxLength={200}
                                        onChange={(e) => {
                                            setBio(e.target.value);
                                            setErrors((p) => ({ ...p, bio: '' }));
                                        }}
                                        rows={5}
                                        className={`w-full rounded-xl border-2 bg-discord-darkest text-discord-white font-medium
                                            placeholder:text-discord-faint/50 outline-none resize-none
                                            transition-all duration-200
                                            focus:bg-discord-darkest focus:border-blurple focus:ring-2 focus:ring-blurple/30
                                            px-4 py-3.5 text-sm
                                            ${errors.bio ? 'border-discord-red/50 focus:border-discord-red focus:ring-discord-red/20' : 'border-discord-border'}`}
                                    />
                                    {errors.bio && (
                                        <p className="mt-1.5 text-xs font-medium text-discord-red flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                                            </svg>
                                            {errors.bio}
                                        </p>
                                    )}
                                </div>
                                <p className="text-xs text-discord-faint text-center">
                                    {bio.length} / 200 characters
                                </p>
                            </div>
                        )}

                        {/* ── Step 3: Skills & Interests ── */}
                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <TagGrid
                                    suggestions={SKILL_SUGGESTIONS}
                                    selected={selectedSkills}
                                    onToggle={(tag) => {
                                        toggleTag(tag, selectedSkills, setSelectedSkills);
                                        setErrors((p) => ({ ...p, tags: '' }));
                                    }}
                                    label="Your Skills"
                                />
                                <TagGrid
                                    suggestions={INTEREST_SUGGESTIONS}
                                    selected={selectedInterests}
                                    onToggle={(tag) => {
                                        toggleTag(tag, selectedInterests, setSelectedInterests);
                                        setErrors((p) => ({ ...p, tags: '' }));
                                    }}
                                    label="Your Interests"
                                />
                                {errors.tags && (
                                    <p className="text-xs font-medium text-discord-red text-center flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                                        </svg>
                                        {errors.tags}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Navigation Buttons ── */}
                        <div className="flex items-center gap-3 mt-8">
                            {step > 1 && (
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={handleBack}
                                    icon={<ArrowLeft className="w-4 h-4" strokeWidth={2} />}
                                >
                                    Back
                                </Button>
                            )}
                            <div className="flex-1" />
                            {step < 3 ? (
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={handleNext}
                                    icon={<ArrowRight className="w-4 h-4" strokeWidth={2} />}
                                >
                                    Continue
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleComplete}
                                    loading={isLoading || completing}
                                    icon={!isLoading && !completing && <Check className="w-4 h-4" strokeWidth={2} />}
                                >
                                    {isLoading || completing ? 'Saving…' : 'Complete Setup'}
                                </Button>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ProfileOnboardingPage;
