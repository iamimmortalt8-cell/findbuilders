"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Save, X, ImageIcon, UploadCloud, AlertCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { fetchProduct, updateProduct, submitProduct, fetchCategories, api } from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { DeleteProductModal } from "@/components/DeleteProductModal";
import type { Category, Product } from "@/lib/types";

export default function EditProduct() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, profile, loading: authLoading } = useAuth();
    const toast = useToast();
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Main Logo
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Screenshots
    const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
    const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
    const [existingScreenshots, setExistingScreenshots] = useState<{ id: string; url: string; display_order: number }[]>([]);

    const [form, setForm] = useState({
        name: "", tagline: "", description: "", website_url: "", category_id: "",
    });
    const [productStatus, setProductStatus] = useState<string>("");
    const [rejectionReason, setRejectionReason] = useState<string>("");

    useEffect(() => {
        if (!authLoading && !user) navigate("/login");
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user) return;
        
        const loadData = async () => {
            try {
                const cats = await fetchCategories();
                setCategories(cats);

                if (id) {
                    const [prod, imagesRes] = await Promise.all([
                        fetchProduct(id),
                        api.getProductImages(id)
                    ]);
                    
                    if (prod.maker_id !== user.id && profile?.role !== 'admin') {
                        navigate("/builder");
                        return;
                    }

                    setForm({
                        name: prod.name || "",
                        tagline: prod.tagline || "",
                        description: prod.description || "",
                        website_url: prod.website_url || "",
                        category_id: prod.category_id || "",
                    });
                    setProductStatus(prod.status || "");
                    setRejectionReason(prod.rejection_reason || "");
                    
                    if (prod.image_url) {
                        setImagePreview(prod.image_url);
                    }

                    if (imagesRes && imagesRes.length > 0) {
                        setExistingScreenshots(imagesRes.map(img => ({ id: img.id, url: img.image_url, display_order: img.display_order })));
                    }
                }
            } catch (err) {
                console.error("Failed to load data", err);
                toast.error(id ? "Failed to load product details." : "Failed to initialize.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, user, profile, navigate]);

    const handleFieldChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!form.name.trim()) {
            errors.name = "Please enter a product name.";
        } else if (form.name.trim().length > 100) {
            errors.name = "Product name must be 100 characters or less.";
        }

        if (!form.tagline.trim()) {
            errors.tagline = "Please enter a short tagline.";
        } else if (form.tagline.trim().length > 150) {
            errors.tagline = "Tagline must be 150 characters or less.";
        }

        if (!form.website_url.trim()) {
            errors.website_url = "Please enter a website or demo URL.";
        } else {
            try {
                const parsed = new URL(form.website_url.trim());
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                    errors.website_url = "URL must start with http:// or https://";
                }
            } catch {
                errors.website_url = "Please enter a valid URL (e.g. https://yourproduct.com).";
            }
        }

        if (!form.description.trim()) {
            errors.description = "Please enter a product description.";
        } else if (form.description.trim().length < 10) {
            errors.description = "Description must be at least 10 characters.";
        } else if (form.description.trim().length > 5000) {
            errors.description = "Description must be 5000 characters or less.";
        }

        if (!form.category_id) {
            errors.category_id = "Please select a category.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setFieldErrors(prev => ({ ...prev, logo: "Logo file must be under 5MB" }));
                return;
            }
            setFieldErrors(prev => {
                const updated = { ...prev };
                delete updated.logo;
                return updated;
            });
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        // Check total count (new + existing)
        if (files.length + existingScreenshots.length + screenshotFiles.length > 8) {
            toast.error("You can only upload up to 8 screenshots total.");
            return;
        }

        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
        if (validFiles.length < files.length) {
            toast.error("Some images were larger than 5MB and were skipped.");
        }

        setScreenshotFiles(prev => [...prev, ...validFiles]);
        
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeScreenshot = (index: number) => {
        setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
        setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const submitForm = async (targetStatus: 'draft' | 'pending') => {
        if (!user) return;
        
        if (!validateForm()) {
            toast.error("Please fix the errors in the form before submitting.");
            return;
        }
        
        setSaving(true);
        try {
            let currentProductId = id;

            if (id) {
                // Edit Mode
                await updateProduct(id, { ...form, status: targetStatus });
            } else {
                // Create Mode
                const newProduct = await submitProduct({ ...form, image_url: "", status: targetStatus }, user.id);
                currentProductId = newProduct.id;
            }

            // Upload new logo if changed
            if (imageFile && currentProductId) {
                await api.uploadProductImage(currentProductId, imageFile);
            }

            // Upload new screenshots if any
            if (screenshotFiles.length > 0 && currentProductId) {
                await api.uploadProductScreenshots(currentProductId, screenshotFiles);
                
                if (id) {
                    // Clear selected files after successful upload in Edit Mode
                    setScreenshotFiles([]);
                    setScreenshotPreviews([]);
                    
                    // Refresh existing screenshots
                    const updatedImages = await api.getProductImages(currentProductId);
                    if (updatedImages) {
                        setExistingScreenshots(updatedImages.map(img => ({
                            id: img.id,
                            url: img.image_url,
                            display_order: img.display_order
                        })));
                    }
                }
            }

            if (id) {
                toast.success(targetStatus === 'draft' ? "Draft saved successfully!" : "Changes saved and submitted for review!");
                navigate("/builder");
            } else {
                toast.success(targetStatus === 'draft' ? "Draft saved successfully!" : "Product submitted for review!");
                navigate("/builder");
            }
        } catch (err: any) {
            toast.error(err.message || (id ? "Failed to update product" : "Failed to submit product"));
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#29342E] border-t-[#D8C7A5] animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B100E] text-[#F5F1E8]">
            <div className="border-b border-[#202A25] bg-[#101814]/90 backdrop-blur-2xl sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/builder" className="flex items-center gap-2 text-sm text-[#8C958E] hover:text-[#F5F1E8] transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back to Dashboard</span>
                    </Link>
                    <span className="text-sm font-semibold text-[#F5F1E8]">{id ? "Edit Product" : "Submit Product"}</span>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <Reveal>
                    <div className="mb-8 sm:mb-10">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F1E8] mb-2">{id ? "Edit Your Product" : "Submit Your Product"}</h1>
                        <p className="text-xs sm:text-sm text-[#8C958E] leading-relaxed">{id ? "Update your product details, logo, and upload screenshots (16:9 laptop size recommended)." : "Fill in the details below. Your product will be reviewed by our team before going live."}</p>
                    </div>
                </Reveal>

                <Reveal delay={0.1}>
                    <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-8">
                        {productStatus === 'rejected' && rejectionReason && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-[#321C1C]/40 border border-[#C97878]/30 rounded-2xl">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-[#C97878] shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-[#C97878] font-bold text-sm uppercase tracking-wider mb-1">Product Rejected</h3>
                                        <p className="text-[#F5F1E8] text-sm leading-relaxed">{rejectionReason}</p>
                                        <p className="text-[#8C958E] text-xs mt-3">Please address the feedback and submit for review again.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Product Image / Logo */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#8C958E] uppercase tracking-[0.15em]">Product Logo / Icon</label>
                            {imagePreview ? (
                                <div className="relative w-32 h-32">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl border border-[#29342E] bg-[#101814] p-2" />
                                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 p-1 rounded-full bg-[#321C1C] border border-[#C97878]/40 text-[#C97878] hover:bg-[#C97878] hover:text-[#1A1A16] transition-colors shadow-lg cursor-pointer">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <label className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-[#789181] hover:bg-[#151D19]/40 transition-all duration-300 ${fieldErrors.logo ? 'border-[#C97878]/60 bg-[#321C1C]/20' : 'border-[#29342E]'}`}>
                                    <ImageIcon className="w-6 h-6 text-[#69736C] mb-2" />
                                    <span className="text-[10px] text-[#8C958E] text-center px-2">Upload Logo (max 5MB)</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                            {fieldErrors.logo && (
                                <p className="text-xs text-[#C97878] flex items-center gap-1 font-medium mt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {fieldErrors.logo}
                                </p>
                            )}
                        </div>

                        {/* Product Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C958E] uppercase tracking-[0.15em]">
                                Product Name <span className="text-[#C97878]">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => handleFieldChange("name", e.target.value)}
                                className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl p-3.5 outline-none transition-all duration-300 placeholder-[#69736C] ${
                                    fieldErrors.name
                                        ? "border-[#C97878]/60 focus:ring-1 focus:ring-[#C97878]/50 bg-[#321C1C]/20"
                                        : "border-[#29342E] focus:ring-1 focus:ring-[#789181]/40 focus:border-[#789181] focus:bg-[#151D19]"
                                }`}
                                placeholder="e.g. DevFlow AI"
                            />
                            {fieldErrors.name && (
                                <p className="text-xs text-[#C97878] flex items-center gap-1 font-medium mt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {fieldErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Tagline */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C958E] uppercase tracking-[0.15em]">
                                Tagline <span className="text-[#C97878]">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.tagline}
                                onChange={(e) => handleFieldChange("tagline", e.target.value)}
                                className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl p-3.5 outline-none transition-all duration-300 placeholder-[#69736C] ${
                                    fieldErrors.tagline
                                        ? "border-[#C97878]/60 focus:ring-1 focus:ring-[#C97878]/50 bg-[#321C1C]/20"
                                        : "border-[#29342E] focus:ring-1 focus:ring-[#789181]/40 focus:border-[#789181] focus:bg-[#151D19]"
                                }`}
                                placeholder="A short one-liner about your product"
                            />
                            {fieldErrors.tagline && (
                                <p className="text-xs text-[#C97878] flex items-center gap-1 font-medium mt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {fieldErrors.tagline}
                                </p>
                            )}
                        </div>

                        {/* Website URL */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C958E] uppercase tracking-[0.15em]">
                                Website / Demo URL <span className="text-[#C97878]">*</span>
                            </label>
                            <input
                                type="url"
                                value={form.website_url}
                                onChange={(e) => handleFieldChange("website_url", e.target.value)}
                                className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl p-3.5 outline-none transition-all duration-300 placeholder-[#69736C] ${
                                    fieldErrors.website_url
                                        ? "border-[#C97878]/60 focus:ring-1 focus:ring-[#C97878]/50 bg-[#321C1C]/20"
                                        : "border-[#29342E] focus:ring-1 focus:ring-[#789181]/40 focus:border-[#789181] focus:bg-[#151D19]"
                                }`}
                                placeholder="https://yourproduct.com"
                            />
                            {fieldErrors.website_url && (
                                <p className="text-xs text-[#C97878] flex items-center gap-1 font-medium mt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {fieldErrors.website_url}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C958E] uppercase tracking-[0.15em]">
                                Description <span className="text-[#C97878]">*</span>
                            </label>
                            <textarea
                                rows={5}
                                value={form.description}
                                onChange={(e) => handleFieldChange("description", e.target.value)}
                                className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl p-3.5 outline-none transition-all duration-300 placeholder-[#69736C] resize-none ${
                                    fieldErrors.description
                                        ? "border-[#C97878]/60 focus:ring-1 focus:ring-[#C97878]/50 bg-[#321C1C]/20"
                                        : "border-[#29342E] focus:ring-1 focus:ring-[#789181]/40 focus:border-[#789181] focus:bg-[#151D19]"
                                }`}
                                placeholder="Tell us what your product does, who it's for, and why it matters..."
                            />
                            {fieldErrors.description && (
                                <p className="text-xs text-[#C97878] flex items-center gap-1 font-medium mt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {fieldErrors.description}
                                </p>
                            )}
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#8C958E] uppercase tracking-[0.15em]">
                                Category <span className="text-[#C97878]">*</span>
                            </label>
                            <select
                                value={form.category_id}
                                onChange={(e) => handleFieldChange("category_id", e.target.value)}
                                className={`w-full bg-[#101814] border text-[#F5F1E8] text-sm rounded-xl p-3.5 outline-none transition-all duration-300 ${
                                    fieldErrors.category_id
                                        ? "border-[#C97878]/60 focus:ring-1 focus:ring-[#C97878]/50 bg-[#321C1C]/20"
                                        : "border-[#29342E] focus:ring-1 focus:ring-[#789181]/40 focus:border-[#789181] focus:bg-[#151D19]"
                                }`}
                            >
                                <option value="" className="bg-[#101814] text-[#8C958E]">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id} className="bg-[#101814] text-[#F5F1E8]">{cat.name}</option>
                                ))}
                            </select>
                            {fieldErrors.category_id && (
                                <p className="text-xs text-[#C97878] flex items-center gap-1 font-medium mt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {fieldErrors.category_id}
                                </p>
                            )}
                        </div>

                        {/* Screenshots Upload */}
                        <div className="space-y-4 pt-4 border-t border-[#202A25]">
                            <div>
                                <h3 className="text-lg font-bold text-[#F5F1E8] mb-1">Product Screenshots</h3>
                                <p className="text-sm text-[#8C958E]">Upload up to 8 laptop-size (16:9) screenshots. These will appear in a horizontal scrollable gallery on your product page.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Existing Screenshots */}
                                {existingScreenshots.map((screenshot, i) => (
                                    <div key={`existing-${screenshot.id}`} className="relative aspect-video rounded-xl bg-[#101814] border border-[#202A25] overflow-hidden group">
                                        <img src={screenshot.url} alt={`Screenshot ${i+1}`} className="w-full h-full object-contain p-1" />
                                        <div className="absolute inset-0 bg-[#0B100E]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C7A5]">Saved</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={async () => {
                                                try {
                                                    await api.deleteProductImage(screenshot.id);
                                                    setExistingScreenshots(prev => prev.filter(s => s.id !== screenshot.id));
                                                } catch (err) {
                                                    console.error("Failed to delete screenshot", err);
                                                }
                                            }}
                                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#321C1C] border border-[#C97878]/40 text-[#C97878] hover:bg-[#C97878] hover:text-[#1A1A16] transition-colors shadow-lg opacity-0 group-hover:opacity-100 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {/* Selected New Screenshots Preview */}
                                {screenshotPreviews.map((url, i) => (
                                    <div key={`new-${i}`} className="relative aspect-video rounded-xl bg-[#163326] border border-[#214C37] overflow-hidden">
                                        <img src={url} alt={`New Screenshot ${i+1}`} className="w-full h-full object-contain p-1 opacity-85" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeScreenshot(i)} 
                                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#321C1C] border border-[#C97878]/40 text-[#C97878] hover:bg-[#C97878] hover:text-[#1A1A16] transition-colors shadow-lg cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {/* Upload Button */}
                                {existingScreenshots.length + screenshotFiles.length < 8 && (
                                    <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-[#29342E] rounded-xl cursor-pointer hover:border-[#789181] hover:bg-[#151D19]/40 transition-all duration-300">
                                        <UploadCloud className="w-6 h-6 text-[#69736C] mb-1" />
                                        <span className="text-[10px] text-[#8C958E]">Upload ({8 - (existingScreenshots.length + screenshotFiles.length)} left)</span>
                                        <input type="file" accept="image/*" multiple onChange={handleScreenshotsChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 border-t border-[#202A25] flex flex-col-reverse sm:flex-row items-center justify-end gap-4">
                            <Link to="/builder" className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#8C958E] hover:text-[#F5F1E8] transition-colors w-full sm:w-auto text-center">
                                Cancel
                            </Link>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <motion.button
                                    type="button"
                                    onClick={() => submitForm('draft')}
                                    disabled={saving}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2.5 bg-[#151D19] border border-[#202A25] hover:bg-[#1B2520] text-[#D8C7A5] text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Draft
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={() => submitForm('pending')}
                                    disabled={saving}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D8C7A5] hover:bg-[#E5D5B5] text-[#1A1A16] text-sm font-semibold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(216,199,165,0.25)] hover:shadow-[0_0_30px_rgba(216,199,165,0.35)] disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-[#1A1A16]" />
                                            {id ? "Saving..." : "Submitting..."}
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-4 h-4 text-[#1A1A16]" />
                                            Submit for Review
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        {/* Danger Zone (Delete Product) */}
                        {id && (
                            <div className="mt-12 pt-8 border-t border-[#C97878]/25">
                                <div className="bg-[#321C1C]/40 border border-[#C97878]/25 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                                    <div>
                                        <h3 className="text-base font-bold text-[#F5F1E8] flex items-center gap-2">
                                            <Trash2 className="w-4 h-4 text-[#C97878]" />
                                            Danger Zone • Delete Product
                                        </h3>
                                        <p className="text-xs text-[#8C958E] mt-1 max-w-md leading-relaxed">
                                            Permanently delete this product and all associated images, votes, comments, and database records. This cannot be undone.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="px-4 py-2.5 bg-[#321C1C] hover:bg-[#422222] text-[#C97878] border border-[#C97878]/30 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-[0_0_15px_rgba(201,120,120,0.15)]"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete Product
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </Reveal>
            </div>

            {/* Permanent Delete Modal */}
            {id && (
                <DeleteProductModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    product={{
                        id,
                        name: form.name || "Product",
                        image_url: imagePreview,
                    }}
                    onSuccess={() => {
                        navigate("/builder");
                    }}
                />
            )}
        </div>
    );
}
