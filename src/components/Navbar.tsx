/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, Upload, Shield, Sliders, User, BookOpen, Heart, LogIn, LogOut } from "lucide-react";
import { UserSession } from "../types";
import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onSearch: (tag: string) => void;
  searchTag: string;
  userSession: UserSession;
  onSignOut: () => void;
  onOpenAuthModal: () => void;
  onOpenSettingsModal: () => void;
}

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  onSearch, 
  searchTag, 
  userSession, 
  onSignOut, 
  onOpenAuthModal,
  onOpenSettingsModal
}: NavbarProps) {
  const [inputVal, setInputVal] = useState(searchTag);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setInputVal(searchTag);
  }, [searchTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputVal);
    navigate(`/search?q=${encodeURIComponent(inputVal)}`);
  };

  const [logoSrc, setLogoSrc] = useState("/logo.png");
  const [logoError, setLogoError] = useState(false);

  const handleLogoError = () => {
    if (logoSrc === "/logo.png") {
      setLogoSrc("/assets/logo.png");
    } else {
      setLogoError(true);
    }
  };

  const isHomeActive = location.pathname === "/" || location.pathname === "/home";
  const isSearchActive = location.pathname.startsWith("/search");
  const isUploadActive = location.pathname === "/upload";
  const isProfileActive = location.pathname.startsWith("/artists") || location.pathname === "/profile";
  const isAdminActive = location.pathname === "/admin";
  const isChangelogActive = location.pathname === "/changelog";

  return (
    <nav className="bg-brand-panel text-brand-primary border-b border-brand-primary/10 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-wrap md:flex-nowrap py-2 md:py-0 gap-4">
          
          {/* Logo / Brand Name */}
          <div 
            onClick={() => {
              setInputVal("");
              onSearch("");
              navigate("/");
            }}
            className="flex items-center gap-3 cursor-pointer select-none group"
            id="brand-logo"
          >
            {!logoError ? (
              <img 
                src={logoSrc} 
                alt="AFA Logo" 
                className="h-11 w-auto object-contain transition duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={handleLogoError}
              />
            ) : (
              <div className="bg-brand-primary w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-brand-primary-light transition-colors duration-300">
                <span className="text-brand-bg text-xs font-bold font-sans">AFA</span>
              </div>
            )}
            <div>
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-brand-primary group-hover:text-brand-primary-light transition">
                Art For All
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <form 
            onSubmit={handleSubmit} 
            className="flex-1 max-w-lg mx-2 sm:mx-6 relative"
            id="nav-search-form"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search artworks by tag (e.g. cozy, watercolor, oil)..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-white border border-brand-primary/20 focus:border-brand-primary/50 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 rounded-full py-2 pl-4 pr-10 text-brand-primary placeholder-brand-primary/40 text-sm font-sans transition-all"
              />
              <button 
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-primary/40 hover:text-brand-primary transition cursor-pointer"
                title="Search"
                id="search-btn"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Menu Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                isHomeActive 
                  ? "bg-brand-primary text-brand-bg shadow-sm" 
                  : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
              }`}
              id="nav-home"
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gallery</span>
            </button>

            {/* Upload tab - visible to logged-in artists or admin */}
            {(userSession.type === "artist" || userSession.type === "admin") && (
              <button
                onClick={() => navigate("/upload")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isUploadActive 
                    ? "bg-brand-primary text-brand-bg shadow-sm" 
                    : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
                }`}
                id="nav-upload"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            )}

            {/* Profiles tab - visible to guests as list, or artist/admin as 'My Profile' */}
            <button
              onClick={() => navigate("/profile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                isProfileActive 
                  ? "bg-brand-primary text-brand-bg shadow-sm" 
                  : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
              }`}
              id="nav-profile"
            >
              <User className="w-3.5 h-3.5" />
              <span>{userSession.type !== "guest" ? "My Profile" : "Artists"}</span>
            </button>

            {/* Keycloak Config Setup Tab - ONLY visible to Admin */}
            {userSession.type === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isAdminActive 
                    ? "bg-brand-primary text-brand-bg shadow-sm" 
                    : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
                }`}
                id="nav-config"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Settings</span>
              </button>
            )}

            <button
              onClick={() => navigate("/changelog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                isChangelogActive 
                  ? "bg-brand-primary text-brand-bg shadow-sm" 
                  : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
              }`}
              id="nav-changelog"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Updates</span>
            </button>

            {/* Separator line */}
            <div className="h-6 w-[1px] bg-brand-primary/10 mx-1 hidden sm:block" />

            {/* Authentication Action Button */}
            {userSession.type === "guest" ? (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
                id="nav-sign-in"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
                        ) : (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-[10px] font-mono bg-brand-primary/5 px-2.5 py-1 rounded-full border border-brand-primary/5">
                  Logged as: <strong className="text-brand-primary">{userSession.type === "admin" ? "Admin" : `@${userSession.artist.name.toLowerCase().replace(/\s+/g, "")}`}</strong>
                </span>
                <button
                  onClick={onOpenSettingsModal}
                  className="flex items-center justify-center p-1.5 hover:bg-brand-primary/10 text-brand-primary/70 hover:text-brand-primary rounded-full transition cursor-pointer"
                  title="Account Settings & Rerun Setup"
                  id="nav-settings-btn"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onSignOut}
                  className="flex items-center justify-center p-1.5 hover:bg-brand-primary/10 text-brand-primary/70 hover:text-brand-primary rounded-full transition cursor-pointer"
                  title="Sign Out Session"
                  id="nav-sign-out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
