import React, { useState } from "react";
import { ArtistProfile } from "../types";
import { 
  User, 
  PenTool, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Wallet, 
  CreditCard, 
  Sparkles, 
  ShieldAlert, 
  DollarSign 
} from "lucide-react";

interface SetupWizardProps {
  isOpen: boolean;
  onComplete: (profile: ArtistProfile) => void;
  onCancel: () => void;
  initialEmail: string;
  initialName: string;
}

export default function SetupWizard({
  isOpen,
  onComplete,
  onCancel,
  initialEmail,
  initialName
}: SetupWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(initialName || "");
  const [bio, setBio] = useState<string>("");
  const [monetaryMethod, setMonetaryMethod] = useState<string>("Monero");
  const [monetaryAddress, setMonetaryAddress] = useState<string>("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = "Artist display name is required.";
    } else if (name.length < 2) {
      newErrors.name = "Display name must be at least 2 characters.";
    }
    if (!bio.trim()) {
      newErrors.bio = "Please write a short bio so visitors know your focus.";
    } else if (bio.length < 10) {
      newErrors.bio = "Your bio should be at least 10 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!monetaryAddress.trim()) {
      newErrors.monetaryAddress = "Payout address or account ID is required for community support.";
    } else if (monetaryMethod === "Monero" && monetaryAddress.length < 10) {
      newErrors.monetaryAddress = "Please provide a valid Monero wallet address or tip shorthand.";
    } else if (monetaryMethod === "PayPal" && !monetaryAddress.includes("@")) {
      newErrors.monetaryAddress = "Please provide a valid PayPal email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = () => {
    const freshProfile: ArtistProfile = {
      id: `artist_${initialEmail}`,
      name: name.trim(),
      bio: bio.trim(),
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      monetaryMethod,
      monetaryAddress: monetaryAddress.trim(),
      verified: false
    };
    onComplete(freshProfile);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-brand-bg/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-white border border-brand-primary/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Progress Header */}
        <div className="bg-brand-panel border-b border-brand-primary/10 px-6 sm:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-primary/60">Step {step} of 3</span>
              <h2 className="font-serif font-semibold text-lg text-brand-primary">
                {step === 1 && "Creative Identity"}
                {step === 2 && "Payout Configuration"}
                {step === 3 && "Finalize Registration"}
              </h2>
            </div>
            <span className="text-xs font-mono text-brand-muted bg-white border border-brand-primary/10 px-3 py-1 rounded-full">
              {initialEmail}
            </span>
          </div>

          {/* Graphical Progress Bar */}
          <div className="mt-4 flex gap-1.5">
            <div className={`h-1 flex-grow rounded-full transition-all duration-350 ${step >= 1 ? "bg-brand-primary" : "bg-brand-primary/10"}`} />
            <div className={`h-1 flex-grow rounded-full transition-all duration-350 ${step >= 2 ? "bg-brand-primary" : "bg-brand-primary/10"}`} />
            <div className={`h-1 flex-grow rounded-full transition-all duration-350 ${step >= 3 ? "bg-brand-primary" : "bg-brand-primary/10"}`} />
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-grow p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-brand-panel p-4 rounded-2xl border border-brand-primary/5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-xs text-brand-primary leading-relaxed font-sans">
                  Welcome to <strong>Art For All</strong>! Your single sign-on authenticated successfully. Let's finish creating your community artist profile.
                </p>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-brand-primary-light font-semibold">
                  Artist Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted/70" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    placeholder="e.g. Robin Moss"
                    className={`w-full bg-slate-50 border ${errors.name ? "border-red-400 focus:ring-red-200" : "border-brand-primary/15 focus:ring-brand-primary/20"} text-brand-primary rounded-xl py-2.5 pl-10 pr-4 text-sm font-sans focus:outline-none focus:ring-4 transition`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-[11px] font-sans flex items-center gap-1 mt-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Short Bio Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-brand-primary-light font-semibold">
                  Creative Biography / Specialty
                </label>
                <div className="relative">
                  <PenTool className="absolute left-3.5 top-3 w-4 h-4 text-brand-muted/70" />
                  <textarea
                    value={bio}
                    onChange={(e) => {
                      setBio(e.target.value);
                      if (errors.bio) setErrors({ ...errors, bio: "" });
                    }}
                    placeholder="Watercolor painter and nature admirer. Curating organic palettes and quiet mossy scenes for homes..."
                    rows={4}
                    className={`w-full bg-slate-50 border ${errors.bio ? "border-red-400 focus:ring-red-200" : "border-brand-primary/15 focus:ring-brand-primary/20"} text-brand-primary rounded-xl py-2.5 pl-10 pr-4 text-sm font-sans focus:outline-none focus:ring-4 transition resize-none`}
                  />
                </div>
                {errors.bio && (
                  <p className="text-red-500 text-[11px] font-sans flex items-center gap-1 mt-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{errors.bio}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-brand-primary-light font-semibold">
                  Select Payout Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "Monero", label: "Monero", icon: Wallet, desc: "Private, low-fee crypto" },
                    { id: "Stripe", label: "Stripe", icon: CreditCard, desc: "Credit card gateway" },
                    { id: "PayPal", label: "PayPal", icon: DollarSign, desc: "Standard email tip link" }
                  ].map((method) => {
                    const IconComp = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setMonetaryMethod(method.id);
                          setMonetaryAddress("");
                          setErrors({});
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer ${
                          monetaryMethod === method.id
                            ? "bg-brand-primary/5 border-brand-primary text-brand-primary shadow-xs"
                            : "bg-white border-brand-primary/10 hover:border-brand-primary/20 text-brand-muted"
                        }`}
                      >
                        <IconComp className="w-5 h-5 mb-1.5" />
                        <span className="text-xs font-semibold">{method.label}</span>
                        <span className="text-[9px] text-brand-muted/70 mt-1 hidden sm:block leading-tight">{method.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monetary Address Input */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-brand-primary-light font-semibold">
                  {monetaryMethod === "Monero" && "Monero Wallet Address"}
                  {monetaryMethod === "Stripe" && "Stripe Account ID (or Payout ID)"}
                  {monetaryMethod === "PayPal" && "PayPal Email Address"}
                </label>
                <input
                  type="text"
                  value={monetaryAddress}
                  onChange={(e) => {
                    setMonetaryAddress(e.target.value);
                    if (errors.monetaryAddress) setErrors({ ...errors, monetaryAddress: "" });
                  }}
                  placeholder={
                    monetaryMethod === "Monero" ? "e.g. 44AFF...98FCA32" :
                    monetaryMethod === "Stripe" ? "e.g. acct_1H1S8vL..." :
                    "e.g. payments@myshop.com"
                  }
                  className={`w-full bg-slate-50 border ${errors.monetaryAddress ? "border-red-400 focus:ring-red-200" : "border-brand-primary/15 focus:ring-brand-primary/20"} text-brand-primary rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:ring-4 transition`}
                />
                <p className="text-[10px] text-brand-muted leading-relaxed font-sans mt-1">
                  {monetaryMethod === "Monero" && "Visitors can support you anonymously using this Monero wallet address."}
                  {monetaryMethod === "Stripe" && "Used to route customer checkout card payments directly into your Stripe merchant account."}
                  {monetaryMethod === "PayPal" && "Generates quick PayPal links during checkout for community support."}
                </p>
                {errors.monetaryAddress && (
                  <p className="text-red-500 text-[11px] font-sans flex items-center gap-1 mt-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{errors.monetaryAddress}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in text-center py-4">
              <div className="bg-brand-panel p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto border border-brand-primary/10 text-brand-primary">
                <CheckCircle2 className="w-8 h-8 text-brand-primary" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="font-serif font-bold text-lg text-brand-primary">All Set, {name}!</h3>
                <p className="text-xs text-brand-muted leading-relaxed font-sans">
                  Your artist identity is ready to be published to the platform index. You can customize your artwork catalog and settings at any time from your profile tab.
                </p>
              </div>

              {/* Review card */}
              <div className="bg-brand-panel border border-brand-primary/10 rounded-2xl p-4 text-left space-y-3 max-w-md mx-auto text-xs font-sans">
                <div className="flex justify-between border-b border-brand-primary/5 pb-2">
                  <span className="font-mono uppercase text-brand-primary-light font-semibold text-[10px]">Artist ID</span>
                  <span className="text-brand-primary font-mono">{initialEmail}</span>
                </div>
                <div className="flex justify-between border-b border-brand-primary/5 pb-2">
                  <span className="font-mono uppercase text-brand-primary-light font-semibold text-[10px]">Display Name</span>
                  <span className="text-brand-primary font-medium">{name}</span>
                </div>
                <div className="flex justify-between border-b border-brand-primary/5 pb-2">
                  <span className="font-mono uppercase text-brand-primary-light font-semibold text-[10px]">Payment Method</span>
                  <span className="text-brand-primary font-mono">{monetaryMethod}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono uppercase text-brand-primary-light font-semibold text-[10px]">Payout Target</span>
                  <code className="bg-white p-1.5 rounded border border-brand-primary/5 block text-[10px] break-all font-mono">
                    {monetaryAddress}
                  </code>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Bar */}
        <div className="bg-brand-panel border-t border-brand-primary/10 px-6 sm:px-8 py-4 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-brand-primary-light transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-red-500 transition cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-5 py-2 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-6 py-2 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Complete Setup</span>
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
