import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ShieldCheck, RotateCw } from 'lucide-react';
import Button from '../components/Button';
import { useAuthStore } from '../stores/authStore';

const EmailVerificationPage = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [mounted, setMounted] = useState(false);
    const [success, setSuccess] = useState(false);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const { verifyEmail, isLoading, error, clearError } = useAuthStore();

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        clearError();
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (code.every((digit) => digit !== '')) handleSubmit();
    }, [code]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const verificationCode = code.join('');
        if (verificationCode.length !== 6) return;
        try {
            await verifyEmail(verificationCode);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 1500);
        } catch { /* error set in store */ }
    };

    const handleChange = (index, value) => {
        const newCode = [...code];
        if (value.length > 1) {
            const pasted = value.slice(0, 6).split('');
            for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || '';
            setCode(newCode);
            const next = newCode.findIndex((d) => d === '');
            inputRefs.current[next === -1 ? 5 : next]?.focus();
            return;
        }
        if (value && !/^\d$/.test(value)) return;
        newCode[index] = value;
        setCode(newCode);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
    };

    const handleReset = () => {
        setCode(['', '', '', '', '', '']);
        clearError();
        inputRefs.current[0]?.focus();
    };

    return (
        <div className="min-h-screen min-h-[100dvh] bg-discord-darkest relative overflow-hidden flex flex-col">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-28 -right-24 w-72 h-72 rounded-full bg-blurple/[0.08] blur-[100px]" />
                <div className="absolute bottom-[20%] -left-20 w-56 h-56 rounded-full bg-indigo-600/[0.05] blur-[80px]" />
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
                            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2} />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-blurple/20 blur-xl -z-10 animate-pulse-glow" />
                    </div>
                </div>

                <div className={`text-center mb-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">Verify Your Email</h1>
                    <p className="text-sm sm:text-base text-discord-muted font-medium max-w-xs mx-auto">
                        Enter the 6-digit code sent to your email address.
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
                                <h2 className="text-xl font-bold text-white mb-1">Email Verified!</h2>
                                <p className="text-sm text-discord-muted">Redirecting you to the app…</p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-5 px-4 py-3 bg-discord-red/10 border border-discord-red/20 rounded-lg text-sm text-discord-red font-medium text-center animate-shake">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                                        {code.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (inputRefs.current[index] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                value={digit}
                                                onChange={(e) => handleChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                className={`
                                                    w-11 h-13 sm:w-13 sm:h-15
                                                    text-center text-xl sm:text-2xl font-bold text-white
                                                    bg-discord-darkest border-2 rounded-lg
                                                    outline-none transition-all duration-200
                                                    focus:border-blurple focus:ring-2 focus:ring-blurple/30
                                                    ${error ? 'border-discord-red/50' : 'border-discord-border'}
                                                    ${digit ? 'border-blurple/50 bg-discord-darkest' : ''}
                                                `}
                                            />
                                        ))}
                                    </div>

                                    <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}
                                        disabled={code.some((d) => d === '')}
                                        icon={!isLoading && <ShieldCheck className="w-4 h-4" strokeWidth={2} />}>
                                        {isLoading ? 'Verifying…' : 'Verify Email'}
                                    </Button>
                                </form>

                                <div className="text-center mt-5">
                                    <button onClick={handleReset}
                                        className="inline-flex items-center gap-1.5 text-sm text-discord-muted hover:text-white transition-colors font-medium cursor-pointer">
                                        <RotateCw className="w-3.5 h-3.5" /> Clear & try again
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={`text-center mt-6 transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-discord-muted hover:text-white transition-colors font-medium">
                            <ArrowLeft className="w-4 h-4" /> Back to home
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default EmailVerificationPage;
