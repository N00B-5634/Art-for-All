/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArtistProfile, Artwork, UserSession } from "../types";
import { User, ShieldCheck, Wallet, Calendar, Edit2, Check, Sparkles } from "lucide-react";
import ArtCard from "./ArtCard";
import { useParams, useNavigate } from "react-router-dom";
import OcrScrambler from "./OcrScrambler";

interface ProfileViewProps {
  profiles: ArtistProfile[];
  artworks: Artwork[];
  selectedArtistId: string;
  setSelectedArtistId: (id: string) => void;
  userSession: UserSession;
  onUpdateProfile: (updated: ArtistProfile) => void;
  onStripeConnect?: (artistId: string) => void;
}

export default function ProfileView({ 
  profiles, 
  artworks, 
  selectedArtistId, 
  setSelectedArtistId,
  userSession,
  onUpdateProfile,
  onStripeConnect
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editMonetaryMethod, setEditMonetaryMethod] = useState("Monero");
  const [editMonetaryAddress, setEditMonetaryAddress] = useState("");
  const [editStripePublishableKey, setEditStripePublishableKey] = useState("");
  const [editStripeSecretKey, setEditStripeSecretKey] = useState("");
  const [editPaypalClientId, setEditPaypalClientId] = useState("");

  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const activeProfile = profiles.find(p => p.id === params.id) || profiles.find(p => p.id === selectedArtistId) || profiles[0];

  // Sync edit state
  useEffect(() => {
    if (activeProfile) {
      setEditName(activeProfile.name);
      setEditBio(activeProfile.bio);
      setEditMonetaryMethod(activeProfile.monetaryMethod || "Monero");
      setEditMonetaryAddress(activeProfile.monetaryAddress || "");
      setEditStripePublishableKey(activeProfile.stripePublishableKey || "");
      setEditStripeSecretKey(activeProfile.stripeSecretKey || "");
      setEditPaypalClientId(activeProfile.paypalClientId || "");
    }
    setIsEditing(false);
    if (activeProfile && activeProfile.id !== selectedArtistId) {
      setSelectedArtistId(activeProfile.id);
    }
  }, [activeProfile, selectedArtistId, params.id]);

  if (profiles.length === 0) {
    return (
      <div className="text-center py-16 bg-brand-panel border border-brand-primary/10 rounded-2xl max-w-2xl mx-auto space-y-4 animate-fade-in" id="profile-empty">
        <div className="bg-brand-primary/5 w-14 h-14 rounded-full flex items-center justify-center mx-auto border border-brand-primary/10 text-brand-primary">
          <User className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-serif font-bold text-xl text-brand-primary">No Registered Artists</h3>
          <p className="text-xs text-brand-muted max-w-sm mx-auto">
            Click <strong className="text-brand-primary">Sign In</strong> in the top-right to register your artist profile and publish your first artwork!
          </p>
        </div>
      </div>
    );
  }

  const activeArtworks = artworks.filter(art => art.artistId === activeProfile.id);

  // Is the logged-in session matching the profile being viewed?
  const isOwnProfile = (userSession.type === "artist" || userSession.type === "admin") && userSession.artist && userSession.artist.id === activeProfile.id;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editBio.trim()) {
      alert("Name and Biography cannot be empty.");
      return;
    }

    onUpdateProfile({
      ...activeProfile,
      name: editName,
      bio: editBio,
      monetaryMethod: editMonetaryMethod,
      monetaryAddress: editMonetaryAddress,
      stripePublishableKey: editStripePublishableKey,
      stripeSecretKey: editStripeSecretKey,
      paypalClientId: editPaypalClientId
    });
    setIsEditing(false);
  };

  const formattedHandle = activeProfile.name.toLowerCase().replace(/\s+/g, "");

  return (
    <div className="space-y-8 animate-fade-in" id="profiles-section">
      
      <div className="flex flex-col gap-3 border-b border-brand-primary/10 pb-5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-brand-muted/70">
          Artists List ({profiles.length})
        </span>
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => {
            const isSelected = activeProfile.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedArtistId(p.id);
                  navigate(`/artists/${p.id}`);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-serif font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-brand-primary text-brand-bg shadow-sm"
                    : "bg-brand-panel text-brand-primary hover:bg-brand-primary/15"
                }`}
              >
                <span>{p.name}</span>
                {p.verified && <ShieldCheck className={`w-3.5 h-3.5 ${isSelected ? "text-brand-bg" : "text-brand-primary-light"}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Twitter-Style Profile Card */}
      <div className="bg-white border border-brand-primary/10 rounded-2xl overflow-hidden shadow-xs relative" id={`profile-card-${activeProfile.id}`}>
        
        {/* Banner area (Cosmic Slate matching AFA) */}
        <div className="h-28 bg-gradient-to-r from-brand-primary/10 via-brand-panel to-brand-primary/5 relative" />

        {/* Profile Details Container */}
        <div className="px-6 pb-6 sm:px-8 relative">
          
          {/* Avatar floating overlapping the banner */}
          <div className="absolute top-0 -translate-y-1/2 left-6 sm:left-8">
            <div className="bg-white p-1 rounded-full shadow-md">
              <div className="bg-brand-primary w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 border-brand-bg">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-brand-bg" />
              </div>
            </div>
          </div>

          {/* Action Button: Edit Profile (Twitter-style, inline, highly secure) */}
          <div className="flex justify-end pt-3 h-12">
            {isOwnProfile && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 border border-brand-primary/20 hover:border-brand-primary hover:bg-brand-panel text-brand-primary px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
                id="edit-profile-btn"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Profile text fields */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 mt-2 max-w-xl" id="edit-profile-form">
              <div>
                <label htmlFor="edit-name-field" className="block text-[11px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                  Display Name *
                </label>
                <input
                  id="edit-name-field"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs"
                />
              </div>

              <div>
                <label htmlFor="edit-bio-field" className="block text-[11px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                  Biography (About you) *
                </label>
                <textarea
                  id="edit-bio-field"
                  required
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs resize-none font-serif italic"
                />
              </div>

              {/* Direct Payout Setup Forms */}
              <div className="border-t border-brand-primary/10 pt-4 space-y-4">
                <h4 className="font-serif font-medium text-sm text-brand-primary">Payout Options</h4>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  Configure your payout options to receive direct payments from supporters.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-method-field" className="block text-[11px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                      Preferred Payment Method
                    </label>
                    <select
                      id="edit-method-field"
                      value={editMonetaryMethod}
                      onChange={(e) => setEditMonetaryMethod(e.target.value)}
                      className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs"
                    >
                      <option value="Stripe">Stripe Card Billing</option>
                      <option value="PayPal">PayPal Smart Buttons</option>
                      <option value="Monero">Monero (XMR) Cryptocurrency</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-address-field" className="block text-[11px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                      Payout Address / Wallet Address
                    </label>
                    <input
                      id="edit-address-field"
                      type="text"
                      value={editMonetaryAddress}
                      onChange={(e) => setEditMonetaryAddress(e.target.value)}
                      className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs font-mono"
                      placeholder="e.g. Monero XMR wallet address, or Stripe/PayPal info"
                    />
                  </div>
                </div>

                {editMonetaryMethod === "Stripe" && (
                  <div className="space-y-4">
                    <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3 animate-fade-in">
                      <span className="text-[10px] font-mono uppercase text-brand-primary-light font-bold">Stripe Custom Credentials</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="edit-stripe-pub" className="block text-[10px] text-brand-muted uppercase mb-1 font-semibold">
                            Publishable Key (pk_...)
                          </label>
                          <input
                            id="edit-stripe-pub"
                            type="text"
                            value={editStripePublishableKey}
                            onChange={(e) => setEditStripePublishableKey(e.target.value)}
                            className="w-full bg-white border border-slate-300 focus:border-brand-primary focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono"
                            placeholder="pk_live_..."
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-stripe-sec" className="block text-[10px] text-brand-muted uppercase mb-1 font-semibold">
                            Secret Key (sk_...)
                          </label>
                          <input
                            id="edit-stripe-sec"
                            type="password"
                            value={editStripeSecretKey}
                            onChange={(e) => setEditStripeSecretKey(e.target.value)}
                            className="w-full bg-white border border-slate-300 focus:border-brand-primary focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono"
                            placeholder="sk_live_..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                      <div className="space-y-0.5 text-left w-full">
                        <span className="block text-[10px] font-mono uppercase text-brand-primary font-bold">
                          Stripe Connected Onboarding (OAuth)
                        </span>
                        <p className="text-[10px] text-brand-muted leading-tight">
                          {activeProfile.stripeConnected 
                            ? `Connected Account ID: ${activeProfile.stripeAccountId}`
                            : "Easily link your Stripe merchant account to automatically handle supporter checkout."}
                        </p>
                      </div>
                      {onStripeConnect && (
                        <button
                          type="button"
                          onClick={() => onStripeConnect(activeProfile.id)}
                          className="bg-[#635BFF] hover:bg-[#5249E0] text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition"
                        >
                          <span>{activeProfile.stripeConnected ? "Reconnect Stripe" : "Link Stripe Account"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {editMonetaryMethod === "PayPal" && (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3 animate-fade-in">
                    <span className="text-[10px] font-mono uppercase text-yellow-600 font-bold">PayPal Smart Button Credentials</span>
                    <div>
                      <label htmlFor="edit-paypal-id" className="block text-[10px] text-brand-muted uppercase mb-1 font-semibold font-sans">
                        PayPal Client ID
                      </label>
                      <input
                        id="edit-paypal-id"
                        type="text"
                        value={editPaypalClientId}
                        onChange={(e) => setEditPaypalClientId(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-brand-primary focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono"
                        placeholder="PayPal Client ID or 'sb' for sandbox"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-1.5 bg-brand-panel hover:bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary/95 text-brand-bg rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 mt-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-2xl text-brand-primary leading-tight">
                    <OcrScrambler text={activeProfile.name} intensity="low" />
                  </h2>
                  {activeProfile.verified && (
                    <span className="flex items-center text-brand-primary" title="Verified artist profile">
                      <ShieldCheck className="w-5 h-5 text-brand-primary-light" />
                    </span>
                  )}
                </div>
                <span className="text-xs text-brand-muted/70 font-mono">
                  @{formattedHandle}
                </span>
              </div>

              <p className="text-brand-muted text-sm leading-relaxed max-w-2xl font-serif italic whitespace-pre-wrap">
                "<OcrScrambler text={activeProfile.bio} intensity="medium" />"
              </p>

              {/* Stats & Meta row */}
              <div className="flex items-center gap-4 text-xs text-brand-muted font-sans flex-wrap pt-1 border-t border-brand-primary/5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-muted/60" />
                  Joined {activeProfile.joinedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-brand-muted/60" />
                  Pays via: <strong className="text-brand-primary font-mono">{activeProfile.monetaryMethod}</strong>
                </span>
              </div>

              {/* Secure payout address banner */}
              <div className="bg-brand-panel border border-brand-primary/10 rounded-xl p-4 mt-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-brand-primary/5">
                  <div className="space-y-0.5">
                    <span className="block text-[10px] font-mono tracking-wider text-brand-primary uppercase font-bold">
                      Payout Destination
                    </span>
                    <code className="block text-[11px] font-mono text-brand-primary select-all break-all pr-2">
                      {activeProfile.monetaryAddress || "No direct address configured"}
                    </code>
                  </div>
                  <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/15 text-[8px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold">
                    Direct Payout (0% fee)
                  </span>
                </div>

                {/* Gateway Detail Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                  <div className="space-y-1">
                    <span className="text-brand-muted block font-medium">Gateway: <strong className="text-brand-primary">{activeProfile.monetaryMethod}</strong></span>
                    {activeProfile.monetaryMethod === "Stripe" && (
                      <div className="space-y-1">
                        <span className="text-slate-500 block font-mono">
                          Publishable Key: {activeProfile.stripePublishableKey ? "✅ Custom key set" : "⚠️ Platform default"}
                        </span>
                        <span className="text-slate-500 block font-mono flex flex-wrap items-center gap-1.5">
                          <span>Stripe Connect:</span>
                          {activeProfile.stripeConnected ? (
                            <span className="text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded-md border border-green-150 text-[10px]">
                              Connected ({activeProfile.stripeAccountId})
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-150 text-[10px]">
                              Not Linked
                            </span>
                          )}
                          {isOwnProfile && onStripeConnect && (
                            <button
                              onClick={() => onStripeConnect(activeProfile.id)}
                              className="text-[10px] text-[#635BFF] hover:text-[#5249E0] font-bold underline cursor-pointer ml-1"
                              type="button"
                            >
                              {activeProfile.stripeConnected ? "Reconnect" : "Link Account"}
                            </button>
                          )}
                        </span>
                      </div>
                    )}
                    {activeProfile.monetaryMethod === "PayPal" && (
                      <span className="text-slate-500 block font-mono">
                        Client ID: {activeProfile.paypalClientId ? `✅ Custom (${activeProfile.paypalClientId})` : "⚠️ Platform default (sb)"}
                      </span>
                    )}
                    {activeProfile.monetaryMethod === "Monero" && (
                      <span className="text-slate-500 block font-mono">
                        Address: {activeProfile.monetaryAddress ? "✅ Configured" : "⚠️ None"}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex items-center justify-end">
                    <span className="text-[10px] text-brand-primary-light italic">
                      Direct payment to artist account.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif font-semibold text-lg text-brand-primary flex items-center gap-2">
          <span>{activeProfile.name}'s Gallery</span>
          <span className="text-xs font-mono font-normal text-brand-muted/70 bg-brand-panel border border-brand-primary/5 px-2.5 py-0.5 rounded-full">
            {activeArtworks.length} artworks
          </span>
        </h3>

        {activeArtworks.length === 0 ? (
          <div className="text-center py-10 bg-brand-panel/40 border border-brand-primary/5 rounded-xl">
            <p className="text-xs text-brand-muted italic">No artworks published yet for this artist.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeArtworks.map((artwork) => (
              <ArtCard 
                key={artwork.id} 
                artwork={artwork} 
                artistProfile={activeProfile}
                onViewArtist={setSelectedArtistId} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
