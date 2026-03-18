import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.length === 0) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    },
});

// ── Redis Adapter (optional — graceful fallback for dev) ─────────────────────
async function attachRedisAdapter() {
    try {
        const { createAdapter } = await import("@socket.io/redis-adapter");
        const { default: Redis } = await import("ioredis");

        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

        // Upstash / cloud Redis uses rediss:// (TLS) — ioredis needs `tls` enabled
        const useTls = redisUrl.startsWith("rediss://");
        const redisOpts = {
            maxRetriesPerRequest: null, // required by @socket.io/redis-adapter
            ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
        };

        const pubClient = new Redis(redisUrl, redisOpts);
        const subClient = pubClient.duplicate();

        await Promise.all([
            new Promise((resolve, reject) => {
                pubClient.on("ready", resolve);
                pubClient.on("error", reject);
            }),
            new Promise((resolve, reject) => {
                subClient.on("ready", resolve);
                subClient.on("error", reject);
            }),
        ]);

        io.adapter(createAdapter(pubClient, subClient));
        console.log("✅ Socket.io Redis adapter connected");
    } catch (error) {
        console.log("⚠️  Redis not available — running Socket.io in-memory (fine for dev)");
        console.log("   Reason:", error.message || error);
    }
}

attachRedisAdapter();

// ── Socket Events ────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a community room for scoped broadcasts
    socket.on("join_community_room", (communityId) => {
        if (communityId) {
            socket.join(`community:${communityId}`);
            console.log(`   → ${socket.id} joined room community:${communityId}`);
        }
    });

    // Join a global feed room (for dev, since we have one community)
    socket.on("join_feed", () => {
        socket.join("feed");
        console.log(`   → ${socket.id} joined feed room`);
    });

    // Join the events room for real-time event updates
    socket.on("join_events", () => {
        socket.join("events");
        console.log(`   → ${socket.id} joined events room`);
    });

    // Join a user-specific room for personal notifications
    socket.on("join_user_room", (userId) => {
        if (userId) {
            socket.join(`user:${userId}`);
            console.log(`   → ${socket.id} joined room user:${userId}`);
        }
    });

    // Join a DM thread room
    socket.on("join_dm", (threadId) => {
        if (threadId) {
            socket.join(`dm:${threadId}`);
        }
    });

    // Join a channel room for realtime chat
    socket.on("join_channel", (channelId) => {
        if (channelId) {
            socket.join(`channel:${channelId}`);
        }
    });

    socket.on("channel:typing", ({ channelId, userId, isTyping }) => {
        if (channelId) {
            socket.to(`channel:${channelId}`).emit("channel:typing", { channelId, userId, isTyping });
        }
    });

    // Typing indicator
    socket.on("dm:typing", ({ threadId, userId, isTyping }) => {
        if (threadId) {
            socket.to(`dm:${threadId}`).emit("dm:typing", { threadId, userId, isTyping });
        }
    });

    // ── Voice Channels (WebRTC signaling) ───────────────────────────────────
    if (!io.voiceState) {
        io.voiceState = {
            channels: new Map(), // channelId -> Map(socketId -> user)
            socketToChannel: new Map(),
        };
    }

    const emitVoiceMembers = (channelId) => {
        const channelKey = channelId?.toString?.() || String(channelId);
        const channelMap = io.voiceState.channels.get(channelKey);
        const members = channelMap
            ? Array.from(channelMap.entries()).map(([sid, info]) => ({
                  socketId: sid,
                  ...info,
              }))
            : [];
        io.to(`voice:${channelKey}`).emit("voice:members", { channelId: channelKey, members });
    };

    const leaveVoiceChannel = () => {
        const currentChannel = io.voiceState.socketToChannel.get(socket.id);
        if (!currentChannel) return;
        const channelMap = io.voiceState.channels.get(currentChannel);
        if (channelMap) {
            channelMap.delete(socket.id);
            if (channelMap.size === 0) {
                io.voiceState.channels.delete(currentChannel);
            }
        }
        io.voiceState.socketToChannel.delete(socket.id);
        socket.leave(`voice:${currentChannel}`);
        socket.to(`voice:${currentChannel}`).emit("voice:peer-left", { socketId: socket.id });
        emitVoiceMembers(currentChannel);
    };

    socket.on("voice:join", ({ channelId, user }) => {
        if (!channelId) return;
        const channelKey = channelId?.toString?.() || String(channelId);
        leaveVoiceChannel();
        socket.join(`voice:${channelKey}`);

        const channelMap = io.voiceState.channels.get(channelKey) || new Map();
        channelMap.set(socket.id, {
            userId: user?.userId || null,
            displayName: user?.displayName || "Member",
            avatar: user?.avatar || "",
        });
        io.voiceState.channels.set(channelKey, channelMap);
        io.voiceState.socketToChannel.set(socket.id, channelKey);

        const peers = Array.from(channelMap.entries())
            .filter(([sid]) => sid !== socket.id)
            .map(([sid, info]) => ({ socketId: sid, ...info }));

        socket.emit("voice:peers", { channelId: channelKey, peers });
        socket.to(`voice:${channelKey}`).emit("voice:peer-joined", {
            socketId: socket.id,
            userId: user?.userId || null,
            displayName: user?.displayName || "Member",
            avatar: user?.avatar || "",
        });
        emitVoiceMembers(channelKey);
    });

    socket.on("voice:leave", () => {
        leaveVoiceChannel();
    });

    socket.on("voice:signal", ({ to, data }) => {
        if (!to) return;
        io.to(to).emit("voice:signal", { from: socket.id, data });
    });

    socket.on("voice:share-stop", ({ channelId }) => {
        if (!channelId) return;
        socket.to(`voice:${channelId}`).emit("voice:share-stopped", { socketId: socket.id });
    });

    socket.on("disconnect", () => {
        leaveVoiceChannel();
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

export { io, app, server };
