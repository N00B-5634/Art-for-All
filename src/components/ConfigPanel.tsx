/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PlatformConfig, ArtistProfile, ChangelogEntry, Artwork, DatabaseStats } from "../types";
import { 
  Sliders, 
  Shield, 
  FileCode, 
  Check, 
  Copy, 
  User, 
  Trash2, 
  CheckCircle, 
  ShieldAlert, 
  Plus, 
  Save, 
  X, 
  BookOpen, 
  Sparkles, 
  HelpCircle, 
  RefreshCw,
  PlusCircle,
  Eye,
  Settings,
  ChevronRight,
  Activity,
  Wallet,
  ShieldAlert as ShieldCheck,
  Download,
  Upload
} from "lucide-react";

interface ConfigPanelProps {
  config: PlatformConfig;
  onUpdateConfig: (updated: PlatformConfig) => void;
  profiles: ArtistProfile[];
  artworks: Artwork[];
  onVerifyProfile: (id: string, verified: boolean) => void;
  onDeleteProfile: (id: string) => void;
  onUpdateProfile: (updated: ArtistProfile) => void;
  onAddProfile: (profile: ArtistProfile) => void;
  changelog: ChangelogEntry[];
  onUpdateChangelog: (updated: ChangelogEntry[]) => void;
  loadingTips: string[];
  onUpdateLoadingTips: (updated: string[]) => void;
  dbStats?: DatabaseStats | null;
  onUpgradeDb?: () => void;
}

type SettingsTab = "system" | "users" | "changelog" | "tips";

export default function ConfigPanel({ 
  config, 
  onUpdateConfig, 
  profiles, 
  artworks,
  onVerifyProfile, 
  onDeleteProfile,
  onUpdateProfile,
  onAddProfile,
  changelog,
  onUpdateChangelog,
  loadingTips,
  onUpdateLoadingTips,
  dbStats,
  onUpgradeDb
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("system");
  const [editingProfile, setEditingProfile] = useState<ArtistProfile | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.artworks || !parsed.profiles || !parsed.config) {
          alert("Error: Invalid database backup file structure.");
          return;
        }

        const confirmRestore = window.confirm(
          "WARNING: Restoring this database will completely OVERWRITE all current profiles, artworks, and settings. Are you sure you want to proceed?"
        );
        if (!confirmRestore) return;

        const response = await fetch("/api/db-admin/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: content
        });

        if (response.ok) {
          const result = await response.json();
          alert(result.message || "Database successfully restored!");
          window.location.reload();
        } else {
          const err = await response.json();
          alert(`Import failed: ${err.error || "Unknown server error"}`);
        }
      } catch (err: any) {
        alert(`Failed to parse backup JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };
  
  // Manual Profile Creation Form State
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileEmail, setNewProfileEmail] = useState("");
  const [newProfileBio, setNewProfileBio] = useState("");
  const [newProfilePayoutMethod, setNewProfilePayoutMethod] = useState("Monero");
  const [newProfilePayoutAddress, setNewProfilePayoutAddress] = useState("");
  const [newProfileRole, setNewProfileRole] = useState<"artist" | "admin">("artist");

  // System Settings State
  const [keycloakAuthUrl, setKeycloakAuthUrl] = useState(config.keycloakAuthUrl);
  const [keycloakRealm, setKeycloakRealm] = useState(config.keycloakRealm);
  const [keycloakClientId, setKeycloakClientId] = useState(config.keycloakClientId);
  const [hostUrl, setHostUrl] = useState(config.hostUrl);
  const [onionAddress, setOnionAddress] = useState(config.onionAddress);
  const [allowPublicIndexing, setAllowPublicIndexing] = useState(config.allowPublicIndexing);
  const [antiOcrScramblingIntensity, setAntiOcrScramblingIntensity] = useState(config.antiOcrScramblingIntensity);

  // Copied & Saved States
  const [copiedPhp, setCopiedPhp] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);

  // Changelog Editor State
  const [editingChangelogIdx, setEditingChangelogIdx] = useState<number | null>(null);
  const [showNewChangelogModal, setShowNewChangelogModal] = useState(false);
  const [newChangelogVersion, setNewChangelogVersion] = useState("v1.3.0");
  const [newChangelogDate, setNewChangelogDate] = useState("July 2026");
  const [newChangelogTitle, setNewChangelogTitle] = useState("Performance & UI Polish");
  const [newChangelogItemText, setNewChangelogItemText] = useState("");
  const [newChangelogItems, setNewChangelogItems] = useState<string[]>([]);

  // Tips Editor State
  const [newTipText, setNewTipText] = useState("");
  const [editingTipIdx, setEditingTipIdx] = useState<number | null>(null);
  const [editingTipText, setEditingTipText] = useState("");

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      keycloakAuthUrl,
      keycloakRealm,
      keycloakClientId,
      hostUrl,
      onionAddress,
      allowPublicIndexing,
      maxUploadSizeBytes: config.maxUploadSizeBytes,
      antiOcrScramblingIntensity
    });
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 2000);
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfileEmail.trim()) {
      alert("Name and Email/ID are required.");
      return;
    }
    const fresh: ArtistProfile = {
      id: newProfileEmail.trim(),
      name: newProfileName.trim(),
      bio: newProfileBio.trim() || "A registered artist on Art For All.",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      monetaryMethod: newProfilePayoutMethod,
      monetaryAddress: newProfilePayoutAddress.trim() || "XMR_DIRECT_ACCOUNT",
      verified: true,
      role: newProfileRole
    };
    onAddProfile(fresh);
    // Reset state
    setNewProfileName("");
    setNewProfileEmail("");
    setNewProfileBio("");
    setNewProfilePayoutMethod("Monero");
    setNewProfilePayoutAddress("");
    setNewProfileRole("artist");
    setShowCreateProfileModal(false);
  };

  const phpConfigCode = `<?php
/**
 * Art For All (AFA) Platform Configuration
 * Generated dynamically on 2026-07-18
 * Source location: config.php
 */

define('AFA_KEYCLOAK_URL', 'https://${keycloakAuthUrl}');
define('AFA_KEYCLOAK_REALM', '${keycloakRealm}');
define('AFA_KEYCLOAK_CLIENT_ID', '${keycloakClientId}');

define('AFA_HOST_URL', '${hostUrl}');
define('AFA_ONION_ADDRESS', '${onionAddress}');

define('AFA_ALLOW_AI_INDEXING', ${allowPublicIndexing ? 'true' : 'false'});
define('AFA_OCR_SCRAMBLER_STRENGTH', '${antiOcrScramblingIntensity}');

// Session Configuration for Tor / Javascript-free clients
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Strict');

session_start();
?>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(phpConfigCode);
    setCopiedPhp(true);
    setTimeout(() => setCopiedPhp(false), 2000);
  };

  // Changelog Handlers
  const handleAddChangelogItem = () => {
    if (newChangelogItemText.trim()) {
      setNewChangelogItems([...newChangelogItems, newChangelogItemText.trim()]);
      setNewChangelogItemText("");
    }
  };

  const handleRemoveChangelogItem = (idx: number) => {
    setNewChangelogItems(newChangelogItems.filter((_, i) => i !== idx));
  };

  const handleCreateChangelog = () => {
    if (!newChangelogVersion.trim() || !newChangelogTitle.trim() || newChangelogItems.length === 0) {
      alert("Please specify version, title, and at least one change detail item.");
      return;
    }
    const freshEntry: ChangelogEntry = {
      version: newChangelogVersion.trim(),
      date: newChangelogDate.trim() || "July 2026",
      title: newChangelogTitle.trim(),
      changes: newChangelogItems
    };
    onUpdateChangelog([freshEntry, ...changelog]);
    // Reset state
    setNewChangelogVersion(`v1.${changelog.length + 3}.0`);
    setNewChangelogTitle("");
    setNewChangelogItems([]);
    setShowNewChangelogModal(false);
  };

  const handleSaveEditChangelog = (idx: number, updatedEntry: ChangelogEntry) => {
    const updated = changelog.map((item, i) => i === idx ? updatedEntry : item);
    onUpdateChangelog(updated);
    setEditingChangelogIdx(null);
  };

  const handleDeleteChangelog = (idx: number) => {
    if (confirm("Are you sure you want to delete this changelog entry?")) {
      const updated = changelog.filter((_, i) => i !== idx);
      onUpdateChangelog(updated);
    }
  };

  // Tips Handlers
  const handleAddTip = () => {
    if (newTipText.trim()) {
      onUpdateLoadingTips([...loadingTips, newTipText.trim()]);
      setNewTipText("");
    }
  };

  const handleStartEditTip = (idx: number) => {
    setEditingTipIdx(idx);
    setEditingTipText(loadingTips[idx]);
  };

  const handleSaveEditTip = (idx: number) => {
    if (editingTipText.trim()) {
      const updated = loadingTips.map((tip, i) => i === idx ? editingTipText.trim() : tip);
      onUpdateLoadingTips(updated);
      setEditingTipIdx(null);
      setEditingTipText("");
    }
  };

  const handleDeleteTip = (idx: number) => {
    if (confirm("Are you sure you want to delete this loading tip?")) {
      const updated = loadingTips.filter((_, i) => i !== idx);
      onUpdateLoadingTips(updated);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in" id="config-panel-view">
      
      {/* Header Panel */}
      <div className="bg-white border border-brand-primary/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-primary" />
            <h2 className="font-serif font-semibold text-2xl text-brand-primary">Administrative Center</h2>
          </div>
          <p className="text-xs text-brand-muted max-w-xl">
            You are signed in with system administrator credentials. Toggle options, manage registered profiles, customize changelogs, or update interface load-tips.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateProfileModal(true)}
            className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-4 py-2 rounded-full text-xs font-semibold cursor-pointer shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Profile</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Navigation tabs + active view */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="bg-white border border-brand-primary/10 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-brand-muted uppercase tracking-wider px-2 mb-2">
              Command Sub-Systems
            </span>

            <button
              onClick={() => setActiveTab("system")}
              className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "system" 
                  ? "bg-brand-primary/10 text-brand-primary font-semibold" 
                  : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>System Parameters</span>
              <ChevronRight className={`w-3.5 h-3.5 ml-auto opacity-60 ${activeTab === "system" ? "block" : "hidden"}`} />
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "users" 
                  ? "bg-brand-primary/10 text-brand-primary font-semibold" 
                  : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
              }`}
            >
              <User className="w-4 h-4" />
              <span>User & Artist Accounts</span>
              <span className="bg-brand-primary/10 text-brand-primary text-[9px] px-2 py-0.5 rounded-full font-mono ml-auto">
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("changelog")}
              className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "changelog" 
                  ? "bg-brand-primary/10 text-brand-primary font-semibold" 
                  : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Platform Changelogs</span>
              <span className="bg-brand-primary/10 text-brand-primary text-[9px] px-2 py-0.5 rounded-full font-mono ml-auto">
                {changelog.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("tips")}
              className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === "tips" 
                  ? "bg-brand-primary/10 text-brand-primary font-semibold" 
                  : "text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Loading Screen Tips</span>
              <span className="bg-brand-primary/10 text-brand-primary text-[9px] px-2 py-0.5 rounded-full font-mono ml-auto">
                {loadingTips.length}
              </span>
            </button>
          </div>

          {/* Database Storage Capacity Monitor Widget */}
          {dbStats && (
            <div className="bg-white border border-brand-primary/10 rounded-2xl p-4 space-y-3 shadow-xs animate-fade-in">
              <div className="flex items-center gap-1.5 border-b border-brand-primary/5 pb-2">
                <FileCode className="w-4 h-4 text-brand-primary" />
                <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-wider">
                  Database Capacity
                </span>
                {dbStats.isReadOnly && (
                  <span className="bg-red-100 text-red-700 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full ml-auto animate-pulse">
                    READ ONLY
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-brand-muted">Used Size</span>
                  <span className="font-mono text-brand-primary">{formatBytes(dbStats.totalSizeBytes)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-brand-muted">Total Limit</span>
                  <span className="font-mono text-brand-primary">{formatBytes(dbStats.maxStorageLimitBytes)}</span>
                </div>
              </div>
              <div className="w-full bg-brand-panel h-2 rounded-full overflow-hidden border border-brand-primary/5">
                <div 
                  className={`h-full transition-all duration-500 ${
                    dbStats.isReadOnly 
                      ? "bg-red-500" 
                      : (dbStats.totalSizeBytes / dbStats.maxStorageLimitBytes > 0.8) 
                        ? "bg-amber-500" 
                        : "bg-brand-primary"
                  }`}
                  style={{ width: `${Math.min(100, (dbStats.totalSizeBytes / dbStats.maxStorageLimitBytes) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-brand-muted leading-relaxed font-sans">
                {dbStats.isReadOnly 
                  ? "Allocated capacity exceeded. Site is currently Read-Only until upgraded." 
                  : "Allocated capacity is within safe threshold limits."}
              </p>
              {onUpgradeDb && (
                <button
                  type="button"
                  onClick={onUpgradeDb}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-primary/5 hover:bg-brand-primary hover:text-white text-brand-primary px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition border border-brand-primary/15"
                >
                  <span>Upgrade Allocation (+100 KB)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Panel Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: System Config Parameters */}
          {activeTab === "system" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Dynamic Operational & Security Statistics Panel */}
              <div className="bg-gradient-to-br from-slate-900 to-brand-primary text-white rounded-2xl p-6 border border-brand-primary/10 shadow-lg space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-brand-accent animate-pulse" />
                      <h3 className="font-serif font-bold text-lg tracking-tight">Active Registry & Database Telemetry</h3>
                    </div>
                    <p className="text-[11px] text-brand-bg/75 font-sans">
                      Genuine server-side database statistics, storage quotas, and client-side configuration state ledger.
                    </p>
                  </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Card 1: Artist Sovereignty & Payouts */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-brand-accent uppercase">
                          SOVEREIGN PAYOUTS
                        </span>
                        <Wallet className="w-4 h-4 text-brand-accent" />
                      </div>
                      <p className="text-2xl font-serif font-bold">
                        {profiles.filter(p => p.monetaryAddress && p.monetaryAddress.trim().length > 0).length} / {profiles.length}
                      </p>
                      <p className="text-[10px] text-brand-bg/70 font-sans leading-relaxed">
                        Registered artist profiles with secure connected cryptographic or traditional monetary addresses.
                      </p>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] font-mono text-brand-bg/60">
                      <span>Direct Inventory Value:</span>
                      <span className="text-white font-bold">
                        ${artworks.reduce((sum, art) => sum + (art.price || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Database Storage Utilization */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                          DATABASE UTILIZATION
                        </span>
                        <FileCode className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-emerald-300">
                        {dbStats ? formatBytes(dbStats.totalSizeBytes) : "0 Bytes"}
                      </p>
                      <p className="text-[10px] text-brand-bg/70 font-sans leading-relaxed">
                        Total allocated disk storage footprint of system configuration, profile registries, and artworks.
                      </p>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] font-mono text-emerald-300">
                      <span>Storage Footprint limit:</span>
                      <span className="text-white font-bold">
                        {dbStats ? formatBytes(dbStats.maxStorageLimitBytes) : "55 KB"} ({dbStats ? dbStats.percentageUsed : 0}%)
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Registry Elements Distribution */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-purple-300 uppercase">
                          REGISTRY INVENTORY
                        </span>
                        <Settings className="w-4 h-4 text-purple-300" />
                      </div>
                      <p className="text-2xl font-serif font-bold text-purple-200">
                        {artworks.length + profiles.length} Records
                      </p>
                      <p className="text-[10px] text-brand-bg/70 font-sans leading-relaxed">
                        Active registered profiles, catalog listings, global configurations, and changelog datasets.
                      </p>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] font-mono text-purple-200/80">
                      <span>Server Write State:</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-semibold font-mono ${dbStats?.isReadOnly ? "bg-red-950/50 text-red-300 border border-red-800/40" : "bg-purple-950/50 text-purple-300 border border-purple-800/40"}`}>
                        {dbStats?.isReadOnly ? "Read-Only mode" : "Read-Write mode"}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Database Registry Records Proportion bar */}
                <div className="bg-slate-950/55 rounded-xl p-4 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold tracking-wide text-brand-bg/85">
                      REGISTRY RECORD DENSITY & DISTRIBUTION
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                      ● ALL DATA DYNAMIC
                    </span>
                  </div>
                  
                  {/* Proportional Distribution Bar */}
                  <div className="h-4 w-full flex rounded-full overflow-hidden border border-white/10 bg-white/5">
                    {(() => {
                      const total = artworks.length + profiles.length + changelog.length + loadingTips.length || 1;
                      const pctArt = ((artworks.length) / total) * 100;
                      const pctProfile = ((profiles.length) / total) * 100;
                      const pctChangelog = ((changelog.length) / total) * 100;
                      const pctTips = ((loadingTips.length) / total) * 100;
                      return (
                        <>
                          <div style={{ width: `${pctArt}%` }} className="bg-emerald-500 h-full transition-all duration-300" title={`Artworks: ${artworks.length}`} />
                          <div style={{ width: `${pctProfile}%` }} className="bg-amber-400 h-full transition-all duration-300" title={`Profiles: ${profiles.length}`} />
                          <div style={{ width: `${pctChangelog}%` }} className="bg-purple-500 h-full transition-all duration-300" title={`Changelogs: ${changelog.length}`} />
                          <div style={{ width: `${pctTips}%` }} className="bg-sky-400 h-full transition-all duration-300" title={`Loading Tips: ${loadingTips.length}`} />
                        </>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono pt-1 text-brand-bg/75">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" />
                      <span>Artworks: <strong>{artworks.length}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full shrink-0" />
                      <span>Profiles: <strong>{profiles.length}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-purple-500 rounded-full shrink-0" />
                      <span>Changelogs: <strong>{changelog.length}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-sky-400 rounded-full shrink-0" />
                      <span>Loading Tips: <strong>{loadingTips.length}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Editor Form */}
                <form onSubmit={handleSaveSystem} className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="font-serif font-semibold text-base text-brand-primary border-b border-brand-primary/10 pb-2">
                    Global Parameters
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                        Keycloak Server URL *
                      </label>
                      <input
                        type="text"
                        value={keycloakAuthUrl}
                        onChange={(e) => setKeycloakAuthUrl(e.target.value)}
                        className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                        Keycloak Realm *
                      </label>
                      <input
                        type="text"
                        value={keycloakRealm}
                        onChange={(e) => setKeycloakRealm(e.target.value)}
                        className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                        Keycloak Client ID *
                      </label>
                      <input
                        type="text"
                        value={keycloakClientId}
                        onChange={(e) => setKeycloakClientId(e.target.value)}
                        className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                        Host Domain URL *
                      </label>
                      <input
                        type="text"
                        value={hostUrl}
                        onChange={(e) => setHostUrl(e.target.value)}
                        className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                      Onion Address Domain (Optional)
                    </label>
                    <input
                      type="text"
                      value={onionAddress}
                      onChange={(e) => setOnionAddress(e.target.value)}
                      className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-primary uppercase tracking-wider mb-1">
                        Artwork Texture Mask
                      </label>
                      <select
                        value={antiOcrScramblingIntensity}
                        onChange={(e) => setAntiOcrScramblingIntensity(e.target.value as any)}
                        className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-1.5 text-brand-primary text-xs cursor-pointer"
                      >
                        <option value="low">Subtle Grain</option>
                        <option value="medium">Balanced Texture</option>
                        <option value="high">Distinct Texture</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-4">
                      <label className="flex items-center gap-2 font-medium text-brand-primary text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allowPublicIndexing}
                          onChange={(e) => setAllowPublicIndexing(e.target.checked)}
                          className="rounded border-brand-primary/30 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
                        />
                        <span>Allow Public Search Index</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-brand-primary/10 pt-4 flex items-center justify-between">
                    <span className="text-[9px] text-brand-muted/50 font-mono">Status: Connected</span>
                    <button
                      type="submit"
                      className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg font-sans font-medium py-1.5 px-4 rounded-full text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      {savedConfig ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savedConfig ? "Settings Saved" : "Save Settings"}</span>
                    </button>
                  </div>
                </form>

                {/* PHP Configuration Preview */}
                <div className="bg-brand-panel text-brand-primary rounded-2xl p-5 border border-brand-primary/10 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-brand-primary/10 pb-2.5">
                      <span className="text-xs font-mono font-semibold flex items-center gap-1">
                        <FileCode className="w-4 h-4" />
                        <span>config.php</span>
                      </span>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-[10px] font-sans font-medium flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedPhp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPhp ? "Copied" : "Copy Code"}</span>
                      </button>
                    </div>
                    <pre className="font-mono text-[9px] text-brand-primary/90 overflow-x-auto p-3 bg-white rounded border border-brand-primary/5 max-h-56 leading-relaxed whitespace-pre select-all">
                      {phpConfigCode}
                    </pre>
                  </div>
                  <p className="text-[10px] text-brand-muted mt-3 font-sans italic leading-tight">
                    💡 <strong>Operator instruction</strong>: Drop this configuration into the root server directory of the server container to finalize client OIDC federations.
                  </p>
                </div>

              </div>

              {/* Keycloak Admin Parameters Setup Info */}
              <div className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-serif font-semibold text-base text-brand-primary flex items-center gap-1.5 border-b border-brand-primary/10 pb-2">
                  <Shield className="w-4 h-4" />
                  <span>Keycloak OIDC Client Parameters</span>
                </h3>
                <p className="text-xs text-brand-muted">
                  These values match your environment's active origin domains. Populate them in the Keycloak admin console for the client <strong>{keycloakClientId}</strong>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-sans">
                  <div className="space-y-2 bg-brand-panel/35 p-3 rounded-xl border border-brand-primary/5">
                    <div>
                      <span className="block font-mono text-[10px] text-brand-primary-light font-bold">Root URL</span>
                      <code className="block bg-white text-brand-primary p-1.5 rounded text-[10px] select-all font-mono break-all mt-1 border border-brand-primary/10">
                        {window.location.origin}
                      </code>
                    </div>
                    <div>
                      <span className="block font-mono text-[10px] text-brand-primary-light font-bold">Home URL</span>
                      <code className="block bg-white text-brand-primary p-1.5 rounded text-[10px] select-all font-mono break-all mt-1 border border-brand-primary/10">
                        {window.location.origin}/
                      </code>
                    </div>
                  </div>
                  <div className="space-y-2 bg-brand-panel/35 p-3 rounded-xl border border-brand-primary/5">
                    <div>
                      <span className="block font-mono text-[10px] text-brand-primary-light font-bold">Valid Redirect URIs</span>
                      <code className="block bg-white text-brand-primary p-1.5 rounded text-[10px] select-all font-mono break-all mt-1 border border-brand-primary/10">
                        {window.location.origin}/callback
                      </code>
                    </div>
                    <div>
                      <span className="block font-mono text-[10px] text-brand-primary-light font-bold">Web Origins</span>
                      <code className="block bg-white text-brand-primary p-1.5 rounded text-[10px] select-all font-mono break-all mt-1 border border-brand-primary/10">
                        {window.location.origin}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform-Agnostic Migration & Backup Subsystem */}
              <div className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-2 border-b border-brand-primary/10 pb-3">
                  <Download className="w-5 h-5 text-brand-primary" />
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-semibold text-base text-brand-primary">
                      Platform-Agnostic Migration & Database Backups
                    </h3>
                    <p className="text-xs text-brand-muted">
                      Seamlessly migrate all artist profiles, artworks, metadata, and operational configs across any sovereign host.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Export Box */}
                  <div className="bg-brand-panel border border-brand-primary/10 rounded-xl p-5 space-y-3 flex flex-col justify-between h-full">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-wider block">
                        Database Portability Export
                      </span>
                      <p className="text-xs text-brand-muted leading-relaxed">
                        Download your entire active registry as a standardized JSON schema. Keep all metadata, cryptographically encrypted payloads, and logs fully portable.
                      </p>
                    </div>
                    <div className="pt-3">
                      <a
                        href="/api/db-admin/export"
                        download="artforall_migration_db.json"
                        className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-4 py-2 rounded-full text-xs font-semibold cursor-pointer shadow-xs transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Database (JSON)</span>
                      </a>
                    </div>
                  </div>

                  {/* Import Box */}
                  <div className="bg-brand-panel border border-brand-primary/10 rounded-xl p-5 space-y-3 flex flex-col justify-between h-full">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-wider block">
                        Database Migration Import
                      </span>
                      <p className="text-xs text-brand-muted leading-relaxed">
                        Migrate an existing system by dropping a previously exported JSON backup. This replaces the active instance database records immediately.
                      </p>
                    </div>
                    <div className="pt-2">
                      <label className="relative inline-flex items-center justify-center gap-1.5 bg-white hover:bg-brand-panel text-brand-primary px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition border border-brand-primary/20 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload & Restore Backup</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: User & Artist Management */}
          {activeTab === "users" && (
            <div className="bg-white border border-brand-primary/10 rounded-2xl p-5 space-y-4 shadow-sm animate-fade-in" id="users-tab">
              <div className="flex justify-between items-center border-b border-brand-primary/10 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-serif font-semibold text-base text-brand-primary flex items-center gap-1.5">
                    <User className="w-5 h-5 text-brand-primary" />
                    <span>Registered Profiles</span>
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Promote users to admins, verify payout addresses, modify details, or remove inactive profiles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateProfileModal(true)}
                  className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manual Create</span>
                </button>
              </div>

              {profiles.length === 0 ? (
                <div className="text-center py-8 italic text-xs text-brand-muted bg-brand-panel/30 border border-brand-primary/10 rounded-xl">
                  No artist profiles currently exist on this platform.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-primary/10 font-mono text-[10px] text-brand-muted uppercase">
                        <th className="py-2 px-3">Artist Name & Bio</th>
                        <th className="py-2 px-3">SSO Profile ID</th>
                        <th className="py-2 px-3">Platform Role</th>
                        <th className="py-2 px-3">Payout Method</th>
                        <th className="py-2 px-3">Monetary Address / URL</th>
                        <th className="py-2 px-3">Verif. Status</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-primary/5">
                      {profiles.map((p) => (
                        <tr key={p.id} className="hover:bg-brand-panel/20 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-serif font-semibold text-brand-primary leading-tight text-xs">{p.name}</div>
                            <div className="text-[10px] font-sans text-brand-muted max-w-[180px] truncate italic" title={p.bio}>
                              {p.bio || "No biography provided."}
                            </div>
                          </td>
                          
                          <td className="py-3 px-3 font-mono text-[10px] text-brand-primary max-w-[120px] truncate" title={p.id}>
                            {p.id}
                          </td>

                          <td className="py-3 px-3">
                            <div className="relative inline-block">
                              <select
                                value={p.role || "artist"}
                                onChange={(e) => {
                                  onUpdateProfile({ ...p, role: e.target.value as "artist" | "admin" });
                                }}
                                className={`appearance-none font-mono text-[9px] font-bold border rounded-full pl-3 pr-7 py-1.5 transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary/25 ${
                                  p.role === "admin" 
                                    ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" 
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                }`}
                                title="Change platform user role"
                              >
                                <option value="artist" className="bg-white text-indigo-700 font-mono">ARTIST</option>
                                <option value="admin" className="bg-white text-purple-700 font-mono">ADMIN</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-60">
                                <ChevronRight className="w-2.5 h-2.5 rotate-90" />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-sans font-medium text-brand-primary">{p.monetaryMethod}</td>

                          <td className="py-3 px-3 font-mono text-[10px] text-brand-muted max-w-[130px] truncate" title={p.monetaryAddress}>
                            {p.monetaryAddress}
                          </td>

                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => onVerifyProfile(p.id, !p.verified)}
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border transition cursor-pointer ${
                                p.verified 
                                  ? "bg-green-50 text-green-700 border-green-200" 
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {p.verified ? <CheckCircle className="w-2.5 h-2.5 text-green-600" /> : <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />}
                              <span>{p.verified ? "VERIFIED" : "PENDING"}</span>
                            </button>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingProfile(p)}
                              className="text-brand-primary hover:text-brand-primary-light hover:bg-brand-primary/5 p-1.5 rounded-full transition cursor-pointer inline-flex items-center justify-center mr-1"
                              title="Edit user details directly"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you absolutely sure you want to delete profile '${p.name}'? ALL their uploaded artworks will be removed from the database permanently.`)) {
                                  onDeleteProfile(p.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition cursor-pointer inline-flex items-center justify-center"
                              title="Delete profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Changelog Entry Manager */}
          {activeTab === "changelog" && (
            <div className="bg-white border border-brand-primary/10 rounded-2xl p-5 space-y-4 shadow-sm animate-fade-in" id="changelog-tab">
              <div className="flex justify-between items-center border-b border-brand-primary/10 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-serif font-semibold text-base text-brand-primary flex items-center gap-1.5">
                    <BookOpen className="w-5 h-5 text-brand-primary" />
                    <span>Dynamic Changelog Management</span>
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Publish new system release logs, edit existing historical entries, and order updates instantly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewChangelogVersion(`v1.${changelog.length + 3}.0`);
                    setNewChangelogDate(new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }));
                    setShowNewChangelogModal(true);
                  }}
                  className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Version Log</span>
                </button>
              </div>

              {changelog.length === 0 ? (
                <div className="text-center py-8 italic text-xs text-brand-muted bg-brand-panel/30 border border-brand-primary/10 rounded-xl">
                  No changelog releases defined. Click "Add Version Log" to create your first release note.
                </div>
              ) : (
                <div className="space-y-4">
                  {changelog.map((entry, index) => (
                    <div key={index} className="border border-brand-primary/10 rounded-xl p-4 space-y-3 hover:border-brand-primary/20 transition bg-brand-panel/5">
                      
                      {/* View Mode */}
                      {editingChangelogIdx !== index ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-brand-primary/5 pb-2">
                            <div className="flex items-center gap-2 font-mono text-xs text-brand-primary font-bold">
                              <span>{entry.version}</span>
                              <span className="text-[10px] text-brand-muted font-normal font-sans">({entry.date})</span>
                              {index === 0 && (
                                <span className="bg-brand-primary/10 text-brand-primary text-[8px] tracking-wider uppercase font-extrabold px-2 py-0.5 rounded-full border border-brand-primary/10">
                                  Current Release
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingChangelogIdx(index)}
                                className="bg-white hover:bg-brand-primary/5 border border-brand-primary/10 text-brand-primary text-[10px] px-2.5 py-1 rounded-md font-sans font-semibold cursor-pointer transition"
                              >
                                Edit Log
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChangelog(index)}
                                className="bg-red-50 hover:bg-red-150 border border-red-200 text-red-600 text-[10px] px-2.5 py-1 rounded-md font-sans font-semibold cursor-pointer transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="text-xs font-serif font-semibold text-brand-primary">{entry.title}</div>
                          
                          <ul className="list-disc pl-5 text-[11px] text-brand-muted space-y-1 font-sans">
                            {entry.changes.map((c, cIdx) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        // Edit Mode
                        <div className="space-y-3 text-xs font-sans">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-brand-primary uppercase tracking-wider mb-1">Version *</label>
                              <input
                                type="text"
                                defaultValue={entry.version}
                                id={`edit-cl-version-${index}`}
                                className="w-full bg-white border border-brand-primary/15 rounded px-2.5 py-1.5 font-mono text-xs text-brand-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-brand-primary uppercase tracking-wider mb-1">Date *</label>
                              <input
                                type="text"
                                defaultValue={entry.date}
                                id={`edit-cl-date-${index}`}
                                className="w-full bg-white border border-brand-primary/15 rounded px-2.5 py-1.5 text-brand-primary text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-brand-primary uppercase tracking-wider mb-1">Release Title *</label>
                              <input
                                type="text"
                                defaultValue={entry.title}
                                id={`edit-cl-title-${index}`}
                                className="w-full bg-white border border-brand-primary/15 rounded px-2.5 py-1.5 text-brand-primary text-xs font-serif"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                              Log Entries (one action per line, separate with newlines) *
                            </label>
                            <textarea
                              rows={4}
                              defaultValue={entry.changes.join("\n")}
                              id={`edit-cl-changes-${index}`}
                              className="w-full bg-white border border-brand-primary/15 rounded px-2.5 py-1.5 text-brand-primary text-xs font-sans resize-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2 border-t border-brand-primary/5 pt-2.5">
                            <button
                              type="button"
                              onClick={() => setEditingChangelogIdx(null)}
                              className="bg-white hover:bg-brand-primary/5 border border-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-md font-semibold cursor-pointer text-[11px]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const versionInput = document.getElementById(`edit-cl-version-${index}`) as HTMLInputElement;
                                const dateInput = document.getElementById(`edit-cl-date-${index}`) as HTMLInputElement;
                                const titleInput = document.getElementById(`edit-cl-title-${index}`) as HTMLInputElement;
                                const changesInput = document.getElementById(`edit-cl-changes-${index}`) as HTMLTextAreaElement;

                                if (versionInput && dateInput && titleInput && changesInput) {
                                  const lines = changesInput.value
                                    .split("\n")
                                    .map(line => line.trim())
                                    .filter(line => line.length > 0);

                                  if (lines.length === 0) {
                                    alert("Please specify at least one change detail item.");
                                    return;
                                  }

                                  handleSaveEditChangelog(index, {
                                    version: versionInput.value.trim(),
                                    date: dateInput.value.trim(),
                                    title: titleInput.value.trim(),
                                    changes: lines
                                  });
                                }
                              }}
                              className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-3.5 py-1.5 rounded-md font-semibold cursor-pointer text-[11px] flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save Log</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Loading Screen Tips Editor */}
          {activeTab === "tips" && (
            <div className="bg-white border border-brand-primary/10 rounded-2xl p-5 space-y-4 shadow-sm animate-fade-in" id="tips-tab">
              <div className="border-b border-brand-primary/10 pb-3">
                <h3 className="font-serif font-semibold text-base text-brand-primary flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-brand-primary" />
                  <span>Platform Loading tips</span>
                </h3>
                <p className="text-xs text-brand-muted">
                  These helpful, education-centric or fun tips display dynamically during system transitions and artwork queries.
                </p>
              </div>

              {/* Tip Insertion Block */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a new load tip or educational guideline (e.g., direct payouts, 0% fees, etc.)"
                  value={newTipText}
                  onChange={(e) => setNewTipText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTip(); }}
                  className="flex-1 bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddTip}
                  disabled={!newTipText.trim()}
                  className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg disabled:opacity-40 disabled:cursor-not-allowed font-semibold px-4 py-2 rounded-lg text-xs cursor-pointer flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tip</span>
                </button>
              </div>

              {/* Tips list */}
              {loadingTips.length === 0 ? (
                <div className="text-center py-8 italic text-xs text-brand-muted bg-brand-panel/30 border border-brand-primary/10 rounded-xl">
                  No tips defined. Add some load tips above to enhance the user waiting experience.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {loadingTips.map((tip, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 bg-brand-panel/10 border border-brand-primary/5 rounded-lg p-3 text-xs font-sans hover:border-brand-primary/10 transition">
                      
                      {editingTipIdx !== index ? (
                        <>
                          <div className="flex items-start gap-2 text-brand-primary">
                            <span className="font-mono text-[10px] text-brand-muted select-none">#{index + 1}</span>
                            <span className="leading-normal">{tip}</span>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditTip(index)}
                              className="text-brand-primary hover:text-brand-primary-light hover:bg-brand-primary/5 p-1 rounded transition cursor-pointer"
                              title="Edit tip"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTip(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition cursor-pointer"
                              title="Delete tip"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editingTipText}
                            onChange={(e) => setEditingTipText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditTip(index); }}
                            className="flex-1 bg-white border border-brand-primary/15 rounded px-2 py-1 text-xs text-brand-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditTip(index)}
                            className="bg-brand-primary text-brand-bg px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer transition"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTipIdx(null)}
                            className="bg-brand-panel border border-brand-primary/10 text-brand-primary px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: Inline Artist Bio / Profile Editor Dialog */}
      {editingProfile && (
        <div className="fixed inset-0 bg-brand-primary/40 backdrop-blur-xs flex items-center justify-center z-[150] p-4 animate-fade-in">
          <div className="bg-white border border-brand-primary/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-brand-primary/10 pb-2">
              <h3 className="font-serif font-semibold text-base text-brand-primary flex items-center gap-2">
                <User className="w-5 h-5 text-brand-primary" />
                <span>Edit Profile: {editingProfile.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="text-brand-primary hover:bg-brand-primary/5 p-1 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                  Full Name / Pseudonym *
                </label>
                <input
                  type="text"
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary font-serif text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                  Artist Biography
                </label>
                <textarea
                  rows={3}
                  value={editingProfile.bio}
                  onChange={(e) => setEditingProfile({ ...editingProfile, bio: e.target.value })}
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                    Platform Role
                  </label>
                  <select
                    value={editingProfile.role || "artist"}
                    onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value as "artist" | "admin" })}
                    className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-2 text-brand-primary text-xs cursor-pointer font-sans"
                  >
                    <option value="artist">Artist (Standard Creator)</option>
                    <option value="admin">Admin (System Manager)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                    Payout Type
                  </label>
                  <select
                    value={editingProfile.monetaryMethod}
                    onChange={(e) => setEditingProfile({ ...editingProfile, monetaryMethod: e.target.value })}
                    className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-2 text-brand-primary text-xs cursor-pointer font-sans"
                  >
                    <option value="Monero">Monero</option>
                    <option value="Stripe">Stripe</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                  Payout Address / URL
                </label>
                <input
                  type="text"
                  value={editingProfile.monetaryAddress}
                  onChange={(e) => setEditingProfile({ ...editingProfile, monetaryAddress: e.target.value })}
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary font-mono text-[10px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-brand-primary/10">
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="bg-brand-panel hover:bg-brand-primary/5 text-brand-primary border border-brand-primary/15 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateProfile(editingProfile);
                  setEditingProfile(null);
                }}
                className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-5 py-2 rounded-full text-xs font-semibold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Profile Modal */}
      {showCreateProfileModal && (
        <div className="fixed inset-0 bg-brand-primary/40 backdrop-blur-xs flex items-center justify-center z-[150] p-4 animate-fade-in">
          <form onSubmit={handleCreateProfile} className="bg-white border border-brand-primary/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-brand-primary/10 pb-2">
              <h3 className="font-serif font-semibold text-base text-brand-primary flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-brand-primary" />
                <span>Create User Profile Manually</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateProfileModal(false)}
                className="text-brand-primary hover:bg-brand-primary/5 p-1 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                    SSO Email / Unique ID *
                  </label>
                  <input
                    type="email"
                    placeholder="jane.doe@example.com"
                    value={newProfileEmail}
                    onChange={(e) => setNewProfileEmail(e.target.value)}
                    className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                  Platform Role
                </label>
                <select
                  value={newProfileRole}
                  onChange={(e) => setNewProfileRole(e.target.value as any)}
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-2 text-brand-primary text-xs cursor-pointer"
                >
                  <option value="artist">Artist (Standard Creator)</option>
                  <option value="admin">Admin (System Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                  Artist Biography
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter a brief bio detailing art focus, inspirations, and mediums used."
                  value={newProfileBio}
                  onChange={(e) => setNewProfileBio(e.target.value)}
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                    Payout Type
                  </label>
                  <select
                    value={newProfilePayoutMethod}
                    onChange={(e) => setNewProfilePayoutMethod(e.target.value)}
                    className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3 py-2 text-brand-primary text-xs cursor-pointer"
                  >
                    <option value="Monero">Monero</option>
                    <option value="Stripe">Stripe</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                    Payout Address / URL
                  </label>
                  <input
                    type="text"
                    placeholder="Enter wallet address or Stripe payment link"
                    value={newProfilePayoutAddress}
                    onChange={(e) => setNewProfilePayoutAddress(e.target.value)}
                    className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary font-mono text-[10px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-brand-primary/10">
              <button
                type="button"
                onClick={() => setShowCreateProfileModal(false)}
                className="bg-brand-panel hover:bg-brand-primary/5 text-brand-primary border border-brand-primary/15 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-5 py-2 rounded-full text-xs font-semibold cursor-pointer"
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Add Changelog Version Log Modal */}
      {showNewChangelogModal && (
        <div className="fixed inset-0 bg-brand-primary/40 backdrop-blur-xs flex items-center justify-center z-[150] p-4 animate-fade-in">
          <div className="bg-white border border-brand-primary/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-brand-primary/10 pb-2">
              <h3 className="font-serif font-semibold text-base text-brand-primary flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-primary" />
                <span>Create Changelog Version Log</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewChangelogModal(false)}
                className="text-brand-primary hover:bg-brand-primary/5 p-1 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                    Version Code *
                  </label>
                  <input
                    type="text"
                    value={newChangelogVersion}
                    onChange={(e) => setNewChangelogVersion(e.target.value)}
                    placeholder="v1.3.0"
                    className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="text"
                    value={newChangelogDate}
                    onChange={(e) => setNewChangelogDate(e.target.value)}
                    placeholder="July 2026"
                    className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                  Release Title *
                </label>
                <input
                  type="text"
                  value={newChangelogTitle}
                  onChange={(e) => setNewChangelogTitle(e.target.value)}
                  placeholder="E.g. Canvas protection & direct payouts"
                  className="w-full bg-white border border-brand-primary/15 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 focus:outline-none rounded-lg px-3.5 py-2 text-brand-primary text-xs font-serif"
                  required
                />
              </div>

              {/* Dynamic list items creator */}
              <div className="space-y-2 bg-brand-panel/10 p-3 rounded-lg border border-brand-primary/5">
                <span className="block text-[9px] font-mono font-bold text-brand-muted uppercase">
                  Log entries list ({newChangelogItems.length} items added)
                </span>

                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Type an entry bullet (e.g. Added watermarks)"
                    value={newChangelogItemText}
                    onChange={(e) => setNewChangelogItemText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddChangelogItem(); }}
                    className="flex-1 bg-white border border-brand-primary/15 focus:border-brand-primary focus:outline-none rounded px-2.5 py-1.5 text-xs text-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddChangelogItem}
                    disabled={!newChangelogItemText.trim()}
                    className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg disabled:opacity-40 px-2 rounded font-semibold text-xs cursor-pointer flex items-center justify-center transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {newChangelogItems.length > 0 && (
                  <ul className="space-y-1 mt-1.5 text-[10px] text-brand-muted font-sans bg-white border border-brand-primary/5 p-2 rounded max-h-24 overflow-y-auto">
                    {newChangelogItems.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 border-b border-brand-primary/5 py-1 last:border-b-0">
                        <span className="truncate flex-1">• {item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChangelogItem(idx)}
                          className="text-red-500 hover:text-red-600 p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-brand-primary/10">
              <button
                type="button"
                onClick={() => {
                  setNewChangelogItems([]);
                  setShowNewChangelogModal(false);
                }}
                className="bg-brand-panel hover:bg-brand-primary/5 text-brand-primary border border-brand-primary/15 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateChangelog}
                className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-5 py-2 rounded-full text-xs font-semibold cursor-pointer"
              >
                Publish Changelog
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
