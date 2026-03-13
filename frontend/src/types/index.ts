export interface ClassItem {
  id: number;
  store_id: number;
  store_name: string;
  store_brand: "emart" | "lotte";
  distance_km: number | null;
  category: string | null;
  title: string;
  description: string | null;
  target: "성인" | "어린이" | "영아";
  price: number | null;
  days: string | null;        // JSON 배열 문자열 e.g. '["월","수"]'
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  end_date: string | null;
  total_sessions: number | null;
  class_type: "정규" | "원데이";
  age_range: string | null;
  image_url: string | null;
  detail_url: string | null;
  last_updated: string | null;
}

export interface SearchResponse {
  total: number;
  page: number;
  page_size: number;
  results: ClassItem[];
  category_summary: Record<string, number>;
}

export type Target = "성인" | "어린이" | "영아";
export type DayOfWeek = "월" | "화" | "수" | "목" | "금" | "토" | "일";
export type TimeSlot = "오전" | "오후" | "17시이후";
export type ClassType = "정규" | "원데이";
export type RadiusOption = 1 | 5 | 10;

export interface Filters {
  radius: RadiusOption;
  targets: Target[];
  days: DayOfWeek[];
  timeSlots: TimeSlot[];
  classTypes: ClassType[];
  keyword: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}
