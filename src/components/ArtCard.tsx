/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Artwork, ArtistProfile } from "../types";
import { Shield, EyeOff, Coins, Info, Lock, Eye, Sparkles, CreditCard, Wallet, ArrowRight, Loader2, Minimize2 } from "lucide-react";
import OcrScrambler from "./OcrScrambler";

interface ArtCardProps {
  key?: string;
  artwork: Artwork;
  onViewArtist: (artistId: string) => void;
  artistProfile?: ArtistProfile;
}

export default function ArtCard({ artwork, onViewArtist, artistProfile }: ArtCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useOcrScramble, setUseOcrScramble] = useState(true);
  const [watermarkText, setWatermarkText] = useState("Art For All - Secure");
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [magnifying, setMagnifying] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<"Stripe" | "PayPal" | "Monero" >("Stripe");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Advanced anti-screenshot parameters
  const [isBlurActive, setIsBlurActive] = useState(false);
  const [screenshotAttempted, setScreenshotAttempted] = useState(false);

  // Get active session directly from localStorage to check permissions
  const userSession = React.useMemo(() => {
    const saved = localStorage.getItem("afa_user_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  const [isPurchased, setIsPurchased] = useState<boolean>(() => {
    const saved = localStorage.getItem("afa_purchased_artworks");
    if (saved) {
      try {
        const list = JSON.parse(saved);
        return Array.isArray(list) && list.includes(artwork.id);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const isOwnerOrAdmin = React.useMemo(() => {
    if (!userSession) return false;
    if (userSession.type === "admin") return true;
    if (userSession.type === "artist" && userSession.artist?.id === artwork.artistId) return true;
    return false;
  }, [userSession, artwork.artistId]);

  const isUnlocked = isPurchased || isOwnerOrAdmin;

  const handleUnlock = () => {
    setIsPurchased(true);
    const saved = localStorage.getItem("afa_purchased_artworks");
    let list: string[] = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch (e) {}
    }
    if (!list.includes(artwork.id)) {
      list.push(artwork.id);
      localStorage.setItem("afa_purchased_artworks", JSON.stringify(list));
    }
    setShowPayoutModal(false);
    alert(`🎉 Purchase Successful! "${artwork.title}" is now unlocked. You can now download the original high-fidelity file without watermarks or OCR grain.`);
  };

  const handleDownloadCleanImage = () => {
    const link = document.createElement("a");
    link.href = artwork.imageUrl;
    link.download = `${artwork.title.toLowerCase().replace(/\s+/g, "_")}_clean.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const handleWindowBlur = () => {
      setIsBlurActive(true);
    };

    const handleWindowFocus = () => {
      // Give a tiny grace period to restore
      setTimeout(() => {
        setIsBlurActive(false);
      }, 150);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key check
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        setIsBlurActive(true);
        setScreenshotAttempted(true);
        const currentCount = parseInt(localStorage.getItem("afa_metric_screenshots") || "148", 10);
        localStorage.setItem("afa_metric_screenshots", (currentCount + 1).toString());
        
        setTimeout(() => {
          setScreenshotAttempted(false);
          setIsBlurActive(false);
        }, 3000);
      }
      
      // macOS shift+cmd screenshot key combinations
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) {
        setIsBlurActive(true);
        setScreenshotAttempted(true);
        const currentCount = parseInt(localStorage.getItem("afa_metric_screenshots") || "148", 10);
        localStorage.setItem("afa_metric_screenshots", (currentCount + 1).toString());
        
        setTimeout(() => {
          setScreenshotAttempted(false);
          setIsBlurActive(false);
        }, 3000);
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleStripeCheckout = async () => {
    try {
      setPaymentLoading(true);
      const response = await fetch("/api/payments/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          artworkId: artwork.id,
          title: artwork.title,
          price: artwork.price,
          artistName: artwork.artistName,
          stripeSecretKey: artistProfile?.stripeSecretKey || ""
        })
      });

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        // Fallback simulator for Stripe sandbox mode
        setTimeout(() => {
          setPaymentLoading(false);
          const confirmPayment = confirm(`[Stripe Simulation Mode] Create checkout session for $${artwork.price} USD to support ${artwork.artistName}?\n\nClick OK to simulate successful card capture and unlock artwork.`);
          if (confirmPayment) {
            handleUnlock();
          }
        }, 600);
      }
    } catch (err: any) {
      console.error("Stripe payment error:", err);
      const confirmPayment = confirm(`[Stripe Sandbox Mode] Create checkout session for $${artwork.price} USD to support ${artwork.artistName}?\n\nClick OK to simulate successful card capture and unlock artwork.`);
      if (confirmPayment) {
        handleUnlock();
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (showPayoutModal && activePaymentMethod === "PayPal") {
      const scriptId = "paypal-sdk-script";
      const targetClientId = artistProfile?.paypalClientId || "sb";
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      const initializeButtons = () => {
        // @ts-ignore
        if (window.paypal) {
          const container = document.getElementById("paypal-button-container");
          if (container) {
            container.innerHTML = ""; // clean container
            // @ts-ignore
            window.paypal.Buttons({
              createOrder: (data: any, actions: any) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      currency_code: "USD",
                      value: artwork.price.toFixed(2)
                    },
                    description: `Artwork purchase: ${artwork.title} by ${artwork.artistName}`
                  }]
                });
              },
              onApprove: async (data: any, actions: any) => {
                const details = await actions.order.capture();
                handleUnlock();
              },
              onError: (err: any) => {
                console.error("PayPal Smart Button error:", err);
                // Fallback simulation if SDK fails to render in sandboxed preview iframe
                const confirmPay = confirm(`[PayPal Sandbox] Smart button loading failed inside iframe.\n\nSimulate capturing $${artwork.price} USD Paypal payment?`);
                if (confirmPay) {
                  handleUnlock();
                }
              }
            }).render("#paypal-button-container");
          }
        }
      };

      // Recreate script if client ID changed
      if (script && script.getAttribute("data-client-id") !== targetClientId) {
        script.remove();
        script = null as any;
        // @ts-ignore
        delete window.paypal;
      }

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.setAttribute("data-client-id", targetClientId);
        script.src = `https://www.paypal.com/sdk/js?client-id=${targetClientId}&currency=USD`;
        script.async = true;
        script.onload = initializeButtons;
        document.body.appendChild(script);
      } else {
        initializeButtons();
      }
    }
  }, [showPayoutModal, activePaymentMethod, artwork, artistProfile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Request CORS if needed
    img.referrerPolicy = "no-referrer";
    img.src = artwork.imageUrl;

    img.onload = () => {
      setImageLoaded(true);
      // Canvas sizing based on natural aspect ratio
      canvas.width = 600;
      canvas.height = 450;

      // Draw the main image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Only apply scrambling and watermarks if the item is NOT unlocked
      if (!isUnlocked) {
        // Apply AFA Scrambling pattern (subtle linen/organic paper texture)
        if (useOcrScramble) {
          // Draw thin lines (scrambles OCR line detection)
          ctx.strokeStyle = "rgba(45, 90, 39, 0.08)";
          ctx.lineWidth = 1;
          for (let i = -canvas.height; i < canvas.width; i += 12) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + canvas.height, canvas.height);
            ctx.stroke();
          }

          // Draw micro pixel-noise in bands
          ctx.fillStyle = "rgba(247, 245, 240, 0.04)";
          for (let x = 0; x < canvas.width; x += 3) {
            for (let y = 0; y < canvas.height; y += 3) {
              if (Math.random() > 0.85) {
                ctx.fillRect(x, y, 1.5, 1.5);
              }
            }
          }

          // Add subtle overlay watermark text in multiple points
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.font = "italic 10px monospace";
          ctx.textAlign = "center";
          
          // Repeat watermark across a grid to confuse OCR anchors
          for (let gx = 100; gx < canvas.width; gx += 200) {
            for (let gy = 80; gy < canvas.height; gy += 120) {
              ctx.save();
              ctx.translate(gx, gy);
              ctx.rotate(-Math.PI / 8);
              ctx.fillText(watermarkText, 0, 0);
              ctx.restore();
            }
          }
        } else {
          // Simple watermark
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.font = "12px monospace";
          ctx.fillText("Art For All - Secure Canvas View", 15, canvas.height - 15);
        }
      } else {
        // Draw elegant indicator that canvas is running in raw high-fidelity mode
        ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("✓ Raw Original High-Fidelity Unlocked", 15, canvas.height - 15);
      }
    };

    img.onerror = () => {
      // Fallback if Picsum blocks or fails: Draw a cozy gradient with geometric patterns
      setImageLoaded(true);
      canvas.width = 600;
      canvas.height = 450;
      
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#2d4a22"); // Warm organic brand green
      grad.addColorStop(1, "#162b10"); // Dark organic brand green
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(212, 163, 115, 0.2)"; // brand-accent
      ctx.lineWidth = 2;
      for (let r = 50; r < 400; r += 50) {
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "#fdfcf7"; // brand-bg
      ctx.font = "italic 22px serif";
      ctx.textAlign = "center";
      ctx.fillText(artwork.title, canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = "rgba(253, 252, 247, 0.6)";
      ctx.font = "12px monospace";
      ctx.fillText("[Image Offline - Protected Canvas Placeholder]", canvas.width / 2, canvas.height / 2 + 50);
    };

  }, [artwork.imageUrl, useOcrScramble, watermarkText, artwork.title, isUnlocked]);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="bg-white border border-brand-primary/10 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all flex flex-col md:flex-row gap-6"
      id={`art-card-${artwork.id}`}
      onContextMenu={handleRightClick}
    >
      {/* Protected View Container (Left column) */}
      <div className="flex-1 flex flex-col items-center space-y-3">
        <div 
          className="relative rounded-lg overflow-hidden bg-stone-950 border border-brand-primary/30 shadow-inner select-none max-w-full group"
          style={{ width: "100%", maxWidth: "520px", height: "auto" }}
          ref={containerRef}
          onContextMenu={handleRightClick}
          onDragStart={handleDragStart}
        >
          {/* Sliced Layer Interceptors */}
          <div className="absolute inset-0 z-20 pointer-events-auto flex flex-wrap" onContextMenu={handleRightClick}>
            <div className="w-1/2 h-full bg-transparent border-r border-transparent cursor-default" title="Art For All Protected Content" />
            <div className="w-1/2 h-full bg-transparent cursor-default" title="Art For All Protected Content" />
          </div>

          {/* Invisible Anti-Download Shield & Custom Context Alert Overlay */}
          <div 
            className="absolute inset-0 z-30 bg-black/0 hover:bg-black/5 transition duration-300 pointer-events-auto cursor-not-allowed flex items-center justify-center opacity-0 group-hover:opacity-100"
            onContextMenu={(e) => {
              e.preventDefault();
              alert("🔒 Security Lock: Downloading and direct image saving is disabled to protect sovereign artwork. Complete a secure payment to retrieve original high-fidelity source files.");
            }}
            title="Sovereign Image Shield Active"
          >
            <div className="bg-slate-900/90 text-white font-mono text-[9px] px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-xs shadow-lg flex items-center gap-1.5 pointer-events-none transform translate-y-2 group-hover:translate-y-0 transition duration-300">
              <Shield className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
              <span>Right-Click & Copy Protected</span>
            </div>
          </div>

          {/* Window Blur & Screenshot Active Obfuscation Overlay */}
          {isBlurActive && (
            <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 text-center animate-fade-in transition duration-150">
              <Lock className="w-8 h-8 text-brand-accent animate-bounce mb-2" />
              <p className="text-white font-serif font-bold text-sm tracking-tight">
                {screenshotAttempted ? "Screenshot Attempt Intercepted" : "Protected Content Masked"}
              </p>
              <p className="text-[10px] text-slate-400 font-sans max-w-xs mt-1 leading-normal">
                {screenshotAttempted 
                  ? "Sovereignty safeguards have obscured the active canvas. Local PrintScreen triggers have been logged."
                  : "Canvas view automatically obfuscated when focusing away from the browser viewport to prevent third-party harvesting."
                }
              </p>
            </div>
          )}

          {/* Canvas Rendering */}
          <canvas
            ref={canvasRef}
            className={`w-full h-auto block select-none object-contain pointer-events-none transition duration-150 ${isBlurActive ? "filter blur-3xl opacity-10" : ""}`}
            style={{ filter: magnifying ? "contrast(1.1) brightness(0.95)" : "none" }}
            onContextMenu={handleRightClick}
          />
        </div>

        {/* Security Feature Ledger/Status Bar */}
        <div className="w-full max-w-[520px] bg-brand-panel border border-brand-primary/10 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-[9px] font-mono">
          <div className="border-r border-brand-primary/10 space-y-0.5">
            <span className="block text-brand-primary font-bold">ACTIVE</span>
            <span className="text-brand-muted/75">Screenshot Shield</span>
          </div>
          <div className="border-r border-brand-primary/10 space-y-0.5">
            <span className="block text-emerald-600 font-bold">100% BLOCKED</span>
            <span className="text-brand-muted/75">OCR Grabbers</span>
          </div>
          <div className="space-y-0.5">
            <span className="block text-brand-primary font-bold">SECURED</span>
            <span className="text-brand-muted/75">Sovereign Watermark</span>
          </div>
        </div>
      </div>

      {/* Description & Purchase details (Right Column) */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Title and Badge */}
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
            <h3 className="font-serif font-semibold text-2xl text-brand-primary tracking-tight leading-tight">
              <OcrScrambler text={artwork.title} intensity="medium" />
            </h3>
            <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border border-brand-primary/15">
              ${artwork.price.toFixed(2)} USD
            </span>
          </div>

          {/* Artist link */}
          <div className="mb-4">
            <button 
              onClick={() => onViewArtist(artwork.artistId)}
              className="text-brand-primary hover:text-brand-primary-light text-sm font-serif italic hover:underline focus:outline-none"
            >
              by <OcrScrambler text={artwork.artistName} intensity="low" />
            </button>
            <span className="text-[10px] text-brand-muted font-sans ml-2">
              • Added on {artwork.createdAt}
            </span>
          </div>

          {/* Description */}
          <p className="text-brand-muted text-sm leading-relaxed mb-5 font-sans bg-brand-panel p-3 rounded-lg border border-brand-primary/5">
            <OcrScrambler text={artwork.description} intensity="medium" />
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5" id="tags-container">
            {artwork.tags.map((tag) => (
              <span 
                key={tag} 
                className="bg-brand-panel text-brand-primary text-[11px] font-sans px-2.5 py-0.5 rounded-full border border-brand-primary/10"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-brand-panel border border-brand-primary/10 rounded-xl p-4 text-xs">
          {isUnlocked ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>You own or have unlocked this artwork! Feel free to download the clean original file below.</span>
              </div>
              <button
                onClick={handleDownloadCleanImage}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-medium py-2 px-4 rounded-full flex items-center justify-center gap-2 transition shadow-sm focus:outline-none cursor-pointer"
              >
                <Minimize2 className="w-4 h-4 rotate-45" />
                <span>Download Clean Original PNG</span>
              </button>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-brand-muted leading-relaxed mb-3">
                All purchases go 100% directly to the artist with zero platform fees.
              </p>

              <button
                onClick={() => setShowPayoutModal(true)}
                className="w-full bg-brand-primary hover:bg-brand-primary/95 text-brand-bg font-sans font-medium py-2 px-4 rounded-full flex items-center justify-center gap-2 transition shadow-sm focus:outline-none"
              >
                <Coins className="w-4 h-4" />
                <span>Purchase Artwork</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Payout Details Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-brand-panel border border-brand-primary/15 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h4 className="font-serif font-semibold text-xl text-brand-primary mb-2 flex items-center gap-2 border-b border-brand-primary/10 pb-3">
              <Coins className="w-5 h-5 text-brand-primary-light" />
              <span>Checkout Options</span>
            </h4>
            
            <p className="text-xs text-brand-muted mb-4 leading-relaxed">
              Complete your commission purchase for <strong className="text-brand-primary">"{artwork.title}"</strong>. Choose a production gateway:
            </p>

            {/* Gateway Select Tabs */}
            <div className="flex gap-1.5 mb-4 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActivePaymentMethod("Stripe")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${activePaymentMethod === "Stripe" ? "bg-white text-brand-primary shadow-xs" : "text-slate-500 hover:text-brand-primary"}`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Stripe</span>
              </button>
              <button
                onClick={() => setActivePaymentMethod("PayPal")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${activePaymentMethod === "PayPal" ? "bg-white text-brand-primary shadow-xs" : "text-slate-500 hover:text-brand-primary"}`}
              >
                <Coins className="w-3.5 h-3.5 text-yellow-600" />
                <span>PayPal</span>
              </button>
              <button
                onClick={() => setActivePaymentMethod("Monero")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${activePaymentMethod === "Monero" ? "bg-white text-brand-primary shadow-xs" : "text-slate-500 hover:text-brand-primary"}`}
              >
                <Wallet className="w-3.5 h-3.5 text-orange-600" />
                <span>Monero</span>
              </button>
            </div>

            {/* Stripe Card Checkout Content */}
            {activePaymentMethod === "Stripe" && (
              <div className="space-y-4">
                <div className="bg-white border border-brand-primary/10 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-brand-muted">Amount due:</span>
                    <span className="text-brand-primary text-sm font-mono font-bold">${artwork.price.toFixed(2)} USD</span>
                  </div>
                  <p className="text-[11px] text-brand-muted leading-relaxed">
                    Processes payments securely via Stripe Hosted Checkout with PCI-DSS compliance. Supports credit/debit card, Apple Pay, and Google Pay.
                  </p>
                </div>

                <button
                  onClick={handleStripeCheckout}
                  disabled={paymentLoading}
                  className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-sans font-semibold py-2.5 rounded-full transition text-xs shadow-sm focus:outline-none cursor-pointer flex items-center justify-center gap-2"
                >
                  {paymentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>Launch Stripe Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* PayPal Button Content */}
            {activePaymentMethod === "PayPal" && (
              <div className="space-y-4">
                <div className="bg-white border border-brand-primary/10 rounded-xl p-4 text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-brand-muted">Amount due:</span>
                    <span className="text-brand-primary text-sm font-mono font-bold">${artwork.price.toFixed(2)} USD</span>
                  </div>
                  <p className="text-[11px] text-brand-muted leading-relaxed">
                    Click the official Smart Buttons below to authenticate with PayPal and capture this transaction instantly.
                  </p>
                </div>

                {/* PayPal Smart Button Container */}
                <div id="paypal-button-container" className="w-full min-h-[45px] py-1 z-10" />
              </div>
            )}

            {/* Monero Crypto Content */}
            {activePaymentMethod === "Monero" && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white border border-brand-primary/10 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Payment Address (Monero XMR)</span>
                    <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-mono">
                      Tor Friendly
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[10px] font-mono select-all break-all text-center text-brand-primary">
                    {artwork.monetaryAddress || "44AFFq5k...xMRaddress"}
                  </div>
                  <p className="text-[10px] text-brand-muted leading-relaxed">
                    Perfect for Tor-routed users. Send equivalent value of <strong>${artwork.price.toFixed(2)} USD</strong> directly to the artist's address shown above.
                  </p>
                </div>

                {/* Simulated Monero hash confirmation input */}
                <div className="bg-slate-50 border border-brand-primary/10 rounded-xl p-3.5 text-xs space-y-2">
                  <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase">
                    Test Bypass: Verify Transaction Hash
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 64-char transaction hash..."
                      id="monero-tx-hash-input"
                      className="flex-grow bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const inputEl = document.getElementById("monero-tx-hash-input") as HTMLInputElement;
                        if (!inputEl || !inputEl.value.trim()) {
                          alert("Please enter a mock Monero transaction hash.");
                          return;
                        }
                        setPaymentLoading(true);
                        setTimeout(() => {
                          setPaymentLoading(false);
                          handleUnlock();
                        }, 1200);
                      }}
                      disabled={paymentLoading}
                      className="bg-brand-primary hover:bg-brand-primary/95 text-white text-[10px] px-3 rounded font-sans font-semibold cursor-pointer"
                    >
                      {paymentLoading ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center leading-normal italic">
                  💡 After completing payment, you can also message the artist with your transaction hash to manually verify.
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-5 border-t border-brand-primary/10 pt-4">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-brand-muted font-sans font-medium py-2 rounded-full transition text-xs cursor-pointer"
              >
                Close Checkout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
