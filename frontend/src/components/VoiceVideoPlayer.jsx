import { forwardRef, useEffect, useRef } from 'react';

const VoiceVideoPlayer = forwardRef(({ stream, muted = true, id, className = '' }, forwardedRef) => {
    const innerRef = useRef(null);
    const videoRef = forwardedRef || innerRef;

    useEffect(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream || null;
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            id={id}
            className={className || "w-full h-full object-cover rounded-xl"}
        />
    );
});

VoiceVideoPlayer.displayName = 'VoiceVideoPlayer';

export default VoiceVideoPlayer;
