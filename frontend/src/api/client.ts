import axios from "axios";
import type { Filters, SearchResponse, UserLocation } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function searchClasses(
  location: UserLocation,
  filters: Filters,
  page = 1
): Promise<SearchResponse> {
  const params: Record<string, string | number> = {
    lat: location.lat,
    lng: location.lng,
    radius: filters.radius,
    page,
  };

  if (filters.targets.length) params.targets = filters.targets.join(",");
  if (filters.days.length) params.days = filters.days.join(",");
  if (filters.timeSlots.length) params.time_slots = filters.timeSlots.join(",");
  if (filters.classTypes.length) params.class_types = filters.classTypes.join(",");
  if (filters.keyword.trim()) params.keyword = filters.keyword.trim();

  const { data } = await axios.get<SearchResponse>(`${BASE}/api/search`, { params });
  return data;
}

export async function getLastUpdated(): Promise<string | null> {
  try {
    const { data } = await axios.get<{ last_updated: string | null }>(`${BASE}/api/last-updated`);
    return data.last_updated;
  } catch {
    return null;
  }
}
