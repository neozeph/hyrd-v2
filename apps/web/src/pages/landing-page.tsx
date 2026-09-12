import { useEffect, useState } from "react";
import { Link } from "react-router";

import { useAuth } from "../auth/use-auth";
import { PublicFooter } from "../components/public/public-footer";
import { PublicNav } from "../components/public/public-nav";
import { SignatureCTA } from "../components/public/signature-cta";

const pipelineStages = [
  { body: "Capture the role before it disappears into tabs and messages.", label: "Saved" },
  { body: "Mark the applications already sent and keep dates close.", label: "Applied" },
  { body: "Separate early conversations from the rest of the search.", label: "Screening" },
  { body: "Keep interview opportunities visible while you prepare.", label: "Interview" },
  { body: "Know which decisions need attention when an offer lands.", label: "Offer" },
];

const features = [
  {
    body: "Store company, position, location, source URL, notes, status, and applied date together.",
    kicker: "Record",
    title: "Every role gets a place",
  },
  {
    body: "Use pipeline and table views depending on whether you need momentum or detail.",
    kicker: "View",
    title: "Scan the search your way",
  },
  {
    body: "Dashboard totals keep active applications, interviews, offers, and recent records in front of you.",
    kicker: "Review",
    title: "See what changed recently",
  },
];

const steps = [
  {
    body: "Add the company, position, location, source, notes, and applied date when you have them.",
    title: "Save the opportunity",
  },
  {
    body: "Move each record through saved, applied, screening, assessment, interview, offer, rejected, or withdrawn.",
    title: "Set the stage",
  },
  {
    body: "Open the dashboard or applications workspace to compare what is active and what needs attention.",
    title: "Review the work",
  },
  {
    body: "Update notes and status as the process changes so the next decision is easier to make.",
    title: "Keep it current",
  },
];

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mediaQuery?.matches) return undefined;

    let animationFrame = 0;

    function updateProgress() {
      animationFrame = 0;
      setProgress(Math.min(window.scrollY / 560, 1));
    }

    function handleScroll() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateProgress);
    }

    updateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return progress;
}

function SectionReveal({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(() => {
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    return Boolean(mediaQuery?.matches) || !("IntersectionObserver" in window);
  });

  useEffect(() => {
    if (element === null) return undefined;

    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mediaQuery?.matches || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.16 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return (
    <section
      className={`landing-reveal ${isVisible ? "is-visible" : ""} ${className}`}
      id={id}
      ref={setElement}
    >
      {children}
    </section>
  );
}

function WorkspaceVisual({ progress }: { progress: number }) {
  return (
    <div
      aria-label="Stylized HYRD workspace with a monitor, application documents, folders, and pipeline cards."
      className="workspace-visual"
      role="img"
      style={{ "--scroll-shift": `${progress * 16}px` } as React.CSSProperties}
    >
      <div className="workspace-grid" aria-hidden="true" />
      <div className="desk-plane" aria-hidden="true" />
      <div className="monitor-panel">
        <div className="monitor-topline">
          <span>HYRD</span>
          <span>Pipeline</span>
        </div>
        <div className="monitor-columns">
          {["Saved", "Applied", "Interview"].map((label, index) => (
            <div className="monitor-column" key={label}>
              <span>{label}</span>
              <div className="mini-card" style={{ "--i": index } as React.CSSProperties} />
              {index > 0 ? <div className="mini-card ghost" /> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="workspace-object folder-object">
        <span>Roles</span>
      </div>
      <div className="workspace-object document-object">
        <span>Application notes</span>
      </div>
      <div className="workspace-object calendar-object">
        <span>Interview</span>
        <strong>14</strong>
      </div>
      <div className="workspace-hotspot workspace-hotspot-a">
        <span>Owned records</span>
      </div>
      <div className="workspace-hotspot workspace-hotspot-b">
        <span>Status clarity</span>
      </div>
    </div>
  );
}

function ProductMockup() {
  const [selected, setSelected] = useState("interview");
  const records = [
    ["saved", "Product Designer", "Saved"],
    ["applied", "Frontend Engineer", "Applied"],
    ["interview", "Operations Lead", "Interview"],
  ];

  return (
    <div className="product-mockup" aria-label="HYRD application record preview">
      <div className="product-mockup-list">
        {records.map(([id, role, status]) => (
          <button
            className={selected === id ? "is-selected" : ""}
            key={id}
            onClick={() => setSelected(id)}
            type="button"
          >
            <span>{role}</span>
            <small>{status}</small>
          </button>
        ))}
      </div>
      <div className="product-mockup-detail">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-hyrd-gold-dark">
          Selected record
        </p>
        <h3>
          {selected === "interview"
            ? "Operations Lead"
            : selected === "applied"
              ? "Frontend Engineer"
              : "Product Designer"}
        </h3>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>
              {selected === "interview"
                ? "Interview"
                : selected === "applied"
                  ? "Applied"
                  : "Saved"}
            </dd>
          </div>
          <div>
            <dt>Next context</dt>
            <dd>Notes, source link, and applied date stay attached to the role.</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const scrollProgress = useScrollProgress();
  const primaryTo = isAuthenticated ? "/dashboard" : "/register";
  const primaryText = isAuthenticated ? "Dashboard" : "Get HYRD";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfaf6] text-hyrd-text">
      <PublicNav isAuthenticated={isAuthenticated} isLoading={isLoading} />

      <main>
        <section className="hero-shell">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-hyrd-gold">
                Personal job-search system
              </p>
              <h1 className="mt-5 max-w-3xl font-serif text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                Your job search deserves a system.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                HYRD turns scattered roles, notes, links, and interview stages
                into one workspace you can actually keep up with.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <SignatureCTA to={primaryTo}>{primaryText}</SignatureCTA>
                {!isAuthenticated ? (
                  <Link className="secondary-public-action" to="/login">
                    Sign in
                  </Link>
                ) : null}
              </div>
            </div>
            <WorkspaceVisual progress={scrollProgress} />
          </div>
        </section>

        <SectionReveal className="border-y border-hyrd-border bg-white px-4 py-10 sm:px-6 lg:px-8" id="pipeline">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[0.34fr_1fr] lg:items-end">
              <div>
                <p className="section-kicker">Pipeline</p>
                <h2 className="section-title">From found to decided.</h2>
              </div>
              <div className="pipeline-strip">
                {pipelineStages.map((stage, index) => (
                  <article className="pipeline-stage" key={stage.label} tabIndex={0}>
                    <span>0{index + 1}</span>
                    <h3>{stage.label}</h3>
                    <p>{stage.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal className="px-4 py-18 sm:px-6 lg:px-8" id="features">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="section-kicker">Features</p>
              <h2 className="section-title">Built for the job-search work that repeats.</h2>
            </div>
            <div className="feature-grid mt-10">
              {features.map((feature) => (
                <article className="feature-panel" key={feature.title} tabIndex={0}>
                  <p>{feature.kicker}</p>
                  <h3>{feature.title}</h3>
                  <span aria-hidden="true" />
                  <small>{feature.body}</small>
                </article>
              ))}
            </div>
          </div>
        </SectionReveal>

        <SectionReveal className="bg-hyrd-navy px-4 py-18 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="section-kicker text-hyrd-gold">Product spotlight</p>
              <h2 className="font-serif text-4xl font-semibold sm:text-5xl">
                Scattered applications become records you can reason through.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
                HYRD does not guess for you. It gives each opportunity a status,
                notes, dates, and a place in the pipeline so the search feels
                manageable again.
              </p>
            </div>
            <ProductMockup />
          </div>
        </SectionReveal>

        <SectionReveal className="px-4 py-18 sm:px-6 lg:px-8" id="how-it-works">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.35fr_1fr]">
              <div>
                <p className="section-kicker">How HYRD works</p>
                <h2 className="section-title">Four practical moves.</h2>
              </div>
              <div className="steps-grid">
                {steps.map((step, index) => (
                  <article className="work-step" key={step.title} tabIndex={0}>
                    <span>0{index + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal className="border-y border-hyrd-border bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="account-section mx-auto max-w-7xl">
            <div className="account-card" aria-hidden="true">
              <div className="account-avatar" />
              <div>
                <span>Personal workspace</span>
                <strong>HYRD account</strong>
              </div>
            </div>
            <div>
              <p className="section-kicker">Account based</p>
              <h2 className="section-title">Your workspace belongs to your sign-in.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-hyrd-muted">
                The repository shows session-based authentication and protected
                application routes. Application records are associated with a
                user account before they are shown in the workspace.
              </p>
            </div>
          </div>
        </SectionReveal>

        <section className="closing-section">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:px-8">
            <div>
              <p className="section-kicker">Start here</p>
              <h2 className="max-w-3xl font-serif text-5xl font-semibold leading-tight text-hyrd-navy sm:text-6xl">
                Start with one opportunity.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-hyrd-muted">
                Add the role in front of you. Give it a status. Keep the next
                step visible. A search becomes easier when it has a shape.
              </p>
              <div className="mt-8">
                <SignatureCTA to={primaryTo}>{primaryText}</SignatureCTA>
              </div>
            </div>
            <div className="closing-crop" aria-hidden="true">
              <WorkspaceVisual progress={0.2} />
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
