import datetime
import json
import math
import re
import sqlite3
import sys
import os
from typing import Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.dirname(__file__))
from database import get_connection, init_db

app = FastAPI(title="문센뭐하니? API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """두 좌표 사이의 거리(km) 계산"""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@app.get("/api/search")
def search_classes(
    lat: float = Query(..., description="사용자 위도"),
    lng: float = Query(..., description="사용자 경도"),
    radius: float = Query(1.0, description="반경 km (1 또는 10)"),
    targets: Optional[str] = Query(None, description="대상 콤마 구분: 성인,어린이,영아"),
    days: Optional[str] = Query(None, description="요일 콤마 구분: 월,화,수,목,금,토,일"),
    time_slots: Optional[str] = Query(None, description="시간대: 오전,오후,17시이후"),
    class_types: Optional[str] = Query(None, description="클래스 유형: 정규,원데이"),
    keyword: Optional[str] = Query(None, description="검색어"),
    baby_months: Optional[int] = Query(None, description="아이 개월수 (영아 나이 필터)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conn = get_connection()
    cur = conn.cursor()

    # 1. 반경 내 지점 필터링
    stores = cur.execute("SELECT * FROM stores WHERE lat IS NOT NULL AND lng IS NOT NULL").fetchall()
    store_ids_in_radius = []
    store_distances = {}
    for store in stores:
        dist = haversine(lat, lng, store["lat"], store["lng"])
        if dist <= radius:
            store_ids_in_radius.append(store["id"])
            store_distances[store["id"]] = round(dist, 1)

    if not store_ids_in_radius:
        conn.close()
        return {"total": 0, "page": page, "results": []}

    placeholders = ",".join("?" * len(store_ids_in_radius))
    query = f"SELECT c.*, s.name AS store_name, s.brand AS store_brand, s.lat, s.lng FROM classes c JOIN stores s ON c.store_id = s.id WHERE c.store_id IN ({placeholders})"
    params: list = list(store_ids_in_radius)

    # 2. 대상 필터
    if targets:
        target_list = [t.strip() for t in targets.split(",") if t.strip()]
        if target_list:
            t_placeholders = ",".join("?" * len(target_list))
            query += f" AND c.target IN ({t_placeholders})"
            params.extend(target_list)

    # 3. 클래스 유형
    if class_types:
        type_list = [t.strip() for t in class_types.split(",") if t.strip()]
        if type_list:
            tp_placeholders = ",".join("?" * len(type_list))
            query += f" AND c.class_type IN ({tp_placeholders})"
            params.extend(type_list)

    # 4. 검색어
    if keyword and keyword.strip():
        query += " AND (c.title LIKE ? OR c.category LIKE ? OR c.description LIKE ?)"
        kw = f"%{keyword.strip()}%"
        params.extend([kw, kw, kw])

    rows = cur.execute(query, params).fetchall()
    conn.close()

    # 5. 요일/시간 필터 (Python 레벨 — JSON 배열 파싱)
    day_filter = [d.strip() for d in days.split(",")] if days else None
    time_filter = [t.strip() for t in time_slots.split(",")] if time_slots else None

    results = []
    for row in rows:
        r = dict(row)
        r["distance_km"] = store_distances.get(r["store_id"], None)

        # 요일 필터
        if day_filter:
            class_days = json.loads(r["days"]) if r["days"] else []
            if not any(d in class_days for d in day_filter):
                continue

        # 시간 필터
        if time_filter and r["start_time"]:
            try:
                hour = int(r["start_time"].split(":")[0])
                slot = (
                    "오전" if hour < 13
                    else "17시이후" if hour >= 17
                    else "오후"
                )
                if slot not in time_filter:
                    continue
            except (ValueError, AttributeError):
                pass

        results.append(r)

    # 아이 개월수 필터 (영아 대상 강좌 중 age_range 매칭)
    if baby_months is not None:
        today = datetime.date.today()
        # 아이 출생연도 계산 (baby_months → birth_year)
        birth_year = today.year - baby_months // 12
        if baby_months % 12 > today.month:
            birth_year -= 1

        def age_matches(age_range: str | None, months: int) -> bool:
            if not age_range:
                return False  # age_range 미기재 강좌는 제외
            # 연도 범위: "2020~2022년생"
            m = re.search(r"(\d{4})\s*[~\-]\s*(\d{4})\s*년생", age_range)
            if m:
                return int(m.group(1)) <= birth_year <= int(m.group(2))
            # 단일 연도: "2021년생"
            m = re.search(r"(\d{4})\s*년생", age_range)
            if m:
                return int(m.group(1)) == birth_year
            # 개월수 범위: "5개월 ~ 10개월"
            m = re.search(r"(\d+)\s*개월?\s*[~\-]\s*(\d+)\s*개월", age_range)
            if m:
                return int(m.group(1)) <= months <= int(m.group(2))
            m = re.search(r"(\d+)\s*[~\-]\s*(\d+)\s*개월", age_range)
            if m:
                return int(m.group(1)) <= months <= int(m.group(2))
            # 단일 개월수: 최소 나이(이상)로 해석
            m = re.search(r"(\d+)\s*개월", age_range)
            if m:
                return months >= int(m.group(1))
            return False
        results = [r for r in results if r.get("target") != "영아" or age_matches(r.get("age_range"), baby_months)]

    # 거리 기준 정렬
    results.sort(key=lambda x: (x["distance_km"] or 999, x["title"]))

    total = len(results)

    # 카테고리별 건수 집계 (전체 결과 기준)
    category_summary: dict = {}
    for r in results:
        cat = r.get("category") or "기타"
        category_summary[cat] = category_summary.get(cat, 0) + 1
    category_summary = dict(sorted(category_summary.items(), key=lambda x: -x[1]))

    # 지점별 건수 집계 (전체 결과 기준)
    store_summary: dict = {}
    for r in results:
        name = r.get("store_name") or ""
        store_summary[name] = store_summary.get(name, 0) + 1
    store_summary = dict(sorted(store_summary.items(), key=lambda x: -x[1]))

    offset = (page - 1) * page_size
    paginated = results[offset: offset + page_size]

    return {"total": total, "page": page, "page_size": page_size, "results": paginated, "category_summary": category_summary, "store_summary": store_summary}


@app.get("/api/stores")
def get_stores(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(10.0),
):
    conn = get_connection()
    stores = conn.execute("SELECT * FROM stores WHERE lat IS NOT NULL AND lng IS NOT NULL").fetchall()
    conn.close()

    result = []
    for store in stores:
        dist = haversine(lat, lng, store["lat"], store["lng"])
        if dist <= radius:
            d = dict(store)
            d["distance_km"] = round(dist, 1)
            result.append(d)

    result.sort(key=lambda x: x["distance_km"])
    return result


@app.get("/api/last-updated")
def last_updated():
    conn = get_connection()
    row = conn.execute("SELECT MAX(last_updated) AS ts FROM classes").fetchone()
    conn.close()
    return {"last_updated": row["ts"] if row else None}


@app.get("/api/health")
def health():
    return {"status": "ok"}
