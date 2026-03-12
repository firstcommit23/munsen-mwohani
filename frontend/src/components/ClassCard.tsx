import { MapPin, Clock, Calendar, Users, Layers } from "lucide-react";
import type { ClassItem } from "../types";

const BRAND_COLORS: Record<string, string> = {
  emart: "bg-yellow-100 text-yellow-700",
  lotte: "bg-red-100 text-red-600",
};

const BRAND_LABELS: Record<string, string> = {
  emart: "이마트",
  lotte: "롯데마트",
};

const TARGET_COLORS: Record<string, string> = {
  성인: "bg-blue-50 text-blue-600",
  어린이: "bg-green-50 text-green-600",
  영아: "bg-purple-50 text-purple-600",
};

function formatPrice(price: number | null): string {
  if (price === null) return "가격 문의";
  if (price === 0) return "무료";
  return price.toLocaleString("ko-KR") + "원";
}

function parseDays(daysJson: string | null): string {
  if (!daysJson) return "";
  try {
    const arr: string[] = JSON.parse(daysJson);
    return arr.join("·");
  } catch {
    return daysJson;
  }
}

interface Props {
  item: ClassItem;
}

export default function ClassCard({ item }: Props) {
  const days = parseDays(item.days);
  const hasSchedule = item.start_time || days || item.start_date;

  return (
    <article
      className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden animate-slide-up cursor-pointer"
      onClick={() => item.detail_url && window.open(item.detail_url, "_blank")}
    >
      <div className="flex gap-0">
        {/* 썸네일 */}
        <div className="w-[100px] h-[100px] shrink-0 bg-slate-100 relative overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <Layers size={24} className="text-slate-300" />
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="flex-1 p-3 min-w-0">
          {/* 상단: 지점 + 거리 + 브랜드 */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${BRAND_COLORS[item.store_brand] ?? "bg-slate-100 text-slate-600"}`}>
              {BRAND_LABELS[item.store_brand] ?? item.store_brand}
            </span>
            <div className="flex items-center gap-0.5 text-xs text-slate-500 font-medium">
              <MapPin size={10} className="text-slate-400" />
              <span className="truncate max-w-[120px]">{item.store_name.replace(/^(이마트|롯데마트)\s*/, "")}</span>
              {item.distance_km !== null && (
                <span className="text-slate-400">({item.distance_km}km)</span>
              )}
            </div>
            {item.class_type === "원데이" && (
              <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-500">
                원데이
              </span>
            )}
          </div>

          {/* 카테고리 */}
          {item.category && (
            <p className="text-[11px] text-slate-400 mb-0.5 font-medium">{item.category}</p>
          )}

          {/* 제목 */}
          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mb-2">
            {item.title}
          </p>

          {/* 메타 정보 */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
            <span className="text-sm font-bold text-blue-600">{formatPrice(item.price)}</span>

            {item.target && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${TARGET_COLORS[item.target] ?? "bg-slate-100 text-slate-600"}`}>
                <Users size={9} className="inline mr-0.5" />
                {item.target}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 하단 일정 바 */}
      {hasSchedule && (
        <div className="border-t border-slate-100 px-3 py-2 flex items-center gap-3 text-xs text-slate-500">
          {days && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-slate-400" />
              {days} {item.start_time && `${item.start_time}${item.end_time ? ` ~ ${item.end_time}` : ""}`}
            </span>
          )}
          {(item.start_date || item.end_date) && (
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-slate-400" />
              {item.start_date} ~ {item.end_date}
              {item.total_sessions && ` · ${item.total_sessions}회`}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
