export default function PowerBiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'default'
}) {
  const tones = {
    default: 'bg-white text-slate-950 ring-slate-200',
    dark: 'bg-slate-950 text-white ring-slate-900',
    red: 'bg-[var(--color-primary)] text-white ring-red-500',
    blue: 'bg-[var(--color-secondary)] text-white ring-blue-900',
    soft: 'bg-slate-50 text-slate-950 ring-slate-200'
  };

  return (
    <article className={`rounded-3xl p-5 shadow-sm ring-1 ${tones[tone] || tones.default}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={tone === 'default' || tone === 'soft'
            ? 'text-xs font-black uppercase tracking-widest text-slate-400'
            : 'text-xs font-black uppercase tracking-widest text-white/70'
          }>
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-black tracking-tight">
            {value}
          </h3>

          {subtitle ? (
            <p className={tone === 'default' || tone === 'soft'
              ? 'mt-2 text-sm font-semibold text-slate-500'
              : 'mt-2 text-sm font-semibold text-white/75'
            }>
              {subtitle}
            </p>
          ) : null}
        </div>

        {Icon ? (
          <div className={tone === 'default' || tone === 'soft'
            ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700'
            : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white'
          }>
            <Icon size={24} />
          </div>
        ) : null}
      </div>
    </article>
  );
}