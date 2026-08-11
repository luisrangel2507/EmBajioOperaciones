"use client";

import { useState } from "react";
import ControlPlansPanel, { type ControlPlanRow } from "@/components/ControlPlansPanel";
import CarsPanel, { type CarRow } from "@/components/CarsPanel";

interface ClientOption {
  id: number;
  name: string;
}

export default function QualityHub({
  controlPlans,
  cars,
  clients,
}: {
  controlPlans: ControlPlanRow[];
  cars: CarRow[];
  clients: ClientOption[];
}) {
  const [tab, setTab] = useState<"planes" | "cars">("planes");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-kraft-200">
        <TabButton active={tab === "planes"} onClick={() => setTab("planes")}>
          Planes de control
        </TabButton>
        <TabButton active={tab === "cars"} onClick={() => setTab("cars")}>
          CARs (8D)
        </TabButton>
      </div>

      {tab === "planes" ? (
        <ControlPlansPanel initialPlans={controlPlans} clients={clients} />
      ) : (
        <CarsPanel initialCars={cars} clients={clients} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm font-bold tracking-wide uppercase transition ${
        active
          ? "border-olive-500 text-ink-700"
          : "border-transparent text-ink-700/50 hover:text-ink-700"
      }`}
    >
      {children}
    </button>
  );
}
