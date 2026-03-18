import { Link } from 'react-router-dom';
import { CircleOff } from 'lucide-react';
import Button from '../components/Button';

const UpgradeCancelPage = () => {
    return (
        <div className="min-h-screen min-h-[100dvh] bg-discord-darkest flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-discord-darker border border-discord-border/50 rounded-3xl p-8 text-center shadow-xl">
                <CircleOff className="w-12 h-12 text-discord-faint mx-auto mb-3" />
                <h1 className="text-2xl font-black text-white mb-2">Checkout Canceled</h1>
                <p className="text-sm text-discord-muted mb-6">No worries. Your plan was not changed.</p>
                <div className="flex flex-col gap-2">
                    <Link to="/upgrade"><Button variant="primary" fullWidth>Try Again</Button></Link>
                    <Link to="/feed"><Button variant="ghost" fullWidth>Back to Feed</Button></Link>
                </div>
            </div>
        </div>
    );
};

export default UpgradeCancelPage;
