import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/urls';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Sparkles,
    Lock,
    ArrowRight,
    Users,
    Globe,
    Zap,
    Ticket,
    ShieldCheck,
    MessageSquare,
    Rocket,
    BookOpen,
    LifeBuoy,
    FileText,
    Briefcase,
    Building2,
    Hash,
    Star,
    ChevronDown,
    ChevronRight,
    Mail,
    MapPin,
    ExternalLink,
    Play,
    Shield,
    Calendar,
    Award,
    Heart,
    Github,
    Twitter,
} from 'lucide-react';
import Button from '../components/Button';
import CursorFollower from '../components/CursorFollower';
import InputField from '../components/InputField';

gsap.registerPlugin(ScrollTrigger);

/* ── FAQ Accordion Item ─────────────────────────────────────────────────── */
const FaqItem = ({ question, answer, isOpen, onToggle }) => (
    <div className="border-b border-discord-border last:border-0">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between py-4 px-1 text-left cursor-pointer group"
        >
            <span className="text-sm sm:text-base font-semibold text-discord-white group-hover:text-blurple transition-colors">
                {question}
            </span>
            <ChevronDown
                className={`w-4 h-4 text-discord-muted transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
            />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 pb-4' : 'max-h-0'}`}>
            <p className="text-sm text-discord-muted leading-relaxed px-1">{answer}</p>
        </div>
    </div>
);

/* ── Animated Counter ───────────────────────────────────────────────────── */
const AnimatedCounter = ({ value, suffix = '' }) => {
    const ref = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!ref.current || hasAnimated.current) return;
        const numericPart = parseFloat(value.replace(/[^0-9.]/g, ''));
        const prefix = value.match(/^[^0-9]*/)?.[0] || '';
        const valueSuffix = value.match(/[^0-9.]*$/)?.[0] || '';
        if (isNaN(numericPart)) { ref.current.textContent = value; return; }

        const obj = { val: 0 };
        ScrollTrigger.create({
            trigger: ref.current,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                hasAnimated.current = true;
                gsap.to(obj, {
                    val: numericPart,
                    duration: 1.8,
                    ease: 'power2.out',
                    onUpdate: () => {
                        if (!ref.current) return;
                        const display = numericPart % 1 !== 0
                            ? obj.val.toFixed(1)
                            : Math.round(obj.val).toLocaleString();
                        ref.current.textContent = prefix + display + valueSuffix;
                    },
                });
            },
        });
    }, [value]);

    return <span ref={ref}>0</span>;
};

/* ── Main HomePage Component ────────────────────────────────────────────── */
const HomePage = () => {
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [openFaq, setOpenFaq] = useState(null);
    const navigate = useNavigate();

    // Refs for GSAP
    const heroRef = useRef(null);
    const navRef = useRef(null);
    const statsRef = useRef(null);
    const featuresRef = useRef(null);
    const aboutRef = useRef(null);
    const testimonialsRef = useRef(null);
    const ctaRef = useRef(null);
    const faqRef = useRef(null);
    const contactRef = useRef(null);
    const footerRef = useRef(null);
    const ambientRef = useRef(null);
    const marqueeRef = useRef(null);
    const ctxRef = useRef(null);

    /* ── GSAP scroll-reveal helper ─────────────────────────────────────── */
    const scrollReveal = useCallback((targets, triggerEl, fromVars, extra = {}) => {
        if (!targets || !triggerEl) return;
        const nodes = targets instanceof NodeList || Array.isArray(targets) ? targets : [targets];
        if (nodes.length === 0) return;

        gsap.fromTo(nodes, {
            opacity: 0,
            ...fromVars,
        }, {
            opacity: 1,
            x: 0, y: 0, scale: 1, rotateX: 0,
            ...extra,
            scrollTrigger: {
                trigger: triggerEl,
                start: extra.start || 'top 88%',
                toggleActions: 'play none none none',
            },
        });
    }, []);

    /* ── GSAP Master Animations ──────────────────────────────────────────── */
    useEffect(() => {
        // Small delay to ensure React has finished painting
        const raf = requestAnimationFrame(() => {
            const ctx = gsap.context(() => {
                // ── Ambient floating blobs ──
                if (ambientRef.current) {
                    const blobs = ambientRef.current.querySelectorAll('.ambient-blob');
                    blobs.forEach((blob, i) => {
                        gsap.to(blob, {
                            y: gsap.utils.random(-30, 30),
                            x: gsap.utils.random(-20, 20),
                            scale: gsap.utils.random(0.9, 1.1),
                            duration: gsap.utils.random(4, 7),
                            ease: 'sine.inOut',
                            repeat: -1,
                            yoyo: true,
                            delay: i * 0.5,
                        });
                    });
                }

                // ── Nav entrance (no scroll trigger — plays immediately) ──
                if (navRef.current) {
                    gsap.fromTo(navRef.current,
                        { y: -40, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
                    );
                }

                // ── Hero section staggered reveal (plays on load, no scroll trigger) ──
                if (heroRef.current) {
                    const heroEls = heroRef.current.querySelectorAll('.hero-badge, .hero-headline, .hero-subtitle, .hero-cta, .hero-invite-card');
                    gsap.fromTo(heroEls,
                        { y: 50, opacity: 0, scale: 0.95 },
                        {
                            y: 0, opacity: 1, scale: 1,
                            duration: 0.7,
                            ease: 'power3.out',
                            stagger: 0.12,
                            delay: 0.3,
                        }
                    );
                }

                // ── Stats counter section ──
                if (statsRef.current) {
                    scrollReveal(
                        statsRef.current.querySelectorAll('.stat-item'),
                        statsRef.current,
                        { y: 40, scale: 0.9 },
                        { stagger: 0.12, duration: 0.7, ease: 'power3.out' }
                    );
                }

                // ── Features section ──
                if (featuresRef.current) {
                    scrollReveal(
                        featuresRef.current.querySelectorAll('.feature-header'),
                        featuresRef.current,
                        { y: 50 },
                        { duration: 0.8, ease: 'power3.out' }
                    );

                    const featureGrid = featuresRef.current.querySelector('.feature-grid');
                    if (featureGrid) {
                        scrollReveal(
                            featuresRef.current.querySelectorAll('.feature-card'),
                            featureGrid,
                            { y: 60, scale: 0.92 },
                            { stagger: 0.1, duration: 0.7, ease: 'power3.out' }
                        );
                    }
                }

                // ── About section split reveal ──
                if (aboutRef.current) {
                    const aboutText = aboutRef.current.querySelector('.about-text');
                    if (aboutText) {
                        scrollReveal(aboutText, aboutRef.current, { x: -80 }, { duration: 0.9, ease: 'power3.out' });
                    }

                    const aboutValues = aboutRef.current.querySelector('.about-values');
                    if (aboutValues) {
                        scrollReveal(
                            aboutRef.current.querySelectorAll('.about-value-card'),
                            aboutValues,
                            { x: 60, scale: 0.9 },
                            { stagger: 0.1, duration: 0.7, ease: 'power3.out' }
                        );
                    }
                }

                // ── Testimonials ──
                if (testimonialsRef.current) {
                    scrollReveal(
                        testimonialsRef.current.querySelector('.testimonials-header'),
                        testimonialsRef.current,
                        { y: 40 },
                        { duration: 0.7, ease: 'power3.out' }
                    );

                    const tGrid = testimonialsRef.current.querySelector('.testimonials-grid');
                    if (tGrid) {
                        scrollReveal(
                            testimonialsRef.current.querySelectorAll('.testimonial-card'),
                            tGrid,
                            { y: 50, rotateX: 15 },
                            { stagger: 0.15, duration: 0.8, ease: 'power3.out' }
                        );
                    }
                }

                // ── CTA Banner ──
                if (ctaRef.current) {
                    scrollReveal(
                        ctaRef.current.querySelector('.cta-banner'),
                        ctaRef.current,
                        { y: 60, scale: 0.92 },
                        { duration: 0.9, ease: 'power3.out' }
                    );
                }

                // ── FAQ Section ──
                if (faqRef.current) {
                    scrollReveal(
                        faqRef.current.querySelector('.faq-header'),
                        faqRef.current,
                        { y: 40 },
                        { duration: 0.7, ease: 'power3.out' }
                    );

                    const faqCard = faqRef.current.querySelector('.faq-card');
                    if (faqCard) {
                        scrollReveal(faqCard, faqCard, { y: 40 }, { duration: 0.7, ease: 'power3.out' });
                    }
                }

                // ── Contact Section ──
                if (contactRef.current) {
                    scrollReveal(
                        contactRef.current.querySelector('.contact-header'),
                        contactRef.current,
                        { y: 40 },
                        { duration: 0.7, ease: 'power3.out' }
                    );

                    const cGrid = contactRef.current.querySelector('.contact-grid');
                    if (cGrid) {
                        scrollReveal(
                            contactRef.current.querySelectorAll('.contact-card'),
                            cGrid,
                            { y: 50, scale: 0.9 },
                            { stagger: 0.12, duration: 0.7, ease: 'back.out(1.4)' }
                        );
                    }
                }

                // ── Horizontal marquee (scroll-scrub) ──
                if (marqueeRef.current) {
                    const row1 = marqueeRef.current.querySelector('.marquee-row-1');
                    const row2 = marqueeRef.current.querySelector('.marquee-row-2');

                    if (row1) {
                        gsap.fromTo(row1, { x: '0%' }, {
                            x: '-25%',
                            ease: 'none',
                            scrollTrigger: {
                                trigger: marqueeRef.current,
                                start: 'top bottom',
                                end: 'bottom top',
                                scrub: 0.5,
                            },
                        });
                    }
                    if (row2) {
                        gsap.fromTo(row2, { x: '-25%' }, {
                            x: '0%',
                            ease: 'none',
                            scrollTrigger: {
                                trigger: marqueeRef.current,
                                start: 'top bottom',
                                end: 'bottom top',
                                scrub: 0.5,
                            },
                        });
                    }
                }

                // ── Footer ──
                if (footerRef.current) {
                    scrollReveal(footerRef.current, footerRef.current, { y: 30 }, { duration: 0.8, ease: 'power3.out', start: 'top 95%' });
                }

                // Ensure ScrollTrigger recalculates positions after everything is set up
                ScrollTrigger.refresh();
            });

            // Store context for cleanup
            ctxRef.current = ctx;
        });

        return () => {
            cancelAnimationFrame(raf);
            ctxRef.current?.revert();
        };
    }, [scrollReveal]);

    /* ── Validate invite code via API ── */
    const handleSignUp = async () => {
        const code = inviteCode.trim();
        if (!code) { setError('Please enter an invite code'); return; }
        setError('');
        setLoading(true);
        try {
            const res = await fetch(apiUrl('/api/invites/validate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json().catch(() => null);
            if (res.ok) {
                sessionStorage.setItem('circlecore_invite_code', code);
                navigate('/signup');
            } else {
                setError(data?.message || 'Invalid or expired invite code');
            }
        } catch {
            setError('Could not connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleSignUp(); };

    /* ── Data ── */
    const stats = [
        { value: '12K+', label: 'Members', icon: Users },
        { value: '500+', label: 'Communities', icon: Globe },
        { value: '1M+', label: 'Messages', icon: MessageSquare },
        { value: '99.9%', label: 'Uptime', icon: Zap },
    ];

    const features = [
        {
            icon: Hash,
            title: 'Organized Channels',
            desc: 'Keep conversations organized with topic-based channels. Text, voice, and media — all in one place.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Lock,
            title: 'Invite-Only Access',
            desc: 'Control exactly who joins your community. Invite codes ensure only the right people get in.',
            color: 'from-emerald-500 to-teal-500',
        },
        {
            icon: Zap,
            title: 'Real-Time Everything',
            desc: 'Live feeds, instant reactions, and real-time notifications keep your community buzzing.',
            color: 'from-amber-500 to-orange-500',
        },
        {
            icon: ShieldCheck,
            title: 'Powerful Moderation',
            desc: 'Auto-flag content, manage reports, and keep your space safe with built-in moderation tools.',
            color: 'from-rose-500 to-pink-500',
        },
        {
            icon: Calendar,
            title: 'Events & Meetups',
            desc: 'Schedule events, manage RSVPs, and bring your community together — online or IRL.',
            color: 'from-violet-500 to-purple-500',
        },
        {
            icon: Award,
            title: 'Roles & Reputation',
            desc: 'Assign roles, track reputation, and reward your most engaged community members.',
            color: 'from-indigo-500 to-blue-500',
        },
    ];

    const testimonials = [
        {
            name: 'Sarah Chen',
            role: 'Community Lead, TechStartup',
            text: 'CircleCore transformed how we manage our beta community. The moderation tools alone saved us hundreds of hours.',
            avatar: '🧑‍💻',
        },
        {
            name: 'Marcus Webb',
            role: 'Creator, DesignCircle',
            text: 'Finally, a platform that puts quality over quantity. Our invite-only model helped us build an incredible community.',
            avatar: '🎨',
        },
        {
            name: 'Priya Patel',
            role: 'Engineering Manager',
            text: 'We moved our entire internal team to CircleCore. The channel organization and real-time features are exactly what we needed.',
            avatar: '⚡',
        },
    ];

    const faqs = [
        { q: 'What is CircleCore?', a: 'CircleCore is a modern community platform for invite-only groups. Think of it as a premium space where quality conversations happen without the noise.' },
        { q: 'How do I get an invite code?', a: 'Request one from an existing member or community admin. Each community manages their own invite codes to ensure quality membership.' },
        { q: 'Is CircleCore free?', a: 'CircleCore offers a free tier with all essential features. Premium tiers unlock advanced moderation, analytics, and unlimited channels.' },
        { q: 'Can I create my own community?', a: 'Absolutely! After signing up, you can create your own workspace and start inviting members immediately.' },
        { q: 'How is CircleCore different from Discord?', a: 'CircleCore is built for curated, invite-only communities. We focus on trust, reputation, and meaningful engagement rather than mass scale.' },
    ];

    const footerColumns = [
        {
            heading: 'Product',
            links: [
                { label: 'Features', href: '#features' },
                { label: 'Community Feed', onClick: () => navigate('/feed') },
                { label: 'Pricing', onClick: () => navigate('/upgrade') },
            ],
        },
        {
            heading: 'Resources',
            links: [
                { label: 'Documentation', icon: BookOpen },
                { label: 'API Status', icon: Zap },
                { label: 'Support', icon: LifeBuoy },
                { label: 'Changelog', icon: FileText },
            ],
        },
        {
            heading: 'Company',
            links: [
                { label: 'About', href: '#about' },
                { label: 'Careers', icon: Briefcase },
                { label: 'Contact', href: '#contact' },
                { label: 'Partners', icon: Users },
            ],
        },
        {
            heading: 'Legal',
            links: [
                { label: 'Privacy Policy' },
                { label: 'Terms of Service' },
                { label: 'Cookie Policy' },
                { label: 'Security' },
            ],
        },
    ];

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-discord-darkest text-discord-white overflow-hidden">
            <CursorFollower />

            {/* ═══════════  AMBIENT BACKGROUND  ═══════════ */}
            <div ref={ambientRef} className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="ambient-blob absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blurple/[0.07] blur-[120px]" />
                <div className="ambient-blob absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/[0.05] blur-[100px]" />
                <div className="ambient-blob absolute top-1/2 right-0 w-[300px] h-[300px] rounded-full bg-purple-600/[0.04] blur-[80px]" />
            </div>

            {/* ═══════════  NAVIGATION  ═══════════ */}
            <nav ref={navRef} className="sticky top-0 z-50 bg-discord-darkest/80 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-3.5">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="w-8 h-8 rounded-full bg-blurple flex items-center justify-center shadow-lg shadow-blurple/25">
                                <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-base font-bold tracking-tight text-white">CircleCore</span>
                        </div>

                        {/* Nav links */}
                        <div className="hidden md:flex items-center gap-6">
                            {[
                                { label: 'Features', id: 'features' },
                                { label: 'About', id: 'about' },
                                { label: 'FAQ', id: 'faq' },
                                { label: 'Contact', id: 'contact' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollTo(item.id)}
                                    className="text-sm font-medium text-discord-muted hover:text-white transition-colors cursor-pointer"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Auth buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-medium text-discord-light hover:text-white transition-colors cursor-pointer"
                        >
                            Log In
                        </button>
                        <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                            Sign Up
                        </Button>
                    </div>
                </div>
            </nav>

            {/* ═══════════  HERO SECTION  ═══════════ */}
            <section ref={heroRef} className="relative pt-16 sm:pt-24 pb-16 sm:pb-24">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
                    {/* Badge */}
                    <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-blurple/10 border border-blurple/20 rounded-full mb-8">
                        <Sparkles className="w-3.5 h-3.5 text-blurple" strokeWidth={2.5} />
                        <span className="text-xs font-semibold text-blurple tracking-wide uppercase">Invite-Only Communities</span>
                    </div>

                    {/* Headline */}
                    <h1 className="hero-headline text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
                        Your circle,{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blurple via-indigo-400 to-purple-400">
                            your&nbsp;rules.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="hero-subtitle text-base sm:text-lg md:text-xl text-discord-muted font-medium max-w-2xl mx-auto leading-relaxed mb-10">
                        The platform where curated communities thrive. Built for trust, quality conversations,
                        and the people who value real connections over endless noise.
                    </p>

                    {/* CTA Buttons */}
                    <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Button variant="primary" size="lg" onClick={() => navigate('/signup')}
                            icon={<ArrowRight className="w-4 h-4" strokeWidth={2} />}>
                            Get Started Free
                        </Button>
                        <Button variant="secondary" size="lg" onClick={() => scrollTo('features')}
                            icon={<Play className="w-4 h-4" strokeWidth={2} />}>
                            See How It Works
                        </Button>
                    </div>

                    {/* ── Invite Code Card ── */}
                    <div className="hero-invite-card max-w-md mx-auto">
                        <div className="relative bg-discord-darker rounded-xl p-5 border border-discord-border shadow-2xl shadow-black/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Lock className="w-3.5 h-3.5 text-blurple" strokeWidth={2.5} />
                                <span className="text-xs font-bold text-discord-muted uppercase tracking-wider">Have an invite code?</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input
                                        placeholder="Enter invite code"
                                        value={inviteCode}
                                        onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(''); }}
                                        onKeyDown={handleKeyDown}
                                        className="w-full rounded-lg bg-discord-darkest text-discord-white text-sm font-medium
                                            placeholder:text-discord-faint/50 outline-none border border-discord-darkest
                                            focus:border-blurple focus:ring-2 focus:ring-blurple/30 px-3.5 py-2.5 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleSignUp}
                                    disabled={!inviteCode.trim() || loading}
                                    className="px-5 py-2.5 bg-blurple hover:bg-blurple-hover text-white text-sm font-semibold rounded-lg
                                        transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                                        shadow-md hover:shadow-lg hover:shadow-blurple/25"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                                    )}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 text-xs font-medium text-discord-red">{error}</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════  STATS BAR  ═══════════ */}
            <section ref={statsRef} className="relative py-8 border-y border-white/[0.06] bg-discord-darker/50">
                <div className="max-w-5xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="stat-item flex flex-col items-center gap-1.5 py-2">
                                <stat.icon className="w-5 h-5 text-blurple mb-1" strokeWidth={2} />
                                <p className="text-2xl sm:text-3xl font-black text-white">
                                    <AnimatedCounter value={stat.value} />
                                </p>
                                <p className="text-xs font-medium text-discord-muted uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════  HORIZONTAL SCROLL MARQUEE  ═══════════ */}
            <section ref={marqueeRef} className="relative py-12 sm:py-16 overflow-hidden select-none">
                <div className="space-y-4">
                    {/* Row 1 — scrolls left on scroll */}
                    <div className="marquee-row-1 flex gap-4 whitespace-nowrap will-change-transform" style={{ width: 'max-content' }}>
                        {[...Array(2)].map((_, copy) => (
                            <div key={copy} className="flex gap-4">
                                {[
                                    { text: 'Invite-Only Access', icon: Lock },
                                    { text: 'Organized Channels', icon: Hash },
                                    { text: 'Real-Time Feed', icon: Zap },
                                    { text: 'Built on Trust', icon: Shield },
                                    { text: 'Community Events', icon: Calendar },
                                    { text: 'Powerful Moderation', icon: ShieldCheck },
                                    { text: 'Roles & Reputation', icon: Award },
                                    { text: 'Premium Tiers', icon: Star },
                                ].map((item) => (
                                    <div
                                        key={item.text + copy}
                                        className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-discord-darker/60 border border-discord-border/30"
                                    >
                                        <item.icon className="w-4 h-4 text-blurple shrink-0" strokeWidth={2} />
                                        <span className="text-sm font-bold text-discord-light tracking-wide">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Row 2 — scrolls right on scroll (opposite) */}
                    <div className="marquee-row-2 flex gap-4 whitespace-nowrap will-change-transform" style={{ width: 'max-content' }}>
                        {[...Array(2)].map((_, copy) => (
                            <div key={copy} className="flex gap-4">
                                {[
                                    { text: 'Quality Conversations', icon: MessageSquare },
                                    { text: 'Workspace Switcher', icon: Building2 },
                                    { text: 'Community Feed', icon: Globe },
                                    { text: 'Team Collaboration', icon: Users },
                                    { text: 'Open Source', icon: Heart },
                                    { text: 'Scale Ready', icon: Rocket },
                                    { text: 'Smart Notifications', icon: Sparkles },
                                    { text: 'Premium Support', icon: LifeBuoy },
                                ].map((item) => (
                                    <div
                                        key={item.text + copy}
                                        className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-blurple/[0.06] border border-blurple/15"
                                    >
                                        <item.icon className="w-4 h-4 text-indigo-400 shrink-0" strokeWidth={2} />
                                        <span className="text-sm font-bold text-discord-muted tracking-wide">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════  FEATURES  ═══════════ */}
            <section ref={featuresRef} id="features" className="relative py-20 sm:py-28">
                <div className="max-w-6xl mx-auto px-5 sm:px-8">
                    {/* Section header */}
                    <div className="feature-header text-center mb-14">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blurple mb-3">Features</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                            Everything&nbsp;you need to run a{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blurple to-purple-400">
                                thriving community
                            </span>
                        </h2>
                        <p className="text-base text-discord-muted max-w-xl mx-auto">
                            Powerful tools that make managing your community feel effortless.
                        </p>
                    </div>

                    {/* Feature cards */}
                    <div className="feature-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((feature, i) => (
                            <div
                                key={feature.title}
                                className="feature-card group relative bg-discord-darker/80 hover:bg-discord-darker border border-discord-border/50 hover:border-discord-border
                                    rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
                            >
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4
                                    shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-5 h-5 text-white" strokeWidth={2} />
                                </div>
                                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-discord-muted leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════  ABOUT SECTION  ═══════════ */}
            <section ref={aboutRef} id="about" className="relative py-20 sm:py-28 bg-discord-darker/40">
                <div className="max-w-6xl mx-auto px-5 sm:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left side — text */}
                        <div className="about-text">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blurple mb-3">About CircleCore</p>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-6 leading-tight">
                                Built for communities that{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blurple to-indigo-400">
                                    value quality
                                </span>
                            </h2>
                            <p className="text-base text-discord-muted leading-relaxed mb-6">
                                We believe the best communities are intentional. CircleCore was built from the ground up
                                for groups that care about who's in the room — where every member adds value and every
                                conversation matters.
                            </p>
                            <p className="text-base text-discord-muted leading-relaxed mb-8">
                                Whether you're building a startup community, managing an internal team, or running a
                                creator network, CircleCore gives you the tools to create a space that feels like home.
                            </p>
                            <Button variant="primary" onClick={() => navigate('/signup')}
                                icon={<ArrowRight className="w-4 h-4" strokeWidth={2} />}>
                                Start Building Your Community
                            </Button>
                        </div>

                        {/* Right side — values grid */}
                        <div className="about-values grid grid-cols-2 gap-3">
                            {[
                                { icon: Shield, title: 'Trust First', desc: 'Invite-only access ensures quality', color: 'text-emerald-400' },
                                { icon: Users, title: 'People-Centric', desc: 'Built around real relationships', color: 'text-blue-400' },
                                { icon: Rocket, title: 'Scale Ready', desc: 'Grows with your community', color: 'text-amber-400' },
                                { icon: Heart, title: 'Open Source', desc: 'Transparent and community-driven', color: 'text-rose-400' },
                            ].map((val) => (
                                <div key={val.title}
                                    className="about-value-card bg-discord-darkest/60 border border-discord-border/40 rounded-xl p-4 hover:border-discord-border transition-colors">
                                    <val.icon className={`w-5 h-5 ${val.color} mb-3`} strokeWidth={2} />
                                    <h4 className="text-sm font-bold text-white mb-1">{val.title}</h4>
                                    <p className="text-xs text-discord-muted">{val.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════  TESTIMONIALS  ═══════════ */}
            <section ref={testimonialsRef} className="relative py-20 sm:py-28" style={{ perspective: '1000px' }}>
                <div className="max-w-5xl mx-auto px-5 sm:px-8">
                    <div className="testimonials-header text-center mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blurple mb-3">Testimonials</p>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                            Loved by community builders
                        </h2>
                    </div>

                    <div className="testimonials-grid grid sm:grid-cols-3 gap-4">
                        {testimonials.map((t, i) => (
                            <div key={i}
                                className="testimonial-card bg-discord-darker/80 border border-discord-border/50 rounded-xl p-6 hover:border-discord-border transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-discord-darkest flex items-center justify-center text-lg">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{t.name}</p>
                                        <p className="text-xs text-discord-faint">{t.role}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-discord-muted leading-relaxed italic">"{t.text}"</p>
                                <div className="flex gap-0.5 mt-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" strokeWidth={0} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════  CTA BANNER  ═══════════ */}
            <section ref={ctaRef} className="relative py-20 sm:py-24">
                <div className="max-w-4xl mx-auto px-5 sm:px-8">
                    <div className="cta-banner relative bg-gradient-to-r from-blurple via-indigo-500 to-purple-600 rounded-2xl p-8 sm:p-14 text-center overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/[0.06] -translate-y-1/2 translate-x-1/4 blur-2xl" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/[0.04] translate-y-1/2 -translate-x-1/4 blur-xl" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                                Ready to start your community?
                            </h2>
                            <p className="text-base sm:text-lg text-white/70 mb-8 max-w-lg mx-auto">
                                Join thousands of builders creating meaningful connections on CircleCore.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="px-8 py-3.5 bg-white text-blurple font-bold text-sm rounded-lg hover:bg-white/90
                                        transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.98]"
                                >
                                    Sign Up — It's Free
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-3.5 bg-white/10 text-white font-semibold text-sm rounded-lg
                                        border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer"
                                >
                                    Already have an account?
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════  FAQ SECTION  ═══════════ */}
            <section ref={faqRef} id="faq" className="relative py-20 sm:py-28 bg-discord-darker/40">
                <div className="max-w-2xl mx-auto px-5 sm:px-8">
                    <div className="faq-header text-center mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blurple mb-3">FAQ</p>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                            Frequently asked questions
                        </h2>
                    </div>

                    <div className="faq-card bg-discord-darker/80 border border-discord-border/50 rounded-xl p-5 sm:p-6">
                        {faqs.map((faq, i) => (
                            <FaqItem
                                key={i}
                                question={faq.q}
                                answer={faq.a}
                                isOpen={openFaq === i}
                                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════  CONTACT SECTION  ═══════════ */}
            <section ref={contactRef} id="contact" className="relative py-20 sm:py-28">
                <div className="max-w-5xl mx-auto px-5 sm:px-8">
                    <div className="contact-header text-center mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blurple mb-3">Contact</p>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                            Get in touch
                        </h2>
                        <p className="text-base text-discord-muted max-w-md mx-auto">
                            Have questions or need help? We'd love to hear from you.
                        </p>
                    </div>

                    <div className="contact-grid grid sm:grid-cols-3 gap-4">
                        {[
                            { icon: Mail, title: 'Email Us', desc: 'hello@circlecore.io', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/10' },
                            { icon: MessageSquare, title: 'Community', desc: 'Join our public forum', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/10' },
                            { icon: MapPin, title: 'Location', desc: 'Worldwide & Remote', color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/10' },
                        ].map((contact) => (
                            <div key={contact.title}
                                className="contact-card bg-discord-darker/80 border border-discord-border/50 rounded-xl p-6 text-center
                                    hover:border-discord-border transition-all duration-300 group cursor-pointer">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.bg} flex items-center justify-center mx-auto mb-4
                                    group-hover:scale-110 transition-transform duration-300`}>
                                    <contact.icon className={`w-5 h-5 ${contact.color}`} strokeWidth={2} />
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">{contact.title}</h3>
                                <p className="text-xs text-discord-muted">{contact.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════  FOOTER  ═══════════ */}
            <footer ref={footerRef} className="relative bg-discord-darkest border-t border-white/[0.06] pt-12 pb-6">
                <div className="max-w-6xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
                        {/* Brand Column */}
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blurple flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </div>
                                <span className="text-sm font-bold text-white">CircleCore</span>
                            </div>
                            <p className="text-xs text-discord-faint leading-relaxed max-w-[200px]">
                                Invite-only communities for serious builders and creators.
                            </p>
                        </div>

                        {/* Link Columns */}
                        {footerColumns.map((col) => (
                            <div key={col.heading}>
                                <h5 className="text-[11px] font-bold uppercase tracking-[0.15em] text-discord-muted mb-3">
                                    {col.heading}
                                </h5>
                                <div className="space-y-2">
                                    {col.links.map((link) => (
                                        <button
                                            key={link.label}
                                            onClick={link.onClick || (link.href ? () => scrollTo(link.href.replace('#', '')) : undefined)}
                                            className="w-full text-left text-sm text-discord-faint hover:text-discord-light transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            {link.icon && <link.icon className="w-3.5 h-3.5 text-discord-faint" strokeWidth={2} />}
                                            {link.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-white/[0.06] pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-discord-faint">© {new Date().getFullYear()} CircleCore. All rights reserved.</p>
                        <p className="text-xs text-discord-faint">Invite-only communities for serious builders.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
