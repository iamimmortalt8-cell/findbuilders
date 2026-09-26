"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
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
import SEO, { buildCollectionSchema } from "@/components/SEO";
import type { Product, Category, Profile } from "@/lib/types";

const CATEGORY_DESCRIPTIONS: Record<string, { title: string; metaDescription: string; intro: string }> = {
    ai: {
        title: "AI Tools & Machine Learning Products | FindBuilders",
        metaDescription: "Discover top AI products, machine learning applications, and generative AI software built by indie makers on FindBuilders.",
        intro: "Explore cutting-edge artificial intelligence products, intelligent automation apps, and developer-first ML tools created by independent makers and startup founders."
    },
    "developer-tools": {
        title: "Developer Tools, APIs & CLI Utilities | FindBuilders",
        metaDescription: "Discover curated developer tools, SDKs, open-source libraries, and engineering utilities built by developers for developers.",
        intro: "A curated collection of developer tools, CLI utilities, libraries, and frameworks built to streamline coding, debugging, testing, and shipping."
    },
    productivity: {
        title: "Productivity Apps & Workflow Software | FindBuilders",
        metaDescription: "Find innovative productivity tools, task managers, and workflow utilities created by makers to help you accomplish more.",
        intro: "Modern productivity software designed to organize your personal workflows, automate repetitive tasks, and keep teams and creators focused on what matters."
    },
    education: {
        title: "Education & Learning Software | FindBuilders",
        metaDescription: "Explore educational platforms, interactive learning apps, and skill-building software built by indie educators and developers.",
        intro: "Educational platforms, interactive coding exercises, and study tools created to empower learners, self-taught engineers, and educators worldwide."
    },
    design: {
        title: "Design Tools, UI Kits & Creative Assets | FindBuilders",
        metaDescription: "Discover design tools, UI resources, prototyping apps, and creative utilities crafted by indie designers on FindBuilders.",
        intro: "Creative software, prototyping tools, icon libraries, and design systems built to empower digital designers and creative professionals."
    },
    business: {
        title: "Business Software & Micro-SaaS Products | FindBuilders",
        metaDescription: "Discover business software, micro-SaaS products, and startup tools designed by indie founders to run and grow modern businesses.",
        intro: "Software solutions and utilities tailored for founders, operators, and small businesses—spanning analytics, customer growth, and billing."
    },
    other: {
        title: "Unique Tools & Experimental Projects | FindBuilders",
        metaDescription: "Explore unique experiments, creative tech projects, and unconventional products built by indie makers across the web.",
        intro: "Interesting and experimental software projects that challenge conventional categories, built by makers exploring new creative boundaries."
    }
};

export default function Products() {
    const { categorySlug } = useParams<{ categorySlug?: string }>();
    const navigate = useNavigate();
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
    const categoryParam = searchParams.get("category") || "";
    const sort = (searchParams.get("sort") as "newest" | "popular" | "oldest") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 12;

    // Resolve category from route slug or query parameter
    const activeCategory = categories.find((c) => {
        if (categorySlug) {
            return c.slug.toLowerCase() === categorySlug.toLowerCase() || c.name.toLowerCase() === categorySlug.toLowerCase();
        }
        if (categoryParam) {
            return c.id === categoryParam || c.slug.toLowerCase() === categoryParam.toLowerCase() || c.name.toLowerCase() === categoryParam.toLowerCase();
        }
        return false;
    });

    const effectiveCategoryId = activeCategory ? activeCategory.id : (categoryParam.length === 36 ? categoryParam : "");

    useEffect(() => {
        fetchCategories().then(setCategories).catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchProducts({ search, category: effectiveCategoryId, sort, page, limit })
            .then(({ data: p, count }) => {
                setProducts(p);
                setTotalCount(count || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [search, effectiveCategoryId, sort, page]);

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
    const selectedCategoryName = activeCategory ? activeCategory.name : "All Categories";
    const sortLabels: Record<string, string> = {
        newest: "Newest",
        popular: "Most Popular",
        oldest: "Oldest"
    };
    const selectedSortLabel = sortLabels[sort] || "Newest";

    const categoryDetails = activeCategory ? (CATEGORY_DESCRIPTIONS[activeCategory.slug.toLowerCase()] || null) : null;

    const seoTitle = activeCategory
        ? (categoryDetails?.title || `${activeCategory.name} Products & Tools | FindBuilders`)
        : (search ? `Results for "${search}" | FindBuilders` : "Discover Products & Developer Tools Built by Indie Makers | FindBuilders");

    const seoDescription = activeCategory
        ? (categoryDetails?.metaDescription || `Explore emerging ${activeCategory.name} products, tools, and apps built by indie makers on FindBuilders.`)
        : "Explore the directory of new startup products, developer tools, AI apps, and SaaS projects launched by indie makers on FindBuilders.";

    const canonicalUrl = activeCategory
        ? `/categories/${activeCategory.slug}`
        : "/products";

    const breadcrumbs = activeCategory
        ? [
            { name: "Home", url: "/" },
            { name: "Categories", url: "/categories" },
            { name: activeCategory.name, url: `/categories/${activeCategory.slug}` }
          ]
        : [
            { name: "Home", url: "/" },
            { name: "Products", url: "/products" }
          ];

    const collectionSchema = buildCollectionSchema(
        activeCategory ? `${activeCategory.name} Products` : "FindBuilders Products Directory",
        seoDescription,
        canonicalUrl
    );

    return (
        <div className="bg-[#0B100E] text-[#F5F1E8] min-h-screen">
            <SEO
                title={seoTitle}
                description={seoDescription}
                canonical={canonicalUrl}
                breadcrumbs={breadcrumbs}
                structuredData={collectionSchema}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <Reveal>
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#2E6549] to-[#214C37]" />
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5F1E8]">
                                {activeCategory
                                    ? `Discover ${activeCategory.name} Products`
                                    : search
                                    ? `Results for "${search}"`
                                    : "Discover Products Built by Makers"}
                            </h1>
                        </div>
                        <p className="text-[#8C958E] text-base ml-5 max-w-2xl mb-2">
                            {activeCategory && categoryDetails
                                ? categoryDetails.intro
                                : "Explore curated software, developer tools, AI apps, and SaaS projects launched by indie creators."}
                        </p>
                        <p className="text-[#789181] text-xs font-mono ml-5">
                            {totalCount} {totalCount === 1 ? "product" : "products"} available
                        </p>
                    </div>

                    {/* Quick Category Navigation Pills */}
                    <div className="flex flex-wrap gap-2 mb-8 items-center">
                        <span className="text-xs text-[#8C958E] font-medium mr-1">Categories:</span>
                        <Link
                            to="/products"
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                !activeCategory
                                    ? "bg-[#D8C7A5] text-[#1A1A16] font-bold shadow-[0_0_15px_rgba(216,199,165,0.2)]"
                                    : "bg-[#151D19] text-[#8C958E] border border-[#202A25] hover:text-[#F5F1E8] hover:border-[#2E6549]"
                            }`}
                        >
                            All Products
                        </Link>
                        {categories.map((cat) => {
                            const isActive = activeCategory?.id === cat.id;
                            return (
                                <Link
                                    key={cat.id}
                                    to={`/categories/${cat.slug}`}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                        isActive
                                            ? "bg-[#D8C7A5] text-[#1A1A16] font-bold shadow-[0_0_15px_rgba(216,199,165,0.2)]"
                                            : "bg-[#151D19] text-[#8C958E] border border-[#202A25] hover:text-[#F5F1E8] hover:border-[#2E6549]"
                                    }`}
                                >
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </Reveal>

                {/* Filters Bar */}
                <Reveal delay={0.1} className="relative z-30">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-8 sm:mb-10 w-full relative z-30">
                        {/* 1. Search Products (Searches Products Only) */}
                        <div className="relative flex-1 min-w-0 group">
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
                        <div ref={userSearchRef} className="relative flex-1 min-w-0 group z-40">
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
                        <div ref={categoryRef} className="relative w-full sm:w-auto min-w-0 sm:min-w-[170px]">
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
                                        className="absolute left-0 lg:right-0 lg:left-auto bottom-full mb-2 w-full min-w-0 sm:min-w-[200px] rounded-2xl bg-[#1B2520]/98 border border-[#29342E] shadow-[0_-15px_40px_rgba(0,0,0,0.9)] p-1.5 z-50 backdrop-blur-2xl max-h-[135px] overflow-y-auto origin-bottom [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#29342E] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#101814]"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (categorySlug) {
                                                    navigate("/products");
                                                } else {
                                                    updateParam("category", "");
                                                }
                                                setIsCategoryOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
                                                !activeCategory
                                                    ? "text-[#D8C7A5] bg-[#214C37] font-semibold border border-[#2E6549]"
                                                    : "text-[#C5C8C1] hover:text-[#F5F1E8] hover:bg-[#202B25]"
                                            }`}
                                        >
                                            <span>All Categories</span>
                                            {!activeCategory && <Check className="w-3.5 h-3.5 text-[#D8C7A5]" />}
                                        </button>
                                        {categories.map((cat) => {
                                            const isSelected = activeCategory?.id === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (categorySlug) {
                                                            navigate(`/categories/${cat.slug}`);
                                                        } else {
                                                            updateParam("category", cat.id);
                                                        }
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
                        <div ref={sortRef} className="relative w-full sm:w-auto min-w-0 sm:min-w-[150px]">
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
                                        className="absolute right-0 bottom-full mb-2 w-full min-w-0 sm:min-w-[160px] rounded-2xl bg-[#1B2520]/98 border border-[#29342E] shadow-[0_-15px_40px_rgba(0,0,0,0.9)] p-1.5 z-50 backdrop-blur-2xl max-h-[135px] overflow-y-auto origin-bottom [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#29342E] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#101814]"
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
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                        >
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-[#151D19]/80 border border-[#202A25] rounded-2xl overflow-hidden">
                                    <div className="aspect-[16/9] bg-[#1B2520] animate-pulse" />
                                    <div className="p-4 sm:p-5 space-y-3">
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
                            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" staggerDelay={0.06}>
                                {products.map((product) => (
                                    <StaggerItem key={product.id}>
                                        <Link
                                            to={`/product/${product.id}`}
                                            className="group relative bg-[#151D19]/90 backdrop-blur-xl border border-[#202A25] rounded-2xl overflow-hidden hover:border-[#2E6549] transition-all duration-500 hover:-translate-y-1 flex flex-col h-full"
                                        >
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_top,rgba(216,199,165,0.06)_0%,transparent_60%)] pointer-events-none" />
                                            <div className="w-full aspect-[16/9] bg-transparent overflow-hidden relative rounded-t-2xl">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={`${product.name} - ${product.tagline || 'Product logo'}`} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Layers className="w-10 h-10 text-[#69736C]" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#151D19] via-transparent to-transparent opacity-60" />
                                            </div>
                                            <div className="flex flex-col flex-1 p-4 sm:p-5 relative">
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
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-5 h-5 rounded-full bg-[#1B2520] ring-1 ring-[#29342E] flex items-center justify-center shrink-0">
                                                            <span className="text-[9px] font-bold text-[#C5C8C1]">{product.maker?.display_name?.charAt(0) || "?"}</span>
                                                        </div>
                                                        <span className="text-xs text-[#8C958E] truncate">{product.maker?.display_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                                        {product.category && (
                                                            <span className="text-[11px] text-[#789181] px-2 py-0.5 rounded-lg bg-[#101814] border border-[#202A25] truncate max-w-[120px]">{product.category.name}</span>
                                                        )}
                                                        <ExternalLink className="w-3.5 h-3.5 text-[#69736C] group-hover:text-[#D8C7A5] transition-colors shrink-0" />
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
                                    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-8 sm:mt-12">
                                        <button
                                            onClick={() => updateParam("page", String(page - 1))}
                                            disabled={page <= 1}
                                            className="p-2 sm:p-2.5 rounded-xl bg-[#151D19] border border-[#29342E] text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                                            .map((p, idx, arr) => (
                                                <React.Fragment key={p}>
                                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                        <span className="text-[#69736C] px-1 text-xs">...</span>
                                                    )}
                                                    <button
                                                        onClick={() => updateParam("page", String(p))}
                                                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
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
                                            className="p-2 sm:p-2.5 rounded-xl bg-[#151D19] border border-[#29342E] text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#1B2520] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
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
