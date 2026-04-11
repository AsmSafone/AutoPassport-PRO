'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background/50 py-6 text-center backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-1.5 md:flex-row md:gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            © {currentYear} AutoPassport Pro
          </p>
          <div className="hidden h-1 w-1 rounded-full bg-border/60 md:block" />
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            Developed with <Heart className="h-3.5 w-4 fill-rose-500 text-rose-500" /> by
            <span className="font-bold text-foreground hover:text-blue-600 transition-colors cursor-default">
              <Link href="https://safone.dev" target="_blank">Safone</Link>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
