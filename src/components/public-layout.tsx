"use client";

import { Footer } from "@/components/footer";
import Link from "next/link";
import Image from "next/image";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Public Header — logo only, no auth buttons */}
      <header className="bg-background border-b backdrop-blur py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/pics/logo-transparent.png"
              alt="Talent3X Logo"
              width={300}
              height={60}
              className="h-10 w-auto"
              priority
              quality={100}
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl px-6 py-10 flex-grow">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
