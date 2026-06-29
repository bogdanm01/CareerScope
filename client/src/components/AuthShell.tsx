import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  asideTitle: string;
  asideText: string;
};

export const AuthShell = ({
  eyebrow,
  title,
  description,
  children,
  asideTitle,
  asideText,
}: AuthShellProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e0e2e6] px-4 py-6 text-foreground sm:px-8 sm:py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-[#c9ccd1] bg-white shadow-[0_24px_70px_rgba(24,29,38,0.16)] lg:min-h-[680px] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative flex min-h-60 flex-col justify-between overflow-hidden bg-[#181d26] p-6 text-white sm:p-8 lg:min-h-full lg:p-10">
          <div className="relative z-10 text-lg font-medium tracking-[-0.01em]">
            {eyebrow}
          </div>

          <div className="relative z-10 hidden flex-1 items-center justify-start py-9 lg:flex">
            <div className="relative grid w-full gap-3">
              <div className="absolute bottom-8 left-[41px] top-8 w-px bg-white/20" />

              {[
                {
                  label: "Create profile",
                  description: "Showcase your experience and skills.",
                  color: "bg-[#f5e9d4] text-[#181d26]",
                  path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H5Z",
                },
                {
                  label: "Apply",
                  description: "Find relevant roles and submit.",
                  color: "bg-[#fcab79] text-[#181d26]",
                  path: "M7 4h10v16H7zm2 4h6M9 12h6M9 16h4",
                },
                {
                  label: "Interview",
                  description: "Move through the hiring process.",
                  color: "bg-[#a8d8c4] text-[#181d26]",
                  path: "M5 6h14v10H9l-4 4V6Zm4 4h6M9 13h4",
                },
                {
                  label: "Get hired",
                  description: "Start the next step in your career.",
                  color: "bg-white text-[#181d26]",
                  path: "M4 8h16v11H4V8Zm5 0V5h6v3M9 13l2 2 4-4",
                },
              ].map((step) => (
                <div
                  key={step.label}
                  className="relative flex min-h-[82px] items-center gap-4 rounded-xl border border-white/10 bg-[#202732] px-4 py-3.5"
                >
                  <div
                    className={`relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg ${step.color}`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-[25px] w-[25px] fill-none stroke-current stroke-[1.7]"
                    >
                      <path
                        d={step.path}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-medium leading-6 text-white">
                      {step.label}
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-white/50">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 max-w-sm">
            <p className="text-xl leading-[1.2] text-gray-100 sm:text-2xl">
              Your career workflow, organized in one place.
            </p>
          </div>
        </aside>

        <main className="flex items-center justify-center bg-white px-6 py-12 text-[#181d26] sm:px-12 lg:px-16">
          <div className="w-full max-w-[520px]">
            <div className="mb-10">
              <h1 className="auth-title text-4xl leading-[1.08] text-foreground sm:text-5xl">
                {title}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-foreground-500">
                {description}
              </p>
            </div>

            {(asideTitle || asideText) && (
              <div className="mb-6">
                {asideTitle && (
                  <h2 className="text-lg font-medium text-foreground">
                    {asideTitle}
                  </h2>
                )}
                {asideText && (
                  <p className="mt-1 text-sm leading-6 text-foreground-500">
                    {asideText}
                  </p>
                )}
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
