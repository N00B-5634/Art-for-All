/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { Artwork, ArtistProfile, PlatformConfig } from "./src/types";
import { DEFAULT_CONFIG } from "./src/data";

import fs from "fs";

dotenv.config();

const DB_PATH = path.join(process.cwd(), "database.json");

// Static starter data used for initial seeding - empty for production
const defaultArtworks: Artwork[] = [];

const defaultProfiles: ArtistProfile[] = [];

const defaultPlatformConfig: PlatformConfig = {
  keycloakAuthUrl: process.env.KEYCLOAK_AUTH_URL || DEFAULT_CONFIG.keycloakAuthUrl,
  keycloakRealm: process.env.KEYCLOAK_REALM || DEFAULT_CONFIG.keycloakRealm,
  keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || DEFAULT_CONFIG.keycloakClientId,
  hostUrl: process.env.HOST_URL || DEFAULT_CONFIG.hostUrl,
  onionAddress: process.env.ONION_ADDRESS || DEFAULT_CONFIG.onionAddress,
  allowPublicIndexing: DEFAULT_CONFIG.allowPublicIndexing,
  maxUploadSizeBytes: DEFAULT_CONFIG.maxUploadSizeBytes,
  antiOcrScramblingIntensity: DEFAULT_CONFIG.antiOcrScramblingIntensity
};

let serverArtworks: Artwork[] = [];
let serverProfiles: ArtistProfile[] = [];
let serverConfig: PlatformConfig = defaultPlatformConfig;
let maxStorageLimitBytes = 55 * 1024; // 55 KB storage capacity limit to test Read-Only mode

function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(data);
      serverArtworks = parsed.artworks || defaultArtworks;
      serverProfiles = parsed.profiles || defaultProfiles;
      serverConfig = parsed.config || defaultPlatformConfig;
      maxStorageLimitBytes = parsed.maxStorageLimitBytes || (55 * 1024);
      console.log(`[AFA DB] Loaded persistent database successfully (${fs.statSync(DB_PATH).size} bytes).`);
      return;
    }
  } catch (e) {
    console.error("[AFA DB] Error reading database.json, seeding defaults:", e);
  }
  
  // Seed initial defaults
  serverArtworks = defaultArtworks;
  serverProfiles = defaultProfiles;
  serverConfig = defaultPlatformConfig;
  maxStorageLimitBytes = 55 * 1024;
  saveDbState();
}

function saveDbState() {
  try {
    const payload = {
      artworks: serverArtworks,
      profiles: serverProfiles,
      config: serverConfig,
      maxStorageLimitBytes
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(payload, null, 2), "utf-8");
  } catch (e) {
    console.error("[AFA DB] Error saving database file:", e);
  }
}

// Storage limits & polling calculator
function getDatabaseStats() {
  let size = 0;
  try {
    if (fs.existsSync(DB_PATH)) {
      size = fs.statSync(DB_PATH).size;
    } else {
      size = JSON.stringify({ artworks: serverArtworks, profiles: serverProfiles, config: serverConfig }).length;
    }
  } catch (e) {
    size = 12000;
  }
  const isReadOnly = size >= maxStorageLimitBytes;
  const percentageUsed = Math.min(100, Math.round((size / maxStorageLimitBytes) * 100));
  return {
    totalSizeBytes: size,
    maxStorageLimitBytes,
    isReadOnly,
    percentageUsed
  };
}

// Middleware to enforce read-only state if limits are reached
function requireWriteAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  const stats = getDatabaseStats();
  if (stats.isReadOnly && req.path !== "/api/config" && req.path !== "/api/db/upgrade" && req.path !== "/config-fallback") {
    return res.status(403).json({
      error: "DATABASE_READ_ONLY",
      message: `Critical Action Blocked: Database storage limit has been reached (${stats.totalSizeBytes} bytes used of ${stats.maxStorageLimitBytes} bytes limit). Please upgrade storage in the setup panel to write data.`
    });
  }
  next();
}

async function startServer() {
  loadDatabase();
  const app = express();
  const PORT = 3000;

  // Use body parsing middlewares
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // 1. Robots.txt Route (Protects artists from AI Crawling agents globally)
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /\n");
  });

  // 2. Clearweb API endpoints
  app.get("/api/artworks", (req, res) => {
    res.json(serverArtworks);
  });

  app.post("/api/artworks", requireWriteAccess, (req, res) => {
    const newArt = req.body;
    if (newArt && newArt.title) {
      const created: Artwork = {
        ...newArt,
        id: `art_${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0]
      };
      serverArtworks.unshift(created);
      saveDbState();
      res.status(201).json(created);
    } else {
      res.status(400).json({ error: "Missing required properties" });
    }
  });

  app.get("/api/profiles", (req, res) => {
    res.json(serverProfiles);
  });

  app.post("/api/profiles", requireWriteAccess, (req, res) => {
    const newProfile = req.body;
    if (newProfile && newProfile.name) {
      const created: ArtistProfile = {
        ...newProfile,
        id: newProfile.id || `artist_${Date.now()}`,
        joinedDate: newProfile.joinedDate || "July 2026",
        verified: newProfile.verified !== undefined ? newProfile.verified : true
      };
      // Check if profile already exists to prevent duplicates
      const existingIdx = serverProfiles.findIndex(p => p.id === created.id);
      if (existingIdx !== -1) {
        serverProfiles[existingIdx] = created;
      } else {
        serverProfiles.push(created);
      }
      saveDbState();
      res.status(201).json(created);
    } else {
      res.status(400).json({ error: "Missing name" });
    }
  });

  app.put("/api/profiles/:id", requireWriteAccess, (req, res) => {
    const { id } = req.params;
    const updated = req.body;
    const index = serverProfiles.findIndex(p => p.id === id);
    if (index !== -1) {
      serverProfiles[index] = { ...serverProfiles[index], ...updated };
      saveDbState();
      res.json(serverProfiles[index]);
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  });

  app.delete("/api/profiles/:id", requireWriteAccess, (req, res) => {
    const { id } = req.params;
    const index = serverProfiles.findIndex(p => p.id === id);
    if (index !== -1) {
      const deleted = serverProfiles.splice(index, 1)[0];
      // Also delete associated artworks from the serverArtworks array
      serverArtworks = serverArtworks.filter(art => art.artistId !== id);
      saveDbState();
      res.json({ success: true, deleted });
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  });

  app.post("/api/profiles/:id/verify", requireWriteAccess, (req, res) => {
    const { id } = req.params;
    const { verified } = req.body;
    const index = serverProfiles.findIndex(p => p.id === id);
    if (index !== -1) {
      serverProfiles[index].verified = !!verified;
      saveDbState();
      res.json(serverProfiles[index]);
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  });

  app.post("/api/profiles/:id/stripe-connect", requireWriteAccess, (req, res) => {
    const { id } = req.params;
    const index = serverProfiles.findIndex(p => p.id === id);
    if (index !== -1) {
      serverProfiles[index].stripeConnected = true;
      serverProfiles[index].stripeAccountId = `acct_con_${Math.random().toString(36).substring(2, 11)}`;
      serverProfiles[index].stripeOnboardingComplete = true;
      serverProfiles[index].monetaryMethod = "Stripe";
      serverProfiles[index].monetaryAddress = serverProfiles[index].stripeAccountId;
      saveDbState();
      res.json(serverProfiles[index]);
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  });

  app.get("/api/db-stats", (req, res) => {
    res.json(getDatabaseStats());
  });

  app.post("/api/db-stats/upgrade", (req, res) => {
    maxStorageLimitBytes += 100 * 1024; // Upgrade limit by 100 KB
    saveDbState();
    res.json({
      success: true,
      stats: getDatabaseStats()
    });
  });

  // Platform-Agnostic Migration Export: Download entire database state as JSON
  app.get("/api/db-admin/export", (req, res) => {
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      artworks: serverArtworks,
      profiles: serverProfiles,
      config: serverConfig,
      maxStorageLimitBytes
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=artforall_migration_db.json");
    res.send(JSON.stringify(backupData, null, 2));
  });

  // Platform-Agnostic Migration Import: Restore entire database state from uploaded JSON
  app.post("/api/db-admin/import", express.json({ limit: "5mb" }), (req, res) => {
    try {
      const backup = req.body;
      if (!backup || !Array.isArray(backup.artworks) || !Array.isArray(backup.profiles) || !backup.config) {
        return res.status(400).json({ error: "Invalid backup schema definition" });
      }

      serverArtworks = backup.artworks;
      serverProfiles = backup.profiles;
      serverConfig = backup.config;
      if (typeof backup.maxStorageLimitBytes === "number") {
        maxStorageLimitBytes = backup.maxStorageLimitBytes;
      }

      saveDbState();
      res.json({
        success: true,
        message: "Database successfully migrated and restored!",
        stats: getDatabaseStats()
      });
    } catch (err: any) {
      res.status(500).json({ error: `Migration restoration failed: ${err.message}` });
    }
  });

  app.get("/api/config", (req, res) => {
    res.json(serverConfig);
  });

  app.post("/api/config", requireWriteAccess, (req, res) => {
    serverConfig = { ...serverConfig, ...req.body };
    saveDbState();
    res.json(serverConfig);
  });

  // 2.5 Stripe Payment Session Creation Route (Lazy loads Stripe SDK)
  app.post("/api/payments/stripe/create-checkout", async (req, res) => {
    try {
      const { artworkId, title, price, artistName, stripeSecretKey } = req.body;
      const stripeSecret = stripeSecretKey || process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(400).json({ error: "Stripe payment service is currently not configured by the administrator." });
      }
      
      const StripeSDK = (await import("stripe")).default;
      const stripeInstance = new StripeSDK(stripeSecret, { apiVersion: "2023-10-16" as any });
      
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Artwork Purchase: ${title}`,
                description: `Direct payment to Artist: ${artistName}`,
              },
              unit_amount: Math.round(parseFloat(price) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin || "http://localhost:3000"}/?payment=success&artworkId=${artworkId}`,
        cancel_url: `${req.headers.origin || "http://localhost:3000"}/?payment=cancel`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe Service Error]:", err.message);
      res.status(500).json({ error: err.message || "Failed to create checkout session" });
    }
  });

  // 3. Fallback Forms for No-JS and Tor Users
  app.get("/search-fallback", (req, res) => {
    const query = (req.query.q || "").toString().trim().toLowerCase();
    const matches = query
      ? serverArtworks.filter(art => 
          art.tags.some(tag => tag.toLowerCase().includes(query)) ||
          art.title.toLowerCase().includes(query) ||
          art.artistName.toLowerCase().includes(query)
        )
      : serverArtworks;

    res.send(renderNoJsHtml("search", matches, query));
  });

  app.post("/upload-fallback", (req, res) => {
    const { title, description, tags, artistId, price, monetaryAddress } = req.body;
    const artist = serverProfiles.find(p => p.id === artistId);
    if (title && description && artistId) {
      const tagsList = tags
        ? tags.split(",").map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 0)
        : ["cozy"];

      const created: Artwork = {
        id: `art_${Date.now()}`,
        title,
        description,
        artistId,
        artistName: artist ? artist.name : "AFA Artist",
        tags: tagsList,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}/800/600`,
        price: parseFloat(price) || 25.0,
        monetaryAddress: monetaryAddress || "XMR_DIRECT",
        createdAt: new Date().toISOString().split("T")[0]
      };
      serverArtworks.unshift(created);
    }
    res.redirect("/?tab=home&msg=uploaded");
  });

  app.post("/config-fallback", (req, res) => {
    const { keycloakAuthUrl, keycloakRealm, keycloakClientId, hostUrl, onionAddress } = req.body;
    if (keycloakAuthUrl && keycloakRealm) {
      serverConfig = {
        ...serverConfig,
        keycloakAuthUrl,
        keycloakRealm,
        keycloakClientId,
        hostUrl,
        onionAddress
      };
    }
    res.redirect("/?tab=config&msg=saved");
  });

  app.post("/profile-fallback", (req, res) => {
    const { name, bio, monetaryMethod, monetaryAddress } = req.body;
    if (name && bio) {
      const created: ArtistProfile = {
        id: `artist_${Date.now()}`,
        name,
        bio,
        joinedDate: "July 2026",
        monetaryMethod: monetaryMethod || "Monero",
        monetaryAddress: monetaryAddress || "DIRECT",
        verified: true
      };
      serverProfiles.push(created);
    }
    res.redirect("/?tab=profile&msg=created");
  });

  // 4. Intercept direct home-view requests for Javascript-free browser clients
  app.get("/", (req, res, next) => {
    // If the request contains explicit nojs query parameters or is typical No-JS navigation
    const queryTab = (req.query.tab || "home").toString();
    const artistId = (req.query.artistId || "artist_1").toString();
    const hasNoJs = req.query.nojs === "true" || req.query.tab !== undefined || req.headers["user-agent"]?.includes("Wget") || req.headers["user-agent"]?.includes("curl");

    if (hasNoJs) {
      res.send(renderNoJsHtml(queryTab, serverArtworks, "", artistId));
    } else {
      next(); // Pass to SPA static serving
    }
  });

  // Serve custom assets (like logo.png) directly from root workspace folder
  app.use("/assets", express.static(path.join(process.cwd(), "assets")));

  // 5. Setup Vite dev mode OR static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AFA] Server online on http://localhost:${PORT}`);
  });
}

// Full SSR No-JS fallback generator (Guarantees elegant identical style for Tor and script-blocked users)
function renderNoJsHtml(tab: string, artworksList: Artwork[], searchQuery = "", activeArtistId = "artist_1"): string {
  const activeProfile = serverProfiles.find(p => p.id === activeArtistId) || serverProfiles[0];
  const activeArtworks = artworksList.filter(art => art.artistId === activeProfile.id);

  // Generate PHP block string dynamically
  const phpBlock = `<?php
define('AFA_KEYCLOAK_URL', 'https://${serverConfig.keycloakAuthUrl}');
define('AFA_KEYCLOAK_REALM', '${serverConfig.keycloakRealm}');
define('AFA_KEYCLOAK_CLIENT_ID', '${serverConfig.keycloakClientId}');
?>`;

  let tabContent = "";

  if (tab === "home" || tab === "search") {
    tabContent = `
      <div class="welcome-banner">
        <span class="badge">🛡️ SECURE CREATOR PLATFORM</span>
        <h1>Welcome to <span style="color: #fef08a;">Art For All</span>, a cozy digital sanctuary.</h1>
        <p>This is a high-fidelity gallery designed with a warm forest-green identity. We secure artwork on the server and render using canvas matrices, completely disabling crawler scraping and uncompensated downloading.</p>
        
        <form method="GET" action="/search-fallback" style="margin-top: 15px; display: flex; gap: 8px;">
          <input type="hidden" name="nojs" value="true" />
          <input type="text" name="q" value="${searchQuery}" placeholder="Search artworks by tag (e.g. cozy, landscape)..." style="flex: 1; padding: 10px; border: 1px solid #065f46; background: #064e3b; border-radius: 8px; color: #fff;" />
          <button type="submit" style="background: #fef08a; color: #022c22; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Search</button>
        </form>
      </div>

      <div style="margin-top: 30px;">
        <h2 style="font-family: serif; color: #064e3b; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">
          ${searchQuery ? `Search Results for "${searchQuery}"` : "Cozy Secured Gallery"}
        </h2>
        
        <div class="art-list">
          ${artworksList.map(art => `
            <div class="art-card">
              <div class="art-image-wrapper">
                <img src="${art.imageUrl}" alt="${art.title}" oncontextmenu="return false;" ondragstart="return false;" />
                <div class="canvas-badge">🛡️ Server Secured Canvas (No JS Native Fallback)</div>
              </div>
              <div class="art-info">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <h3>${art.title}</h3>
                  <span class="price-tag">$${art.price.toFixed(2)}</span>
                </div>
                <p style="font-style: italic; font-size: 13px; color: #065f46; margin: 4px 0 12px 0;">by ${art.artistName}</p>
                <p class="description">${art.description}</p>
                <div style="margin-top: 10px;">
                  ${art.tags.map(t => `<span class="tag">#${t}</span>`).join(" ")}
                </div>
                
                <div style="margin-top: 20px; padding: 12px; background: #fef3c7; border-radius: 8px; border: 1px solid #f59e0b; font-size: 12px;">
                  <strong style="color: #78350f;">Direct Payout Details:</strong> Send funds to the artist's certified address: 
                  <code style="display: block; background: #fff; padding: 6px; border-radius: 4px; margin-top: 5px; font-family: monospace; word-break: break-all;">${art.monetaryAddress}</code>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } else if (tab === "upload") {
    tabContent = `
      <div class="form-container">
        <h2>Publish New Artwork</h2>
        <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Add your artwork securely. High-resolution downloads are blocked until payment receipt confirmation.</p>
        
        <form method="POST" action="/upload-fallback" style="display: flex; flex-col; gap: 15px;">
          <div>
            <label>Artwork Title *</label>
            <input type="text" name="title" required placeholder="e.g. Woodland River" />
          </div>
          <div>
            <label>Creative Story / Description *</label>
            <textarea name="description" required placeholder="Describe your creation..."></textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>Artist Profile *</label>
              <select name="artistId" required>
                ${serverProfiles.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}
              </select>
            </div>
            <div>
              <label>Commission Price (USD) *</label>
              <input type="number" name="price" step="0.01" value="25.00" required />
            </div>
          </div>
          <div>
            <label>Tags (Comma separated) *</label>
            <input type="text" name="tags" placeholder="watercolor, cabin, cozy" />
          </div>
          <div>
            <label>Certified Payout Wallet Address *</label>
            <input type="text" name="monetaryAddress" required placeholder="e.g. Monero key, PayPal handle" />
          </div>
          
          <button type="submit" class="submit-btn">Publish Secure Canvas Entry</button>
        </form>
      </div>
    `;
  } else if (tab === "profile") {
    tabContent = `
      <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
        ${serverProfiles.map(p => `
          <a href="/?nojs=true&tab=profile&artistId=${p.id}" class="tab-link ${p.id === activeArtistId ? "active" : ""}">
            ${p.name} ${p.verified ? "✓" : ""}
          </a>
        `).join("")}
      </div>

      <div class="artist-bio-card">
        <h2>${activeProfile.name} ${activeProfile.verified ? "✓" : ""}</h2>
        <p style="font-family: serif; font-style: italic; font-size: 16px; margin: 10px 0;">"${activeProfile.bio}"</p>
        <p style="font-size: 12px; color: #666;">Joined: ${activeProfile.joinedDate} • Payout Method: <strong>${activeProfile.monetaryMethod}</strong></p>
        
        <div style="margin-top: 15px; padding: 12px; background: #ecfdf5; border: 1px solid #059669; border-radius: 8px;">
          <span style="font-size: 11px; font-weight: bold; color: #047857; display: block; margin-bottom: 4px;">CERTIFIED DESTINATION</span>
          <code style="font-family: monospace; font-size: 12px;">${activeProfile.monetaryAddress}</code>
        </div>
      </div>

      <div style="margin-top: 30px;">
        <h3 style="font-family: serif; color: #064e3b; margin-bottom: 15px;">${activeProfile.name}'s Pieces</h3>
        <div class="art-list">
          ${activeArtworks.map(art => `
            <div class="art-card">
              <div class="art-image-wrapper">
                <img src="${art.imageUrl}" alt="${art.title}" oncontextmenu="return false;" ondragstart="return false;" />
              </div>
              <div class="art-info">
                <h3>${art.title}</h3>
                <p class="description">${art.description}</p>
                <span class="price-tag">$${art.price.toFixed(2)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } else if (tab === "config") {
    tabContent = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="form-container">
          <h2>Keycloak System Setup</h2>
          <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Configure variables for federated artist authenticator ${serverConfig.keycloakAuthUrl}.</p>
          
          <form method="POST" action="/config-fallback">
            <div>
              <label>Keycloak URL *</label>
              <input type="text" name="keycloakAuthUrl" value="${serverConfig.keycloakAuthUrl}" required />
            </div>
            <div>
              <label>Keycloak Realm *</label>
              <input type="text" name="keycloakRealm" value="${serverConfig.keycloakRealm}" required />
            </div>
            <div>
              <label>Keycloak Client ID *</label>
              <input type="text" name="keycloakClientId" value="${serverConfig.keycloakClientId}" required />
            </div>
            <div>
              <label>Clearweb Host Domain *</label>
              <input type="text" name="hostUrl" value="${serverConfig.hostUrl}" required />
            </div>
            <div>
              <label>Tor onion Address *</label>
              <input type="text" name="onionAddress" value="${serverConfig.onionAddress}" required />
            </div>
            
            <button type="submit" class="submit-btn">Apply Settings</button>
          </form>
        </div>

        <div style="background: #1e1b4b; color: #e0e7ff; padding: 20px; border-radius: 12px; font-family: monospace; font-size: 11px;">
          <h3 style="margin-bottom: 10px; border-bottom: 1px solid #312e81; padding-bottom: 5px; color: #fef08a;">Generated config.php</h3>
          <pre style="white-space: pre-wrap; word-break: break-all;">${phpBlock}</pre>
        </div>
      </div>
    `;
  } else if (tab === "changelog") {
    tabContent = `
      <div class="form-container" style="max-width: 100%;">
        <h2 style="font-family: serif; color: #064e3b; margin-bottom: 10px;">Development History Log</h2>
        <p style="font-size: 12px; color: #555; margin-bottom: 25px;">Track development commits and secure Tor features deployed.</p>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <div style="padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
            <strong style="color: #065f46;">v1.2.0-TorReady (July 2026)</strong>
            <ul style="margin-top: 8px; font-size: 12px; line-height: 1.6;">
              <li>Added secure client-side Canvas Scrambler to block screenshot detection.</li>
              <li>Blocked crawling agents (GPTBot, Google-Extended) inside robots.txt.</li>
              <li>Implemented Javascript-free fallback SSR server template (Active).</li>
            </ul>
          </div>
          <div style="padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
            <strong style="color: #065f46;">v1.1.0 (June 2026)</strong>
            <p style="font-size: 12px; margin-top: 4px;">Connected single sign-on mapping for Keycloak ${serverConfig.keycloakAuthUrl} parameters.</p>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Art For All - Secure Canvas Gallery</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #fafaf9;
            color: #1c1917;
            margin: 0;
            padding: 0;
          }
          header {
            background-color: #022c22;
            color: #f5f5f4;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #064e3b;
          }
          header a {
            color: #f5f5f4;
            text-decoration: none;
            font-weight: bold;
            font-size: 18px;
            font-family: serif;
          }
          nav {
            display: flex;
            gap: 15px;
          }
          nav a {
            color: #cbd5e1;
            text-decoration: none;
            font-size: 13px;
            padding: 6px 12px;
            border-radius: 6px;
            transition: all 0.2s;
          }
          nav a:hover, nav a.active {
            color: #fff;
            background-color: #064e3b;
          }
          .container {
            max-width: 1100px;
            margin: 30px auto;
            padding: 0 20px;
          }
          .nojs-banner {
            background-color: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 10px;
            color: #065f46;
            padding: 12px 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .welcome-banner {
            background-color: #064e3b;
            color: #fff;
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 30px;
          }
          .welcome-banner h1 {
            margin: 5px 0 15px 0;
            font-family: serif;
          }
          .welcome-banner p {
            font-size: 14px;
            line-height: 1.6;
            color: #d1fae5;
            margin: 0;
          }
          .badge {
            background-color: #022c22;
            color: #34d399;
            font-family: monospace;
            font-size: 10px;
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: bold;
          }
          .art-list {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }
          .art-card {
            background: #fff;
            border: 1px solid #e7e5e4;
            border-radius: 16px;
            padding: 20px;
            display: flex;
            gap: 20px;
          }
          .art-image-wrapper {
            flex: 1;
            max-width: 400px;
            background: #111;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
          }
          .art-image-wrapper img {
            width: 100%;
            height: auto;
            display: block;
            pointer-events: none;
          }
          .canvas-badge {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(2, 44, 34, 0.9);
            color: #34d399;
            font-size: 9px;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
          }
          .art-info {
            flex: 1.2;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .art-info h3 {
            margin: 0;
            font-family: serif;
            font-size: 22px;
          }
          .price-tag {
            background: #ecfdf5;
            color: #065f46;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-family: monospace;
            font-weight: bold;
          }
          .description {
            font-size: 14px;
            color: #444;
            line-height: 1.5;
          }
          .tag {
            background: #f5f5f4;
            border: 1px solid #e7e5e4;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            color: #666;
          }
          .form-container {
            background: #fff;
            border: 1px solid #e7e5e4;
            border-radius: 16px;
            padding: 25px;
            max-width: 600px;
            margin: 0 auto;
          }
          .form-container h2 {
            font-family: serif;
            color: #064e3b;
            margin-top: 0;
          }
          .form-container label {
            display: block;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #064e3b;
            margin-bottom: 5px;
            margin-top: 15px;
          }
          .form-container input, .form-container textarea, .form-container select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 13px;
          }
          .form-container textarea {
            height: 100px;
            resize: none;
          }
          .submit-btn {
            background-color: #064e3b;
            color: #fff;
            border: none;
            padding: 12px;
            width: 100%;
            border-radius: 8px;
            font-weight: bold;
            font-family: serif;
            margin-top: 20px;
            cursor: pointer;
          }
          .submit-btn:hover {
            background-color: #022c22;
          }
          .artist-bio-card {
            background: #fff;
            border: 1px solid #e7e5e4;
            border-radius: 16px;
            padding: 25px;
          }
          .tab-link {
            text-decoration: none;
            padding: 8px 16px;
            background: #f5f5f4;
            color: #444;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            font-family: serif;
          }
          .tab-link.active {
            background: #064e3b;
            color: #fff;
          }
          footer {
            background: #022c22;
            color: #a7f3d0;
            padding: 30px;
            text-align: center;
            font-size: 11px;
            font-family: monospace;
            margin-top: 50px;
          }
          @media print {
            body { display: none !important; }
          }
        </style>
      </head>
      <body>
        <header>
          <a href="/?nojs=true">Art For All</a>
          <nav>
            <a href="/?nojs=true&tab=home" class="${tab === "home" || tab === "search" ? "active" : ""}">Gallery</a>
            <a href="/?nojs=true&tab=upload" class="${tab === "upload" ? "active" : ""}">Publish</a>
            <a href="/?nojs=true&tab=profile" class="${tab === "profile" ? "active" : ""}">Profiles</a>
            <a href="/?nojs=true&tab=config" class="${tab === "config" ? "active" : ""}">Setup</a>
            <a href="/?nojs=true&tab=changelog" class="${tab === "changelog" ? "active" : ""}">Changelogs</a>
          </nav>
        </header>

        <div class="container">
          <div class="nojs-banner">
            <span>🌱 AFA Dual-Engine active: Serving pure Javascript-free fallbacks for Tor & strict sandbox containers.</span>
            <span style="font-family: monospace; font-size: 10px; background: #047857; color: #fff; padding: 2px 6px; border-radius: 4px;">NO SCRIPT ACTIVE</span>
          </div>

          ${tabContent}
        </div>

        <footer>
          © 2026 Art For All • Enforced disallow in robots.txt • Keycloak federation SSO integrated
        </footer>
      </body>
    </html>
  `;
}

startServer();
