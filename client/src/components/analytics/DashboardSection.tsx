export const DashboardSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="grid gap-4 pt-3 first:pt-0 w-full">
    <div>
      <h2 className="text-xl font-medium tracking-[-0.01em] text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm leading-6 text-default-500">
          {description}
        </p>
      )}
    </div>
    {children}
  </section>
);
