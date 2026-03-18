import { forwardRef } from 'react';

/**
 * Reusable Button component — Discord dark theme
 *
 * @param {'primary' | 'secondary' | 'ghost'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} fullWidth
 * @param {boolean} loading
 * @param {React.ReactNode} icon - optional icon element
 */
const Button = forwardRef(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            loading = false,
            disabled = false,
            icon,
            className = '',
            ...props
        },
        ref,
    ) => {
        const base =
            'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none';

        const variants = {
            primary:
                'bg-blurple text-white hover:bg-blurple-hover active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-blurple/25',
            secondary:
                'bg-discord-darker text-discord-light border border-discord-border hover:bg-discord-border-light active:scale-[0.98]',
            ghost:
                'bg-transparent text-discord-light hover:bg-white/[0.06] hover:text-discord-white active:scale-[0.98]',
        };

        const sizes = {
            sm: 'text-xs px-3.5 py-2',
            md: 'text-sm px-5 py-3',
            lg: 'text-base px-6 py-3.5',
        };

        const disabledStyles = 'opacity-40 cursor-not-allowed pointer-events-none';

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`
          ${base}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${disabled || loading ? disabledStyles : ''}
          ${className}
        `}
                {...props}
            >
                {loading ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        {children}
                    </>
                ) : (
                    <>
                        {icon && <span className="shrink-0">{icon}</span>}
                        {children}
                    </>
                )}
            </button>
        );
    },
);

Button.displayName = 'Button';

export default Button;
