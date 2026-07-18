/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Artwork, ArtistProfile } from "../types";
import { Search } from "lucide-react";
import ArtCard from "./ArtCard";

interface SearchViewProps {
  filteredArtworks: Artwork[];
  profiles: ArtistProfile[];
  searchTag: string;
  handleSearch: (tag: string) => void;
  onViewArtist: (artistId: string) => void;
}

export default function SearchView({
  filteredArtworks,
  profiles,
  searchTag,
  handleSearch,
  onViewArtist
}: SearchViewProps) {
  return (
    <div className="space-y-6 animate-fade-in" id="search-view">
      <div className="border-b border-brand-primary/10 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-mono text-brand-muted uppercase tracking-widest block">Search Results</span>
          <h2 className="font-serif font-medium text-2xl text-brand-primary flex items-center gap-2">
            <Search className="w-5 h-5 text-brand-primary shrink-0" />
            <span>Artworks matching:</span>
            <span className="text-brand-primary bg-brand-primary/10 border border-brand-primary/15 text-xs font-mono px-3 py-0.5 rounded-full">
              "{searchTag}"
            </span>
          </h2>
        </div>

        <button
          onClick={() => handleSearch("")}
          className="text-xs text-brand-primary hover:text-brand-primary-light transition underline focus:outline-none cursor-pointer"
        >
          Clear Search
        </button>
      </div>

      {filteredArtworks.length === 0 ? (
        <div className="text-center py-12 bg-brand-panel border border-brand-primary/10 rounded-2xl">
          <p className="text-sm font-serif italic text-brand-muted mb-1">No matching artworks found.</p>
          <p className="text-xs text-brand-muted/70">Try searching with other tags or reset search to view the archive.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredArtworks.map((art) => (
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
  );
}
