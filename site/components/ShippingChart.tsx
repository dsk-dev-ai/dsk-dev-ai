import { formatMonth, shortMonth, type MonthCount } from "@/lib/data";

export default function ShippingChart({ months }: { months: MonthCount[] }) {
  if (months.length === 0) return null;
  const max = Math.max(...months.map((entry) => entry.count), 1);
  const total = months.reduce((sum, entry) => sum + entry.count, 0);
  const label = months
    .map((entry) => `${formatMonth(entry.month)}: ${entry.count}`)
    .join(", ");

  return (
    <figure className="card flex flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Momentum</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight">Shipping cadence</h2>
          <p className="mt-1 text-sm text-muted">Merged pull requests, last 12 months</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-bold tracking-tight text-ink">{total}</div>
          <div className="text-xs uppercase tracking-wider text-faint">merged</div>
        </div>
      </div>

      <div className="mt-7 flex h-40 items-end gap-1.5" role="img" aria-label={`Merged pull requests by month - ${label}`}>
        {months.map((entry, index) => {
          const height = Math.max(3, (entry.count / max) * 100);
          return (
            <div key={entry.month} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t-[4px] bg-accent/75 transition-colors group-hover:bg-accent"
                style={{ height: `${height}%`, minHeight: entry.count > 0 ? 4 : 2 }}
              />
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[10px] text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {entry.count}
              </div>
              <span className="mt-2 h-3 text-center text-[9px] uppercase tracking-wide text-faint">
                {index % 2 === 0 ? shortMonth(entry.month) : ""}
              </span>
            </div>
          );
        })}
      </div>

      <figcaption className="mt-4 border-t border-line pt-3 text-xs text-faint">
        Source: GitHub API · includes public, org, and private aggregate counts
      </figcaption>
    </figure>
  );
}
