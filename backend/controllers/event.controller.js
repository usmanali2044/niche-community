import Event from "../models/event.model.js";
import Community from "../models/community.model.js";
import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { io } from "../socket.js";

const resolveRolePermissions = async (req) => {
    const roleIds = req.communityMembership?.roles || [];
    if (!roleIds.length) return {};
    const community = await Community.findById(req.communityId).select("roles").lean();
    if (!community) return {};
    const roleMap = new Map((community.roles || []).map((r) => [r._id.toString(), r.permissions || {}]));
    return roleIds.reduce((acc, roleId) => {
        const perms = roleMap.get(roleId?.toString?.() || String(roleId));
        if (!perms) return acc;
        Object.keys(perms).forEach((key) => {
            if (perms[key]) acc[key] = true;
        });
        return acc;
    }, {});
};

// Helper — enrich events with creator profile info
async function enrichEvents(events) {
    const creatorIds = [...new Set(events.map((e) => e.creatorId._id.toString()))];
    const profiles = await Profile.find({ userId: { $in: creatorIds } }).lean();
    const profileMap = {};
    profiles.forEach((p) => { profileMap[p.userId.toString()] = p; });

    return events.map((event) => ({
        ...event,
        creator: {
            _id: event.creatorId._id,
            name: event.creatorId.name,
            email: event.creatorId.email,
            avatar: profileMap[event.creatorId._id.toString()]?.avatar || "",
        },
    }));
}

// ── Get Upcoming Events ─────────────────────────────────────────────────────
export const getEvents = async (req, res) => {
    try {
        const events = await Event.find({ communityId: req.communityId, date: { $gte: new Date() } })
            .sort({ date: 1 })
            .populate("creatorId", "name email")
            .lean();

        const enriched = await enrichEvents(events);

        res.status(200).json({ success: true, events: enriched });
    } catch (error) {
        console.log("Error in getEvents:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Create Event ────────────────────────────────────────────────────────────
export const createEvent = async (req, res) => {
    try {
        const rolePermissions = await resolveRolePermissions(req);
        const canCreateEvent = ["admin", "moderator"].includes(req.communityRole) || rolePermissions.createEvents;
        if (!canCreateEvent) {
            return res.status(403).json({ success: false, message: "You do not have permission to create events" });
        }
        const { title, description, date, location, startDate, endDate, coverImage, locationType } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Event title is required" });
        }
        const baseDate = startDate || date;
        if (!baseDate) {
            return res.status(400).json({ success: false, message: "Event start date is required" });
        }
        if (!location || !location.trim()) {
            return res.status(400).json({ success: false, message: "Event location is required" });
        }

        const start = new Date(baseDate);
        if (Number.isNaN(start.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid start date" });
        }
        const end = endDate ? new Date(endDate) : null;
        if (end && Number.isNaN(end.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid end date" });
        }
        if (end && end.getTime() <= start.getTime()) {
            return res.status(400).json({ success: false, message: "End time must be after start time" });
        }

        const targetCommunityId = req.communityId;

        const event = await Event.create({
            communityId: targetCommunityId,
            creatorId: req.userId,
            title: title.trim(),
            description: description?.trim() || "",
            date: start,
            startDate: start,
            endDate: end || undefined,
            location: location?.trim() || "",
            locationType: locationType || "somewhere_else",
            coverImage: coverImage || "",
        });

        const populated = await Event.findById(event._id)
            .populate("creatorId", "name email")
            .lean();

        const [enriched] = await enrichEvents([populated]);

        // Emit real-time event
        io.to("events").emit("new_event", enriched);

        // ── Event invite notifications (broadcast) ────────────────────────
        try {
            const community = await Community.findById(targetCommunityId)
                .select("members name")
                .lean();
            const memberIds = (community?.members || [])
                .map((id) => id?.toString?.() || String(id))
                .filter((id) => id && id !== req.userId);

            for (const memberId of memberIds) {
                try {
                    const notification = await Notification.create({
                        userId: memberId,
                        type: "event",
                        meta: {
                            communityId: targetCommunityId,
                            communityName: community?.name || "",
                            eventId: event._id,
                            eventTitle: event.title,
                            startDate: event.startDate || event.date,
                        },
                    });
                    io.to(`user:${memberId}`).emit("new_notification", notification);
                } catch (notifErr) {
                    console.log("⚠️  Failed to create event invite notification:", notifErr);
                }
            }
        } catch (notifErr) {
            console.log("⚠️  Failed to broadcast event notifications:", notifErr);
        }

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event: enriched,
        });
    } catch (error) {
        console.log("Error in createEvent:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Toggle RSVP ─────────────────────────────────────────────────────────────
export const toggleRsvp = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const userId = req.userId;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }
        if (event.communityId.toString() !== req.communityId) {
            return res.status(403).json({ success: false, message: "Community mismatch" });
        }

        const alreadyRsvped = event.rsvpList.map((id) => id.toString()).includes(userId);

        if (alreadyRsvped) {
            event.rsvpList.pull(userId);
        } else {
            event.rsvpList.push(userId);
        }

        await event.save();

        const rsvpData = {
            eventId,
            rsvpList: event.rsvpList,
            userId,
            action: alreadyRsvped ? "unrsvp" : "rsvp",
        };

        // Emit real-time event
        io.to("events").emit("rsvp_update", rsvpData);

        res.status(200).json({ success: true, ...rsvpData });
    } catch (error) {
        console.log("Error in toggleRsvp:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Delete Event (admin only) ───────────────────────────────────────────────
export const deleteEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        if (req.communityRole !== 'admin') {
            return res.status(403).json({ success: false, message: "Only admins can delete events" });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }
        if (event.communityId.toString() !== req.communityId) {
            return res.status(403).json({ success: false, message: "Community mismatch" });
        }

        await Event.findByIdAndDelete(eventId);

        try {
            io.to("events").emit("event_deleted", { eventId });
        } catch { }

        res.status(200).json({ success: true, eventId });
    } catch (error) {
        console.log("Error in deleteEvent:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Start Event (creator or admin) ──────────────────────────────────────────
export const startEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const userId = req.userId;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });
        if (event.communityId.toString() !== req.communityId) {
            return res.status(403).json({ success: false, message: "Community mismatch" });
        }

        const isCreator = event.creatorId.toString() === userId;
        const isAdmin = req.communityRole === 'admin';
        const isModerator = req.communityRole === 'moderator';
        if (!isCreator && !isAdmin && !isModerator) {
            return res.status(403).json({ success: false, message: "Not allowed to start this event" });
        }

        event.status = 'live';
        event.startedAt = new Date();
        await event.save();

        const populated = await Event.findById(event._id).populate("creatorId", "name email").lean();
        const [enriched] = await enrichEvents([populated]);

        try {
            io.to("events").emit("event_started", enriched);
        } catch { }

        res.status(200).json({ success: true, event: enriched });
    } catch (error) {
        console.log("Error in startEvent:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── End Event (creator or admin/mod) ───────────────────────────────────────
export const endEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const userId = req.userId;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });
        if (event.communityId.toString() !== req.communityId) {
            return res.status(403).json({ success: false, message: "Community mismatch" });
        }

        const isCreator = event.creatorId.toString() === userId;
        const isAdmin = req.communityRole === 'admin';
        const isModerator = req.communityRole === 'moderator';
        if (!isCreator && !isAdmin && !isModerator) {
            return res.status(403).json({ success: false, message: "Not allowed to end this event" });
        }

        event.status = 'ended';
        event.endedAt = new Date();
        await event.save();

        const populated = await Event.findById(event._id).populate("creatorId", "name email").lean();
        const [enriched] = await enrichEvents([populated]);

        try {
            io.to("events").emit("event_ended", enriched);
        } catch { }

        res.status(200).json({ success: true, event: enriched });
    } catch (error) {
        console.log("Error in endEvent:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Update Event (creator or admin) ─────────────────────────────────────────
export const updateEvent = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const userId = req.userId;
        const { title, description, location, startDate, endDate, coverImage } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });
        if (event.communityId.toString() !== req.communityId) {
            return res.status(403).json({ success: false, message: "Community mismatch" });
        }

        const isCreator = event.creatorId.toString() === userId;
        const isAdmin = req.communityRole === 'admin';
        if (!isCreator && !isAdmin) {
            return res.status(403).json({ success: false, message: "Not allowed to edit this event" });
        }

        if (title && title.trim()) event.title = title.trim();
        if (description !== undefined) event.description = description?.trim() || "";
        if (location && location.trim()) event.location = location.trim();
        const nextStart = startDate ? new Date(startDate) : (event.startDate || event.date);
        const nextEnd = endDate ? new Date(endDate) : event.endDate;
        if (startDate && Number.isNaN(nextStart.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid start date" });
        }
        if (endDate && Number.isNaN(nextEnd.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid end date" });
        }
        if (nextEnd && nextStart && nextEnd.getTime() <= nextStart.getTime()) {
            return res.status(400).json({ success: false, message: "End time must be after start time" });
        }
        if (startDate) {
            event.startDate = nextStart;
            event.date = nextStart;
        }
        if (endDate) event.endDate = nextEnd;
        if (coverImage !== undefined) event.coverImage = coverImage || "";

        await event.save();

        const populated = await Event.findById(event._id).populate("creatorId", "name email").lean();
        const [enriched] = await enrichEvents([populated]);

        try {
            io.to("events").emit("event_updated", enriched);
        } catch { }

        res.status(200).json({ success: true, event: enriched });
    } catch (error) {
        console.log("Error in updateEvent:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
