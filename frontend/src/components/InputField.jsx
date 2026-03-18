import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable InputField component — Discord dark theme
 *
 * @param {string} label
 * @param {string} error - error message to display
 * @param {React.ReactNode} icon - optional left icon
 * @param {'text' | 'password' | 'email'} type
 */
const InputField = forwardRef(
    (
        {
            label,
            error,
            icon,
            type = 'text',
            className = '',
            ...props
        },
        ref,
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className={`w-full ${className}`}>
                {label && (
                    <label className="block text-xs font-bold text-discord-muted uppercase tracking-wide mb-2">
                        {label}
                    </label>
                )}

                <div className="relative">
                    {icon && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-discord-faint pointer-events-none">
                            {icon}
                        </span>
                    )}

                    <input
                        ref={ref}
                        type={inputType}
                        className={`
              w-full rounded-lg bg-discord-darkest text-discord-white font-medium
              placeholder:text-discord-faint/60 outline-none
              transition-all duration-200 border
              focus:ring-2 focus:ring-blurple/50
              ${icon ? 'pl-10 pr-4' : 'px-3.5'}
              ${isPassword ? 'pr-10' : ''}
              ${error
                                ? 'border-discord-red/50 focus:border-discord-red focus:ring-discord-red/30'
                                : 'border-discord-darkest focus:border-blurple'}
              py-2.5 text-sm
            `}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-discord-faint hover:text-discord-light transition-colors cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword
                                ? <EyeOff className="w-4 h-4" strokeWidth={2} />
                                : <Eye className="w-4 h-4" strokeWidth={2} />
                            }
                        </button>
                    )}
                </div>

                {error && (
                    <p className="mt-1.5 text-xs font-medium text-discord-red flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    },
);

InputField.displayName = 'InputField';

export default InputField;
