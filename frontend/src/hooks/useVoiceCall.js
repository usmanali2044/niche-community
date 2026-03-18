import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const TURN_URLS = (import.meta.env.VITE_TURN_URL || '').split(',').map((u) => u.trim()).filter(Boolean);
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || '';
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || '';

const TURN_SERVERS = TURN_URLS.length > 0
    ? TURN_URLS.map((url) => ({
        urls: url,
        ...(TURN_USERNAME ? { username: TURN_USERNAME } : {}),
        ...(TURN_CREDENTIAL ? { credential: TURN_CREDENTIAL } : {}),
    }))
    : [];

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...TURN_SERVERS,
];
const AUDIO_CONSTRAINTS = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
};

const buildLocalUser = (user, profile) => ({
    userId: user?._id || null,
    displayName: profile?.displayName || user?.name || 'Member',
    avatar: profile?.avatar || '',
});

const useVoiceCall = (socket, user, profile) => {
    const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [remoteMedia, setRemoteMedia] = useState([]);
    const [remoteVideos, setRemoteVideos] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [noiseReduction, setNoiseReduction] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [elapsed, setElapsed] = useState(0);

    const localStreamRef = useRef(null);
    const rawStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peersRef = useRef(new Map());
    const timersRef = useRef(null);
    const audioCtxRef = useRef(null);

    const ensureAudioConstraints = useCallback(async (stream) => {
        const track = stream?.getAudioTracks?.()[0];
        if (!track || typeof track.applyConstraints !== 'function') return;
        try {
            await track.applyConstraints(AUDIO_CONSTRAINTS);
        } catch {
            // ignore unsupported constraints
        }
    }, []);

    const playTone = useCallback((frequency, duration = 0.08, type = 'sine', gainValue = 0.04) => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            gain.gain.value = gainValue;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + duration);
        } catch {
            // ignore sound errors
        }
    }, []);

    const buildProcessedStream = useCallback((rawStream) => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            const source = ctx.createMediaStreamSource(rawStream);
            const highpass = ctx.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 80;
            const lowpass = ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 12000;
            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.value = -28;
            compressor.knee.value = 24;
            compressor.ratio.value = 4;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;
            const gain = ctx.createGain();
            gain.gain.value = 1.0;

            const destination = ctx.createMediaStreamDestination();
            source.connect(highpass);
            highpass.connect(lowpass);
            lowpass.connect(compressor);
            compressor.connect(gain);
            gain.connect(destination);

            return destination.stream;
        } catch {
            return rawStream;
        }
    }, []);

    const applyLocalAudioTrack = useCallback((stream) => {
        const track = stream?.getAudioTracks?.()[0];
        if (!track) return;
        peersRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio');
            if (sender) {
                sender.replaceTrack(track);
            } else {
                pc.addTrack(track, stream);
            }
        });
    }, []);

    const refreshLocalAudioStream = useCallback((enabled) => {
        if (!rawStreamRef.current) return;
        localStreamRef.current = enabled ? buildProcessedStream(rawStreamRef.current) : rawStreamRef.current;
        localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = !isMuted;
        });
        applyLocalAudioTrack(localStreamRef.current);
    }, [applyLocalAudioTrack, buildProcessedStream, isMuted]);

    const updateElapsed = useCallback(() => {
        if (!startTime) return;
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, [startTime]);

    useEffect(() => {
        if (!startTime) {
            setElapsed(0);
            if (timersRef.current) clearInterval(timersRef.current);
            timersRef.current = null;
            return;
        }
        updateElapsed();
        timersRef.current = setInterval(updateElapsed, 1000);
        return () => {
            if (timersRef.current) clearInterval(timersRef.current);
            timersRef.current = null;
        };
    }, [startTime, updateElapsed]);

    const attachRemoteStream = useCallback((socketId, stream) => {
        setRemoteMedia((prev) => {
            const filtered = prev.filter((item) => item.socketId !== socketId);
            return [...filtered, { socketId, stream }];
        });
    }, []);

    const removeRemoteStream = useCallback((socketId) => {
        setRemoteMedia((prev) => prev.filter((item) => item.socketId !== socketId));
        setRemoteVideos((prev) => prev.filter((item) => item.socketId !== socketId));
    }, []);

    const createPeerConnection = useCallback(
        (socketId) => {
            if (peersRef.current.has(socketId)) return peersRef.current.get(socketId);
            const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
            peersRef.current.set(socketId, pc);

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, screenStreamRef.current));
            }

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket?.emit('voice:signal', { to: socketId, data: { type: 'candidate', candidate: event.candidate } });
                }
            };

            pc.onnegotiationneeded = async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket?.emit('voice:signal', { to: socketId, data: { type: 'offer', sdp: pc.localDescription } });
                } catch {
                    // ignore
                }
            };

            pc.ontrack = (event) => {
                if (event.streams?.[0]) {
                    if (event.track.kind === 'video') {
                        setRemoteVideos((prev) => {
                            const filtered = prev.filter((item) => item.socketId !== socketId);
                            return [...filtered, { socketId, stream: event.streams[0] }];
                        });
                        event.track.onended = () => {
                            setRemoteVideos((prev) => prev.filter((item) => item.socketId !== socketId));
                        };
                    } else {
                        attachRemoteStream(socketId, event.streams[0]);
                    }
                }
            };

            pc.onconnectionstatechange = () => {
                if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                    removeRemoteStream(socketId);
                }
            };

            return pc;
        },
        [socket, attachRemoteStream, removeRemoteStream]
    );

    const closePeerConnection = useCallback((socketId) => {
        const pc = peersRef.current.get(socketId);
        if (pc) {
            pc.onicecandidate = null;
            pc.ontrack = null;
            pc.close();
        }
        peersRef.current.delete(socketId);
        removeRemoteStream(socketId);
    }, [removeRemoteStream]);

    const joinVoice = useCallback(
        async (channel) => {
            if (!socket || !channel?._id) return;
            if (activeVoiceChannel?._id === channel._id) return;
            if (activeVoiceChannel?._id && activeVoiceChannel._id !== channel._id) {
                socket.emit('voice:leave');
                peersRef.current.forEach((_, key) => closePeerConnection(key));
                peersRef.current.clear();
                if (rawStreamRef.current) {
                    rawStreamRef.current.getTracks().forEach((track) => track.stop());
                    rawStreamRef.current = null;
                }
                localStreamRef.current = null;
                setParticipants([]);
                setRemoteMedia([]);
            }

            try {
                if (!localStreamRef.current) {
                    rawStreamRef.current = await navigator.mediaDevices.getUserMedia({
                        audio: AUDIO_CONSTRAINTS,
                        video: false,
                    });
                    await ensureAudioConstraints(rawStreamRef.current);
                    localStreamRef.current = noiseReduction ? buildProcessedStream(rawStreamRef.current) : rawStreamRef.current;
                } else {
                    await ensureAudioConstraints(rawStreamRef.current);
                }
            } catch (err) {
                console.error('Voice call: failed to access microphone', err);
                return;
            }

            localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = !isMuted;
            });

            setActiveVoiceChannel(channel);
            setStartTime(Date.now());
            const localUser = buildLocalUser(user, profile);
            setParticipants([{ socketId: 'local', ...localUser, isLocal: true }]);
            socket.emit('voice:join', { channelId: channel._id, user: localUser });
            playTone(760, 0.09, 'sine', 0.04);
        },
        [socket, user, profile, activeVoiceChannel, isMuted, playTone, buildProcessedStream, noiseReduction, ensureAudioConstraints]
    );

    const leaveVoice = useCallback(() => {
        if (!socket) return;
        socket.emit('voice:leave');
        peersRef.current.forEach((_, key) => closePeerConnection(key));
        peersRef.current.clear();
        if (rawStreamRef.current) {
            rawStreamRef.current.getTracks().forEach((track) => track.stop());
            rawStreamRef.current = null;
        }
        localStreamRef.current = null;
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }
        setParticipants([]);
        setRemoteMedia([]);
        setRemoteVideos([]);
        setActiveVoiceChannel(null);
        setStartTime(null);
        playTone(240, 0.12, 'sine', 0.05);
    }, [socket, closePeerConnection]);

    const stopScreenShare = useCallback(() => {
        if (!screenStreamRef.current) return;
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        setIsSharing(false);
        setRemoteVideos([]);
        if (activeVoiceChannel?._id) {
            socket?.emit('voice:share-stop', { channelId: activeVoiceChannel._id });
        }
        peersRef.current.forEach((pc, socketId) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
            if (sender) {
                sender.replaceTrack(null);
            }
            try {
                pc.createOffer().then((offer) => {
                    pc.setLocalDescription(offer).then(() => {
                        socket?.emit('voice:signal', { to: socketId, data: { type: 'offer', sdp: pc.localDescription } });
                    });
                });
            } catch {
                // ignore
            }
        });
    }, [socket, activeVoiceChannel?._id]);

    const startScreenShare = useCallback(async () => {
        if (!activeVoiceChannel || !socket) return;
        try {
            if (!navigator.mediaDevices?.getDisplayMedia) {
                console.error('Screen share not supported in this browser');
                return;
            }
            if (!localStreamRef.current) {
                try {
                    rawStreamRef.current = await navigator.mediaDevices.getUserMedia({
                        audio: AUDIO_CONSTRAINTS,
                        video: false,
                    });
                    await ensureAudioConstraints(rawStreamRef.current);
                    localStreamRef.current = noiseReduction ? buildProcessedStream(rawStreamRef.current) : rawStreamRef.current;
                } catch {
                    // allow screen share even if mic access is denied
                }
            }
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            const [track] = screenStream.getVideoTracks();
            if (!track) return;
            screenStreamRef.current = screenStream;
            setIsSharing(true);

            peersRef.current.forEach((pc, socketId) => {
                const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(track);
                } else {
                    pc.addTrack(track, screenStream);
                }
                try {
                    pc.createOffer().then((offer) => {
                        pc.setLocalDescription(offer).then(() => {
                            socket.emit('voice:signal', { to: socketId, data: { type: 'offer', sdp: pc.localDescription } });
                        });
                    });
                } catch {
                    // ignore
                }
            });

            track.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error('Screen share failed', err);
            setIsSharing(false);
        }
    }, [activeVoiceChannel, socket, stopScreenShare, buildProcessedStream, noiseReduction, ensureAudioConstraints]);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((track) => {
                    track.enabled = !next;
                });
            }
            playTone(next ? 420 : 620, 0.06, 'triangle', 0.035);
            return next;
        });
    }, [playTone]);

    const toggleDeafen = useCallback(() => {
        setIsDeafened((prev) => {
            const next = !prev;
            playTone(next ? 360 : 520, 0.06, 'triangle', 0.03);
            return next;
        });
    }, [playTone]);

    const toggleNoiseReduction = useCallback(() => {
        setNoiseReduction((prev) => {
            const next = !prev;
            refreshLocalAudioStream(next);
            return next;
        });
    }, [refreshLocalAudioStream]);

    const connectedPeerIds = useMemo(() => {
        const ids = new Set();
        remoteMedia.forEach((item) => ids.add(item.socketId));
        remoteVideos.forEach((item) => ids.add(item.socketId));
        return Array.from(ids);
    }, [remoteMedia, remoteVideos]);

    useEffect(() => {
        if (!socket) return;

        const handlePeers = async ({ peers }) => {
            const localUser = buildLocalUser(user, profile);
            setParticipants([{ socketId: 'local', ...localUser, isLocal: true }, ...(peers || [])]);

            for (const peer of peers || []) {
                const pc = createPeerConnection(peer.socketId);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('voice:signal', { to: peer.socketId, data: { type: 'offer', sdp: pc.localDescription } });
            }
        };

        const handlePeerJoined = (peer) => {
            setParticipants((prev) => {
                if (prev.find((p) => p.socketId === peer.socketId)) return prev;
                return [...prev, peer];
            });
        };

        const handlePeerLeft = ({ socketId }) => {
            setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
            closePeerConnection(socketId);
        };

        const handleSignal = async ({ from, data }) => {
            const pc = createPeerConnection(from);
            if (data?.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('voice:signal', { to: from, data: { type: 'answer', sdp: pc.localDescription } });
            } else if (data?.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } else if (data?.type === 'candidate' && data.candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch {
                    // ignore
                }
            }
        };

        const handleMembers = ({ members }) => {
            if (!Array.isArray(members)) return;
            const localUser = buildLocalUser(user, profile);
            const localId = socket?.id;
            const next = members.map((m) => ({
                ...m,
                isLocal: localId ? m.socketId === localId : m.isLocal,
            }));
            if (localId && !next.some((m) => m.socketId === localId)) {
                next.unshift({ socketId: localId, ...localUser, isLocal: true });
            }
            setParticipants((prev) => {
                const merged = [...next];
                prev.forEach((p) => {
                    if (p.socketId === 'local' && localId) return;
                    if (!merged.some((m) => m.socketId === p.socketId)) merged.push(p);
                });
                return merged;
            });
        };

        const handleShareStopped = ({ socketId }) => {
            if (!socketId) return;
            setRemoteVideos((prev) => prev.filter((item) => item.socketId !== socketId));
        };

        socket.on('voice:peers', handlePeers);
        socket.on('voice:peer-joined', handlePeerJoined);
        socket.on('voice:peer-left', handlePeerLeft);
        socket.on('voice:signal', handleSignal);
        socket.on('voice:members', handleMembers);
        socket.on('voice:share-stopped', handleShareStopped);

        return () => {
            socket.off('voice:peers', handlePeers);
            socket.off('voice:peer-joined', handlePeerJoined);
            socket.off('voice:peer-left', handlePeerLeft);
            socket.off('voice:signal', handleSignal);
            socket.off('voice:members', handleMembers);
            socket.off('voice:share-stopped', handleShareStopped);
        };
    }, [socket, user, profile, createPeerConnection, closePeerConnection]);

    useEffect(() => {
        return () => {
            peersRef.current.forEach((_, key) => closePeerConnection(key));
            peersRef.current.clear();
            if (rawStreamRef.current) {
                rawStreamRef.current.getTracks().forEach((track) => track.stop());
                rawStreamRef.current = null;
            }
            localStreamRef.current = null;
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
                screenStreamRef.current = null;
            }
        };
    }, [closePeerConnection]);

    return {
        activeVoiceChannel,
        participants,
        remoteMedia,
        remoteVideos,
        isMuted,
        isDeafened,
        isSharing,
        noiseReduction,
        connectedPeerIds,
        elapsed,
        joinVoice,
        leaveVoice,
        toggleMute,
        toggleDeafen,
        toggleNoiseReduction,
        startScreenShare,
        stopScreenShare,
    };
};

export default useVoiceCall;
