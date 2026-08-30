export const SCRAP_REASONS = [
  "Oxidacion",
  "Rayaduras",
  "Golpe / Abolladura",
  "Fuera de especificacion",
  "Rebaba",
  "Porosidad",
  "Error de proceso",
  "Material defectuoso",
  "Manejo inadecuado",
  "Otro",
] as const;

export type ScrapReason = (typeof SCRAP_REASONS)[number];
