/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import Keycloak from "keycloak-js";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams, Navigate } from "react-router-dom";
import { Artwork, ArtistProfile, PlatformConfig, UserSession, ChangelogEntry, DatabaseStats } from "./types";
import { 
  INITIAL_ARTWORKS, 
  INITIAL_PROFILES, 
  DEFAULT_CONFIG, 
  PLATFORM_CHANGELOG, 
  FUN_LOADING_TIPS 
} from "./data";
import Navbar from "./components/Navbar";
import UploadForm from "./components/UploadForm";
import ProfileView from "./components/ProfileView";
import ConfigPanel from "./components/ConfigPanel";
import ChangelogView from "./components/ChangelogView";
import AuthModal from "./components/AuthModal";
import SetupWizard from "./components/SetupWizard";
import SettingsModal from "./components/SettingsModal";
import HomeView from "./components/HomeView";
import SearchView from "./components/SearchView";
import { Shield, Sparkles, Search, Coffee, ShieldAlert, Lock, User as UserIcon, Loader2 } from "lucide-react";

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTag = (searchParams.get("q") || "").trim().toLowerCase();

  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve state dynamically from local storage to keep data persistent across redirects
  const [artworks, setArtworks] = useState<Artwork[]>(() => {
    const saved = localStorage.getItem("afa_artworks");
    return saved ? JSON.parse(saved) : INITIAL_ARTWORKS;
  });

  const [profiles, setProfiles] = useState<ArtistProfile[]>(() => {
    const saved = localStorage.getItem("afa_profiles");
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [config, setConfig] = useState<PlatformConfig>(() => {
    const saved = localStorage.getItem("afa_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      // If the cached configuration has stale Keycloak values, reset to standard defaults
      if (parsed.keycloakClientId === "art-for-all-client" || parsed.keycloakRealm === "afa-artists") {
        localStorage.removeItem("afa_config");
        return DEFAULT_CONFIG;
      }
      return parsed;
    }
    return DEFAULT_CONFIG;
  });

  const [selectedArtistId, setSelectedArtistId] = useState<string>("");
  
  // Persist authentication sessions across redirects
  const [userSession, setUserSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem("afa_user_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.type === "admin" && !parsed.artist) {
          return { type: "guest" };
        }
        return parsed;
      } catch (e) {
        return { type: "guest" };
      }
    }
    return { type: "guest" };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Loading indicator and dynamic configurations
  const [loading, setLoading] = useState<boolean>(false);

  const [changelog, setChangelog] = useState<ChangelogEntry[]>(() => {
    const saved = localStorage.getItem("afa_changelog");
    return saved ? JSON.parse(saved) : PLATFORM_CHANGELOG;
  });

  const [loadingTips, setLoadingTips] = useState<string[]>(() => {
    const saved = localStorage.getItem("afa_loading_tips");
    return saved ? JSON.parse(saved) : FUN_LOADING_TIPS;
  });

  const [loadingTip, setLoadingTip] = useState<string>(() => {
    return loadingTips[0] || "Art For All is loading...";
  });

  // Synchronize configuration fetch completion
  const [configFetched, setConfigFetched] = useState<boolean>(false);
  const keycloakInitializedRef = useRef<boolean>(false);
  
  // Setup wizard target state for first-time OIDC sign-ins
  const [pendingOidcUser, setPendingOidcUser] = useState<{ email: string; name: string } | null>(() => {
    const saved = localStorage.getItem("afa_pending_oidc_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  const fetchDbStats = () => {
    fetch("/api/db-stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch database stats");
        return res.json();
      })
      .then((data) => {
        setDbStats(data);
      })
      .catch((err) => console.error("Error fetching database stats:", err));
  };

  const reFetchServerState = () => {
    fetchDbStats();
    
    fetch("/api/profiles")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.length > 0) {
          setProfiles(data);
          localStorage.setItem("afa_profiles", JSON.stringify(data));
        }
      });

    fetch("/api/artworks")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.length > 0) {
          setArtworks(data);
          localStorage.setItem("afa_artworks", JSON.stringify(data));
        }
      });
  };

  const handleUpgradeDb = () => {
    fetch("/api/db-stats/upgrade", {
      method: "POST"
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to upgrade database");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setDbStats(data.stats);
          triggerLoading("Upgrading database storage allocation by 100 KB...");
        }
      })
      .catch((err) => console.error("Error upgrading database:", err));
  };

  const handleStripeConnect = (artistId: string) => {
    triggerLoading("Connecting with Stripe OAuth and Linking Account...");
    fetch(`/api/profiles/${encodeURIComponent(artistId)}/stripe-connect`, {
      method: "POST"
    })
      .then((res) => {
        if (!res.ok) throw new Error("Stripe onboarding request failed");
        return res.json();
      })
      .then((updatedArtist) => {
        setProfiles((prev) => prev.map(p => p.id === artistId ? updatedArtist : p));
        if (userSession.type !== "guest" && userSession.artist?.id === artistId) {
          setUserSession({ ...userSession, artist: updatedArtist });
        }
        fetchDbStats();
        alert(`🎉 Stripe Onboarding Complete! Connected Account ID: ${updatedArtist.stripeAccountId}`);
      })
      .catch((err) => {
        console.error("Stripe connect error:", err);
        alert(`❌ Stripe Connect failed: ${err.message}`);
      });
  };

  // Save states to local storage on changes
  useEffect(() => {
    localStorage.setItem("afa_artworks", JSON.stringify(artworks));
  }, [artworks]);

  useEffect(() => {
    localStorage.setItem("afa_profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem("afa_config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("afa_user_session", JSON.stringify(userSession));
  }, [userSession]);

  useEffect(() => {
    localStorage.setItem("afa_changelog", JSON.stringify(changelog));
  }, [changelog]);

  useEffect(() => {
    localStorage.setItem("afa_loading_tips", JSON.stringify(loadingTips));
  }, [loadingTips]);

  const processOidcUser = (payload: any) => {
    if (!payload || !payload.email) return;

    const email = payload.email;
    const name = payload.name || payload.preferred_username || email.split("@")[0];

    const isAdminEmail = email === "thepurpledragons12@gmail.com" || email === "rabe345g@gmail.com";

    if (isAdminEmail) {
      let adminProfile = profiles.find((p) => p.id === email || p.id === `artist_${email}` || p.role === "admin");
      if (!adminProfile) {
        adminProfile = {
          id: `artist_${email}`,
          name: name,
          bio: "Platform Administrator. Click 'Edit Profile' to customize your bio and payment links.",
          joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          monetaryMethod: "Monero",
          monetaryAddress: `${name.toLowerCase().replace(/\s+/g, "")}_admin_wallet`,
          verified: true,
          role: "admin"
        };
        const updatedProfiles = [...profiles, adminProfile];
        setProfiles(updatedProfiles);
        localStorage.setItem("afa_profiles", JSON.stringify(updatedProfiles));
      } else {
        if (adminProfile.role !== "admin") {
          const updatedAdmin = { ...adminProfile, role: "admin" as const };
          const updatedProfiles = profiles.map(p => p.id === adminProfile!.id ? updatedAdmin : p);
          setProfiles(updatedProfiles);
          localStorage.setItem("afa_profiles", JSON.stringify(updatedProfiles));
          adminProfile = updatedAdmin;
        }
      }

      const session = { type: "admin" as const, artist: adminProfile };
      setUserSession(session);
      localStorage.setItem("afa_user_session", JSON.stringify(session));
      setSelectedArtistId(adminProfile.id);
      navigate("/admin");
    } else {
      const existingProfile = profiles.find((p) => p.id === email || p.id === `artist_${email}`);
      if (existingProfile && existingProfile.role === "admin") {
        const session = { type: "admin" as const, artist: existingProfile };
        setUserSession(session);
        localStorage.setItem("afa_user_session", JSON.stringify(session));
        setSelectedArtistId(existingProfile.id);
        navigate("/admin");
      } else {
        const artist = existingProfile;
        if (!artist) {
          setPendingOidcUser({ email, name });
          localStorage.setItem("afa_pending_oidc_user", JSON.stringify({ email, name }));
        } else {
          const session = { type: "artist" as const, artist };
          setUserSession(session);
          localStorage.setItem("afa_user_session", JSON.stringify(session));
          setSelectedArtistId(artist.id);
          navigate(`/artists/${artist.id}`);
        }
      }
    }

    // Clean URL query params and redirect cleanly
    navigate("/", { replace: true });
  };

  // Synchronize server-side .env config, profiles, and artworks on mount
  useEffect(() => {
    fetch("/api/config")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch server config");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setConfig(data);
        }
        setConfigFetched(true);
      })
      .catch((err) => {
        console.error("Error loading server config:", err);
        setConfigFetched(true); // Proceed with current config fallback
      });

    // Fetch initial profiles from the Express backend
    fetch("/api/profiles")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.length > 0) {
          setProfiles(data);
          localStorage.setItem("afa_profiles", JSON.stringify(data));
        }
      })
      .catch((err) => console.error("Error fetching backend profiles:", err));

    // Fetch initial artworks from the Express backend
    fetch("/api/artworks")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.length > 0) {
          setArtworks(data);
          localStorage.setItem("afa_artworks", JSON.stringify(data));
        }
      })
      .catch((err) => console.error("Error fetching backend artworks:", err));

    fetchDbStats();
  }, []);

  // Real OIDC authentication and callback handling via Keycloak JS SDK
  useEffect(() => {
    if (!configFetched) return;
    if (keycloakInitializedRef.current) return;

    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const state = params.get("state");
    const isLoginPath = location.pathname === "/login";
    const isCallbackPath = location.pathname === "/callback" || location.pathname === "/oidc-callback";

    if (code || isLoginPath || isCallbackPath) {
      keycloakInitializedRef.current = true;
      setLoading(true);
      setLoadingTip(isLoginPath ? "Redirecting to Single Sign-On..." : "Signing in...");

      const keycloak = new Keycloak({
        url: `https://${config.keycloakAuthUrl}`,
        realm: config.keycloakRealm,
        clientId: config.keycloakClientId
      });

      // Use a dedicated, fully functional callback URL
      const callbackUrl = window.location.origin + "/callback";

      keycloak.init({
        onLoad: isLoginPath ? "login-required" : "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
        redirectUri: callbackUrl
      }).then((authenticated) => {
        if (authenticated) {
          const payload = keycloak.tokenParsed;
          if (payload && payload.email) {
            processOidcUser(payload);
            return;
          }
        } else if (isLoginPath) {
          keycloak.login({
            redirectUri: callbackUrl
          });
          return;
        }
        
        // Clean up parameters in URL and redirect cleanly back to root / home
        if (location.search || isCallbackPath || isLoginPath) {
          navigate("/", { replace: true });
        }
      }).catch((err) => {
        console.error("Keycloak client federation failed:", err);
        if (isCallbackPath) {
          navigate("/", { replace: true });
        }
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [configFetched, config, location.pathname, location.search]);

  const triggerLoading = (customTip?: string) => {
    setLoading(true);
    const tipsList = loadingTips.length > 0 ? loadingTips : FUN_LOADING_TIPS;
    const randTip = customTip || tipsList[Math.floor(Math.random() * tipsList.length)];
    setLoadingTip(randTip);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  };

  const handleSearch = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/");
    }
  };

  const handleAddArtwork = (newArt: Omit<Artwork, "id" | "createdAt">) => {
    const freshArt: Artwork = {
      ...newArt,
      id: `art_${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0]
    };
    const updated = [freshArt, ...artworks];
    setArtworks(updated);
    localStorage.setItem("afa_artworks", JSON.stringify(updated));

    // Sync to backend server
    fetch("/api/artworks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(freshArt)
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 403 && data.error === "DATABASE_READ_ONLY") {
            alert(`⚠️ Action Blocked (Read-Only Mode): ${data.message}`);
            reFetchServerState();
          } else {
            throw new Error(data.error || "Failed to create artwork");
          }
        } else {
          fetchDbStats();
        }
      })
      .catch((err) => {
        console.error("Error creating server artwork:", err);
        reFetchServerState();
      });

    navigate("/");
  };

  const handleUpdateProfile = (updated: ArtistProfile) => {
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    setProfiles(updatedProfiles);
    localStorage.setItem("afa_profiles", JSON.stringify(updatedProfiles));
    // If the logged-in user updated their own profile, sync the session
    if (userSession.type !== "guest" && userSession.artist?.id === updated.id) {
      setUserSession({ ...userSession, artist: updated });
    }

    // Sync to backend server
    fetch(`/api/profiles/${encodeURIComponent(updated.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 403 && data.error === "DATABASE_READ_ONLY") {
            alert(`⚠️ Action Blocked (Read-Only Mode): ${data.message}`);
            reFetchServerState();
          } else {
            throw new Error(data.error || "Failed to update profile");
          }
        } else {
          fetchDbStats();
        }
      })
      .catch((err) => {
        console.error("Error updating server profile:", err);
        reFetchServerState();
      });

    triggerLoading("Updating profile information...");
  };

  const handleCreateProfile = (newProfile: ArtistProfile) => {
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem("afa_profiles", JSON.stringify(updated));

    // Sync to backend server
    fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProfile)
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 403 && data.error === "DATABASE_READ_ONLY") {
            alert(`⚠️ Action Blocked (Read-Only Mode): ${data.message}`);
            reFetchServerState();
          } else {
            throw new Error(data.error || "Failed to create profile");
          }
        } else {
          fetchDbStats();
        }
      })
      .catch((err) => {
        console.error("Error creating server profile:", err);
        reFetchServerState();
      });

    triggerLoading(`Creating profile for ${newProfile.name}...`);
  };

  const handleVerifyProfile = (id: string, verified: boolean) => {
    const updatedProfiles = profiles.map(p => p.id === id ? { ...p, verified } : p);
    setProfiles(updatedProfiles);
    localStorage.setItem("afa_profiles", JSON.stringify(updatedProfiles));
    if (userSession.type !== "guest" && userSession.artist?.id === id) {
      setUserSession({ ...userSession, artist: { ...userSession.artist, verified } });
    }

    // Sync to backend server
    fetch(`/api/profiles/${encodeURIComponent(id)}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified })
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 403 && data.error === "DATABASE_READ_ONLY") {
            alert(`⚠️ Action Blocked (Read-Only Mode): ${data.message}`);
            reFetchServerState();
          } else {
            throw new Error(data.error || "Failed to verify profile");
          }
        } else {
          fetchDbStats();
        }
      })
      .catch((err) => {
        console.error("Error verifying server profile:", err);
        reFetchServerState();
      });

    triggerLoading(verified ? "Verifying artist profile..." : "Revoking profile verification...");
  };

  const handleDeleteProfile = (id: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    const updatedArtworks = artworks.filter(art => art.artistId !== id);
    setProfiles(updatedProfiles);
    setArtworks(updatedArtworks);
    localStorage.setItem("afa_profiles", JSON.stringify(updatedProfiles));
    localStorage.setItem("afa_artworks", JSON.stringify(updatedArtworks));
    if (selectedArtistId === id) {
      setSelectedArtistId("");
    }

    // Sync to backend server
    fetch(`/api/profiles/${encodeURIComponent(id)}`, {
      method: "DELETE"
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 403 && data.error === "DATABASE_READ_ONLY") {
            alert(`⚠️ Action Blocked (Read-Only Mode): ${data.message}`);
            reFetchServerState();
          } else {
            throw new Error(data.error || "Failed to delete profile");
          }
        } else {
          fetchDbStats();
        }
      })
      .catch((err) => {
        console.error("Error deleting server profile:", err);
        reFetchServerState();
      });

    triggerLoading("Deleting profile...");
  };

  const handleSignOut = () => {
    setUserSession({ type: "guest" });
    triggerLoading("Signing out...");
    navigate("/");
  };


  // Filter artworks by searchTag
  const filteredArtworks = searchTag
    ? artworks.filter(art => 
        art.tags.some(tag => tag.toLowerCase().includes(searchTag)) ||
        art.title.toLowerCase().includes(searchTag) ||
        art.artistName.toLowerCase().includes(searchTag)
      )
    : artworks;

  // Calculate popular tags dynamically from actual artwork tags
  const popularTags = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    artworks.forEach(art => {
      art.tags.forEach(t => {
        const cleaned = t.trim().toLowerCase();
        if (cleaned) {
          counts[cleaned] = (counts[cleaned] || 0) + 1;
        }
      });
    });
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 8);
  }, [artworks]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-muted font-sans flex flex-col selection:bg-brand-primary/10 selection:text-brand-primary">
      
      {/* Search Header Navigation */}
      <Navbar 
        currentTab={location.pathname} 
        setCurrentTab={() => {}} 
        onSearch={handleSearch} 
        searchTag={searchTag} 
        userSession={userSession}
        onSignOut={handleSignOut}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Central Security Gateway Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        config={config}
      />

      {/* User Account & Gateway Settings Modal */}
      {userSession.type !== "guest" && userSession.artist && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          activeProfile={userSession.artist}
          onUpdateProfile={handleUpdateProfile}
          onRerunSetupWizard={() => {
            const email = userSession.artist.id.startsWith("artist_") 
              ? userSession.artist.id.replace("artist_", "") 
              : userSession.artist.id;
            setPendingOidcUser({ email, name: userSession.artist.name });
          }}
          onStripeConnect={handleStripeConnect}
        />
      )}

      {/* Dynamic OIDC Artist Setup Wizard */}
      {pendingOidcUser && (
        <SetupWizard
          isOpen={pendingOidcUser !== null}
          initialEmail={pendingOidcUser.email}
          initialName={pendingOidcUser.name}
          onCancel={() => {
            setPendingOidcUser(null);
            if (userSession.type === "guest") {
              setUserSession({ type: "guest" });
            }
          }}
          onComplete={(freshProfile) => {
            const email = pendingOidcUser?.email || "";
            const isAdmin = email === "thepurpledragons12@gmail.com" || email === "rabe345g@gmail.com" || userSession.type === "admin";
            const role = isAdmin ? "admin" : "artist";

            const finalizedProfile: ArtistProfile = {
              ...freshProfile,
              role: role as "admin" | "artist",
              verified: isAdmin ? true : freshProfile.verified
            };

            setProfiles((prev) => {
              const exists = prev.some(p => p.id === finalizedProfile.id);
              let updated;
              if (exists) {
                updated = prev.map(p => p.id === finalizedProfile.id ? finalizedProfile : p);
              } else {
                updated = [...prev, finalizedProfile];
              }
              localStorage.setItem("afa_profiles", JSON.stringify(updated));
              return updated;
            });

            // Sync to backend server
            fetch(`/api/profiles/${encodeURIComponent(finalizedProfile.id)}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(finalizedProfile)
            })
              .then(async (res) => {
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  if (res.status === 403 && data.error === "DATABASE_READ_ONLY") {
                    alert(`⚠️ Action Blocked (Read-Only Mode): ${data.message}`);
                    reFetchServerState();
                  } else {
                    throw new Error(data.error || "Failed to update profile");
                  }
                } else {
                  fetchDbStats();
                }
              })
              .catch((err) => {
                console.error("Error updating profile during wizard finish:", err);
                reFetchServerState();
              });

            setUserSession({ type: role, artist: finalizedProfile });
            setSelectedArtistId(finalizedProfile.id);
            setPendingOidcUser(null);
            navigate(role === "admin" ? "/admin" : `/artists/${finalizedProfile.id}`);
            triggerLoading("Completing registration and building your profile...");
          }}
        />
      )}

      {/* Subtle Production-Ready Top Loading Bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-brand-accent z-[200] overflow-hidden animate-pulse">
          <div className="h-full bg-brand-primary-light w-1/2 animate-infinite-slide" style={{
            animation: "shimmer 1.5s infinite linear",
            backgroundImage: "linear-gradient(to right, transparent 0%, #ffffff 50%, transparent 100%)",
            backgroundSize: "200% 100%"
          }} />
        </div>
      )}

      {/* Floating subtle corner loader indicator */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-brand-primary/95 text-white text-xs px-4 py-2 rounded-xl border border-brand-primary/20 shadow-lg z-[200] flex items-center gap-2 font-sans animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
          <span>{loadingTip}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route 
            path="/" 
            element={
              <HomeView 
                artworks={artworks}
                profiles={profiles}
                popularTags={popularTags}
                handleSearch={handleSearch}
                onViewArtist={(artistId) => {
                  setSelectedArtistId(artistId);
                  navigate(`/artists/${artistId}`);
                }}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            } 
          />

          <Route 
            path="/search" 
            element={
              <SearchView 
                filteredArtworks={filteredArtworks}
                profiles={profiles}
                searchTag={searchTag}
                handleSearch={handleSearch}
                onViewArtist={(artistId) => {
                  setSelectedArtistId(artistId);
                  navigate(`/artists/${artistId}`);
                }}
              />
            } 
          />

          <Route 
            path="/upload" 
            element={
              (userSession.type === "artist" || userSession.type === "admin") ? (
                <UploadForm 
                  onAddArtwork={handleAddArtwork} 
                  activeArtist={userSession.artist} 
                  isAdmin={userSession.type === "admin"}
                  profiles={profiles}
                />
              ) : (
                <div className="max-w-md mx-auto text-center py-16 bg-white border border-brand-primary/10 rounded-2xl space-y-4 shadow-sm animate-fade-in" id="upload-gated">
                  <div className="bg-brand-panel p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto border border-brand-primary/10 text-brand-primary">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-serif font-bold text-lg text-brand-primary">Access Restricted</h3>
                    <p className="text-xs text-brand-muted max-w-xs mx-auto">
                      You must be signed in as a registered artist to publish artworks.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Sign In Now
                  </button>
                </div>
              )
            } 
          />

          <Route 
            path="/artists" 
            element={
              <ProfileView 
                profiles={profiles} 
                artworks={artworks} 
                selectedArtistId={selectedArtistId || (profiles[0]?.id || "")}
                setSelectedArtistId={setSelectedArtistId}
                userSession={userSession}
                onUpdateProfile={handleUpdateProfile}
                onStripeConnect={handleStripeConnect}
              />
            } 
          />

          <Route 
            path="/artists/:id" 
            element={
              <ProfileView 
                profiles={profiles} 
                artworks={artworks} 
                selectedArtistId={selectedArtistId || (profiles[0]?.id || "")}
                setSelectedArtistId={setSelectedArtistId}
                userSession={userSession}
                onUpdateProfile={handleUpdateProfile}
                onStripeConnect={handleStripeConnect}
              />
            } 
          />

          <Route 
            path="/profile" 
            element={
              userSession.type !== "guest" && userSession.artist ? (
                <Navigate to={`/artists/${userSession.artist.id}`} replace />
              ) : (
                <Navigate to="/artists" replace />
              )
            } 
          />

          <Route 
            path="/admin" 
            element={
              userSession.type === "admin" ? (
                <ConfigPanel 
                  config={config} 
                  onUpdateConfig={(updated) => {
                    setConfig(updated);
                    triggerLoading("Updating global configurations...");
                    fetch("/api/config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updated)
                    }).catch((err) => console.error("Error saving config to server:", err));
                  }} 
                  profiles={profiles}
                  artworks={artworks}
                  onVerifyProfile={handleVerifyProfile}
                  onDeleteProfile={handleDeleteProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onAddProfile={handleCreateProfile}
                  changelog={changelog}
                  onUpdateChangelog={setChangelog}
                  loadingTips={loadingTips}
                  onUpdateLoadingTips={setLoadingTips}
                  dbStats={dbStats}
                  onUpgradeDb={handleUpgradeDb}
                />
              ) : (
                <div className="max-w-md mx-auto text-center py-16 bg-white border border-brand-primary/10 rounded-2xl space-y-4 shadow-sm animate-fade-in" id="config-gated">
                  <div className="bg-brand-panel p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto border border-brand-primary/10 text-brand-primary">
                    <ShieldAlert className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-serif font-bold text-lg text-brand-primary">Administrator Sign In</h3>
                    <p className="text-xs text-brand-muted max-w-xs mx-auto">
                      Only the administrator can access settings, verify profiles, and manage configurations.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Sign In as Admin
                  </button>
                </div>
              )
            } 
          />

          <Route 
            path="/changelog" 
            element={<ChangelogView entries={changelog} />} 
          />

          <Route 
            path="/login" 
            element={
              <div className="max-w-md mx-auto text-center py-24 space-y-4 animate-fade-in">
                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-brand-muted font-medium">Redirecting to Single Sign-On...</p>
              </div>
            } 
          />

          <Route 
            path="/callback" 
            element={
              <div className="max-w-md mx-auto text-center py-24 space-y-4 animate-fade-in">
                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-brand-muted font-medium">Authenticating credentials...</p>
              </div>
            } 
          />

          <Route 
            path="/oidc-callback" 
            element={
              <div className="max-w-md mx-auto text-center py-24 space-y-4 animate-fade-in">
                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-brand-muted font-medium">Completing federated callback...</p>
              </div>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Simple, Clean Footer */}
      <footer className="bg-brand-panel text-brand-primary/60 py-6 mt-16 border-t border-brand-primary/10 font-sans text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <span className="font-serif font-semibold text-brand-primary">Art For All</span>
          <p className="text-brand-muted">
            © 2026 Art For All • Direct payouts to artists • All rights reserved
          </p>
        </div>
      </footer>

    </div>
  );
}
