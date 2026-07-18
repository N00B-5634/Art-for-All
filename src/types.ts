/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Artwork {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  description: string;
  tags: string[];
  imageUrl: string; // Dynamic URL or base64
  price: number; // Commission price in USD or cryptocurrency
  monetaryAddress: string; // Artist's payout address (Monero, Stripe, PayPal, etc.)
  createdAt: string;
}

export interface ArtistProfile {
  id: string;
  name: string;
  bio: string;
  joinedDate: string;
  monetaryMethod: string; // e.g. "Monero", "Stripe", "PayPal"
  monetaryAddress: string;
  verified: boolean;
  role?: "admin" | "artist";
  password?: string; // Established Keycloak password
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  paypalClientId?: string;
  stripeConnected?: boolean;
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
}

export interface DatabaseStats {
  totalSizeBytes: number;
  maxStorageLimitBytes: number;
  isReadOnly: boolean;
  percentageUsed: number;
}

export type UserSession = 
  | { type: "guest" }
  | { type: "artist"; artist: ArtistProfile }
  | { type: "admin"; artist: ArtistProfile };

export interface PlatformConfig {
  keycloakAuthUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  hostUrl: string;
  onionAddress: string;
  allowPublicIndexing: boolean;
  maxUploadSizeBytes: number;
  antiOcrScramblingIntensity: "low" | "medium" | "high";
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}
