import { Link } from "react-router";

type AuthShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  heading: string;
  intro: string;
  mode: "login" | "register";
};

export function AuthShell({
  children,
  eyebrow,
  heading,
  intro,
  mode,
}: AuthShellProps) {
  const isRegister = mode === "register";
  const prompt =
    mode === "login"
      ? { text: "New to HYRD?", link: "Create an account", to: "/register" }
      : { text: "Already tracking roles?", link: "Log in", to: "/login" };

  return (
    <main className="auth-page bg-white text-hyrd-text">
      <div className="auth-layout">
        <section className="auth-visual-panel" aria-hidden="true">
          <img
            alt=""
            className="auth-artwork"
            height="1200"
            src="/brand/hyrd-auth-geometric.svg"
            width="1200"
          />
        </section>

        <section className="auth-content-panel">
          <div
            className={`auth-content ${isRegister ? "auth-content-register" : ""}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-hyrd-gold-dark">
              {eyebrow}
            </p>
            <div className="auth-title-row">
              <h1 className="font-serif text-3xl leading-tight text-hyrd-text">
                {heading}
              </h1>
              <Link
                aria-label="HYRD home"
                className="auth-brand-lockup inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                to="/"
              >
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-7 object-contain"
                  height="28"
                  src="/brand/hyrd-mark.png.png"
                  width="28"
                />
                <span className="font-serif text-lg font-semibold tracking-[0.14em] text-hyrd-navy">
                  HYRD
                </span>
              </Link>
            </div>
            <p className="mt-2 text-sm leading-6 text-hyrd-muted">{intro}</p>
            <div className={isRegister ? "mt-2" : "mt-5"}>{children}</div>
            <p className="auth-switch-link text-sm text-hyrd-muted">
              {prompt.text}{" "}
              <Link
                className="font-semibold text-hyrd-gold-dark underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-hyrd-gold"
                to={prompt.to}
              >
                {prompt.link}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
