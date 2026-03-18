import { useEffect, useRef } from 'react';

const VoiceAudioPlayer = ({ stream, muted = false }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.srcObject = stream || null;
    }, [stream]);

    return <audio ref={audioRef} autoPlay playsInline muted={muted} />;
};

export default VoiceAudioPlayer;
