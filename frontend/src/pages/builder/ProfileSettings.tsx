import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, ExternalLink, Plus, Trash2, LogOut, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { supabaseProfileService } from "@/lib/supabase-profiles";
import { parseBio, ProfileLink } from "@/lib/types";

export default function ProfileSettings() {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const toast = useToast();
    const [initialized, setInitialized] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        displayName: "",
        username: "",
        headline: "",
        bioText: "",
        links: [] as ProfileLink[],
        interests: [] as string[],
        contact: {
            email: "",
            whatsapp: "",
            phone: ""
        }
    });

    useEffect(() => {
        if (!formData.username) {
            setUsernameStatus("idle");
            return;
        }
        
        // Don't show taken if it's their own username
        if (profile && parseBio(profile.bio).username === formData.username) {
            setUsernameStatus("available");
            return;
        }

        setUsernameStatus("checking");
        const timer = setTimeout(async () => {
            try {
                const isTaken = await supabaseProfileService.checkUsername(formData.username, profile?.id);
                setUsernameStatus(isTaken ? "taken" : "available");
            } catch (err) {
                setUsernameStatus("idle");
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.username, profile]);

    const [newLink, setNewLink] = useState({ title: "", url: "" });
    const [newInterest, setNewInterest] = useState("");

    useEffect(() => {
        if (!user || !profile) {
            navigate("/login");
            return;
        }

        if (!initialized) {
            const extendedBio = parseBio(profile.bio);
            setFormData({
                displayName: profile.display_name || "",
                username: extendedBio.username || "",
                headline: extendedBio.headline || "",
                bioText: extendedBio.bioText || "",
                links: extendedBio.links || [],
                interests: extendedBio.interests || [],
                contact: {
                    email: extendedBio.contact?.email || "",
                    whatsapp: extendedBio.contact?.whatsapp || "",
                    phone: extendedBio.contact?.phone || ""
                }
            });
            setInitialized(true);
        }
    }, [user, profile, navigate, initialized]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1 * 1024 * 1024) {
            toast.error("Image size must be smaller than 1 MB.");
            return;
        }

        try {
            setUploading(true);
            await supabaseProfileService.uploadAvatar(file);
            await refreshProfile();
            toast.success("Avatar updated successfully.");
        } catch (error: any) {
            toast.error(error.message || "Failed to upload avatar.");
        } finally {
            setUploading(false);
        }
    };

    const addLink = () => {
        if (newLink.title.trim() && newLink.url.trim()) {
            setFormData(prev => ({
                ...prev,
                links: [...prev.links, { title: newLink.title.trim(), label: newLink.title.trim(), url: newLink.url.trim() }]
            }));
            setNewLink({ title: "", url: "" });
        }
    };

    const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addLink();
        }
    };

    const removeLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }));
    };

    const addInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && newInterest.trim()) {
            e.preventDefault();
            if (!formData.interests.includes(newInterest.trim())) {
                setFormData(prev => ({
                    ...prev,
                    interests: [...prev.interests, newInterest.trim()]
                }));
            }
            setNewInterest("");
        }
    };

    const removeInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.filter(i => i !== interest)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let currentLinks = [...formData.links];
            if (newLink.title.trim() && newLink.url.trim()) {
                currentLinks.push({ 
                    title: newLink.title.trim(), 
                    label: newLink.title.trim(), 
                    url: newLink.url.trim() 
                });
                setNewLink({ title: "", url: "" });
            }

            let currentInterests = [...formData.interests];
            if (newInterest.trim() && !currentInterests.includes(newInterest.trim())) {
                currentInterests.push(newInterest.trim());
                setNewInterest("");
            }

            const formattedLinks = currentLinks.map(l => ({
                title: l.title || l.label || l.url,
                label: l.label || l.title || l.url,
                url: l.url
            }));

            const bioData = {
                bioText: formData.bioText,
                username: formData.username,
                headline: formData.headline,
                links: formattedLinks,
                interests: currentInterests,
                contact: formData.contact
            };

            await supabaseProfileService.updateProfile({
                display_name: formData.displayName,
                bio: JSON.stringify(bioData)
            });

            setFormData(prev => ({
                ...prev,
                links: formattedLinks,
                interests: currentInterests
            }));

            await refreshProfile();
            toast.success("Profile updated successfully.");
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    if (!user || !profile) return null;

    return (
        <div className="bg-[#0B100E] text-[#F5F1E8] min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-[#202A25] pb-5 sm:pb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8]">Profile Settings</h1>
                        <p className="text-[#8C958E] text-xs sm:text-sm mt-1">Manage your public profile and personal details.</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link 
                            to={`/profile/${profile.id}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#151D19] border border-[#29342E] hover:bg-[#1B2520] hover:text-[#F5F1E8] text-[#C5C8C1] transition-colors text-xs sm:text-sm font-medium"
                        >
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>View Public Profile</span>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#321C1C] border border-[#C97878]/30 text-[#C97878] hover:bg-[#321C1C]/80 transition-colors text-xs sm:text-sm font-medium cursor-pointer"
                        >
                            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-[#151D19] border border-[#202A25] rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                            <div className="relative group mb-4">
                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[#29342E] bg-[#101814]">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#1B2520] text-[#8C958E] text-2xl sm:text-3xl font-bold">
                                            {formData.displayName?.charAt(0) || user.email.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 bg-[#0B100E]/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full backdrop-blur-sm">
                                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5F1E8] mb-1" />
                                    <span className="text-xs font-medium text-[#F5F1E8]">Change</span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleAvatarUpload} 
                                        accept="image/*" 
                                        className="hidden" 
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            <h3 className="font-semibold text-[#F5F1E8] mt-2 sm:mt-4 text-base sm:text-lg">{formData.displayName || "No Name"}</h3>
                            <p className="text-[#8C958E] text-xs sm:text-sm mt-1 truncate max-w-full px-2">{user.email}</p>
                            {uploading && <p className="text-[#D8C7A5] text-xs mt-3">Uploading...</p>}
                            <p className="text-[11px] sm:text-xs text-[#69736C] mt-3 sm:mt-4">Max file size: 1 MB</p>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-medium text-[#C5C8C1]">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.displayName}
                                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                                        className="w-full bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-[#F5F1E8] focus:outline-none focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40 transition-all placeholder-[#69736C]"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-medium text-[#C5C8C1]">Username</label>
                                    <input 
                                        type="text" 
                                        value={formData.username}
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        className={`w-full bg-[#101814] border rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-[#F5F1E8] focus:outline-none transition-all placeholder-[#69736C] ${
                                            usernameStatus === 'taken' 
                                                ? 'border-[#C97878]/50 focus:border-[#C97878] focus:ring-1 focus:ring-[#C97878]' 
                                                : 'border-[#29342E] focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40'
                                        }`}
                                    />
                                    {usernameStatus === 'checking' && <p className="text-xs text-[#8C958E] mt-1">Checking availability...</p>}
                                    {usernameStatus === 'taken' && <p className="text-xs text-[#C97878] mt-1">Username is already taken</p>}
                                    {usernameStatus === 'available' && formData.username && profile && parseBio(profile.bio).username !== formData.username && <p className="text-xs text-[#7FAF8D] mt-1">Username is available!</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-[#C5C8C1]">Headline</label>
                                <input 
                                    type="text" 
                                    value={formData.headline}
                                    onChange={e => setFormData({...formData, headline: e.target.value})}
                                    className="w-full bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-[#F5F1E8] focus:outline-none focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40 transition-all placeholder-[#69736C]"
                                />
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-[#C5C8C1]">Email Address (Read-only)</label>
                                <input 
                                    type="email" 
                                    value={user.email}
                                    readOnly
                                    className="w-full bg-[#151D19] border border-[#202A25] rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-[#69736C] cursor-not-allowed"
                                />
                                <p className="text-xs text-[#69736C]">Your email is managed by your authentication provider.</p>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-[#C5C8C1]">About / Bio</label>
                                <textarea 
                                    value={formData.bioText}
                                    onChange={e => setFormData({...formData, bioText: e.target.value})}
                                    rows={5}
                                    className="w-full bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-[#F5F1E8] focus:outline-none focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40 transition-all resize-none placeholder-[#69736C]"
                                    placeholder="Tell us a little bit about yourself..."
                                />
                            </div>

                            <div className="border-t border-[#202A25] pt-6 space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-[#C5C8C1]">Contact Info (Optional)</h3>
                                    <p className="text-xs text-[#8C958E] mt-1">These details will be visible on your public profile if provided.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-[#8C958E] mb-1.5 block">Email</label>
                                        <input 
                                            type="email" 
                                            value={formData.contact.email}
                                            onChange={e => setFormData({...formData, contact: {...formData.contact, email: e.target.value}})}
                                            placeholder="hello@example.com"
                                            className="w-full bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 text-sm text-[#F5F1E8] focus:outline-none focus:border-[#789181] transition-all placeholder-[#69736C]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-[#8C958E] mb-1.5 block">WhatsApp Number</label>
                                            <input 
                                                type="text" 
                                                value={formData.contact.whatsapp}
                                                onChange={e => setFormData({...formData, contact: {...formData.contact, whatsapp: e.target.value}})}
                                                placeholder="+1234567890"
                                                className="w-full bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 text-sm text-[#F5F1E8] focus:outline-none focus:border-[#789181] transition-all placeholder-[#69736C]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[#8C958E] mb-1.5 block">Phone Number</label>
                                            <input 
                                                type="text" 
                                                value={formData.contact.phone}
                                                onChange={e => setFormData({...formData, contact: {...formData.contact, phone: e.target.value}})}
                                                placeholder="+1234567890"
                                                className="w-full bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 text-sm text-[#F5F1E8] focus:outline-none focus:border-[#789181] transition-all placeholder-[#69736C]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[#202A25] pt-6 space-y-4">
                                <label className="text-sm font-medium text-[#C5C8C1] block">Links</label>
                                <div className="space-y-3">
                                    {formData.links.map((link, idx) => (
                                        <div key={idx} className="flex items-center gap-2 sm:gap-3 bg-[#101814] border border-[#202A25] rounded-xl p-2.5 pl-3 sm:pl-4">
                                            <div className="flex-1 text-xs sm:text-sm text-[#F5F1E8] font-medium truncate">{link.title || link.label || link.url}</div>
                                            <div className="flex-[2] text-xs sm:text-sm text-[#8C958E] truncate hidden sm:block">{link.url}</div>
                                            <button 
                                                type="button" 
                                                onClick={() => removeLink(idx)}
                                                className="p-1.5 sm:p-2 text-[#69736C] hover:text-[#C97878] transition-colors rounded-lg hover:bg-[#321C1C]/30 cursor-pointer shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                                        <input 
                                            type="text" 
                                            value={newLink.title}
                                            onChange={e => setNewLink({...newLink, title: e.target.value})}
                                            onKeyDown={handleLinkKeyDown}
                                            placeholder="Title (e.g. GitHub, LinkedIn, Website)"
                                            className="w-full sm:flex-1 bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 text-sm text-[#F5F1E8] focus:outline-none focus:border-[#789181] transition-all placeholder-[#69736C]"
                                        />
                                        <input 
                                            type="url" 
                                            value={newLink.url}
                                            onChange={e => setNewLink({...newLink, url: e.target.value})}
                                            onKeyDown={handleLinkKeyDown}
                                            placeholder="URL (https://...)"
                                            className="w-full sm:flex-[2] bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 text-sm text-[#F5F1E8] focus:outline-none focus:border-[#789181] transition-all placeholder-[#69736C]"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={addLink}
                                            disabled={!newLink.title.trim() || !newLink.url.trim()}
                                            className="w-full sm:w-auto p-2.5 bg-[#151D19] border border-[#29342E] rounded-xl text-[#8C958E] hover:text-[#F5F1E8] hover:border-[#789181] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="sm:hidden text-xs font-semibold">Add Link</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[#202A25] pt-6 space-y-4">
                                <label className="text-sm font-medium text-[#C5C8C1] block">Interests</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.interests.map((interest, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#163326] border border-[#214C37] rounded-lg text-[#D8C7A5] text-xs sm:text-sm">
                                            {interest}
                                            <button type="button" onClick={() => removeInterest(interest)} className="hover:text-[#F5F1E8] transition-colors cursor-pointer">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <input 
                                    type="text" 
                                    value={newInterest}
                                    onChange={e => setNewInterest(e.target.value)}
                                    onKeyDown={addInterest}
                                    placeholder="Type an interest and press Enter (e.g. AI, SaaS, Web3)"
                                    className="w-full bg-[#101814] border border-[#29342E] rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-[#F5F1E8] focus:outline-none focus:border-[#789181] focus:ring-1 focus:ring-[#789181]/40 transition-all placeholder-[#69736C]"
                                />
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-6 py-3 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] rounded-xl font-semibold shadow-[0_0_20px_rgba(216,199,165,0.25)] hover:shadow-[0_0_30px_rgba(216,199,165,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center justify-center"
                                >
                                    {loading ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
