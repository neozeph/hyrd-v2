import { Link } from "react-router";

import { PublicFooter } from "../components/public/public-footer";
import { PublicNav } from "../components/public/public-nav";
import { SignatureCTA } from "../components/public/signature-cta";

type LegalPageProps = {
  kind: "privacy" | "terms";
};

const verifiedFacts = [
  "HYRD has account registration and login using email, name, and password fields.",
  "Passwords are hashed on the API before storage.",
  "Authenticated sessions are represented by server-created session records.",
  "Job applications belong to a user account and include company, position, status, optional location, job URL, notes, and applied date.",
  "Protected application routes require an authenticated session before showing application data.",
];

const privacyOpenItems = [
  "Final data retention periods",
  "Production contact details for privacy requests",
  "Third-party processors or hosting disclosures",
  "Jurisdiction-specific privacy rights and response timelines",
];

const termsOpenItems = [
  "Legal owner or contracting entity",
  "Governing law and venue",
  "Age requirements",
  "Payment terms, if HYRD ever introduces paid plans",
  "Warranty, liability, availability, and termination language",
];

export function LegalPage({ kind }: LegalPageProps) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms & Conditions";
  const intro = isPrivacy
    ? "This page is a design-ready policy structure grounded only in repository-verifiable HYRD behavior. It still needs legal review before it becomes final policy language."
    : "This page prepares the public terms route and structure without inventing legal commitments, company details, or jurisdictional language that the repository does not establish.";
  const openItems = isPrivacy ? privacyOpenItems : termsOpenItems;

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-hyrd-text">
      <PublicNav />
      <main>
        <section className="border-b border-hyrd-border bg-hyrd-navy px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-hyrd-gold">
              HYRD public document
            </p>
            <h1 className="mt-5 font-serif text-5xl font-semibold leading-tight sm:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-200">
              {intro}
            </p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="h-max border border-hyrd-border bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-hyrd-gold-dark">
                Status
              </p>
              <p className="mt-3 text-sm leading-6 text-hyrd-muted">
                Draft structure only. Unverified legal details are intentionally
                left unresolved for future review.
              </p>
              <div className="mt-5">
                <SignatureCTA className="w-full" to="/register">
                  Get HYRD
                </SignatureCTA>
              </div>
            </aside>

            <div className="space-y-7">
              <article className="legal-panel">
                <h2>Verified implementation facts</h2>
                <ul>
                  {verifiedFacts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </article>

              <article className="legal-panel">
                <h2>{isPrivacy ? "Privacy content pending review" : "Terms content pending review"}</h2>
                <p>
                  HYRD needs finalized wording from the project owner or legal
                  reviewer before this section can describe commitments,
                  rights, obligations, or operational practices beyond the facts
                  verified in the codebase.
                </p>
                <ul>
                  {openItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="legal-panel">
                <h2>Account acknowledgement</h2>
                <p>
                  The registration screen requires users to check an agreement
                  box before submitting. The current repository does not include
                  a database model for persisting consent history.
                </p>
                <p>
                  Return to the <Link className="public-link" to="/">landing page</Link>{" "}
                  or review the companion{" "}
                  <Link className="public-link" to={isPrivacy ? "/terms" : "/privacy"}>
                    {isPrivacy ? "Terms & Conditions" : "Privacy Policy"}
                  </Link>
                  .
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
