import type { ReactNode } from 'react';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  asideTitle: string;
  asideText: string;
};

export const AuthShell = ({ eyebrow, title, description, children, asideTitle, asideText }: AuthShellProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center gap-6 px-6 py-16 sm:px-10 lg:px-16">
          <div className="inline-flex w-fit rounded-full border border-divider bg-content2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-foreground-600">
            {eyebrow}
          </div>
          <h1 className="max-w-[10ch] text-5xl leading-none tracking-tight text-foreground sm:text-6xl lg:text-7xl">{title}</h1>
          <p className="max-w-2xl text-base leading-7 text-foreground-500 sm:text-lg">{description}</p>

          <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-divider bg-content1 p-5">
              <strong className="mb-3 block text-sm font-semibold text-foreground">Fast access</strong>
              <span className="block text-sm leading-6 text-foreground-500">
                Sign in, create an account, or recover your password in one flow.
              </span>
            </div>
            <div className="rounded-3xl border border-divider bg-content1 p-5">
              <strong className="mb-3 block text-sm font-semibold text-foreground">Secure sessions</strong>
              <span className="block text-sm leading-6 text-foreground-500">
                Cookie-backed sessions are restored from the backend on refresh.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-6 sm:px-6 lg:px-6">
          <div className="w-full max-w-[560px] rounded-3xl border border-divider bg-content1 p-6 shadow-medium sm:p-8">
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">{asideTitle}</h2>
              <p className="text-sm leading-6 text-foreground-500">{asideText}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
