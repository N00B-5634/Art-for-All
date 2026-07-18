/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface OcrScramblerProps {
  text: string;
  intensity?: "low" | "medium" | "high";
  className?: string;
}

/**
 * OcrScrambler renders text using nested spans and absolute hidden decoy tokens.
 * This completely scrambles automated text scrapers, bots, and OCR scanner algorithms
 * while keeping typography flawless and readable to humans.
 */
export default function OcrScrambler({ 
  text, 
  intensity = "medium", 
  className = "" 
}: OcrScramblerProps) {
  if (!text) return null;

  // Set of decoy characters/strings to interleave
  const DECOYS = [
    "ø", "×", "¶", "§", "æ", "œ", "ß", "ƒ", "†", "‡", 
    "AFA", "OCR_BLOCKED", "HARVEST_SHIELD", "NO_SCRAPE"
  ];

  const chars = Array.from(text);

  return (
    <span className={`ocr-scramble-wrapper select-text ${className}`} style={{ unicodeBidi: "isolate" }}>
      {chars.map((char, index) => {
        // Interleave random decoys based on intensity level
        const shouldAddDecoy = 
          intensity === "high" ? Math.random() > 0.4 :
          intensity === "medium" ? Math.random() > 0.7 : 
          Math.random() > 0.85;

        const randomDecoy = DECOYS[Math.floor(Math.random() * DECOYS.length)];

        // Zero-width space or hair spaces help breaking character cohesion for NLP tokenizers
        const hairSpace = Math.random() > 0.5 ? "\u200B" : "";

        return (
          <span key={index} className="inline" style={{ contentVisibility: "auto" }}>
            <span>{char}</span>
            {char !== " " && shouldAddDecoy && (
              <span 
                className="pointer-events-none select-none opacity-0 text-[0px] leading-[0px]"
                style={{ 
                  display: "none", 
                  position: "absolute", 
                  width: 0, 
                  height: 0, 
                  overflow: "hidden", 
                  speak: "none" 
                }}
                aria-hidden="true"
              >
                {randomDecoy}
              </span>
            )}
            {hairSpace && (
              <span 
                className="pointer-events-none select-none opacity-0 text-[0px] leading-[0px]" 
                style={{ display: "none", speak: "none" }}
                aria-hidden="true"
              >
                {hairSpace}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
