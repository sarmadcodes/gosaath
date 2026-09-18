import type { Area } from "@/data/types";

/**
 * Karachi areas used for matching. Area-level only: the product never asks
 * for or stores an exact home address.
 */
export const areas: Area[] = [
  { id: "area-dha-2", name: "DHA Phase 2", city: "Karachi" },
  { id: "area-dha-5", name: "DHA Phase 5", city: "Karachi" },
  { id: "area-dha-6", name: "DHA Phase 6", city: "Karachi" },
  { id: "area-dha-8", name: "DHA Phase 8", city: "Karachi" },
  { id: "area-clifton", name: "Clifton", city: "Karachi" },
  { id: "area-gulshan", name: "Gulshan-e-Iqbal", city: "Karachi" },
  { id: "area-johar", name: "Gulistan-e-Johar", city: "Karachi" },
  { id: "area-nazimabad", name: "North Nazimabad", city: "Karachi" },
  { id: "area-pechs", name: "PECHS", city: "Karachi" },
  { id: "area-bahadurabad", name: "Bahadurabad", city: "Karachi" },
  { id: "area-tariq-road", name: "Tariq Road", city: "Karachi" },
  { id: "area-malir", name: "Malir", city: "Karachi" },
  { id: "area-saddar", name: "Saddar", city: "Karachi" },
  { id: "area-korangi", name: "Korangi", city: "Karachi" },
  { id: "area-nk", name: "North Karachi", city: "Karachi" },
  { id: "area-fbarea", name: "Federal B Area", city: "Karachi" },
];

export function areaById(id: string) {
  return areas.find((a) => a.id === id);
}

export function areaName(id: string) {
  return areaById(id)?.name ?? "";
}
