import { SearchX, Loader2 } from "lucide-react";
import type { RefObject } from "react";
import type { ClassItem } from "../types";
import ClassCard from "./ClassCard";

interface Props {
  results: ClassItem[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  searched: boolean;
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

export default function SearchResults({ results, total, loading, loadingMore, searched, hasMore, sentinelRef }: Props) {
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

      <div className="flex flex-col gap-3">
        {results.map((item) => (
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
