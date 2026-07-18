/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, User, PenTool, Wallet, CreditCard, DollarSign, Sparkles, Sliders, ChevronRight, Settings } from "lucide-react";
import { ArtistProfile } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: ArtistProfile;
  onUpdateProfile: (updated: ArtistProfile) => void;
  onRerunSetupWizard: () => void;
  onStripeConnect?: (artistId: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  activeProfile,
  onUpdateProfile,
  onRerunSetupWizard,
  onStripeConnect
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "payout" | "more">("profile");

  // Local state for editing fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [monetaryMethod, setMonetaryMethod] = useState("Monero");
  const [monetaryAddress, setMonetaryAddress] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when modal is opened or activeProfile changes
  useEffect(() => {
    if (activeProfile && isOpen) {
      setName(activeProfile.name || "");
      setBio(activeProfile.bio || "");
      setMonetaryMethod(activeProfile.monetaryMethod || "Monero");
      setMonetaryAddress(activeProfile.monetaryAddress || "");
      setStripePublishableKey(activeProfile.stripePublishableKey || "");
      setStripeSecretKey(activeProfile.stripeSecretKey || "");
      setPaypalClientId(activeProfile.paypalClientId || "");
      setSavedSuccess(false);
    }
  }, [activeProfile, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    onUpdateProfile({
      ...activeProfile,
      name: name.trim(),
      bio: bio.trim(),
      monetaryMethod,
      monetaryAddress: monetaryAddress.trim(),
      stripePublishableKey: stripePublishableKey.trim(),
      stripeSecretKey: stripeSecretKey.trim(),
      paypalClientId: paypalClientId.trim()
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[150] flex items-center justify-center p-4 overflow-y-auto animate-fade-in" 
      id="settings-modal-overlay"
    >
      <div 
        className="bg-white border border-brand-primary/15 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col md:flex-row overflow-hidden my-8 max-h-[85vh]"
        id="settings-modal-content"
      >
        
        {/* Left Sidebar Menu */}
        <div className="bg-slate-50 md:w-56 p-5 border-r border-slate-100 flex flex-col shrink-0">
          <div className="mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-primary" />
            <h3 className="font-serif font-bold text-sm text-brand-primary">Account Settings</h3>
          </div>

          <div className="space-y-1 flex-grow">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition cursor-pointer ${
                activeTab === "profile" 
                  ? "bg-brand-primary text-brand-bg shadow-xs" 
                  : "text-brand-muted hover:bg-slate-100 hover:text-brand-primary"
              }`}
              id="settings-tab-profile"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Identity Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("payout")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition cursor-pointer ${
                activeTab === "payout" 
                  ? "bg-brand-primary text-brand-bg shadow-xs" 
                  : "text-brand-muted hover:bg-slate-100 hover:text-brand-primary"
              }`}
              id="settings-tab-payout"
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span>Payout Gateways</span>
            </button>

            <button
              onClick={() => setActiveTab("more")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition cursor-pointer ${
                activeTab === "more" 
                  ? "bg-brand-primary text-brand-bg shadow-xs" 
                  : "text-brand-muted hover:bg-slate-100 hover:text-brand-primary"
              }`}
              id="settings-tab-more"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 shrink-0" />
                <span>More Settings</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-mono">
            ID: {activeProfile.id.replace("artist_", "")}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-grow p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h4 className="font-serif font-bold text-base text-brand-primary">
                {activeTab === "profile" && "Configure Artist Identity"}
                {activeTab === "payout" && "Configure Financial Gateways"}
                {activeTab === "more" && "Advanced Settings Menu"}
              </h4>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-brand-primary transition p-1 hover:bg-slate-100 rounded-full cursor-pointer"
                title="Close Settings"
                id="close-settings-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-4 animate-fade-in" id="settings-profile-form">
                <div className="space-y-1.5">
                  <label htmlFor="settings-name-field" className="block text-xs font-mono uppercase tracking-wider text-brand-primary font-semibold">
                    Public Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="settings-name-field"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-brand-primary/15 focus:border-brand-primary rounded-xl py-2 pl-9 pr-4 text-xs font-sans text-brand-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="settings-bio-field" className="block text-xs font-mono uppercase tracking-wider text-brand-primary font-semibold">
                    Creative Biography / About Me
                  </label>
                  <div className="relative">
                    <PenTool className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      id="settings-bio-field"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share your style, history, and mediums..."
                      className="w-full bg-slate-50 border border-brand-primary/15 focus:border-brand-primary rounded-xl py-2 pl-9 pr-4 text-xs font-sans text-brand-primary focus:outline-none resize-none font-serif italic"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-brand-primary hover:bg-brand-primary/95 text-white font-sans text-xs px-5 py-2 rounded-xl transition font-semibold cursor-pointer shadow-xs"
                    id="settings-profile-save"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === "payout" && (
              <form onSubmit={handleSave} className="space-y-4 animate-fade-in" id="settings-payout-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="settings-method-field" className="block text-xs font-mono uppercase tracking-wider text-brand-primary font-semibold">
                      Preferred Payment Gateway
                    </label>
                    <select
                      id="settings-method-field"
                      value={monetaryMethod}
                      onChange={(e) => setMonetaryMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-brand-primary/15 focus:border-brand-primary rounded-xl px-3 py-2 text-xs font-sans text-brand-primary focus:outline-none"
                    >
                      <option value="Monero">Monero (XMR) Private Crypto</option>
                      <option value="Stripe">Stripe Credit Card Checkout</option>
                      <option value="PayPal">PayPal Standard Button</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="settings-address-field" className="block text-xs font-mono uppercase tracking-wider text-brand-primary font-semibold">
                      Payout Destination / Account Address
                    </label>
                    <input
                      id="settings-address-field"
                      type="text"
                      value={monetaryAddress}
                      onChange={(e) => setMonetaryAddress(e.target.value)}
                      placeholder={
                        monetaryMethod === "Monero" ? "e.g. 44AFF...98FCA32" :
                        monetaryMethod === "Stripe" ? "e.g. acct_1H1S8vL..." :
                        "e.g. payments@myshop.com"
                      }
                      className="w-full bg-slate-50 border border-brand-primary/15 focus:border-brand-primary rounded-xl px-3 py-2 text-xs font-mono text-brand-primary focus:outline-none"
                    />
                  </div>
                </div>

                {monetaryMethod === "Stripe" && (
                  <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5 animate-fade-in">
                    <span className="text-[10px] font-mono uppercase text-[#635BFF] font-bold">Custom Stripe Credentials</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="settings-stripe-pub" className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                          Publishable Key
                        </label>
                        <input
                          id="settings-stripe-pub"
                          type="text"
                          value={stripePublishableKey}
                          onChange={(e) => setStripePublishableKey(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono focus:outline-none"
                          placeholder="pk_live_..."
                        />
                      </div>
                      <div>
                        <label htmlFor="settings-stripe-sec" className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                          Secret Key
                        </label>
                        <input
                          id="settings-stripe-sec"
                          type="password"
                          value={stripeSecretKey}
                          onChange={(e) => setStripeSecretKey(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono focus:outline-none"
                          placeholder="sk_live_..."
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="text-left w-full">
                        <span className="block text-[9px] font-mono uppercase text-brand-primary font-bold">Stripe OAuth Onboarding</span>
                        <p className="text-[9px] text-brand-muted leading-tight">
                          {activeProfile.stripeConnected 
                            ? `Status: Connected (${activeProfile.stripeAccountId})` 
                            : "Securely link your merchant Stripe account via unified sandbox onboarding."}
                        </p>
                      </div>
                      {onStripeConnect && (
                        <button
                          type="button"
                          onClick={() => onStripeConnect(activeProfile.id)}
                          className="bg-[#635BFF] hover:bg-[#5249E0] text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 transition"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{activeProfile.stripeConnected ? "Reconnect Account" : "Connect Stripe"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {monetaryMethod === "PayPal" && (
                  <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3.5 animate-fade-in">
                    <span className="text-[10px] font-mono uppercase text-amber-600 font-bold">PayPal Smart Button Credentials</span>
                    <div>
                      <label htmlFor="settings-paypal-id" className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        PayPal Client ID
                      </label>
                      <input
                        id="settings-paypal-id"
                        type="text"
                        value={paypalClientId}
                        onChange={(e) => setPaypalClientId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono focus:outline-none"
                        placeholder="e.g. AZ76_..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-brand-primary hover:bg-brand-primary/95 text-white font-sans text-xs px-5 py-2 rounded-xl transition font-semibold cursor-pointer shadow-xs"
                    id="settings-payout-save"
                  >
                    Save Payout Settings
                  </button>
                </div>
              </form>
            )}

            {activeTab === "more" && (
              <div className="space-y-5 animate-fade-in text-left">
                <div className="bg-amber-50 border border-amber-200/55 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-semibold text-brand-primary">Sovereign Identity Wizard</h5>
                      <p className="text-[11px] text-brand-muted leading-relaxed font-sans">
                        Re-running the Setup Wizard will let you choose your creative persona, write a fresh bio, and select payment gateways from scratch. 
                        <strong> Your artworks, verification status, and admin role are fully preserved.</strong>
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-amber-200/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRerunSetupWizard();
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer shadow-sm transition flex items-center gap-1.5"
                      id="settings-rerun-wizard-btn"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Rerun Setup Wizard</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-2">
                  <h5 className="text-xs font-semibold text-brand-primary">Security Notice</h5>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    You can update your platform details as many times as you want. All profile modifications are written with high cryptographic isolation and signed on behalf of your single sign-on Keycloak token.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Alert / Success */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between min-h-12">
            {savedSuccess ? (
              <span className="text-emerald-600 text-xs font-sans font-semibold animate-pulse" id="settings-save-success-msg">
                ✓ Payout & Identity updated on server!
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                Direct peer-to-peer art sovereign indexing.
              </span>
            )}
            
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-brand-primary px-4 py-2 rounded-lg cursor-pointer transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
