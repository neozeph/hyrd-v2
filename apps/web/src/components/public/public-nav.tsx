import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Icon } from "../ui/icons";
import { SignatureCTA } from "./signature-cta";

type PublicNavProps = {
  isAuthenticated?: boolean;
  isLoading?: boolean;
};

export function PublicNav({
  isAuthenticated = false,
  isLoading = false,
}: PublicNavProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const primaryTo = isAuthenticated ? "/dashboard" : "/register";
  const primaryText = isAuthenticated ? "Dashboard" : "Get HYRD";

  useEffect(() => {
    function updateScrolled() {
      setIsScrolled(window.scrollY > 12);
    }

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <>
      <header
        className={`fixed left-0 top-0 z-50 w-full border-b text-white transition-colors duration-200 ${
          isScrolled
            ? "border-white/14 bg-hyrd-deep/98 shadow-[0_1px_0_rgba(255,255,255,0.06)]"
            : "border-white/10 bg-hyrd-navy/96"
        }`}
      >
        <nav
          aria-label="Public navigation"
          className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8"
        >
          <Link
            aria-label="HYRD home"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-hyrd-gold"
            to="/"
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-8 w-8 object-contain"
              height="32"
              src="/brand/hyrd-mark.png.png"
              width="32"
            />
            <span className="font-serif text-2xl font-semibold tracking-[0.12em]">
              HYRD
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <a className="nav-link" href="/#pipeline">
              Pipeline
            </a>
            <a className="nav-link" href="/#features">
              Features
            </a>
            <a className="nav-link" href="/#how-it-works">
              How it works
            </a>
            <Link className="nav-link" to="/login">
              Sign in
            </Link>
            <SignatureCTA className="min-h-10 px-4 py-2 text-xs" to={primaryTo}>
              {isLoading ? "Checking" : primaryText}
            </SignatureCTA>
          </div>

          <button
            aria-controls="public-mobile-navigation"
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
            className="grid h-11 w-11 place-items-center border border-white/20 text-white transition hover:border-hyrd-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-hyrd-gold md:hidden"
            onClick={() => setIsMobileOpen((current) => !current)}
            type="button"
          >
            <Icon className="h-5 w-5" name={isMobileOpen ? "close" : "menu"} />
          </button>
        </nav>

        <div
          className={`${isMobileOpen ? "block" : "hidden"} border-t border-white/10 bg-hyrd-deep px-4 py-4 md:hidden`}
          id="public-mobile-navigation"
        >
          <div className="mx-auto grid max-w-7xl gap-1">
            {[
              ["Pipeline", "/#pipeline"],
              ["Features", "/#features"],
              ["How it works", "/#how-it-works"],
            ].map(([label, href]) => (
              <a
                className="border border-transparent px-2 py-3 text-sm text-slate-200 transition hover:border-white/14 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-hyrd-gold"
                href={href}
                key={label}
                onClick={() => setIsMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            <Link
              className="border border-transparent px-2 py-3 text-sm text-slate-200 transition hover:border-white/14 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-hyrd-gold"
              onClick={() => setIsMobileOpen(false)}
              to="/login"
            >
              Sign in
            </Link>
            <SignatureCTA className="mt-3 w-full" to={primaryTo}>
              {primaryText}
            </SignatureCTA>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-16" />
    </>
  );
}
