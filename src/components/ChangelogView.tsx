/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChangelogEntry } from "../types";
import { BookOpen, GitBranch, Calendar, ShieldCheck } from "lucide-react";

interface ChangelogViewProps {
  entries: ChangelogEntry[];
}

export default function ChangelogView({ entries }: ChangelogViewProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6" id="changelog-view">
      
      {/* Header */}
      <div className="bg-white border border-brand-primary/10 rounded-2xl p-6 sm:p-8 text-center">
        <div className="bg-brand-panel p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-brand-primary/10">
          <BookOpen className="w-6 h-6 text-brand-primary" />
        </div>
        <h2 className="font-serif font-semibold text-2xl text-brand-primary">Updates</h2>
        <p className="text-xs text-brand-muted max-w-lg mx-auto mt-1">
          View the latest updates and platform improvements.
        </p>
      </div>

      {/* List */}
      <div className="space-y-6 relative before:absolute before:left-4 sm:before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-brand-primary/15">
        {entries.map((entry, index) => (
          <div key={entry.version} className="relative pl-10 sm:pl-14" id={`changelog-version-${entry.version}`}>
            {/* Dot */}
            <div className={`absolute left-2.5 sm:left-4.5 -translate-x-1/2 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
              index === 0 
                ? "bg-brand-primary border-brand-bg ring-4 ring-brand-primary/15" 
                : "bg-brand-panel border-brand-primary/35"
            }`} />

            <div className="bg-white border border-brand-primary/10 rounded-xl p-5 hover:border-brand-primary/20 transition shadow-sm">
              
              {/* Version & Date */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5 border-b border-brand-primary/10 pb-2">
                <div className="flex items-center gap-1.5 font-mono text-xs text-brand-primary font-bold">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>{entry.version}</span>
                  {index === 0 && (
                    <span className="bg-brand-primary/10 text-brand-primary text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-brand-primary/15">
                      Latest Release
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 font-sans text-[10px] text-brand-muted/70">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{entry.date}</span>
                </div>
              </div>

              {/* Title */}
              <h4 className="font-serif font-semibold text-brand-primary text-sm mb-3">
                {entry.title}
              </h4>

              {/* Change lists */}
              <ul className="space-y-2 text-xs text-brand-muted leading-relaxed font-sans">
                {entry.changes.map((change, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full shrink-0 mt-2" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
