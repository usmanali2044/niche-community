import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const InviteLinkPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isCheckingAuth } = useAuthStore();

    useEffect(() => {
        if (isCheckingAuth) return;
        const raw = searchParams.get('code') || '';
        const code = raw.trim().toUpperCase();
        if (!code) {
            navigate('/invite', { replace: true });
            return;
        }
        if (user) {
            if (user.isInviteVerified) {
                navigate(`/join-community?code=${encodeURIComponent(code)}`, { replace: true });
            } else {
                navigate(`/invite?code=${encodeURIComponent(code)}`, { replace: true });
            }
            return;
        }
        navigate(`/signup?code=${encodeURIComponent(code)}`, { replace: true });
    }, [isCheckingAuth, navigate, searchParams, user]);

    return (
        <div className="min-h-screen min-h-[100dvh] bg-discord-darkest flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-3 border-blurple border-t-transparent animate-spin" />
        </div>
    );
};

export default InviteLinkPage;
