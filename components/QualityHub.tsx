"use client";

import { useState } from "react";
import ControlPlansPanel, { type ControlPlanRow } from "@/components/ControlPlansPanel";
import CarsPanel, { type CarRow } from "@/components/CarsPanel";
import QualityRecordsPanel from "@/components/QualityRecordsPanel";
import { QUALITY_CATEGORIES, type QualityCategory } from "@/lib/qualityCategories";

interface ClientOption {
  id: number;
  name: string;
}

type TabKey = "planes" | "cars" | QualityCategory;

const TAB_ORDER: { key: TabKey; label: string; description: string }[] = [
  {
    key: "planes",
    label: "Planes de Control",
    description: "Caracteristicas, metodos de control y plan de reaccion por pieza.",
  },
  {
    key: "part_specifications",
    label: QUALITY_CATEGORIES.part_specifications.label,
    description: "Especificaciones tecnicas y de diseno por pieza.",
  },
  {
    key: "supplier_quality",
    label: QUALITY_CATEGORIES.supplier_quality.label,
    description: "Seguimiento a la calidad de proveedores.",
  },
  {
    key: "cars",
    label: "Control de Problemas / CAR Log",
    description: "Reportes de accion correctiva con metodologia 8D.",
  },
  {
    key: "process_flow_charts",
    label: QUALITY_CATEGORIES.process_flow_charts.label,
    description: "Diagramas del flujo de proceso de fabricacion o inspeccion.",
  },
  {
    key: "checksheets",
    label: QUALITY_CATEGORIES.checksheets.label,
    description: "Formatos de verificacion en piso.",
  },
  {
    key: "sppap",
    label: QUALITY_CATEGORIES.sppap.label,
    description: "Aprobacion de proceso de produccion de proveedor.",
  },
  {
    key: "deviations",
    label: QUALITY_CATEGORIES.deviations.label,
    description: "Desviaciones autorizadas con fecha de vencimiento.",
  },
  {
    key: "fmea",
    label: QUALITY_CATEGORIES.fmea.label,
    description: "Analisis de modo y efecto de falla, con RPN.",
  },
  {
    key: "ppap",
    label: QUALITY_CATEGORIES.ppap.label,
    description: "Proceso de aprobacion de partes de produccion.",
  },
  {
    key: "gage_control",
    label: QUALITY_CATEGORIES.gage_control.label,
    description: "Calibracion y vigencia de instrumentos de medicion.",
  },
  {
    key: "shared_practices",
    label: QUALITY_CATEGORIES.shared_practices.label,
    description: "Buenas practicas compartidas entre lineas o plantas.",
  },
];

export default function QualityHub({
  controlPlans,
  cars,
  clients,
}: {
  controlPlans: ControlPlanRow[];
  cars: CarRow[];
  clients: ClientOption[];
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
            <span className="text-lg text-ink-500/30 transition-transform duration-200 group-hover:translate-x-0.5">
              ›
            </span>
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
        ‹ Volver a Calidad
      </button>

      <h2 className="text-sm font-bold tracking-wide text-ink-700 uppercase">{current?.label}</h2>

      {tab === "planes" && <ControlPlansPanel initialPlans={controlPlans} clients={clients} />}
      {tab === "cars" && <CarsPanel initialCars={cars} clients={clients} />}
      {tab !== "planes" && tab !== "cars" && (
        <QualityRecordsPanel category={tab} clients={clients} />
      )}
    </div>
  );
}
