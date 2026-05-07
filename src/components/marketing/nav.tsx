"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200"
          : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="shrink-0" onClick={close}>
          <Image
            src="/pics/logo-transparent.png"
            alt="Talent3X"
            width={130}
            height={44}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          <Link href="/#why" className="hover:text-blue-600 transition-colors">Why Talent3X</Link>
          <Link href="/students" className="hover:text-blue-600 transition-colors">For Students</Link>
          <Link href="/universities" className="hover:text-blue-600 transition-colors">For Universities</Link>
          <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
          <Link href="/partners" className="hover:text-blue-600 transition-colors">Partners &amp; Investors</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href="https://app.talent3x.com/login" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="text-slate-600">Login</Button>
          </a>
          <a href="https://app.talent3x.com" target="_blank" rel="noopener noreferrer">
            <Button size="sm">Get Started</Button>
          </a>
        </div>

        <button
          className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-6 py-5 space-y-4 text-sm font-medium text-slate-700">
          <Link href="/#why" onClick={close} className="block hover:text-blue-600 transition-colors">Why Talent3X</Link>
          <Link href="/students" onClick={close} className="block hover:text-blue-600 transition-colors">For Students</Link>
          <Link href="/universities" onClick={close} className="block hover:text-blue-600 transition-colors">For Universities</Link>
          <Link href="/how-it-works" onClick={close} className="block hover:text-blue-600 transition-colors">How It Works</Link>
          <Link href="/partners" onClick={close} className="block hover:text-blue-600 transition-colors">Partners &amp; Investors</Link>
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <a href="https://app.talent3x.com/login" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full" size="sm">Login</Button>
            </a>
            <a href="https://app.talent3x.com" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full" size="sm">Get Started</Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
