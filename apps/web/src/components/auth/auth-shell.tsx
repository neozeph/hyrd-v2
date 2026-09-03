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
    <main className="min-h-screen bg-white text-hyrd-text">
      <div className="grid min-h-screen w-full lg:grid-cols-[40%_60%]">
        <section className="hidden bg-hyrd-navy px-10 py-12 text-white lg:flex lg:flex-col">
          <div className="text-xl font-semibold tracking-[0.14em]">HYRD</div>
          <div className="my-auto max-w-sm">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#d3b57d]">
              Personal workspace
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-tight">
              Keep every opportunity clear enough to act on.
            </h2>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              Track roles, interviews, offers, and follow-ups in one calm system
              designed for focused job-search decisions.
            </p>
          </div>
        </section>

        <section
          className={`flex min-h-screen items-center px-5 sm:px-8 lg:px-14 ${
            isRegister ? "py-5 sm:py-6" : "py-8"
          }`}
        >
          <div className="mx-auto w-full max-w-[500px]">
            <div className={isRegister ? "mb-5 lg:hidden" : "mb-9 lg:hidden"}>
              <div className="text-xl font-semibold tracking-[0.14em] text-hyrd-navy">
                HYRD
              </div>
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-hyrd-gold-dark">
              {eyebrow}
            </p>
            <h1
              className={`font-serif text-3xl leading-tight text-hyrd-text ${
                isRegister ? "mt-2" : "mt-3"
              }`}
            >
              {heading}
            </h1>
            <p
              className={`text-sm text-hyrd-muted ${
                isRegister ? "mt-2 leading-5" : "mt-3 leading-6"
              }`}
            >
              {intro}
            </p>
            <div className={isRegister ? "mt-4" : "mt-7"}>{children}</div>
            <p className={`${isRegister ? "mt-3" : "mt-6"} text-sm text-hyrd-muted`}>
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
