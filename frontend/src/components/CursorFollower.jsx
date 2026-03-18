import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * A small blurple circle that follows the mouse cursor with smooth easeInOut lag.
 * Only renders on devices with a pointer (no touch-only).
 */
const CursorFollower = ({ size = 18, color = '#5865F2', opacity = 0.55 }) => {
    const dotRef = useRef(null);
    const pos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const dot = dotRef.current;
        if (!dot) return;

        // Hide on touch-only devices
        const mq = window.matchMedia('(pointer: fine)');
        if (!mq.matches) { dot.style.display = 'none'; return; }

        const onMove = (e) => {
            pos.current.x = e.clientX;
            pos.current.y = e.clientY;
        };

        // Smooth follow with GSAP quickTo for butter-smooth easeInOut lag
        const xTo = gsap.quickTo(dot, 'x', { duration: 0.5, ease: 'power2.out' });
        const yTo = gsap.quickTo(dot, 'y', { duration: 0.5, ease: 'power2.out' });

        const handleMove = (e) => {
            xTo(e.clientX - size / 2);
            yTo(e.clientY - size / 2);
        };

        // Scale up on interactive elements
        const handleEnterInteractive = () => {
            gsap.to(dot, { scale: 2.2, opacity: 0.25, duration: 0.3, ease: 'power2.out' });
        };
        const handleLeaveInteractive = () => {
            gsap.to(dot, { scale: 1, opacity: opacity, duration: 0.3, ease: 'power2.out' });
        };

        window.addEventListener('mousemove', handleMove);

        // Attach hover listeners to buttons/links
        const interactives = document.querySelectorAll('a, button, input, [role="button"]');
        interactives.forEach((el) => {
            el.addEventListener('mouseenter', handleEnterInteractive);
            el.addEventListener('mouseleave', handleLeaveInteractive);
        });

        return () => {
            window.removeEventListener('mousemove', handleMove);
            interactives.forEach((el) => {
                el.removeEventListener('mouseenter', handleEnterInteractive);
                el.removeEventListener('mouseleave', handleLeaveInteractive);
            });
        };
    }, [size, opacity]);

    return (
        <div
            ref={dotRef}
            className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-screen"
            style={{
                width: size,
                height: size,
                backgroundColor: color,
                opacity: opacity,
                boxShadow: `0 0 ${size}px ${color}80`,
                willChange: 'transform',
            }}
        />
    );
};

export default CursorFollower;
