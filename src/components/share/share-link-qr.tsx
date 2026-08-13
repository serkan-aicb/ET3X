"use client";

/**
 * Share a link as a copyable URL + downloadable QR code.
 *
 * Extracted from the pre-v1.6 educator "share task" page before that tree was
 * deleted (workspace doc 22, C4/F8). Spec v6 §5a lists a self-enrol link/QR as
 * one of the four recipient modes for evaluator-issued actions and says it
 * "reuses the existing link/QR mechanism, does not need a second one built" —
 * so this is that mechanism, decoupled from Supabase and given the current
 * design system. The assign wizard is email-only today; drop this in when
 * self-enrol lands.
 */

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** How long the "Copied" confirmation stays up. */
const COPIED_MS = 2000;

export function ShareLinkQr({
  url,
  title = "Share this link",
  description,
  filename = "qr-code",
  size = 180,
  className,
}: {
  /** Full absolute URL the QR encodes and the copy button writes. */
  url: string;
  title?: string;
  description?: string;
  /** Basename for the downloaded PNG (no extension). */
  filename?: string;
  size?: number;
  className?: string;
}) {
  const qrRef = React.useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(t);
  }, [copied]);

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API needs a secure context; fall back to a throwaway input.
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
  };

  /** Rasterise the QR at 2x so the PNG stays crisp in print and slides. */
  const downloadQr = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);

      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-card", className)}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              aria-label="Share link"
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground"
            />
            <Button variant="outline" onClick={copyLink} aria-label="Copy share link">
              {copied ? <Check /> : <Copy />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          <Button variant="outline" onClick={downloadQr}>
            <Download /> Download QR code
          </Button>
        </div>

        <div
          ref={qrRef}
          className="mx-auto shrink-0 rounded-lg border bg-white p-3 sm:mx-0"
        >
          <QRCodeSVG value={url || " "} size={size} level="M" />
        </div>
      </div>
    </div>
  );
}
