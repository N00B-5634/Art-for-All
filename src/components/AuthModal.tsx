/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Shield, Fingerprint, ArrowRight } from "lucide-react";
import { PlatformConfig } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PlatformConfig;
  onSandboxLogin?: (email: string, name: string, role: "admin" | "artist") => void;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  config
}: AuthModalProps) {
  if (!isOpen) return null;

  const handleKeycloakRedirect = () => {
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="auth-modal">
      <div className="bg-white border border-brand-primary/15 rounded-2xl max-w-md w-full p-6 shadow-xl relative my-8">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-brand-primary transition p-1.5 hover:bg-slate-100 rounded-full cursor-pointer"
          title="Close Dialog"
          id="close-auth-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="bg-brand-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-brand-primary/20">
            <Shield className="w-6 h-6 text-brand-primary" />
          </div>
          <h2 className="font-serif font-bold text-xl text-brand-primary">Sign In to Art For All</h2>
          <p className="text-[10px] font-mono tracking-widest text-brand-primary-light uppercase font-semibold mt-1">
            Secure Artist & Admin Portal
          </p>
        </div>

        {/* Content Container */}
        <div className="space-y-6">
          
          {/* Primary Keycloak OIDC Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-brand-primary/5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-brand-primary text-white p-2 rounded-xl shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-brand-primary font-sans">Single Sign-On (SSO) Federated Login</h4>
                <p className="text-[11px] text-brand-muted leading-relaxed font-sans">
                  Connect securely via our federated Keycloak provider (<strong>{config.keycloakAuthUrl}</strong>).
                </p>
              </div>
            </div>

            <button
              onClick={handleKeycloakRedirect}
              className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-sans py-3 rounded-xl transition text-xs shadow-xs focus:outline-none cursor-pointer flex items-center justify-center gap-1.5 font-semibold"
            >
              <span>Connect with Federated SSO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-slate-400 text-center leading-normal border-t border-slate-100 pt-3">
            Manage your profile, gallery listings, and payout links in one secure place.
          </div>
        </div>

      </div>
    </div>
  );
}
