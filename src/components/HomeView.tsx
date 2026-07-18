/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Artwork, ArtistProfile } from "../types";
import { Sparkles, User as UserIcon } from "lucide-react";
import ArtCard from "./ArtCard";

interface HomeViewProps {
  artworks: Artwork[];
  profiles: ArtistProfile[];
  popularTags: string[];
  handleSearch: (tag: string) => void;
  onViewArtist: (artistId: string) => void;
  onOpenAuthModal: () => void;
}

export default function HomeView({
  artworks,
  profiles,
  popularTags,
  handleSearch,
  onViewArtist,
  onOpenAuthModal
}: HomeViewProps) {
  return (
    <div className="space-y-10 animate-fade-in" id="home-view">
      {/* Welcoming Blurb Banner */}
      <div className="bg-brand-panel text-brand-primary rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-brand-primary/10 shadow-xs">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#2d4a22 0.5px, transparent 0.5px)", backgroundSize: "10px 10px" }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
        
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary font-sans text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">
            <span>Community Art Gallery</span>
          </span>
          
          <h1 className="font-serif font-medium text-3xl sm:text-4xl tracking-tight leading-tight">
            Welcome to <span className="italic font-light">Art For All</span>
          </h1>
          
          <p className="text-sm text-brand-muted leading-relaxed font-sans">
            Browse curated illustrations, landscape designs, and paintings created by our community of artists. Support independent artists with direct payouts on every purchase.
          </p>

          {/* Popular Tags shortcuts */}
          {popularTags.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted/80 mr-1">
                Search by Popular Tags:
              </span>
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleSearch(tag)}
                  className="bg-white hover:bg-brand-primary hover:text-brand-bg border border-brand-primary/15 text-[11px] text-brand-primary px-3 py-1 rounded-full transition focus:outline-none shadow-xs cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* General List View of Artworks */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-brand-primary/10 pb-3">
          <h2 className="font-serif font-medium text-2xl text-brand-primary flex items-center gap-1.5">
            <span>Explore Artworks</span>
            <span className="text-xs font-mono font-normal text-brand-muted/70 bg-brand-panel border border-brand-primary/5 px-2.5 py-0.5 rounded-full">
              {artworks.length} artworks
            </span>
          </h2>
        </div>

        {artworks.length === 0 ? (
          <div className="text-center py-20 bg-white border border-brand-primary/10 rounded-3xl space-y-4 shadow-sm animate-fade-in" id="gallery-empty-state">
            <div className="bg-brand-panel p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto border border-brand-primary/10 text-brand-primary">
              <Sparkles className="w-6 h-6 text-brand-primary" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-serif font-bold text-lg text-brand-primary">No Artworks Published Yet</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Independent art is on the way. Sign in as an artist to publish your first piece!
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenAuthModal}
                  className="bg-brand-primary hover:bg-brand-primary/95 text-brand-bg px-4 py-2 rounded-full text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {artworks.map((art) => (
              <ArtCard 
                key={art.id} 
                artwork={art} 
                artistProfile={profiles.find(p => p.id === art.artistId)}
                onViewArtist={onViewArtist} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
