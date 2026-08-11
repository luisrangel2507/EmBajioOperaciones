export const QUALITY_CATEGORIES = {
  part_specifications: {
    label: "Especificaciones de Parte",
    prefix: "ESP",
    variant: "default",
  },
  process_flow_charts: {
    label: "Diagramas de Flujo de Proceso",
    prefix: "DFP",
    variant: "default",
  },
  checksheets: {
    label: "Hojas de Verificacion",
    prefix: "CHK",
    variant: "default",
  },
  sppap: {
    label: "SPPAP",
    prefix: "SPPAP",
    variant: "default",
  },
  deviations: {
    label: "Desviaciones",
    prefix: "DESV",
    variant: "dated",
  },
  fmea: {
    label: "FMEA",
    prefix: "FMEA",
    variant: "fmea",
  },
  ppap: {
    label: "PPAP",
    prefix: "PPAP",
    variant: "default",
  },
  gage_control: {
    label: "Control de Calibres",
    prefix: "CAL",
    variant: "dated",
  },
  supplier_quality: {
    label: "Calidad de Proveedores",
    prefix: "PROV",
    variant: "default",
  },
  shared_practices: {
    label: "Practicas Compartidas",
    prefix: "PRAC",
    variant: "default",
  },
} as const;

export type QualityCategory = keyof typeof QUALITY_CATEGORIES;

export function isQualityCategory(value: string): value is QualityCategory {
  return value in QUALITY_CATEGORIES;
}
