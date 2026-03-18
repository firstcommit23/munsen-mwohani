import axios from "axios";
import type { Filters, SearchResponse, UserLocation } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function searchClasses(
  location: UserLocation,
  filters: Filters,
  page = 1,
  storeName?: string,
  pageSize = 20,
): Promise<SearchResponse> {
  const params: Record<string, string | number> = {
    lat: location.lat,
    lng: location.lng,
    radius: filters.radius,
    page,
    page_size: pageSize,
  };

  if (filters.targets.length) params.targets = filters.targets.join(",");
  if (filters.days.length) params.days = filters.days.join(",");
  if (filters.timeSlots.length) params.time_slots = filters.timeSlots.join(",");
  if (filters.classTypes.length) params.class_types = filters.classTypes.join(",");
  if (filters.keyword.trim()) params.keyword = filters.keyword.trim();
  if (storeName) params.store_name = storeName;
  if (filters.babyBirthDate && filters.targets.includes("영아")) {
    const [y, m] = filters.babyBirthDate.split("-").map(Number);
    const now = new Date();
    const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
    if (months >= 0) params.baby_months = months;
  }

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
