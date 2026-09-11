import { Link } from "react-router";

export function PublicFooter() {
  return (
    <footer className="border-t border-hyrd-border bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link
            aria-label="HYRD home"
            className="inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-hyrd-gold"
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
            <span className="font-serif text-xl font-semibold tracking-[0.12em] text-hyrd-navy">
              HYRD
            </span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-hyrd-muted">
            Personal job-application tracking for roles, stages, notes, dates,
            and next decisions.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link className="public-link" to="/privacy">
            Privacy
          </Link>
          <Link className="public-link" to="/terms">
            Terms & Conditions
          </Link>
          <Link className="public-link" to="/login">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
