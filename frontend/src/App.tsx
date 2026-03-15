import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronUp } from 'lucide-react';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import SearchResults from './components/SearchResults';
import Footer from './components/Footer';
import { searchClasses } from './api/client';
import type { Filters, ClassItem, UserLocation } from './types';
import './index.css';

const DEFAULT_LOCATION: UserLocation = {
    lat: 37.3065828331701,
    lng: 127.072617824971,
    label: '상현동',
};

const DEFAULT_FILTERS: Filters = {
    radius: 10,
    targets: ['성인', '어린이', '영아'],
    days: ['월', '화', '수', '목', '금', '토', '일'],
    timeSlots: ['오전', '오후', '17시이후'],
    classTypes: ['정규', '원데이'],
    keyword: '',
    babyBirthDate: '',
};

const PAGE_SIZE = 20;

export default function App() {
    const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [results, setResults] = useState<ClassItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searched, setSearched] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});
    const [storeSummary, setStoreSummary] = useState<Record<string, number>>({});
    const [searchKey, setSearchKey] = useState(0);
    // searchKey는 SearchResults에 key prop으로 전달되어 검색마다 내부 state 초기화

    // 무한 스크롤 감지용 sentinel
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) =>
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    label: '현재 위치',
                }),
            () => {},
        );
    }, []);

    // 첫 검색
    const handleSearch = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSearched(true);
        setPage(1);
        setResults([]);
        setCategorySummary({});
        setStoreSummary({});
        setSearchKey((k) => k + 1);
        try {
            const data = await searchClasses(location, filters, 1);
            setResults(data.results);
            setTotal(data.total);
            setCategorySummary(data.category_summary ?? {});
            setStoreSummary(data.store_summary ?? {});
            setHasMore(
                data.results.length === PAGE_SIZE &&
                    data.results.length < data.total,
            );
        } catch {
            setError(
                '서버 연결에 실패했습니다. 백엔드가 실행 중인지 확인해주세요.',
            );
            setResults([]);
            setTotal(0);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [location, filters]);

    // 추가 페이지 로드
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        try {
            const data = await searchClasses(location, filters, nextPage);
            setResults((prev) => [...prev, ...data.results]);
            setPage(nextPage);
            setHasMore(
                data.results.length === PAGE_SIZE &&
                    results.length + data.results.length < data.total,
            );
        } catch {
            // 추가 로드 실패는 조용히 처리
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, page, location, filters, results.length]);

    // 스크롤 위치 감지 — 300px 이상 내려가면 위로 가기 버튼 표시
    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > 300);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Intersection Observer — sentinel이 보이면 loadMore 호출
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMore();
            },
            { threshold: 0.1 },
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [loadMore]);

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
                    key={searchKey}
                    results={results}
                    total={total}
                    loading={loading}
                    loadingMore={loadingMore}
                    searched={searched}
                    hasMore={hasMore}
                    sentinelRef={sentinelRef}
                    categorySummary={categorySummary}
                    storeSummary={storeSummary}
                />
            </main>
            <Footer />
            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                    aria-label="맨 위로"
                >
                    <ChevronUp size={20} />
                </button>
            )}
        </div>
    );
}
