import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useAuthStore } from '../stores/authStore';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { resetPassword, isLoading, error, clearError } = useAuthStore();

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => { clearError(); }, []);

    const getStrength = (pw) => {
        if (!pw) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 6) score++;
        if (pw.length >= 10) score++;
        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
        if (/\d/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-discord-red' };
        if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-discord-yellow' };
        if (score <= 3) return { level: 3, label: 'Good', color: 'bg-blurple' };
        return { level: 4, label: 'Strong', color: 'bg-discord-green' };
    };

    const strength = getStrength(password);

    const validate = () => {
        const errs = {};
        if (!password) errs.password = 'Password is required';
        else if (password.length < 6) errs.password = 'Must be at least 6 characters';
        if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
        else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch { /* error set in store */ }
    };

    return (
        <div className="min-h-screen min-h-[100dvh] bg-discord-darkest relative overflow-hidden flex flex-col">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-28 -right-24 w-72 h-72 rounded-full bg-blurple/[0.08] blur-[100px]" />
                <div className="absolute bottom-[30%] -left-20 w-56 h-56 rounded-full bg-indigo-600/[0.05] blur-[80px]" />
            </div>

            <header className={`relative z-10 flex items-center justify-between px-5 sm:px-8 py-4
                transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blurple flex items-center justify-center shadow-lg shadow-blurple/25">
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-white">CircleCore</span>
                </Link>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-10">
                <div className={`mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-blurple shadow-lg shadow-blurple/30 flex items-center justify-center">
                            <Lock className="w-7 h-7 text-white" strokeWidth={2} />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-blurple/20 blur-xl -z-10 animate-pulse-glow" />
                    </div>
                </div>

                <div className={`text-center mb-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">Set New Password</h1>
                    <p className="text-sm sm:text-base text-discord-muted font-medium max-w-xs mx-auto">
                        Choose a strong password for your account.
                    </p>
                </div>

                <section className={`w-full max-w-[420px] mx-auto transition-all duration-700 delay-300
                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="relative bg-discord-darker rounded-xl p-6 sm:p-8 shadow-2xl shadow-black/20 border border-discord-border/50">
                        {success ? (
                            <div className="text-center py-6 animate-scale-in">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-discord-green/10 flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-discord-green" strokeWidth={2} />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Password Reset!</h2>
                                <p className="text-sm text-discord-muted">Redirecting you to login…</p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-5 px-4 py-3 bg-discord-red/10 border border-discord-red/20 rounded-lg text-sm text-discord-red font-medium text-center animate-shake">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <InputField id="reset-password" label="New Password" type="password"
                                            placeholder="••••••••" value={password}
                                            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                                            error={errors.password} icon={<Lock className="w-4 h-4" strokeWidth={2} />} />
                                        {password && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 flex gap-1">
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <div key={i}
                                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-discord-border'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-[11px] font-semibold text-discord-muted">{strength.label}</span>
                                            </div>
                                        )}
                                    </div>

                                    <InputField id="reset-confirm-password" label="Confirm Password" type="password"
                                        placeholder="••••••••" value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
                                        error={errors.confirmPassword} icon={<Lock className="w-4 h-4" strokeWidth={2} />} />

                                    <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}
                                        icon={!isLoading && <ShieldCheck className="w-4 h-4" strokeWidth={2} />}>
                                        {isLoading ? 'Resetting…' : 'Reset Password'}
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>

                    <div className={`text-center mt-6 transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-discord-muted hover:text-white transition-colors font-medium">
                            <ArrowLeft className="w-4 h-4" /> Back to login
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ResetPasswordPage;
