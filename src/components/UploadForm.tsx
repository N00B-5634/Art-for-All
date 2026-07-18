/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Upload, ShieldAlert, Check } from "lucide-react";
import { Artwork, ArtistProfile } from "../types";

interface UploadFormProps {
  onAddArtwork: (newArt: Omit<Artwork, "id" | "createdAt">, file: File | null) => void;
  activeArtist?: ArtistProfile;
  isAdmin?: boolean;
  profiles?: ArtistProfile[];
}

export default function UploadForm({ onAddArtwork, activeArtist, isAdmin = false, profiles = [] }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [price, setPrice] = useState("30.00");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Track selected artist if in Admin mode
  const [selectedArtistId, setSelectedArtistId] = useState(() => {
    return activeArtist?.id || (profiles.length > 0 ? profiles[0].id : "");
  });

  const currentArtist = isAdmin 
    ? (profiles.find(p => p.id === selectedArtistId) || activeArtist) 
    : activeArtist;

  // Automatically update monetary address when selected artist changes
  const [monetaryAddress, setMonetaryAddress] = useState(currentArtist?.monetaryAddress || "");

  useEffect(() => {
    if (currentArtist) {
      setMonetaryAddress(currentArtist.monetaryAddress);
    }
  }, [currentArtist]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price) {
      alert("Please fill in all required fields.");
      return;
    }

    // Split tags by comma, trim, filter empty
    const tags = tagsInput
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    // If no tags, provide a fallback "cozy"
    if (tags.length === 0) tags.push("cozy");

    if (!currentArtist) {
      alert("No active artist found. Please register an artist profile first.");
      return;
    }

    onAddArtwork({
      title,
      artistId: currentArtist.id,
      artistName: currentArtist.name,
      description,
      tags,
      imageUrl: selectedFile ? URL.createObjectURL(selectedFile) : "https://picsum.photos/seed/cozy/800/600",
      price: parseFloat(price) || 0,
      monetaryAddress: currentArtist.monetaryAddress // Securely bound to identity
    }, selectedFile);

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      // Reset form
      setTitle("");
      setDescription("");
      setTagsInput("");
      setSelectedFile(null);
    }, 2500);
  };

  const selectFileManual = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-brand-primary/10 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="font-serif font-semibold text-2xl text-brand-primary mb-1 flex items-center gap-2">
          <Upload className="w-6 h-6 text-brand-primary" />
          <span>Publish New Artwork</span>
        </h2>
        <p className="text-xs text-brand-muted font-sans">
          Publish your artwork to showcase it in the gallery.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-brand-panel border border-brand-primary/10 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
          <div className="bg-brand-primary p-3 rounded-full text-brand-bg">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-semibold text-lg text-brand-primary">Artwork Uploaded Successfully!</h3>
          <p className="text-xs text-brand-muted max-w-sm">
            Your artwork is now published and active in the gallery.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" id="upload-form">
          {/* File Upload Stage */}
          <div>
            <label className="block text-xs font-semibold text-brand-primary uppercase tracking-wider mb-2">
              Artwork File (PNG or JPG) *
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? "border-brand-accent bg-brand-panel" 
                  : "border-brand-primary/20 bg-brand-panel/30 hover:border-brand-primary/40"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={selectFileManual}
              id="file-dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
                id="file-input-manual"
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="text-xs text-brand-primary font-medium">✓ File Selected</div>
                  <div className="text-[11px] text-brand-muted truncate max-w-md mx-auto">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                  <div className="text-[10px] text-brand-primary-light italic">Click to replace</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-brand-primary/40 mx-auto" />
                  <div className="text-xs text-brand-muted">
                    Drag and drop your image here, or <span className="text-brand-primary underline font-medium">browse</span>
                  </div>
                  <div className="text-[10px] text-brand-muted/70">
                    Supports PNG, JPG, JPEG up to 5MB
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label htmlFor="art-title" className="block text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1.5">
                Artwork Title *
              </label>
              <input
                id="art-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Whispering Birches"
                className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="art-price" className="block text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1.5">
                Commission Price (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted/50 text-xs">$</span>
                <input
                  id="art-price"
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25.00"
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg pl-7 pr-3.5 py-2 text-brand-primary text-xs"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="art-description" className="block text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1.5">
              Description / Creative Story *
            </label>
            <textarea
              id="art-description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story of how you created this artwork, the tools, mediums, and cozy inspirations..."
              className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display logged-in artist name or select dropdown if admin */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1.5">
                Publishing Artist *
              </label>
              {isAdmin && profiles.length > 0 ? (
                <select
                  value={selectedArtistId}
                  onChange={(e) => setSelectedArtistId(e.target.value)}
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs font-medium cursor-pointer"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (@{p.name.toLowerCase().replace(/\s+/g, "")})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={`${currentArtist?.name || ""} (Verified)`}
                  className="w-full bg-brand-panel border border-brand-primary/10 rounded-lg px-3.5 py-2 text-brand-primary text-xs font-medium opacity-85 select-none"
                />
              )}
            </div>

            {/* Tags Input */}
            <div>
              <label htmlFor="art-tags" className="block text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1.5">
                Tags (Comma Separated) *
              </label>
              <input
                id="art-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. watercolor, cozy, landscape"
                className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs"
              />
            </div>
          </div>

          {/* Locked Payout Address Display */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-brand-primary uppercase tracking-wider">
                Payout Address / Account URL
              </label>
              <span className="text-[10px] text-brand-primary font-serif italic font-medium">Linked to artist profile</span>
            </div>
            <input
              type="text"
              disabled
              value={monetaryAddress}
              className="w-full bg-brand-panel border border-brand-primary/10 rounded-lg px-3.5 py-2 text-brand-primary text-xs font-mono select-all opacity-85"
            />
            <p className="text-[10px] text-brand-muted/60 mt-1">
              Your payout destination is configured. To update, edit your payout parameters inside your profile settings.
            </p>
          </div>

          {/* Terms of Protection */}
          <div className="bg-brand-panel border border-brand-primary/10 rounded-xl p-4 flex gap-3 text-[11px] text-brand-muted leading-normal">
            <ShieldAlert className="w-5 h-5 text-brand-primary-light shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-brand-primary block mb-0.5">Artwork Listing Agreement</span>
              By publishing, you list this artwork for purchase. We request web crawlers not to scrape images via metadata declarations. Original files are stored securely.
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary/95 text-brand-bg font-sans font-medium py-2.5 rounded-full transition text-xs shadow-sm focus:outline-none cursor-pointer"
          >
            Publish Artwork
          </button>
        </form>
      )}
    </div>
  );
}
