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
      <div className="relative h-72 sm:h-[calc(100vh-11rem)] sm:max-h-[52rem] sm:min-h-[34rem]">
        <Image
          src="/images/dashboard-hero.webp"
          alt=""
          aria-hidden="true"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-700/10 via-ink-700/15 to-ink-700/85" />

        <a
          href="#gadgets"
          className="group absolute bottom-36 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5"
        >
          <span className="rounded-full bg-ink-700/55 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-sm transition-colors duration-300 [text-shadow:0_1px_4px_rgba(0,0,0,0.6)] group-hover:bg-ink-700/75">
            Ir a gadgets
          </span>
          <span className="relative flex h-14 w-14 animate-bounce items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke="white"
              strokeWidth={1.75}
              strokeLinejoin="round"
              className="absolute inset-0 h-full w-full text-white opacity-80 drop-shadow-[0_10px_18px_rgba(0,0,0,0.4)] transition-opacity duration-300 group-hover:opacity-100"
            >
              <path d="M24 4 43 15v18L24 44 5 33V15Z" fill="rgba(255,255,255,0.1)" />
              <path
                d="M24 4v18M24 22 5 15M24 22l19-7"
                strokeLinecap="round"
                opacity={0.55}
              />
            </svg>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative h-4 w-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </a>
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
      className={`flex-1 rounded-lg border bg-ink-700/60 px-3.5 py-2.5 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-ink-700/75 ${accent}`}
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
