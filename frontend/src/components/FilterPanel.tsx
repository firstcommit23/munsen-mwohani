import { MapPin, Search, RotateCcw } from "lucide-react";
import type {
  Filters, Target, DayOfWeek, TimeSlot, ClassType, RadiusOption, UserLocation,
} from "../types";

interface Props {
  location: UserLocation;
  filters: Filters;
  onChange: (f: Filters) => void;
  onSearch: () => void;
  loading: boolean;
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

const TARGETS: Target[] = ["성인", "어린이", "영아"];
const DAYS: DayOfWeek[] = ["월", "화", "수", "목", "금", "토", "일"];
const TIME_SLOTS: TimeSlot[] = ["오전", "오후", "17시이후"];
const CLASS_TYPES: ClassType[] = ["정규", "원데이"];

const TIME_LABELS: Record<TimeSlot, string> = {
  오전: "오전",
  오후: "오후",
  "17시이후": "17시 이후",
};

export default function FilterPanel({ location, filters, onChange, onSearch, loading }: Props) {
  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  const isAllDays = filters.days.length === DAYS.length;
  const toggleAllDays = () =>
    set({ days: isAllDays ? [] : [...DAYS] });

  const handleReset = () =>
    onChange({
      radius: 10,
      targets: [...TARGETS],
      days: [...DAYS],
      timeSlots: [...TIME_SLOTS],
      classTypes: [...CLASS_TYPES],
      keyword: "",
      babyBirthDate: "",
    });

  return (
    <div className="bg-white rounded-2xl shadow-card mx-4 mt-4 overflow-hidden">
      {/* 위치 */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-blue-600" />
            <span className="font-semibold text-slate-900 text-sm">{location.label}</span>
          </div>
          <div className="flex gap-2">
            {([1, 5, 10] as RadiusOption[]).map((r) => (
              <button
                key={r}
                onClick={() => set({ radius: r })}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                  filters.radius === r
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"
                }`}
              >
                {r}km 이내
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 필터 본체 */}
      <div className="px-5 py-4 space-y-4">
        {/* 대상 */}
        <FilterRow label="대상">
          {TARGETS.map((t) => (
            <Pill
              key={t}
              active={filters.targets.includes(t)}
              onClick={() => {
                const next = toggle(filters.targets, t);
                set({ targets: next, babyBirthDate: next.includes("영아") ? filters.babyBirthDate : "" });
              }}
            >
              {t}
            </Pill>
          ))}
        </FilterRow>

        {/* 아이 생년월일 (영아만 선택된 경우) */}
        {filters.targets.length === 1 && filters.targets.includes("영아") && (
          <FilterRow label="생년월">
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={filters.babyBirthDate}
                max={new Date().toISOString().slice(0, 7)}
                onChange={(e) => set({ babyBirthDate: e.target.value })}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 bg-white focus:border-blue-400 outline-none transition-colors"
              />
              {filters.babyBirthDate && (
                <span className="text-xs text-purple-500 font-medium">
                  {(() => {
                    const [y, m] = filters.babyBirthDate.split("-").map(Number);
                    const now = new Date();
                    const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
                    return months >= 0 ? `${months}개월` : "";
                  })()}
                </span>
              )}
              {filters.babyBirthDate && (
                <button onClick={() => set({ babyBirthDate: "" })} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
              )}
            </div>
          </FilterRow>
        )}

        {/* 요일 */}
        <FilterRow label="요일">
          <Pill active={isAllDays} onClick={toggleAllDays} compact>
            전체
          </Pill>
          {DAYS.map((d) => (
            <Pill
              key={d}
              active={filters.days.includes(d)}
              onClick={() => set({ days: toggle(filters.days, d) })}
              compact
            >
              {d}
            </Pill>
          ))}
        </FilterRow>

        {/* 시간 */}
        <FilterRow label="시간">
          {TIME_SLOTS.map((ts) => (
            <Pill
              key={ts}
              active={filters.timeSlots.includes(ts)}
              onClick={() => set({ timeSlots: toggle(filters.timeSlots, ts) })}
            >
              {TIME_LABELS[ts]}
            </Pill>
          ))}
        </FilterRow>

        {/* 클래스 유형 */}
        <FilterRow label="클래스">
          {CLASS_TYPES.map((ct) => (
            <Pill
              key={ct}
              active={filters.classTypes.includes(ct)}
              onClick={() => set({ classTypes: toggle(filters.classTypes, ct) })}
            >
              {ct}
            </Pill>
          ))}
        </FilterRow>

        {/* 검색어 */}
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus-within:border-blue-400 transition-colors">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="강좌명, 카테고리 검색"
            value={filters.keyword}
            onChange={(e) => set({ keyword: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
          {filters.keyword && (
            <button onClick={() => set({ keyword: "" })} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 font-medium hover:bg-slate-50 transition-colors"
        >
          <RotateCcw size={13} />
          초기화
        </button>
        <button
          onClick={onSearch}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              검색 중...
            </span>
          ) : (
            "검색"
          )}
        </button>
      </div>
    </div>
  );
}

/* ── 서브 컴포넌트 ── */

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-medium text-slate-400 w-10 pt-1.5 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({
  active, onClick, children, compact = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`filter-pill ${active ? "filter-pill-active" : "filter-pill-inactive"} ${
        compact ? "px-2.5 py-1 text-xs" : ""
      }`}
    >
      {children}
    </button>
  );
}
