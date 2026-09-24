import React, { useState, useEffect, useRef } from "react";
import { Bell, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AdminNotification } from "@/lib/types";

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("admin_notifications")
            .select(`
                *,
                product:products(id, name),
                maker:profiles(id, display_name)
            `)
            .order("created_at", { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data as AdminNotification[]);
        }
        setLoading(false);
    };

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        
        await supabase
            .from("admin_notifications")
            .update({ is_read: true })
            .eq("id", id);
    };

    const markAllAsRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        
        await supabase
            .from("admin_notifications")
            .update({ is_read: true })
            .eq("is_read", false);
    };

    const handleNotificationClick = (notification: AdminNotification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        setIsOpen(false);
        if (notification.product_id) {
            navigate(`/admin/submissions/${notification.product_id}`);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#151D19] transition-all duration-300"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D8C7A5] rounded-full ring-2 ring-[#0B100E]" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#151D19]/95 backdrop-blur-xl border border-[#202A25] rounded-2xl shadow-2xl overflow-hidden z-[100]">
                    <div className="p-4 border-b border-[#202A25] flex items-center justify-between">
                        <h3 className="font-bold text-[#F5F1E8]">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs text-[#789181] hover:text-[#D8C7A5] transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-[#8C958E] text-sm animate-pulse">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-[#202A25] mx-auto mb-3" />
                                <p className="text-[#8C958E] text-sm">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#202A25]/50">
                                {notifications.map((notification) => (
                                    <div 
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-[#1B2520]/60 transition-colors cursor-pointer flex gap-4 ${!notification.is_read ? 'bg-[#1B2520]/40' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.is_read ? 'text-[#F5F1E8] font-medium' : 'text-[#C5C8C1]'}`}>
                                                {notification.type === 'product_submission' ? (
                                                    <>
                                                        <span className="font-semibold text-[#D8C7A5]">{notification.product?.name || "A product"}</span> was submitted by <span className="font-semibold text-[#F5F1E8]">{notification.maker?.display_name || "a builder"}</span> for review.
                                                    </>
                                                ) : (
                                                    "New notification"
                                                )}
                                            </p>
                                            <p className="text-xs text-[#789181] mt-1">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <button 
                                                onClick={(e) => markAsRead(notification.id, e)}
                                                className="shrink-0 p-1.5 h-fit rounded-lg text-[#789181] hover:text-[#D8C7A5] hover:bg-[#151D19] transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
