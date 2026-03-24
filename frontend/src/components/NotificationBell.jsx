import { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, AtSign, X, Check, Megaphone, ShieldAlert, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../stores/notificationStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useChannelStore } from '../stores/channelStore';
import { useChannelMessageStore } from '../stores/channelMessageStore';

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const navigate = useNavigate();
    const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
    const { setActiveCommunity } = useWorkspaceStore();
    const { setActiveChannel } = useChannelStore();
    const { setScrollTarget } = useChannelMessageStore();

    useEffect(() => { fetchNotifications().catch(() => { }); }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const iconForType = (type) => {
        switch (type) {
            case 'reply': return <MessageCircle className="w-4 h-4 text-blue-400" strokeWidth={2} />;
            case 'mention': return <AtSign className="w-4 h-4 text-blurple" strokeWidth={2} />;
            case 'admin': return <Megaphone className="w-4 h-4 text-amber-400" strokeWidth={2} />;
            case 'moderator':
            case 'warning': return <ShieldAlert className="w-4 h-4 text-red-400" strokeWidth={2} />;
            case 'event': return <Calendar className="w-4 h-4 text-emerald-400" strokeWidth={2} />;
            default: return <Bell className="w-4 h-4 text-blurple" strokeWidth={2} />;
        }
    };

    const labelForNotification = (notif) => {
        switch (notif.type) {
            case 'reply':
                return (
                    <>
                        <span className="font-bold text-discord-white">{notif.meta?.commenterName || 'Someone'}</span>
                        <span className="text-discord-light">
                            {notif.meta?.channelId ? ' replied to your message' : ' replied to your post'}
                        </span>
                    </>
                );
            case 'mention':
                return (<><span className="font-bold text-discord-white">{notif.meta?.mentionerName || 'Someone'}</span><span className="text-discord-light"> mentioned you</span></>);
            case 'event':
                return (<><span className="text-discord-light">You were invited to </span><span className="font-bold text-discord-white">{notif.meta?.eventTitle || 'an event'}</span></>);
            case 'admin':
                if (notif.meta?.action === 'invite_request') {
                    return (
                        <>
                            <span className="text-discord-light">New invite request from </span>
                            <span className="font-bold text-discord-white">{notif.meta?.requesterName || 'Member'}</span>
                            {notif.meta?.communityName && (
                                <span className="text-discord-light"> for </span>
                            )}
                            {notif.meta?.communityName && (
                                <span className="font-bold text-discord-white">{notif.meta?.communityName}</span>
                            )}
                        </>
                    );
                }
                if (notif.meta?.action === 'invite_approved') {
                    return (
                        <>
                            <span className="text-discord-light">Your invite was approved for </span>
                            <span className="font-bold text-discord-white">{notif.meta?.communityName || 'a server'}</span>
                        </>
                    );
                }
                if (notif.meta?.action === 'server_invite') {
                    return (
                        <>
                            <span className="text-discord-light">You were invited to join </span>
                            <span className="font-bold text-discord-white">{notif.meta?.communityName || 'a server'}</span>
                        </>
                    );
                }
                return (<><span className="text-discord-light">New server announcement from </span><span className="font-bold text-discord-white">{notif.meta?.senderName || 'Admin'}</span></>);
            case 'warning':
                return <span className="text-discord-red font-semibold">You received a warning from a moderator</span>;
            case 'moderator': {
                const action = notif.meta?.action;
                if (action === 'report_message') {
                    return (
                        <>
                            <span className="text-discord-light">New message report in </span>
                            <span className="font-bold text-discord-white">{notif.meta?.communityName || 'a server'}</span>
                            {notif.meta?.channelName && (
                                <span className="text-discord-faint"> · #{notif.meta.channelName}</span>
                            )}
                        </>
                    );
                }
                if (action === 'suspend') return <span className="text-discord-red font-semibold">You were suspended by a moderator</span>;
                if (action === 'delete_message') return <span className="text-discord-red font-semibold">A moderator deleted your message</span>;
                if (action === 'delete_post') return <span className="text-discord-red font-semibold">A moderator deleted your post</span>;
                return <span className="text-discord-red font-semibold">Moderator action taken</span>;
            }
            default: return <span className="text-discord-light">New notification</span>;
        }
    };

    const handleNotificationClick = async (notif) => {
        const meta = notif?.meta || {};
        if (meta.action === 'server_invite') {
            navigate('/feed?tab=invites');
            if (!notif.readAt) {
                markAsRead(notif._id).catch(() => { });
            }
            setOpen(false);
            return;
        }
        if (meta.communityId) {
            setActiveCommunity(meta.communityId);
        }
        if (meta.channelId) {
            setActiveChannel(meta.channelId);
        }
        if (meta.messageId) {
            setScrollTarget(meta.messageId);
        }
        navigate('/feed');
        if (!notif.readAt) {
            markAsRead(notif._id).catch(() => { });
        }
        setOpen(false);
    };

    const handleMarkRead = async (e, id) => {
        e.stopPropagation();
        try { await markAsRead(id); } catch { }
    };

    const handleToggle = () => {
        const willOpen = !open;
        setOpen(willOpen);
        if (willOpen && unreadCount > 0) markAllAsRead().catch(() => { });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleToggle}
                className="relative w-9 h-9 rounded-lg bg-discord-darker border border-discord-border flex items-center justify-center hover:bg-discord-border-light/20 transition-all cursor-pointer"
                aria-label="Notifications">
                <Bell className="w-4 h-4 text-discord-light" strokeWidth={2} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-discord-red text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-scale-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed left-2 right-2 top-14 sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-96 bg-discord-darker/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-discord-border overflow-hidden z-[9999] animate-slide-down">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-discord-border">
                        <h3 className="text-sm font-bold text-discord-white">Notifications</h3>
                        <button onClick={() => setOpen(false)}
                            className="w-6 h-6 rounded-md hover:bg-discord-border-light/20 flex items-center justify-center transition-colors cursor-pointer">
                            <X className="w-3.5 h-3.5 text-discord-muted" strokeWidth={2} />
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-5 h-5 rounded-full border-2 border-blurple border-t-transparent animate-spin" />
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif) => {
                                const isUnread = !notif.readAt;
                                return (
                                    <div key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-discord-border-light/10 cursor-pointer ${isUnread ? 'bg-blurple/[0.06] border-l-[3px] border-l-blurple' : 'border-l-[3px] border-l-transparent'}`}>
                                        <div className="w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center shrink-0 mt-0.5">
                                            {iconForType(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs leading-relaxed">{labelForNotification(notif)}</p>
                                            {(notif.meta?.commentSnippet || notif.meta?.postSnippet || notif.meta?.messageSnippet) && (
                                                <p className="text-[11px] text-discord-faint mt-0.5 truncate">"{notif.meta.commentSnippet || notif.meta.postSnippet || notif.meta.messageSnippet}"</p>
                                            )}
                                            <p className="text-[10px] text-discord-faint mt-1">{timeAgo(notif.createdAt)}</p>
                                        </div>
                                        {isUnread && (
                                            <button onClick={(e) => handleMarkRead(e, notif._id)}
                                                className="w-6 h-6 rounded-md hover:bg-discord-border-light/20 flex items-center justify-center shrink-0 transition-colors cursor-pointer" title="Mark as read">
                                                <Check className="w-3.5 h-3.5 text-discord-green" strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-10 h-10 rounded-full bg-discord-darkest flex items-center justify-center mx-auto mb-2">
                                    <Bell className="w-4 h-4 text-discord-faint" strokeWidth={1.5} />
                                </div>
                                <p className="text-xs font-semibold text-discord-light">All caught up!</p>
                                <p className="text-[11px] text-discord-faint mt-0.5">No notifications yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
