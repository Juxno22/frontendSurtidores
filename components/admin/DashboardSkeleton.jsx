export default function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="h-96 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200" />
        <div className="h-96 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200" />
      </div>
    </div>
  );
}