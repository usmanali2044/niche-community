import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Pencil, X, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const BANNER_COLORS = [
    '#334155',
    '#f472b6',
    '#f97316',
    '#f59e0b',
    '#facc15',
    '#8b5cf6',
    '#38bdf8',
    '#22d3ee',
    '#22c55e',
    '#111827',
];

const SETTINGS_SECTIONS = [
    { label: 'My Account', key: 'account' },
    { label: 'Language', key: 'language' },
    { label: 'Data & Privacy', key: 'privacy' },
    { label: 'Family Center', key: 'family' },
    { label: 'Notifications', key: 'notifications' },
];

const BILLING_SECTIONS = [
    { id: 'circlecore-plus', label: 'CircleCore Plus', badge: 'Premium' },
];

const ProfileSettingsModal = ({ isOpen, onClose, profile, user, onSave }) => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const initial = useMemo(() => ({
        displayName: profile?.displayName || user?.name || '',
        pronouns: profile?.pronouns || '',
        bannerColor: profile?.bannerColor || '#3f4f4f',
        bio: profile?.bio || '',
    }), [profile, user]);

    const [activeTab, setActiveTab] = useState('main');
    const [activeSection, setActiveSection] = useState('account');
    const [displayName, setDisplayName] = useState(initial.displayName);
    const [pronouns, setPronouns] = useState(initial.pronouns);
    const [bannerColor, setBannerColor] = useState(initial.bannerColor);
    const [bio, setBio] = useState(initial.bio);
    const [isSaving, setIsSaving] = useState(false);
    const [privacy, setPrivacy] = useState({
        improveData: profile?.dataPrivacy?.improveData ?? true,
        personalizeActivity: profile?.dataPrivacy?.personalizeActivity ?? true,
        thirdPartyPersonalization: profile?.dataPrivacy?.thirdPartyPersonalization ?? true,
        personalizeExperience: profile?.dataPrivacy?.personalizeExperience ?? true,
        voiceClips: profile?.dataPrivacy?.voiceClips ?? true,
    });

    useEffect(() => {
        if (!isOpen) return;
        setDisplayName(initial.displayName);
        setPronouns(initial.pronouns);
        setBannerColor(initial.bannerColor);
        setBio(initial.bio);
        setPrivacy({
            improveData: profile?.dataPrivacy?.improveData ?? true,
            personalizeActivity: profile?.dataPrivacy?.personalizeActivity ?? true,
            thirdPartyPersonalization: profile?.dataPrivacy?.thirdPartyPersonalization ?? true,
            personalizeExperience: profile?.dataPrivacy?.personalizeExperience ?? true,
            voiceClips: profile?.dataPrivacy?.voiceClips ?? true,
        });
    }, [isOpen, initial]);

    if (!isOpen) return null;

    const canSave = displayName.trim().length > 0;
    const handleSave = async () => {
        if (!canSave || isSaving) return;
        setIsSaving(true);
        try {
            await onSave?.({
                displayName: displayName.trim(),
                pronouns: pronouns.trim(),
                bannerColor,
                bio,
                dataPrivacy: privacy,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await logout();
            onClose?.();
        } catch { }
    };

    const handleBillingClick = (sectionId) => {
        if (sectionId !== 'circlecore-plus') return;
        onClose?.();
        navigate('/upgrade');
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="absolute inset-0 md:inset-[5vh] rounded-none md:rounded-2xl bg-discord-dark shadow-2xl border border-discord-border/60 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-full w-full grid grid-cols-1 md:grid-cols-[280px_1fr]">
                    <aside className="hidden md:flex h-full bg-[#2b2d31] border-r border-discord-border/50 px-4 py-5 flex-col gap-5 overflow-y-auto">
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-discord-darkest/70 px-3 py-2">
                            <div>
                                <p className="text-sm font-semibold text-white">{profile?.displayName || user?.name || 'User'}</p>
                                <p className="text-xs text-discord-faint">Edit Profiles</p>
                            </div>
                            <Pencil className="w-4 h-4 text-discord-faint" />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full rounded-lg bg-discord-darkest text-xs text-discord-white placeholder:text-discord-faint/60 px-3 py-2 border border-discord-border/60 focus:outline-none focus:border-blurple"
                            />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-discord-faint mb-2">User Settings</p>
                            <div className="space-y-1">
                                {SETTINGS_SECTIONS.map((section) => (
                                    <button
                                        key={section.label}
                                        onClick={() => setActiveSection(section.key)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                                            activeSection === section.key
                                                ? 'bg-discord-darkest text-white'
                                                : 'text-discord-faint hover:bg-discord-darkest/60'
                                        }`}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-discord-faint mb-2">Billing Settings</p>
                            <div className="space-y-1">
                                {BILLING_SECTIONS.map((section) => (
                                    <button
                                        key={section.id || section.label}
                                        onClick={() => handleBillingClick(section.id)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-discord-faint hover:bg-discord-darkest/60 flex items-center justify-between"
                                    >
                                        <span>{section.label}</span>
                                        {section.badge && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-discord-border/50 text-discord-light">
                                                {section.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-discord-red hover:bg-discord-darkest/60"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </aside>

                    <main className="h-full overflow-y-auto">
                        <div className="sticky top-0 z-10 bg-discord-dark/90 backdrop-blur border-b border-discord-border/60 px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
                            <div>
                                <p className="text-lg font-semibold text-white">
                                    {activeSection === 'privacy' ? 'Data & Privacy' : 'Profiles'}
                                </p>
                                {activeSection === 'account' && (
                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                        <button
                                            onClick={() => setActiveTab('main')}
                                            className={`text-sm font-semibold pb-2 border-b-2 ${
                                                activeTab === 'main'
                                                    ? 'text-white border-blurple'
                                                    : 'text-discord-faint border-transparent hover:text-discord-light'
                                            }`}
                                        >
                                            Main Profile
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('server')}
                                            className={`text-sm font-semibold pb-2 border-b-2 ${
                                                activeTab === 'server'
                                                    ? 'text-white border-blurple'
                                                    : 'text-discord-faint border-transparent hover:text-discord-light'
                                            }`}
                                        >
                                            Per-server Profiles
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={!canSave || isSaving}
                                    className="px-3 sm:px-4 py-2 rounded-lg bg-blurple text-white text-sm font-semibold hover:bg-blurple/90 disabled:opacity-60"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-full bg-discord-darkest/60 border border-discord-border/60 text-discord-faint hover:text-white"
                                >
                                    <X className="w-4 h-4 mx-auto" />
                                </button>
                            </div>
                        </div>

                        <div className="md:hidden border-b border-discord-border/60 px-5 py-3 space-y-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-discord-faint">Settings</div>
                            <div className="flex flex-wrap gap-2">
                                {SETTINGS_SECTIONS.map((section) => (
                                    <button
                                        key={section.key}
                                        onClick={() => setActiveSection(section.key)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                            activeSection === section.key
                                                ? 'bg-discord-border-light/30 text-white'
                                                : 'text-discord-faint hover:bg-discord-darkest/60'
                                        }`}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.16em] text-discord-faint">Billing</div>
                            <div className="flex flex-wrap gap-2">
                                {BILLING_SECTIONS.map((section) => (
                                    <button
                                        key={section.id || section.label}
                                        onClick={() => handleBillingClick(section.id)}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-discord-faint hover:bg-discord-darkest/60 flex items-center gap-2"
                                    >
                                        <span>{section.label}</span>
                                        {section.badge && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-discord-border/50 text-discord-light">
                                                {section.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {activeSection === 'account' && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        onClick={() => setActiveTab('main')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                            activeTab === 'main'
                                                ? 'bg-discord-border-light/30 text-white'
                                                : 'text-discord-faint hover:bg-discord-darkest/60'
                                        }`}
                                    >
                                        Main Profile
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('server')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                            activeTab === 'server'
                                                ? 'bg-discord-border-light/30 text-white'
                                                : 'text-discord-faint hover:bg-discord-darkest/60'
                                        }`}
                                    >
                                        Per-server
                                    </button>
                                </div>
                            )}
                        </div>

                        {activeSection === 'account' && activeTab === 'main' && (
                            <div className="px-5 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
                                <div className="space-y-6">
                                    <div className="rounded-xl bg-gradient-to-r from-[#2c2f36] via-[#254136] to-[#2d6b4f] p-4">
                                        <div className="text-discord-light text-sm">
                                            Give your profile a fresh look
                                            <p className="text-[11px] text-discord-faint mt-1">
                                                Customize your name, pronouns, and bio.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-discord-light">Display Name</label>
                                        <input
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="mt-2 w-full rounded-lg bg-discord-darkest border border-discord-border/60 text-discord-white px-3 py-2 focus:outline-none focus:border-blurple"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-discord-light">Pronouns</label>
                                        <input
                                            value={pronouns}
                                            onChange={(e) => setPronouns(e.target.value)}
                                            placeholder="Add your pronouns"
                                            className="mt-2 w-full rounded-lg bg-discord-darkest border border-discord-border/60 text-discord-white px-3 py-2 placeholder:text-discord-faint/60 focus:outline-none focus:border-blurple"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-discord-light">Banner Color</label>
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {BANNER_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setBannerColor(color)}
                                                    className={`w-14 h-12 rounded-xl border-2 ${
                                                        bannerColor === color ? 'border-blurple' : 'border-transparent'
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {bannerColor === color && (
                                                        <Palette className="w-4 h-4 text-white mx-auto" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-discord-light">Bio</label>
                                        <p className="text-xs text-discord-faint mt-1">
                                            You can use markdown and links if you&apos;d like.
                                        </p>
                                        <div className="relative mt-3">
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                rows={4}
                                                maxLength={190}
                                                className="w-full rounded-lg bg-discord-darkest border border-discord-border/60 text-discord-white px-3 py-3 focus:outline-none focus:border-blurple resize-none"
                                            />
                                            <span className="absolute bottom-2 right-3 text-xs text-discord-faint">
                                                {190 - bio.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-sm font-semibold text-discord-light">Preview</p>
                                    <div className="rounded-2xl border border-discord-border/60 bg-discord-darker overflow-hidden">
                                        <div className="h-28" style={{ backgroundColor: bannerColor }} />
                                        <div className="px-5 pb-5 -mt-9">
                                            <div className="w-16 h-16 rounded-full bg-discord-darkest border-4 border-discord-darker overflow-hidden flex items-center justify-center">
                                                {profile?.avatar ? (
                                                    <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg font-bold text-discord-light">
                                                        {(displayName || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <button className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-discord-darkest text-xs text-discord-light">
                                                <span className="w-2 h-2 rounded-full bg-discord-green" />
                                                Add Status
                                            </button>
                                            <p className="mt-4 text-lg font-semibold text-white">{displayName || 'User'}</p>
                                            <p className="text-sm text-discord-faint">{user?._id || user?.username || 'user'}</p>
                                            <div className="mt-4">
                                                <button className="w-full py-2 rounded-lg bg-blurple text-white text-sm font-semibold">
                                                    Example Button
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'account' && activeTab === 'server' && (
                            <div className="px-5 sm:px-8 py-10 text-discord-faint text-sm">
                                Per-server profiles are coming soon.
                            </div>
                        )}

                        {activeSection === 'language' && (
                            <div className="px-5 sm:px-8 py-12">
                                <div className="max-w-3xl">
                                    <h2 className="text-xl font-semibold text-white">Select a Language</h2>
                                    <p className="text-sm text-discord-faint mt-2">
                                        Choose the language you want CircleCore to display.
                                    </p>
                                    <div className="mt-6 rounded-xl border border-discord-border/60 bg-discord-darkest/80 px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-7 rounded-sm overflow-hidden border border-discord-border/60 bg-discord-darkest flex items-center justify-center text-[10px] font-semibold">
                                                US
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">English, US</p>
                                                <p className="text-xs text-discord-faint">English, US</p>
                                            </div>
                                        </div>
                                        <div className="text-discord-faint text-sm">English, US</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'privacy' && (
                            <div className="px-5 sm:px-8 py-8">
                                <h2 className="text-xl font-semibold text-white text-center mb-8">How CircleCore Uses Your Data</h2>
                                <div className="space-y-6 max-w-3xl mx-auto">
                                    {[
                                        {
                                            key: 'improveData',
                                            title: 'Use data to improve CircleCore',
                                            desc: 'Allows us to use and process your information to understand and improve our services.',
                                        },
                                        {
                                            key: 'personalizeActivity',
                                            title: 'Use my activity to personalize Sponsored Content',
                                            desc: 'Allows us to personalize Sponsored Content using your activity, such as the communities you join.',
                                        },
                                        {
                                            key: 'thirdPartyPersonalization',
                                            title: 'Use third-party data to personalize Sponsored Content',
                                            desc: 'Allows us to personalize Sponsored Content using data we receive from third parties.',
                                        },
                                        {
                                            key: 'personalizeExperience',
                                            title: 'Use data to personalize my CircleCore experience',
                                            desc: 'Allows us to use information such as who you talk to and what you do to personalize CircleCore for you.',
                                        },
                                        {
                                            key: 'voiceClips',
                                            title: 'Allow my voice to be recorded in Clips',
                                            desc: 'By turning on this setting, your voice may be included when someone in the same voice channel uses Clips.',
                                        },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-start justify-between gap-6">
                                            <div>
                                                <p className="text-sm font-semibold text-discord-light">{item.title}</p>
                                                <p className="text-xs text-discord-faint mt-1">
                                                    {item.desc}{' '}
                                                    <a href="/help" className="text-blurple hover:underline">Learn more</a>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setPrivacy((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                                    privacy[item.key] ? 'bg-blurple' : 'bg-discord-darkest'
                                                }`}
                                            >
                                                <span className={`absolute top-0.5 ${privacy[item.key] ? 'right-0.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white transition-all`} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t border-discord-border/50 text-xs text-discord-faint">
                                        We need to store and process data to provide the basic CircleCore service. You can disable or delete your account anytime.
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'family' && (
                            <div className="px-5 sm:px-8 py-8">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="rounded-2xl border border-discord-border/60 bg-discord-darkest/80 p-6 flex items-center justify-between gap-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Stay informed about how your teen is using CircleCore.</h2>
                                            <p className="text-sm text-discord-faint mt-2">
                                                We built Family Center to provide more context so you can work together on healthy online habits.
                                                <a href="/help" className="text-blurple ml-1 hover:underline">Learn more</a>
                                            </p>
                                        </div>
                                        <div className="w-32 h-24 rounded-xl bg-gradient-to-br from-blurple/30 via-emerald-400/20 to-yellow-400/20 flex items-center justify-center text-discord-light text-sm">
                                            Family
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { title: 'Messages stay private', text: 'You can see who your teen is talking to, while still respecting their privacy.' },
                                            { title: 'Transparent sharing', text: 'You and your teen see the exact same information, so you are on the same page.' },
                                            { title: 'Easily connect', text: 'Setup is as simple as scanning a QR code your teen shows you.' },
                                        ].map((card) => (
                                            <div key={card.title} className="rounded-2xl border border-discord-border/60 bg-discord-darkest/80 p-4">
                                                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                                                <p className="text-xs text-discord-faint mt-2">{card.text}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-2xl border border-discord-border/60 bg-discord-darkest/80 p-6 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">What are connected parents and guardians able to see?</h3>
                                            <p className="text-xs text-discord-faint mt-2">
                                                Our goal is to help you stay informed about your teen’s activity so you can have meaningful conversations and support them.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { title: 'New friends', text: 'New friends that your teen added or accepted.' },
                                                { title: 'Servers joined or participated in', text: 'Servers your teen recently joined, created, or sent a message in.' },
                                                { title: 'Users messaged or called', text: 'This includes direct messages and group chats.' },
                                                { title: 'Total time spent in voice or video', text: 'Minutes in calls across direct messages, group chats, and servers.' },
                                                { title: 'Total purchases', text: 'All purchases your teen made, including shop and subscriptions.' },
                                                { title: 'Reports shared by your teen', text: 'If they share a report they filed, you’ll be notified.' },
                                                { title: 'Teen account settings', text: 'You can manage settings your teen can’t edit on their own.' },
                                            ].map((row) => (
                                                <div key={row.title} className="rounded-xl border border-discord-border/60 bg-discord-darkest/70 p-4">
                                                    <p className="text-sm font-semibold text-white">{row.title}</p>
                                                    <p className="text-xs text-discord-faint mt-1">{row.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="md:hidden px-5 pb-8">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-discord-red hover:bg-discord-darkest/60"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsModal;
