import Image from "next/image";
import type { OrderRow } from "@/components/OrdersDashboard";

const OPEN_STATUSES = new Set(["pendiente", "en_proceso"]);

export default function DashboardHero({ orders }: { orders: OrderRow[] }) {
  const total = orders.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soonThreshold = new Date(today);
  soonThreshold.setDate(soonThreshold.getDate() + 3);

  const urgent = orders
    .filter((o) => {
      if (!OPEN_STATUSES.has(o.status) || !o.due_date) return false;
      const due = new Date(o.due_date);
      return due <= soonThreshold;
    })
    .sort(
      (a, b) =>
        new Date(a.due_date as string).getTime() -
        new Date(b.due_date as string).getTime()
    );

  const activeInspectors = Array.from(
    new Set(
      orders
        .filter((o) => OPEN_STATUSES.has(o.status) && o.inspector_name)
        .map((o) => o.inspector_name as string)
    )
  );

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-kraft-200 shadow-sm">
      <div className="relative h-48 sm:h-[26rem]">
        <Image
          src="/images/dashboard-hero.webp"
          alt=""
          aria-hidden="true"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-700/10 via-ink-700/15 to-ink-700/85" />

        <div className="absolute top-4 left-5">
          <span className="text-[10px] font-bold tracking-[0.3em] text-white/90 uppercase [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
            ◈ Panel de administracion
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-ink-700 p-4 sm:absolute sm:inset-x-5 sm:bottom-3.5 sm:flex-row sm:gap-3 sm:bg-transparent sm:p-0">
        <HeroStat label="Ordenes totales" value={total} accent="border-olive-400/40" />
        <HeroStat label="Vencimiento proximo" value={urgent.length} accent="border-red-400/40">
          {urgent.length > 0 ? (
            <div className="mt-1 flex flex-col gap-0.5 border-l border-red-400/30 pl-2">
              {urgent.slice(0, 2).map((o) => (
                <span key={o.id} className="text-[10.5px] text-white/75">
                  {o.order_number} · {formatDate(o.due_date)}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[10.5px] text-white/45">Sin vencimientos cercanos</p>
          )}
        </HeroStat>
        <HeroStat label="Inspectores activos" value={activeInspectors.length} accent="border-white/15">
          {activeInspectors.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {activeInspectors.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9.5px] text-white/75"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[10.5px] text-white/45">Sin inspectores activos</p>
          )}
        </HeroStat>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  accent,
  children,
}: {
  label: string;
  value: number;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`flex-1 rounded-lg border bg-ink-700/60 px-3.5 py-2.5 backdrop-blur-md ${accent}`}
    >
      <p className="text-2xl font-black tracking-tight text-olive-300">{value}</p>
      <p className="text-[9.5px] font-bold tracking-widest text-white/65 uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}
