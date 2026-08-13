export interface GadgetStats {
  ordenesPendientes: number;
  ordenesEnProceso: number;
  ordenesCompletadas: number;
  carsAbiertos: number;
  controlPlans: number;
  qualityRecords: number;
  turnosSemana: number;
  piezasSemana: number;
  rotacionesSemana: number;
}

export default function DashboardGadgets({ stats }: { stats: GadgetStats }) {
  return (
    <div id="gadgets" className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold tracking-wide text-ink-700 uppercase">Gadgets</h2>
        <p className="text-xs text-ink-500/60">
          Datos rapidos de cada modulo, actualizados al cargar el panel.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <GadgetGroup label="Ordenes" accent="border-olive-400/40">
          <Bubble value={stats.ordenesPendientes} label="Pendientes" />
          <Bubble value={stats.ordenesEnProceso} label="En proceso" />
          <Bubble value={stats.ordenesCompletadas} label="Completadas" />
        </GadgetGroup>

        <GadgetGroup label="Calidad" accent="border-red-400/40">
          <Bubble value={stats.carsAbiertos} label="CARs abiertos" />
          <Bubble value={stats.controlPlans} label="Planes de control" />
          <Bubble value={stats.qualityRecords} label="Registros" />
        </GadgetGroup>

        <GadgetGroup label="RH / Turnos" accent="border-kraft-400/50">
          <Bubble value={stats.turnosSemana} label="Turnos esta semana" />
          <Bubble value={stats.piezasSemana} label="Piezas inspeccionadas" />
        </GadgetGroup>

        <GadgetGroup label="Produccion" accent="border-ink-500/25">
          <Bubble value={stats.rotacionesSemana} label="Inspectores en rotacion" />
        </GadgetGroup>
      </div>
    </div>
  );
}

function GadgetGroup({
  label,
  accent,
  children,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-xl border bg-white p-4 shadow-sm ${accent}`}
    >
      <p className="text-[10px] font-bold tracking-widest text-ink-500/50 uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

function Bubble({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-0.5 rounded-full bg-kraft-50 px-3 py-3 text-center ring-1 ring-kraft-200">
      <p className="text-xl font-black tracking-tight text-ink-700">{value}</p>
      <p className="text-[9px] leading-tight font-semibold text-ink-500/60 uppercase">
        {label}
      </p>
    </div>
  );
}
