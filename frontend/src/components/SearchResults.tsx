import { useMemo, useDeferredValue, useState, memo, useCallback } from "react";
import { SearchX, Loader2 } from "lucide-react";
import type { RefObject } from "react";
import type { ClassItem } from "../types";
import ClassCard from "./ClassCard";

const StoreChip = memo(function StoreChip({ store, count, isSelected, onSelect }: {
  store: string; count: number; isSelected: boolean; onSelect: (store: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(store)}
      className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors whitespace-nowrap ${
        isSelected ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
      }`}
    >
      {store.replace(/^(이마트|롯데마트)\s*/, "")} <span className={isSelected ? "text-slate-300" : "text-slate-400"}>{count}</span>
    </button>
  );
});

const CategoryChip = memo(function CategoryChip({ cat, count, isSelected, onSelect }: {
  cat: string; count: number; isSelected: boolean; onSelect: (cat: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(cat)}
      className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors whitespace-nowrap ${
        isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"
      }`}
    >
      {cat} <span className={isSelected ? "text-blue-200" : "text-slate-400"}>{count}</span>
    </button>
  );
});

interface Props {
  results: ClassItem[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  searched: boolean;
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  categorySummary: Record<string, number>;
  storeSummary: Record<string, number>;
}

export default function SearchResults({ results, total, loading, loadingMore, searched, hasMore, sentinelRef, categorySummary, storeSummary }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const handleSelectStore = useCallback((store: string) => {
    setSelectedStore((prev) => (prev === store ? null : store));
    setSelectedCategory(null);
  }, []);

  const handleSelectCategory = useCallback((cat: string) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  }, []);

  const deferredStore = useDeferredValue(selectedStore);
  const deferredCategory = useDeferredValue(selectedCategory);
  const topStores = useMemo(() => Object.entries(storeSummary), [storeSummary]);

  // 지점 선택 시 해당 지점 강좌만 기준으로 카테고리 재집계
  const topCategories = useMemo(() => {
    const base = deferredStore ? results.filter((r) => r.store_name === deferredStore) : null;
    if (!base) return Object.entries(categorySummary).slice(0, 10);
    const summary: Record<string, number> = {};
    for (const r of base) {
      const cat = r.category ?? "기타";
      summary[cat] = (summary[cat] ?? 0) + 1;
    }
    return Object.entries(summary).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [deferredStore, results, categorySummary]);

  const filtered = useMemo(
    () => {
      let list = results;
      if (deferredStore) list = list.filter((r) => r.store_name === deferredStore);
      if (deferredCategory) list = list.filter((r) => (r.category ?? "기타") === deferredCategory);
      return list;
    },
    [results, deferredStore, deferredCategory]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <p className="text-sm">근처 문화센터 강좌 검색 중...</p>
      </div>
    );
  }

  if (!searched) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
          <span className="text-3xl">🎨</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">위치와 조건을 설정하고</p>
          <p className="text-sm text-slate-400">검색 버튼을 눌러보세요</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <SearchX size={36} className="text-slate-300" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">검색 결과가 없어요</p>
          <p className="text-sm text-slate-400">반경을 넓히거나 조건을 바꿔보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <p className="text-xs text-slate-400 mb-3 font-medium">
        총 <span className="text-blue-600 font-semibold">{total.toLocaleString()}개</span> 강좌
      </p>

      {/* 지점 칩 */}
      {topStores.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {topStores.map(([store, count]) => (
            <StoreChip key={store} store={store} count={count} isSelected={selectedStore === store} onSelect={handleSelectStore} />
          ))}
        </div>
      )}

      {/* 카테고리 칩 */}
      {topCategories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {topCategories.map(([cat, count]) => (
            <CategoryChip key={cat} cat={cat} count={count} isSelected={selectedCategory === cat} onSelect={handleSelectCategory} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((item) => (
          <ClassCard key={item.id} item={item} />
        ))}
      </div>

      {/* 무한 스크롤 sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-blue-400" />
        </div>
      )}

      {!hasMore && results.length > 0 && results.length >= total && (
        <p className="text-center text-xs text-slate-400 mt-4 pb-2">
          모든 강좌를 불러왔어요
        </p>
      )}
    </div>
  );
}
