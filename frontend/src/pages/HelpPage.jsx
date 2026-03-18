import { useMemo, useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HelpCircle, Search, Mail, Sparkles, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const FaqItem = ({ question, answer, isOpen, onToggle }) => (
    <div className="border-b border-discord-border/50 last:border-0">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
        >
            <span className="text-sm sm:text-base font-semibold text-discord-white group-hover:text-blurple transition-colors">
                {question}
            </span>
            <ChevronDown
                className={`w-4 h-4 text-discord-faint transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
            />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 pb-4' : 'max-h-0'}`}>
            <p className="text-sm text-discord-light leading-relaxed">{answer}</p>
        </div>
    </div>
);

const HelpPage = () => {
    const [openFaq, setOpenFaq] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const faqs = useMemo(() => ([
        {
            q: 'How do I create a server?',
            a: 'Click the + button in the left sidebar, choose a template, and follow the setup steps.',
        },
        {
            q: 'How do I add friends?',
            a: 'Go to Friends → Add Friend and enter their user ID. They need to accept your request.',
        },
        {
            q: 'How do I invite users to my server?',
            a: 'Open the server menu and select Invite to Server. You can generate an invite code to share.',
        },
        {
            q: 'How do I create channels?',
            a: 'Click the + next to Text Channels, choose a type, and set a name.',
        },
        {
            q: 'How do I change my status?',
            a: 'Click your profile in the bottom-left and choose your status from the menu.',
        },
        {
            q: 'How do I create events?',
            a: 'Open the server menu → Create Event. Fill in the details and publish.',
        },
    ]), []);

    const filteredFaqs = useMemo(() => {
        if (!searchQuery.trim()) return faqs;
        const q = searchQuery.trim().toLowerCase();
        return faqs.filter((item) =>
            item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        );
    }, [faqs, searchQuery]);
    const heroRef = useRef(null);
    const searchRef = useRef(null);
    const faqRef = useRef(null);
    const supportRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(heroRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
            gsap.fromTo(searchRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' });
            if (faqRef.current) {
                gsap.fromTo(faqRef.current, { opacity: 0, y: 24 }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: faqRef.current, start: 'top 85%' },
                });
            }
            if (supportRef.current) {
                gsap.fromTo(supportRef.current, { opacity: 0, y: 24 }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: supportRef.current, start: 'top 85%' },
                });
            }
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className="min-h-screen bg-discord-darkest text-discord-white relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-blurple/[0.08] blur-[120px]" />
                <div className="absolute bottom-[20%] -left-24 w-80 h-80 rounded-full bg-indigo-600/[0.06] blur-[110px]" />
            </div>

            <header className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blurple flex items-center justify-center shadow-lg shadow-blurple/30">
                        <Sparkles className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-white">CircleCore</span>
                </Link>
                <Link to="/feed" className="text-sm font-semibold text-discord-faint hover:text-white">
                    Back to Feed
                </Link>
            </header>

            <main className="relative z-10 px-6 sm:px-10 pb-16">
                <section ref={heroRef} className="max-w-4xl mx-auto text-center mt-10">
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 rounded-full bg-discord-darker flex items-center justify-center border border-discord-border/50">
                            <HelpCircle className="w-6 h-6 text-blurple" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Help Center</h1>
                    <p className="text-sm sm:text-base text-discord-faint mt-3">
                        Find quick answers, tips, and guidance to get the most out of CircleCore.
                    </p>

                    <div ref={searchRef} className="mt-8 max-w-xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-faint" />
                            <input
                                type="text"
                                placeholder="Search help articles"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setOpenFaq(0);
                                }}
                                className="w-full bg-discord-darker border border-discord-border/50 rounded-xl py-3 pl-10 pr-4 text-sm text-discord-white placeholder:text-discord-faint/60 focus:outline-none focus:ring-2 focus:ring-blurple"
                            />
                        </div>
                    </div>
                </section>

                <section className="max-w-4xl mx-auto mt-12 grid gap-6">
                    <div ref={faqRef} className="rounded-2xl border border-discord-border/40 bg-discord-darker/60 p-6">
                        <h2 className="text-lg font-bold mb-4">Popular Questions</h2>
                        <div className="space-y-1">
                            {filteredFaqs.length === 0 && (
                                <div className="text-sm text-discord-faint py-4">No questions found.</div>
                            )}
                            {filteredFaqs.map((item, idx) => (
                                <FaqItem
                                    key={item.q}
                                    question={item.q}
                                    answer={item.a}
                                    isOpen={openFaq === idx}
                                    onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
                                />
                            ))}
                        </div>
                    </div>

                    <div ref={supportRef} className="rounded-2xl border border-discord-border/40 bg-discord-darker/60 p-6">
                        <h2 className="text-lg font-bold mb-3">Need more help?</h2>
                        <p className="text-sm text-discord-faint mb-4">
                            If you’re stuck, contact support and we’ll get back to you quickly.
                        </p>
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blurple text-white text-sm font-semibold hover:bg-blurple/90 transition">
                            <Mail className="w-4 h-4" />
                            Contact Support
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default HelpPage;
