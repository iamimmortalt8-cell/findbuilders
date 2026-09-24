import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, User, Package, Settings, X, MessageSquare, ArrowUp, Mail, Phone, MessageCircle } from "lucide-react";
import { parseBio, Profile, Product } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { supabaseProfileService } from "@/lib/supabase-profiles";

export default function PublicProfile() {
    const { user } = useAuth();
    const toast = useToast();
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalUsers, setModalUsers] = useState<Profile[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadProfile = async () => {
            try {
                setLoading(true);
                const [profileData, productsData, followStats] = await Promise.all([
                    supabaseProfileService.getPublicProfile(id),
                    supabaseProfileService.getUserPublicProducts(id),
                    supabaseProfileService.getFollowStats(id, user?.id)
                ]);
                
                if (!profileData) {
                    throw new Error("Profile not found");
                }
                
                setProfile(profileData);
                setProducts(productsData || []);
                setFollowersCount(followStats.followersCount || 0);
                setFollowingCount(followStats.followingCount || 0);
                setIsFollowing(followStats.isFollowing || false);
                
            } catch (err: any) {
                setError(err.message || "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [id, user?.id]);

    const handleFollowToggle = async () => {
        if (!user || !profile || followLoading) return;
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await supabaseProfileService.unfollowUser(profile.id);
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                await supabaseProfileService.followUser(profile.id);
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (err: any) {
            console.error("Follow error:", err);
            toast.error(err.message || "Failed to update follow status.");
        } finally {
            setFollowLoading(false);
        }
    };

    const openFollowersModal = async () => {
        if (!profile) return;
        setModalTitle("Followers");
        setShowModal(true);
        setModalLoading(true);
        try {
            const data = await supabaseProfileService.getFollowers(profile.id);
            setModalUsers(data as Profile[]);
        } catch (err) {
            console.error(err);
            setModalUsers([]);
        } finally {
            setModalLoading(false);
        }
    };

    const openFollowingModal = async () => {
        if (!profile) return;
        setModalTitle("Following");
        setShowModal(true);
        setModalLoading(true);
        try {
            const data = await supabaseProfileService.getFollowing(profile.id);
            setModalUsers(data as Profile[]);
        } catch (err) {
            console.error(err);
            setModalUsers([]);
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#0B100E] min-h-screen pt-32 pb-20 flex items-center justify-center">
                <div className="text-[#8C958E] font-medium">Loading profile...</div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="bg-[#0B100E] min-h-screen pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-2xl font-bold text-[#F5F1E8] mb-2">Profile Not Found</h2>
                <p className="text-[#8C958E] mb-6">{error || "This user doesn't exist or has been removed."}</p>
                <Link to="/" className="px-6 py-2 bg-[#1B2520] text-[#F5F1E8] border border-[#29342E] rounded-full hover:bg-[#202B25] transition">
                    Go Home
                </Link>
            </div>
        );
    }

    const extendedBio = parseBio(profile.bio);

    // Safely extract bioText without exposing raw serialized JSON
    const cleanBioText = (() => {
        let text = extendedBio.bioText ? extendedBio.bioText.trim() : "";
        if (!text) return "";
        if (text.startsWith("{") && text.endsWith("}")) {
            try {
                const nested = JSON.parse(text);
                if (typeof nested === "object" && nested !== null) {
                    text = nested.bioText || nested.bio || "";
                }
            } catch {
                // keep text
            }
        }
        return text;
    })();

    // Real links and interests only
    const validLinks = (extendedBio.links || []).filter(
        link => link && typeof link.url === "string" && link.url.trim().length > 0
    );
    const validInterests = (extendedBio.interests || []).filter(
        interest => typeof interest === "string" && interest.trim().length > 0
    );

    const isOwnProfile = user?.id === profile.id;
    const hasContactInfo = Boolean(extendedBio.contact?.email || extendedBio.contact?.whatsapp || extendedBio.contact?.phone);

    return (
        <div className="bg-[#0B100E] min-h-screen pt-28 md:pt-32 pb-24 relative text-[#F5F1E8]">
            <div className="max-w-3xl mx-auto px-6">
                
                {/* 1. PROFILE HEADER */}
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 items-start mb-6">
                    {/* Real Avatar */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border border-[#29342E] bg-[#101814] shrink-0 shadow-xl flex items-center justify-center">
                        {profile.avatar_url ? (
                            <img 
                                src={profile.avatar_url} 
                                alt={profile.display_name} 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#69736C] bg-[#151D19]">
                                <User className="w-12 h-12" />
                            </div>
                        )}
                    </div>
                    
                    {/* User Info & Actions */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8] truncate">
                                    {profile.display_name}
                                </h1>
                                {extendedBio.username && (
                                    <div className="text-[#D8C7A5] text-sm sm:text-base font-medium mt-0.5">
                                        @{extendedBio.username}
                                    </div>
                                )}
                                
                                {/* Followers / Following */}
                                <div className="flex items-center gap-4 text-sm text-[#8C958E] mt-2.5">
                                    <button 
                                        onClick={openFollowersModal} 
                                        className="hover:text-[#F5F1E8] transition cursor-pointer flex gap-1.5 items-center"
                                    >
                                        <span className="font-semibold text-[#F5F1E8]">{followersCount}</span> followers
                                    </button>
                                    <span className="text-[#29342E]">•</span>
                                    <button 
                                        onClick={openFollowingModal} 
                                        className="hover:text-[#F5F1E8] transition cursor-pointer flex gap-1.5 items-center"
                                    >
                                        <span className="font-semibold text-[#F5F1E8]">{followingCount}</span> following
                                    </button>
                                </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="flex items-center gap-3">
                                {hasContactInfo && (
                                    <button
                                        onClick={() => setShowContactModal(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#151D19] border border-[#29342E] text-[#C5C8C1] hover:bg-[#1B2520] hover:text-[#F5F1E8] transition-all text-sm font-semibold shrink-0 shadow-sm cursor-pointer"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Contact Info
                                    </button>
                                )}
                                {isOwnProfile ? (
                                    <Link 
                                        to="/settings/profile"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D8C7A5] text-[#1A1A16] hover:bg-[#E5D5B5] transition-all text-sm font-semibold shrink-0 shadow-lg"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Edit Profile
                                    </Link>
                                ) : user ? (
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-full transition-all text-sm font-semibold shrink-0 shadow-lg cursor-pointer ${
                                            isFollowing 
                                                ? 'bg-[#1B2520] text-[#C5C8C1] hover:bg-[#202B25] border border-[#29342E]' 
                                                : 'bg-[#D8C7A5] text-[#1A1A16] hover:bg-[#E5D5B5]'
                                        }`}
                                    >
                                        {followLoading ? 'Wait...' : isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D8C7A5] text-[#1A1A16] hover:bg-[#E5D5B5] transition-all text-sm font-semibold shrink-0 shadow-lg"
                                    >
                                        Follow
                                    </Link>
                                )}
                            </div>
                        </div>
                        
                        {/* Headline */}
                        {extendedBio.headline && (
                            <p className="text-sm sm:text-base text-[#C5C8C1] font-normal mt-3">
                                {extendedBio.headline}
                            </p>
                        )}
                    </div>
                </div>

                {/* 2 & 3. REAL BIO */}
                {cleanBioText && (
                    <div className="mb-5">
                        <p className="text-[#C5C8C1] leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                            {cleanBioText}
                        </p>
                    </div>
                )}

                {/* 4. REAL LINKS */}
                {validLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mb-5">
                        {validLinks.map((link, idx) => {
                            const rawUrl = (link.url || "").trim();
                            const formattedUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
                                ? rawUrl
                                : `https://${rawUrl}`;
                            const displayTitle = link.title || link.label || rawUrl;
                            return (
                                <a 
                                    key={idx}
                                    href={formattedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#151D19] border border-[#29342E] hover:bg-[#1B2520] hover:border-[#2E6549] hover:text-[#D8C7A5] transition-all text-xs sm:text-sm font-medium text-[#C5C8C1] shadow-sm group"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 text-[#69736C] group-hover:text-[#D8C7A5] transition-colors" />
                                    <span>{displayTitle}</span>
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* 5. REAL INTERESTS */}
                {validInterests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {validInterests.map((interest, idx) => (
                            <span 
                                key={idx}
                                className="px-3 py-1 rounded-lg bg-[#163326] border border-[#214C37] text-[#D8C7A5] text-xs sm:text-sm font-medium"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                )}

                {/* 6 & 7. POSTED PRODUCTS */}
                <div className="mt-10 pt-8 border-t border-[#202A25]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold tracking-tight text-[#F5F1E8] flex items-center gap-2.5">
                            <span>Posted Products</span>
                            {products.length > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#151D19] text-[#8C958E] border border-[#202A25]">
                                    {products.length}
                                </span>
                            )}
                        </h2>
                    </div>

                    {products.length > 0 ? (
                        <div className="space-y-3.5">
                            {products.map(product => (
                                <Link 
                                    key={product.id}
                                    to={`/product/${product.id}`}
                                    className="group block p-4 sm:p-5 rounded-2xl bg-[#151D19]/90 border border-[#202A25] hover:bg-[#1B2520] hover:border-[#2E6549] transition-all duration-200 shadow-md"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Product Logo */}
                                        {product.image_url ? (
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#101814] border border-[#202A25] p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.name} 
                                                    className="w-full h-full object-contain rounded-lg" 
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#101814] border border-[#202A25] flex items-center justify-center shrink-0">
                                                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-[#69736C]" />
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base sm:text-lg font-semibold text-[#F5F1E8] group-hover:text-[#D8C7A5] transition truncate">
                                                {product.name}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-[#8C958E] line-clamp-2 mt-0.5">
                                                {product.tagline}
                                            </p>

                                            <div className="flex items-center gap-2.5 sm:gap-3 mt-3 flex-wrap">
                                                {product.category?.name && (
                                                    <span className="text-xs font-medium text-[#789181] bg-[#101814] border border-[#202A25] px-2.5 py-0.5 rounded-md">
                                                        {product.category.name}
                                                    </span>
                                                )}
                                                <span className="text-xs text-[#D8C7A5] font-medium bg-[#163326] border border-[#214C37] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                                    <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                                                    {product.upvotes_count || 0}
                                                </span>
                                                <span className="text-xs text-[#8C958E] font-medium bg-[#101814] border border-[#202A25] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                                    <MessageSquare className="w-3 h-3" />
                                                    {product.comments_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        /* 8. EMPTY STATE */
                        <div className="text-center py-14 px-4 bg-[#151D19] rounded-2xl border border-[#202A25]">
                            <Package className="w-10 h-10 text-[#69736C] mx-auto mb-3" />
                            <p className="text-[#8C958E] font-medium text-sm sm:text-base">No products posted yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Followers / Following Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#151D19] border border-[#29342E] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-5 border-b border-[#202A25]">
                            <h3 className="text-lg font-bold text-[#F5F1E8]">{modalTitle}</h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-[#8C958E] hover:text-[#F5F1E8] transition p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
                            {modalLoading ? (
                                <div className="py-12 text-center text-[#8C958E]">Loading...</div>
                            ) : modalUsers.length > 0 ? (
                                <div className="space-y-2">
                                    {modalUsers.map(u => {
                                        const bio = parseBio(u.bio);
                                        return (
                                            <a 
                                                key={u.id}
                                                href={`/profile/${u.id}`} 
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1B2520] transition group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-[#101814] border border-[#29342E] overflow-hidden shrink-0 flex items-center justify-center">
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-[#69736C]" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[#F5F1E8] font-medium truncate group-hover:text-[#D8C7A5] transition">
                                                        {u.display_name}
                                                    </div>
                                                    {bio.username && (
                                                        <div className="text-[#8C958E] text-sm truncate">
                                                            @{bio.username}
                                                        </div>
                                                    )}
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-[#8C958E]">
                                    {modalTitle === "Followers" ? "No followers yet." : "Not following anyone yet."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Info Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#151D19] border border-[#29342E] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-[#202A25]">
                            <h3 className="text-lg font-bold text-[#F5F1E8]">Contact Info</h3>
                            <button 
                                onClick={() => setShowContactModal(false)} 
                                className="text-[#8C958E] hover:text-[#F5F1E8] transition p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {extendedBio.contact?.email && (
                                <a href={`mailto:${extendedBio.contact.email}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#1B2520] transition group border border-transparent hover:border-[#29342E]">
                                    <div className="w-10 h-10 rounded-full bg-[#101814] border border-[#29342E] flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-[#D8C7A5]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs text-[#8C958E] font-medium mb-0.5">Email</div>
                                        <div className="text-[#F5F1E8] font-medium truncate group-hover:text-[#D8C7A5] transition">{extendedBio.contact.email}</div>
                                    </div>
                                </a>
                            )}
                            {extendedBio.contact?.whatsapp && (
                                <a href={`https://wa.me/${extendedBio.contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#1B2520] transition group border border-transparent hover:border-[#29342E]">
                                    <div className="w-10 h-10 rounded-full bg-[#101814] border border-[#29342E] flex items-center justify-center shrink-0">
                                        <MessageCircle className="w-5 h-5 text-[#25D366]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs text-[#8C958E] font-medium mb-0.5">WhatsApp</div>
                                        <div className="text-[#F5F1E8] font-medium truncate group-hover:text-[#25D366] transition">{extendedBio.contact.whatsapp}</div>
                                    </div>
                                </a>
                            )}
                            {extendedBio.contact?.phone && (
                                <a href={`tel:${extendedBio.contact.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#1B2520] transition group border border-transparent hover:border-[#29342E]">
                                    <div className="w-10 h-10 rounded-full bg-[#101814] border border-[#29342E] flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5 text-[#D8C7A5]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs text-[#8C958E] font-medium mb-0.5">Phone</div>
                                        <div className="text-[#F5F1E8] font-medium truncate group-hover:text-[#D8C7A5] transition">{extendedBio.contact.phone}</div>
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

