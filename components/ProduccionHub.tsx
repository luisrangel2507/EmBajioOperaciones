"use client";

import { useState } from "react";
import OeeDashboard, { type OeeDayRow } from "@/components/OeeDashboard";
import OrdersDashboard, { type OrderRow, type OptionRow } from "@/components/OrdersDashboard";
import ScrapPanel, { type ScrapRow, type OrderOption } from "@/components/ScrapPanel";
import ScrapTrendChart, { type DailyActual } from "@/components/ScrapTrendChart";
import RotationGrid from "@/components/RotationGrid";

type TabKey = "oee" | "ordenes" | "scrap" | "rotacion";

const TAB_ORDER: { key: TabKey; label: string; description: string }[] = [
  {
    key: "oee",
    label: "OEE - Produccion planeada vs real",
    description: "Disponibilidad, rendimiento y calidad por dia, con el plan capturable.",
  },
  {
    key: "ordenes",
    label: "Ordenes en produccion",
    description: "Ordenes pendientes o en proceso; carga nuevas ordenes directamente aqui.",
  },
  {
    key: "scrap",
    label: "Desechos / Scrap",
    description: "Registro de piezas desechadas por estacion y motivo, con tendencia de % desecho.",
  },
  {
    key: "rotacion",
    label: "Rotacion de estaciones",
    description: "Que inspector cubre cada estacion por horario. Se guarda automaticamente.",
  },
];

export default function ProduccionHub({
  oeeDays,
  orders,
  clients,
  inspectors,
  scrapRecords,
  scrapOrders,
  dailyActual,
}: {
  oeeDays: OeeDayRow[];
  orders: OrderRow[];
  clients: OptionRow[];
  inspectors: OptionRow[];
  scrapRecords: ScrapRow[];
  scrapOrders: OrderOption[];
  dailyActual: DailyActual[];
}) {
  const [tab, setTab] = useState<TabKey | null>(null);

  if (tab === null) {
    return (
      <div className="overflow-hidden rounded-xl border border-kraft-200 bg-white shadow-sm">
        {TAB_ORDER.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex w-full items-center justify-between gap-3 border-b border-kraft-100 px-4 py-3.5 text-left transition-colors duration-200 last:border-b-0 hover:bg-olive-400/8"
          >
            <div>
              <p className="text-sm font-bold text-ink-700">{t.label}</p>
              <p className="text-xs text-ink-500/55">{t.description}</p>
            </div>
            <span className="text-lg text-ink-500/30">›</span>
          </button>
        ))}
      </div>
    );
  }

  const current = TAB_ORDER.find((t) => t.key === tab);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setTab(null)}
        className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-ink-700/60 uppercase transition-colors duration-200 hover:text-ink-700"
      >
        ‹ Volver a Produccion
      </button>

      <h2 className="text-sm font-bold tracking-wide text-ink-700 uppercase">{current?.label}</h2>

      {tab === "oee" && <OeeDashboard initialDays={oeeDays} />}

      {tab === "ordenes" && (
        <OrdersDashboard
          initialOrders={orders}
          clients={clients}
          inspectors={inspectors}
          defaultStatus="pendiente,en_proceso"
        />
      )}

      {tab === "scrap" && (
        <div className="space-y-6">
          <ScrapPanel initialRecords={scrapRecords} clients={clients} orders={scrapOrders} />
          <ScrapTrendChart records={scrapRecords} dailyActual={dailyActual} clients={clients} />
        </div>
      )}

      {tab === "rotacion" && <RotationGrid inspectors={inspectors} />}
    </div>
  );
}
