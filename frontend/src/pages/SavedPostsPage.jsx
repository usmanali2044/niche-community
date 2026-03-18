import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Sparkles, ArrowLeft, LogOut } from 'lucide-react';
import Button from '../components/Button';
import PostCard from '../components/PostCard';
import NotificationBell from '../components/NotificationBell';
import { useFeedStore } from '../stores/feedStore';
import { useAuthStore } from '../stores/authStore';

const SavedPostsPage = () => {
    const [mounted, setMounted] = useState(false);
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const { fetchSavedPosts } = useFeedStore();
    const { user, logout } = useAuthStore();

    useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

    useEffect(() => {
        (async () => {
            try {
                const posts = await fetchSavedPosts();
                setSavedPosts(posts);
            } catch { }
            setLoading(false);
        })();
    }, []);

    const handleLogout = async () => { await logout(); navigate('/login'); };

    return (
        <div className="min-h-screen min-h-[100dvh] bg-discord-darkest relative overflow-hidden flex flex-col">
            {/* Ambient */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-28 -left-24 w-72 h-72 rounded-full bg-amber-500/[0.05] blur-[100px]" />
                <div className="absolute bottom-[20%] -right-20 w-56 h-56 rounded-full bg-blurple/[0.04] blur-[80px]" />
            </div>

            {/* Header */}
            <header className={`sticky top-0 z-30 bg-discord-darkest/80 backdrop-blur-xl border-b border-discord-border/30
                flex items-center justify-between px-4 sm:px-8 py-3.5
                transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
                <div className="flex items-center gap-2 shrink-0">
                    <Link to="/feed" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blurple flex items-center justify-center shadow-md shadow-blurple/20">
                            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold tracking-tight text-white hidden sm:inline">CircleCore</span>
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <Button variant="ghost" size="sm" onClick={() => navigate('/feed')}>
                        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                        <span className="hidden sm:inline ml-1">Back to Feed</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-3.5 h-3.5" strokeWidth={2} />}>
                        <span className="hidden sm:inline">Log Out</span>
                    </Button>
                </div>
            </header>

            {/* Body */}
            <main className="relative z-10 flex-1 w-full max-w-[700px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Title */}
                <div className={`mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                            <Bookmark className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Saved Posts</h1>
                            <p className="text-sm text-discord-muted font-medium">
                                {loading ? 'Loading…' : `${savedPosts.length} saved post${savedPosts.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
                    </div>
                )}

                {/* Empty state */}
                {!loading && savedPosts.length === 0 && (
                    <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="bg-discord-darker rounded-2xl border border-discord-border/50 p-10 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                                <Bookmark className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">No saved posts yet</h2>
                            <p className="text-sm text-discord-faint max-w-xs mx-auto mb-6">
                                Click the bookmark icon on any post to save it here for later.
                            </p>
                            <Button variant="primary" onClick={() => navigate('/feed')}>Browse Feed</Button>
                        </div>
                    </div>
                )}

                {/* Posts */}
                {!loading && savedPosts.length > 0 && (
                    <div className="space-y-4">
                        {savedPosts.map((post, i) => (
                            <div key={post._id}
                                className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                style={{ transitionDelay: `${200 + i * 60}ms` }}>
                                {post.communityName && (
                                    <p className="text-[10px] font-bold text-discord-faint uppercase tracking-wider mb-1.5 pl-1">
                                        from {post.communityName}
                                    </p>
                                )}
                                <PostCard post={post} />
                            </div>
                        ))}
                    </div>
                )}

                <div className="h-8" />
            </main>
        </div>
    );
};

export default SavedPostsPage;
