export default function ReportPanel({
  title,
  subtitle,
  children,
  right
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-slate-950">
            {title}
          </h3>

          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        {right ? (
          <div className="min-w-0 shrink-0">
            {right}
          </div>
        ) : null}
      </div>

      <div className="min-w-0">
        {children}
      </div>
    </section>
  );
}