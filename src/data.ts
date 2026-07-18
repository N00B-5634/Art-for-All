/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Artwork, ArtistProfile, ChangelogEntry, PlatformConfig } from "./types";

export const INITIAL_PROFILES: ArtistProfile[] = [];

export const INITIAL_ARTWORKS: Artwork[] = [];

export const DEFAULT_CONFIG: PlatformConfig = {
  keycloakAuthUrl: "sso.ftc25671.com",
  keycloakRealm: "afa",
  keycloakClientId: "afa",
  hostUrl: "https://ais-dev-sn6sxh4lnoykyp5ktlv5fy-835535307163.us-east1.run.app",
  onionAddress: "afaart4all4torv3kdy2zmlhwsjdfgpwbyf34scu5e7dskrnyy.onion",
  allowPublicIndexing: false,
  maxUploadSizeBytes: 5242880, // 5MB
  antiOcrScramblingIntensity: "medium"
};

export const PLATFORM_CHANGELOG: ChangelogEntry[] = [
  {
    version: "v1.2.0",
    date: "July 2026",
    title: "Canvas protection & direct payouts",
    changes: [
      "Added client-side canvas watermark protection layer to protect original images.",
      "Disabled standard right-click and image dragging inside the gallery to deter unapproved copying.",
      "Implemented standard server configuration proxies.",
      "Configured crawl directives to discourage automated AI scrapers from indexing artist creations.",
      "Redesigned the application interface to provide a clean and unified gallery feel.",
      "Added direct-to-artist payment options (Stripe, PayPal, and Monero) to skip platform fees."
    ]
  },
  {
    version: "v1.1.0",
    date: "June 2026",
    title: "Authentication updates",
    changes: [
      "Configured secure authorization and identity checks.",
      "Enabled custom profile verification checks."
    ]
  },
  {
    version: "v1.0.0",
    date: "May 2026",
    title: "Platform release",
    changes: [
      "Created digital canvas structures with zero fees taken from artistic sales.",
      "Designed basic UI with clean typography."
    ]
  }
];

export const FUN_LOADING_TIPS = [
  "Art For All charges 0% platform fees. 100% of payment funds go directly to the artist.",
  "To support artists, standard right-click and image dragging are disabled inside the gallery.",
  "A microscopic canvas layer protects artworks from automated indexers.",
  "The gallery uses secure connection configurations with zero third-party trackers or ads.",
  "Crawler directives prohibit automated AI scrapers from indexing artist creations.",
  "Art For All does not use feed algorithms. All searches are strictly tag-based lists, ensuring everyone gets equal exposure.",
  "Artwork image files are protected until purchased directly from the artist."
];
