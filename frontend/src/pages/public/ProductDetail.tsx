"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowUp,
    ExternalLink,
    MessageCircle,
    Send,
    Trash2,
    Layers,
    Clock,
    ArrowLeft,
    Loader2,
    Share2,
    Check,
} from "lucide-react";
import { fetchProduct, toggleVote, checkUserVote, fetchComments, addComment, deleteComment, getProductImages } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Reveal } from "@/components/Reveal";
import type { Product, Comment as CommentType, ProductImage } from "@/lib/types";
import { parseBio } from "@/lib/types";
import { supabaseProfileService } from "@/lib/supabase-profiles";
import SEO, { buildProductSchema } from "@/components/SEO";

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const [product, setProduct] = useState<Product | null>(null);
    const [comments, setComments] = useState<CommentType[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [commenting, setCommenting] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [images, setImages] = useState<ProductImage[]>([]);
    const [copied, setCopied] = useState(false);

    // Drag-to-scroll refs for horizontal screenshot gallery
    const galleryScrollRef = useRef<HTMLDivElement>(null);
    const isDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!galleryScrollRef.current) return;
        isDownRef.current = true;
        startXRef.current = e.pageX - galleryScrollRef.current.offsetLeft;
        scrollLeftRef.current = galleryScrollRef.current.scrollLeft;
    };

    const handleMouseUpOrLeave = () => {
        isDownRef.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDownRef.current || !galleryScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - galleryScrollRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        galleryScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!galleryScrollRef.current) return;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            // Trackpad horizontal scroll, let browser handle natively
            return;
        }
        if (e.deltaY !== 0) {
            galleryScrollRef.current.scrollLeft += e.deltaY;
        }
    };

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            fetchProduct(id),
            fetchComments(id),
            getProductImages(id),
            user ? checkUserVote(id, user.id) : Promise.resolve(false),
        ])
            .then(async ([p, c, imgs, voted]) => {
                setProduct(p);
                setComments(c);
                setImages(imgs || []);
                setHasVoted(voted);
                if (p && user && p.maker && p.maker.id !== user.id) {
                    const stats = await supabaseProfileService.getFollowStats(p.maker.id, user.id);
                    setIsFollowing(stats.isFollowing);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, user]);

    const handleVote = async () => {
        if (!user || !id) return;
        setVoting(true);
        try {
            const added = await toggleVote(id, user.id);
            setHasVoted(added);
            setProduct((prev) =>
                prev ? { ...prev, upvotes_count: prev.upvotes_count + (added ? 1 : -1) } : prev
            );
        } catch (err) {
            console.error("Vote error:", err);
        } finally {
            setVoting(false);
        }
    };

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            navigate("/login");
            return;
        }
        if (!product?.maker || followLoading) return;
        
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await supabaseProfileService.unfollowUser(product.maker.id);
                setIsFollowing(false);
            } else {
                await supabaseProfileService.followUser(product.maker.id);
                setIsFollowing(true);
            }
        } catch (err: any) {
            console.error("Follow error:", err);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product?.name ? `${product.name} on FindBuilders` : "FindBuilders Product",
                    text: product?.tagline || `Check out ${product?.name} on FindBuilders!`,
                    url,
                });
                return;
            } catch (err: any) {
                if (err.name === "AbortError") return;
            }
        }
        
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Link copied to clipboard");
            setTimeout(() => setCopied(false), 2500);
        } catch (e) {
            console.error("Clipboard copy failed:", e);
            toast.error("Failed to copy link");
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !id || !newComment.trim()) return;
        setCommenting(true);
        try {
            const comment = await addComment(id, user.id, newComment.trim());
            setComments((prev) => [...prev, comment]);
            setNewComment("");
            setProduct((prev) => prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev);
            toast.success("Comment added!");
        } catch (err: any) {
            console.error("Comment error:", err);
            toast.error(err.message || "Failed to add comment.");
        } finally {
            setCommenting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!id) return;
        try {
            await deleteComment(commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setProduct((prev) => prev ? { ...prev, comments_count: prev.comments_count - 1 } : prev);
            toast.success("Comment deleted.");
        } catch (err: any) {
            console.error("Delete comment error:", err);
            toast.error(err.message || "Failed to delete comment.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#29342E] border-t-[#D8C7A5] animate-spin" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex flex-col items-center justify-center text-[#F5F1E8]">
                <SEO
                    title="Product Not Found | FindBuilders"
                    description="The requested product could not be found. Discover other startup products and tools built by indie makers on FindBuilders."
                    noindex={true}
                />
                <div className="w-16 h-16 rounded-2xl bg-[#151D19] border border-[#202A25] flex items-center justify-center mb-5">
                    <Layers className="w-7 h-7 text-[#69736C]" />
                </div>
                <h1 className="text-2xl font-bold mb-4">Product not found</h1>
                <Link to="/products" className="text-[#D8C7A5] hover:underline">
                    Browse all products
                </Link>
            </div>
        );
    }

    const productSchema = buildProductSchema({
        id: product.id,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        image_url: product.image_url,
        category_name: product.category?.name,
        website_url: product.website_url,
        maker_name: product.maker?.display_name,
        maker_id: product.maker?.id
    });

    const breadcrumbs = [
        { name: "Home", url: "/" },
        { name: "Products", url: "/products" },
        ...(product.category ? [{ name: product.category.name, url: `/categories/${product.category.slug}` }] : []),
        { name: product.name, url: `/product/${product.id}` }
    ];

    return (
        <div className="bg-[#0B100E] text-[#F5F1E8] min-h-screen">
            <SEO
                title={`${product.name} - ${product.tagline} | FindBuilders`}
                description={`${product.tagline}. ${product.description ? product.description.slice(0, 140) + '...' : ''}`}
                canonical={`/product/${product.id}`}
                ogImage={product.image_url || undefined}
                breadcrumbs={breadcrumbs}
                structuredData={productSchema}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 overflow-x-hidden">
                {/* Back link */}
                <Reveal>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 text-sm text-[#8C958E] hover:text-[#F5F1E8] transition-colors mb-5 sm:mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        All Products
                    </Link>
                </Reveal>

                {/* Product Hero Showcase */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6 md:gap-8 lg:gap-12 mb-10 md:mb-14">
                    {/* Left: Product Logo */}
                    <Reveal direction="left">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-64 md:h-64 lg:w-80 lg:h-80 shrink-0 aspect-square rounded-2xl md:rounded-[2rem] bg-[#151D19] border border-[#29342E] p-2.5 sm:p-3.5 md:p-6 flex items-center justify-center shadow-xl md:shadow-2xl relative overflow-hidden group mx-auto md:mx-0">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={`${product.name} logo`}
                                    className="w-full h-full object-contain rounded-xl md:rounded-2xl select-none"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#69736C]">
                                    <Layers className="w-10 h-10 md:w-20 md:h-20 mb-1 md:mb-2 text-[#69736C]" />
                                    <span className="text-[10px] md:text-xs uppercase tracking-wider font-semibold text-[#8C958E]">No Logo</span>
                                </div>
                            )}
                        </div>
                    </Reveal>

                    {/* Right: Product Info & Actions */}
                    <Reveal direction="right" delay={0.1}>
                        <div className="flex-1 min-w-0 w-full text-center md:text-left">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#F5F1E8] tracking-tight break-words">
                                {product.name}
                            </h1>
                            <p className="text-[#8C958E] text-sm sm:text-base md:text-lg lg:text-xl font-normal mt-1.5 md:mt-2.5 mb-4 md:mb-6 leading-relaxed md:leading-snug break-words">
                                {product.tagline}
                            </p>

                            {/* Maker Card */}
                            <div className="inline-flex items-center justify-between gap-3 sm:gap-4 bg-[#151D19] border border-[#202A25] p-2.5 sm:p-3 px-3.5 sm:px-4 rounded-2xl mb-4 md:mb-6 max-w-md w-full shadow-lg">
                                <Link
                                    to={`/profile/${product.maker?.id}`}
                                    className="flex items-center gap-3 group min-w-0 text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#101814] flex items-center justify-center ring-1 ring-[#29342E] shrink-0 overflow-hidden group-hover:ring-[#789181]/40 transition-all">
                                        {product.maker?.avatar_url ? (
                                            <img
                                                src={product.maker.avatar_url}
                                                alt={product.maker.display_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-[#8C958E]">
                                                {product.maker?.display_name?.charAt(0) || "?"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 truncate">
                                        <span className="text-sm font-semibold text-[#F5F1E8] group-hover:text-[#D8C7A5] transition-colors block truncate">
                                            {product.maker?.display_name || "Anonymous Maker"}
                                        </span>
                                        {product.maker?.bio && parseBio(product.maker.bio).username && (
                                            <p className="text-xs text-[#D8C7A5] font-medium truncate">
                                                @{parseBio(product.maker.bio).username}
                                            </p>
                                        )}
                                    </div>
                                </Link>

                                {user && user.id !== product.maker?.id && (
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md shrink-0 cursor-pointer ${
                                            isFollowing
                                                ? "bg-[#1B2520] text-[#C5C8C1] hover:bg-[#202B25] border border-[#29342E]"
                                                : "bg-[#D8C7A5] text-[#1A1A16] hover:bg-[#E5D5B5] font-bold"
                                        }`}
                                    >
                                        {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                                    </button>
                                )}
                            </div>

                            {/* Category & Date Metadata */}
                            <div className="flex items-center justify-center md:justify-start gap-2.5 sm:gap-3 mb-5 md:mb-8 text-xs text-[#8C958E] flex-wrap">
                                {product.category && (
                                    <Link
                                        to={`/categories/${product.category.slug}`}
                                        className="px-3.5 py-1.5 rounded-full bg-[#151D19] border border-[#202A25] text-[#789181] hover:text-[#D8C7A5] hover:border-[#2E6549] transition-colors font-medium"
                                    >
                                        {product.category.name}
                                    </Link>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-[#69736C] font-normal">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(product.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>

                            {/* Actions: Upvote, Visit Product, Share */}
                            <div className="flex items-center justify-center md:justify-start gap-2.5 sm:gap-3.5 flex-wrap w-full">
                                <motion.button
                                    onClick={handleVote}
                                    disabled={!user || voting}
                                    whileTap={!user ? {} : { scale: 0.95 }}
                                    className={`flex items-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-all duration-300 ${
                                        hasVoted
                                            ? "bg-[#214C37] text-[#D8C7A5] border border-[#2E6549] shadow-[0_0_25px_rgba(33,76,55,0.35)]"
                                            : "bg-[#163326] hover:bg-[#214C37] text-[#D8C7A5] border border-[#2E6549]/50 shadow-[0_0_20px_rgba(22,51,38,0.2)]"
                                    } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                                >
                                    <ArrowUp className="w-4 h-4 stroke-[3]" />
                                    <span>{product.upvotes_count}</span>
                                </motion.button>

                                <a
                                    href={product.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm sm:text-base font-bold transition-all duration-300 shadow-[0_0_25px_rgba(216,199,165,0.25)] hover:shadow-[0_0_35px_rgba(216,199,165,0.4)]"
                                >
                                    <span>Visit Product</span>
                                    <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                                </a>

                                <motion.button
                                    type="button"
                                    onClick={handleShare}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#151D19] hover:bg-[#1B2520] text-[#C5C8C1] hover:text-[#F5F1E8] text-sm sm:text-base font-semibold border border-[#29342E] transition-all duration-300 shadow-md cursor-pointer"
                                    title="Share product link"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-[#7FAF8D] stroke-[2.5]" />
                                            <span className="text-[#7FAF8D]">Link Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-4 h-4 stroke-[2]" />
                                            <span>Share</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* About This Product */}
                <Reveal>
                    <div className="mb-14">
                        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F1E8] tracking-tight mb-4">
                            About this product
                        </h2>
                        <div className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-3xl p-6 sm:p-8 shadow-xl">
                            <p className="text-[#C5C8C1] text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words">
                                {product.description}
                            </p>
                        </div>
                    </div>
                </Reveal>

                {/* Product Screenshots - Horizontal Scrollable Gallery */}
                {images.length > 0 && (
                    <Reveal>
                        <div className="mb-14">
                            {images.length === 1 ? (
                                /* Single Screenshot: Displayed Normally */
                                <div className="aspect-video w-full rounded-3xl bg-[#101814] border border-[#202A25] overflow-hidden p-2 flex items-center justify-center shadow-2xl">
                                    <img
                                        src={images[0].image_url}
                                        alt={`${product.name} screenshot`}
                                        className="w-full h-full object-contain rounded-2xl select-none"
                                        draggable={false}
                                    />
                                </div>
                            ) : (
                                /* Multiple Screenshots: Horizontal Scrollable Row */
                                <div
                                    ref={galleryScrollRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseLeave={handleMouseUpOrLeave}
                                    onMouseUp={handleMouseUpOrLeave}
                                    onMouseMove={handleMouseMove}
                                    onWheel={handleWheel}
                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                    className="flex gap-4 sm:gap-6 overflow-x-auto select-none [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing pb-3 pt-1 -mx-2 px-2 scroll-smooth"
                                >
                                    {images.map((img, idx) => (
                                        <div
                                            key={img.id || idx}
                                            className="w-[88vw] sm:w-[620px] md:w-[740px] shrink-0 aspect-video rounded-3xl bg-[#101814] border border-[#202A25] hover:border-[#2E6549] transition-all duration-300 overflow-hidden p-2 flex items-center justify-center shadow-2xl relative group"
                                        >
                                            <img
                                                src={img.image_url}
                                                alt={`${product.name} screenshot ${idx + 1}`}
                                                className="w-full h-full object-contain rounded-2xl pointer-events-none select-none"
                                                draggable={false}
                                            />
                                            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-[#0B100E]/80 border border-[#29342E] text-xs font-mono text-[#8C958E] backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity select-none pointer-events-none">
                                                #{idx + 1} / {images.length}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Reveal>
                )}

                {/* Comments */}
                <Reveal>
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <MessageCircle className="w-5 h-5 text-[#D8C7A5]" />
                            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F1E8] tracking-tight">
                                Comments ({comments.length})
                            </h2>
                        </div>

                        {/* Comment Form */}
                        {user ? (
                            <form onSubmit={handleComment} className="mb-8">
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#1B2520] border border-[#29342E] flex items-center justify-center shrink-0 mt-1">
                                        <span className="text-xs font-bold text-[#8C958E]">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            rows={3}
                                            className="w-full bg-[#151D19] border border-[#29342E] text-[#F5F1E8] text-sm sm:text-base rounded-2xl focus:ring-1 focus:ring-[#789181]/50 focus:border-[#789181] p-4 outline-none transition-all duration-300 placeholder-[#69736C] resize-none"
                                        />
                                        <div className="flex justify-end mt-3">
                                            <motion.button
                                                type="submit"
                                                disabled={!newComment.trim() || commenting}
                                                whileTap={{ scale: 0.97 }}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(216,199,165,0.2)] cursor-pointer"
                                            >
                                                {commenting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-[#1A1A16]" />
                                                ) : (
                                                    <Send className="w-4 h-4 text-[#1A1A16]" />
                                                )}
                                                Comment
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-[#151D19] border border-[#202A25] rounded-2xl p-6 mb-8 text-center">
                                <p className="text-[#8C958E] text-sm">
                                    <Link to="/login" className="text-[#D8C7A5] hover:underline font-semibold">
                                        Log in
                                    </Link>{" "}
                                    to leave a comment
                                </p>
                            </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-4">
                            {comments.length > 0 ? (
                                comments.map((comment, i) => (
                                    <motion.div
                                        key={comment.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: i * 0.05,
                                            duration: 0.4,
                                            ease: [0.22, 0.03, 0.26, 1],
                                        }}
                                        className="bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    to={`/profile/${comment.user_id}`}
                                                    className="w-8 h-8 rounded-full bg-[#1B2520] border border-[#29342E] flex items-center justify-center overflow-hidden hover:opacity-80 transition shrink-0"
                                                >
                                                    {comment.user?.avatar_url ? (
                                                        <img
                                                            src={comment.user.avatar_url}
                                                            alt={comment.user.display_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-[#8C958E]">
                                                            {comment.user?.display_name?.charAt(0) || "?"}
                                                        </span>
                                                    )}
                                                </Link>
                                                <div>
                                                    <Link
                                                        to={`/profile/${comment.user_id}`}
                                                        className="text-sm font-semibold text-[#F5F1E8] hover:text-[#D8C7A5] transition"
                                                    >
                                                        {comment.user?.display_name || "Community Member"}
                                                    </Link>
                                                    {comment.user?.bio && parseBio(comment.user.bio).username && (
                                                        <span className="text-xs text-[#D8C7A5]/80 ml-2 font-medium">
                                                            @{parseBio(comment.user.bio).username}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-[#69736C] ml-2">
                                                        {new Date(comment.created_at).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            {user && user.id === comment.user_id && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="p-1.5 rounded-lg text-[#69736C] hover:text-[#C97878] hover:bg-[#321C1C]/40 transition-all duration-300 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm sm:text-base text-[#C5C8C1] mt-3 leading-relaxed">
                                            {comment.content}
                                        </p>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-center text-[#69736C] text-sm py-8">
                                    No comments yet. Be the first to share your thoughts!
                                </p>
                            )}
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}
