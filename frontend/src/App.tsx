import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import FilterPanel from "./components/FilterPanel";
import SearchResults from "./components/SearchResults";
import { searchClasses } from "./api/client";
import type { Filters, ClassItem, UserLocation } from "./types";
import "./index.css";

// 상현동 기본 좌표 (광교 이마트 근처)
const DEFAULT_LOCATION: UserLocation = {
  lat: 37.2786,
  lng: 127.0470,
  label: "상현동",
};

const DEFAULT_FILTERS: Filters = {
  radius: 1,
  targets: ["성인", "어린이", "영아"],
  days: ["월", "화", "수", "목", "금", "토", "일"],
  timeSlots: ["오전", "오후", "17시이후"],
  classTypes: ["정규", "원데이"],
  keyword: "",
};

export default function App() {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<ClassItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 브라우저 GPS로 위치 자동 감지
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "현재 위치",
        });
      },
      () => {
        // 권한 거부 시 기본값(상현동) 유지
      }
    );
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchClasses(location, filters, 1);
      setResults(data.results);
      setTotal(data.total);
    } catch (e) {
      setError("서버 연결에 실패했습니다. 백엔드가 실행 중인지 확인해주세요.");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [location, filters]);

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-2xl mx-auto pb-16">
        <FilterPanel
          location={location}
          filters={filters}
          onChange={setFilters}
          onSearch={handleSearch}
          loading={loading}
        />

        {error && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <SearchResults
          results={results}
          total={total}
          loading={loading}
          searched={searched}
        />
      </main>
    </div>
  );
}
