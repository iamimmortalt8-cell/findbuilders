"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Users,
    TrendingUp,
    ExternalLink,
    Layers,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    ChevronDown,
    Check,
    X,
    Loader2,
    User,
} from "lucide-react";
import { fetchProducts, fetchCategories, searchProfiles } from "@/lib/api";
import { parseBio } from "@/lib/types";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/Reveal";
import type { Product, Category, Profile } from "@/lib/types";

export default function Products() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // User Search State
    const [userQuery, setUserQuery] = useState("");
    const [userResults, setUserResults] = useState<Profile[]>([]);
    const [userSearching, setUserSearching] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const userSearchRef = useRef<HTMLDivElement>(null);

    // Custom Select Dropdown States
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const categoryRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    const handleToggleCategory = () => {
        setIsCategoryOpen(!isCategoryOpen);
        setIsSortOpen(false);
    };

    const handleToggleSort = () => {
        setIsSortOpen(!isSortOpen);
        setIsCategoryOpen(false);
    };

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = (searchParams.get("sort") as "newest" | "popular" | "oldest") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 12;

    useEffect(() => {
        fetchCategories().then(setCategories).catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchProducts({ search, category, sort, page, limit })
            .then(({ data: p, count }) => {
                setProducts(p);
                setTotalCount(count || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [search, category, sort, page]);

    // Handle User Search debouncing
    useEffect(() => {
        if (!userQuery.trim()) {
            setUserResults([]);
            setUserSearching(false);
            return;
        }

        setUserSearching(true);
        const timer = setTimeout(async () => {
            try {
                const results = await searchProfiles(userQuery.trim());
                setUserResults(results || []);
            } catch (err) {
                console.error("User search failed:", err);
                setUserResults([]);
            } finally {
                setUserSearching(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [userQuery]);

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            if (userSearchRef.current && !userSearchRef.current.contains(target)) {
                setIsUserDropdownOpen(false);
            }
            if (categoryRef.current && !categoryRef.current.contains(target)) {
                setIsCategoryOpen(false);
            }
            if (sortRef.current && !sortRef.current.contains(target)) {
                setIsSortOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsUserDropdownOpen(false);
                setIsCategoryOpen(false);
                setIsSortOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        if (key !== "page") params.delete("page");
        setSearchParams(params);
    };

    const totalPages = Math.ceil(totalCount / limit);

    // Selected labels for custom dropdowns
    const selectedCategoryName = categories.find((c) => c.id === category)?.name || "All Categories";
    const sortLabels: Record<string, string> = {
        newest: "Newest",
        popular: "Most Popular",
        oldest: "Oldest"
    };
    const selectedSortLabel = sortLabels[sort] || "Newest";

    return (
        <div className="bg-[#0B100E] text-[#F5F1E8] min-h-screen">
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <Reveal>
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#2E6549] to-[#214C37]" />
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5F1E8]">
                                {search ? `Results for "${search}"` : "Discover Products"}
                            </h1>
                        </div>
                        <p className="text-[#8C958E] text-base ml-5">
                            {totalCount} {totalCount === 1 ? "product" : "products"} found
                        </p>
                    </div>
                </Reveal>

                {/* Filters Bar */}
                <Reveal delay={0.1} className="relative z-30">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-10 w-full relative z-30">
                        {/* 1. Search Products (Searches Products Only) */}
                        <div className="relative flex-1 min-w-[200px] group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C958E] group-focus-within:text-[#D8C7A5] transition-colors pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => updateParam("search", e.target.value)}
                                placeholder="Search products..."
                                className="w-full bg-[#151D19] border border-[#29342E] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#789181]/50 focus:border-[#789181] focus:bg-[#1B2520] pl-10 pr-9 py-2.5 outline-none transition-all duration-300 placeholder-[#69736C]"
                            />
                            {search && (
                                <button
                                    onClick={() => updateParam("search", "")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C958E] hover:text-[#F5F1E8] transition-colors"
                                    title="Clear product search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* 2. Search Users (Searches Users Only - Dropdown Popover Directly Below Input) */}
                        <div ref={userSearchRef} className="relative flex-1 min-w-[200px] group z-40">
                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C958E] group-focus-within:text-[#D8C7A5] transition-colors pointer-events-none" />
                            <input
                                type="text"
                                value={userQuery}
                                onChange={(e) => {
                                    setUserQuery(e.target.value);
                                    if (!isUserDropdownOpen) setIsUserDropdownOpen(true);
                                }}
                                onFocus={() => {
                                    if (userQuery.trim()) setIsUserDropdownOpen(true);
                                }}
                                placeholder="Search users..."
                                className="w-full bg-[#151D19] border border-[#29342E] text-[#F5F1E8] text-sm rounded-xl focus:ring-1 focus:ring-[#789181]/50 focus:border-[#789181] focus:bg-[#1B2520] pl-10 pr-9 py-2.5 outline-none transition-all duration-300 placeholder-[#69736C]"
                            />
                            {userQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUserQuery("");
                                        setUserResults([]);
                                        setIsUserDropdownOpen(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C958E] hover:text-[#F5F1E8] transition-colors cursor-pointer"
                                    title="Clear user search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {/* User Search Results Dropdown Panel */}
                            <AnimatePresence>
                                {isUserDropdownOpen && userQuery.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-[#1B2520]/98 border border-[#29342E] shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-2 z-[100] backdrop-blur-2xl max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#29342E] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                                    >
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-[#8C958E] uppercase tracking-wider flex items-center justify-between border-b border-[#202A25] mb-1">
                                            <span>Users</span>
                                            {userSearching && <Loader2 className="w-3 h-3 text-[#D8C7A5] animate-spin" />}
                                        </div>

                                        {userSearching && userResults.length === 0 ? (
                                            <div className="py-6 text-center text-xs text-[#8C958E] flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#D8C7A5]" />
                                                <span>Searching users...</span>
                                            </div>
                                        ) : userResults.length > 0 ? (
                                            <div className="space-y-0.5">
                                                {userResults.map((u) => {
                                                    const bioData = parseBio(u.bio);
                                                    return (
                                                        <Link
                                                            key={u.id}
                                                            to={`/profile/${u.id}`}
                                                            onClick={() => {
                                                                setIsUserDropdownOpen(false);
                                                                setUserQuery("");
                                                            }}
                                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#214C37]/40 hover:border-[#2E6549]/50 border border-transparent transition-all group cursor-pointer"
                                                        >
                                                            <div className="w-9 h-9 rounded-full bg-[#101814] border border-[#29342E] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-[#789181] transition-colors">
                                                                {u.avatar_url ? (
                                                                    <img
                                                                        src={u.avatar_url}
                                                                        alt={u.display_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs font-bold text-[#8C958E]">
                                                                        {u.display_name?.charAt(0).toUpperCase() || "?"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-[#F5F1E8] text-sm truncate group-hover:text-[#D8C7A5] transition-colors">
                                                                        {u.display_name || "User"}
                                                                    </span>
                                                                    {bioData.username && (
                                                                        <span className="text-xs text-[#D8C7A5] font-medium truncate">
                                                                            @{bioData.username}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {bioData.headline ? (
                                                                    <p className="text-xs text-[#8C958E] truncate mt-0.5">
                                                                        {bioData.headline}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-[#69736C] truncate mt-0.5">
                                                                        Builder on FindBuilders
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center text-xs text-[#8C958E]">
                                                No users found
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 3. Category Custom Dark Dropdown (Opens through TOP) */}
                        <div ref={categoryRef} className="relative w-full sm:w-auto min-w-[170px]">
                            <button
                                type="button"
                                onClick={handleToggleCategory}
                                className={`w-full bg-[#151D19] border text-[#F5F1E8] text-sm rounded-xl px-4 py-2.5 outline-none transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer ${
                                    isCategoryOpen
                                        ? "border-[#789181] ring-1 ring-[#789181]/30 bg-[#1B2520]"
                                        : "border-[#29342E] hover:border-[#789181]/40 hover:bg-[#1B2520]"
                                }`}
                            >
                                <span className="truncate font-medium text-[#C5C8C1]">{selectedCategoryName}</span>
                                <ChevronDown
                                    className={`w-4 h-4 text-[#8C958E] transition-transform duration-200 shrink-0 ${
                                        isCategoryOpen ? "rotate-180 text-[#D8C7A5]" : ""
                                    }`}
                                />
                            </button>

                            <AnimatePresence>
                                {isCategoryOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-0 lg:right-0 lg:left-auto bottom-full mb-2 w-full min-w-[200px] rounded-2xl bg-[#1B2520]/98 border border-[#29342E] shadow-[0_-15px_40px_rgba(0,0,0,0.9)] p-1.5 z-50 backdrop-blur-2xl max-h-[135px] overflow-y-auto origin-bottom [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#29342E] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#101814]"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                updateParam("category", "");
                                                setIsCategoryOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
                                                category === ""
                                                    ? "text-[#D8C7A5] bg-[#214C37] font-semibold border border-[#2E6549]"
                                                    : "text-[#C5C8C1] hover:text-[#F5F1E8] hover:bg-[#202B25]"
                                            }`}
                                        >
                                            <span>All Categories</span>
                                            {category === "" && <Check className="w-3.5 h-3.5 text-[#D8C7A5]" />}
                                        </button>
                                        {categories.map((cat) => {
                                            const isSelected = category === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => {
                                                        updateParam("category", cat.id);
                                                        setIsCategoryOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "text-[#D8C7A5] bg-[#214C37] font-semibold border border-[#2E6549]"
                                                            : "text-[#C5C8C1] hover:text-[#F5F1E8] hover:bg-[#202B25]"
                                                    }`}
                                                >
                                                    <span className="truncate">{cat.name}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#D8C7A5]" />}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 4. Sort Custom Dark Dropdown (Opens through TOP) */}
                        <div ref={sortRef} className="relative w-full sm:w-auto min-w-[150px]">
                            <button
                                type="button"
                                onClick={handleToggleSort}
                                className={`w-full bg-[#151D19] border text-[#F5F1E8] text-sm rounded-xl px-4 py-2.5 outline-none transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer ${
                                    isSortOpen
                                        ? "border-[#789181] ring-1 ring-[#789181]/30 bg-[#1B2520]"
                                        : "border-[#29342E] hover:border-[#789181]/40 hover:bg-[#1B2520]"
                                }`}
                            >
                                <span className="truncate font-medium text-[#C5C8C1]">{selectedSortLabel}</span>
                                <ChevronDown
                                    className={`w-4 h-4 text-[#8C958E] transition-transform duration-200 shrink-0 ${
                                        isSortOpen ? "rotate-180 text-[#D8C7A5]" : ""
                                    }`}
                                />
                            </button>

                            <AnimatePresence>
                                {isSortOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 bottom-full mb-2 w-full min-w-[160px] rounded-2xl bg-[#1B2520]/98 border border-[#29342E] shadow-[0_-15px_40px_rgba(0,0,0,0.9)] p-1.5 z-50 backdrop-blur-2xl max-h-[135px] overflow-y-auto origin-bottom [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#29342E] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#101814]"
                                    >
                                        {[
                                            { key: "newest", label: "Newest" },
                                            { key: "popular", label: "Most Popular" },
                                            { key: "oldest", label: "Oldest" },
                                        ].map((item) => {
                                            const isSelected = sort === item.key;
                                            return (
                                                <button
                                                    key={item.key}
                                                    type="button"
                                                    onClick={() => {
                                                        updateParam("sort", item.key);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? "text-[#D8C7A5] bg-[#214C37] font-semibold border border-[#2E6549]"
                                                            : "text-[#C5C8C1] hover:text-[#F5F1E8] hover:bg-[#202B25]"
                                                    }`}
                                                >
                                                    <span>{item.label}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#D8C7A5]" />}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </Reveal>

                {/* Products Grid */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-[#151D19]/80 border border-[#202A25] rounded-2xl overflow-hidden">
                                    <div className="aspect-[16/9] bg-[#1B2520] animate-pulse" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-5 bg-[#1B2520] rounded-lg w-2/3 animate-pulse" />
                                        <div className="h-4 bg-[#1B2520] rounded-lg w-full animate-pulse" />
                                        <div className="flex items-center justify-between pt-3 border-t border-[#202A25]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-[#1B2520] animate-pulse" />
                                                <div className="h-3 bg-[#1B2520] rounded w-16 animate-pulse" />
                                            </div>
                                            <div className="h-3 bg-[#1B2520] rounded w-12 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : products.length > 0 ? (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.06}>
                                {products.map((product) => (
                                    <StaggerItem key={product.id}>
                                        <Link
                                            to={`/product/${product.id}`}
                                            className="group relative bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl overflow-hidden hover:border-[#2E6549] transition-all duration-500 hover:-translate-y-1 flex flex-col h-full"
                                        >
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_top,rgba(216,199,165,0.06)_0%,transparent_60%)] pointer-events-none" />
                                            <div className="w-full aspect-[16/9] bg-transparent overflow-hidden relative rounded-t-2xl">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Layers className="w-10 h-10 text-[#69736C]" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#151D19] via-transparent to-transparent opacity-60" />
                                            </div>
                                            <div className="flex flex-col flex-1 p-5 relative">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-bold text-[#F5F1E8] text-base truncate group-hover:text-[#D8C7A5] transition-colors duration-300">{product.name}</h3>
                                                        <p className="text-[#8C958E] text-sm mt-1 line-clamp-2">{product.tagline}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#163326] border border-[#214C37] shrink-0">
                                                        <TrendingUp className="w-3.5 h-3.5 text-[#D8C7A5]" />
                                                        <span className="text-xs font-bold text-[#D8C7A5]">{product.upvotes_count}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-[#202A25] mt-auto">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-[#1B2520] ring-1 ring-[#29342E] flex items-center justify-center">
                                                            <span className="text-[9px] font-bold text-[#C5C8C1]">{product.maker?.display_name?.charAt(0) || "?"}</span>
                                                        </div>
                                                        <span className="text-xs text-[#8C958E]">{product.maker?.display_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {product.category && (
                                                            <span className="text-[11px] text-[#789181] px-2 py-0.5 rounded-lg bg-[#101814] border border-[#202A25]">{product.category.name}</span>
                                                        )}
                                                        <ExternalLink className="w-3.5 h-3.5 text-[#69736C] group-hover:text-[#D8C7A5] transition-colors" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </StaggerItem>
                                ))}
                            </StaggerContainer>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Reveal delay={0.2}>
                                    <div className="flex items-center justify-center gap-2 mt-12">
                                        <button
                                            onClick={() => updateParam("page", String(page - 1))}
                                            disabled={page <= 1}
                                            className="p-2.5 rounded-xl bg-[#151D19] border border-[#29342E] text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                                            .map((p, idx, arr) => (
                                                <React.Fragment key={p}>
                                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                        <span className="text-[#69736C] px-1">...</span>
                                                    )}
                                                    <button
                                                        onClick={() => updateParam("page", String(p))}
                                                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-300 ${
                                                            p === page
                                                                ? "bg-[#D8C7A5] text-[#1A1A16] font-semibold shadow-[0_0_20px_rgba(216,199,165,0.25)]"
                                                                : "bg-[#151D19] border border-[#29342E] text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520]"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </React.Fragment>
                                            ))}
                                        <button
                                            onClick={() => updateParam("page", String(page + 1))}
                                            disabled={page >= totalPages}
                                            className="p-2.5 rounded-xl bg-[#151D19] border border-[#29342E] text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                                        >
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Reveal>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-[#151D19] border border-[#202A25] flex items-center justify-center mb-5">
                                <Layers className="w-7 h-7 text-[#69736C]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#F5F1E8] mb-2">No products found</h3>
                            <p className="text-[#8C958E] text-sm">
                                {search ? "Try a different search query." : "Be the first to submit a product!"}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
