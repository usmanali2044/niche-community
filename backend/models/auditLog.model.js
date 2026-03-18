import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true,
        index: true,
    },
    moderatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    actionType: {
        type: String,
        enum: ['warn', 'suspend', 'ban', 'unban', 'kick', 'delete_post', 'delete_message', 'blocklist_add', 'blocklist_remove', 'dismiss'],
        required: true,
    },
    reason: {
        type: String,
        default: '',
        trim: true,
    },
    // Flexible metadata: { duration, postId, postContent, suspensionEndDate, etc. }
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: { createdAt: true, updatedAt: false }, // immutable — no updates
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
