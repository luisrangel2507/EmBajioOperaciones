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

const TAB_ORDER: { key: TabKey; label: string }[] = [
  { key: "planes", label: "Planes de Control" },
  { key: "part_specifications", label: QUALITY_CATEGORIES.part_specifications.label },
  { key: "supplier_quality", label: QUALITY_CATEGORIES.supplier_quality.label },
  { key: "cars", label: "Control de Problemas / CAR Log" },
  { key: "process_flow_charts", label: QUALITY_CATEGORIES.process_flow_charts.label },
  { key: "checksheets", label: QUALITY_CATEGORIES.checksheets.label },
  { key: "sppap", label: QUALITY_CATEGORIES.sppap.label },
  { key: "deviations", label: QUALITY_CATEGORIES.deviations.label },
  { key: "fmea", label: QUALITY_CATEGORIES.fmea.label },
  { key: "ppap", label: QUALITY_CATEGORIES.ppap.label },
  { key: "gage_control", label: QUALITY_CATEGORIES.gage_control.label },
  { key: "shared_practices", label: QUALITY_CATEGORIES.shared_practices.label },
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
  const [tab, setTab] = useState<TabKey>("planes");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-kraft-200">
        {TAB_ORDER.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-xs font-bold tracking-wide whitespace-nowrap uppercase transition ${
              tab === t.key
                ? "border-olive-500 text-ink-700"
                : "border-transparent text-ink-700/50 hover:text-ink-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "planes" && <ControlPlansPanel initialPlans={controlPlans} clients={clients} />}
      {tab === "cars" && <CarsPanel initialCars={cars} clients={clients} />}
      {tab !== "planes" && tab !== "cars" && (
        <QualityRecordsPanel category={tab} clients={clients} />
      )}
    </div>
  );
}
