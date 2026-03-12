"""
이마트 문화센터 크롤러 (Playwright 기반)
cultureclub.emart.com — React SPA, 네트워크 탭 감청으로 API 추출
"""

import json
import re
import sqlite3
import sys
import os
import time
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from database import get_connection, init_db

BASE_URL = "https://cultureclub.emart.com"

TARGET_KEYWORDS = {
    "영아": ["영아", "영유아", "베이비", "아기", "baby", "24개월", "36개월", "48개월"],
    "어린이": ["어린이", "아동", "키즈", "kids", "Kids", "child", "주니어", "초등", "유아"],
}


def infer_target(title: str, category: str = "") -> str:
    text = (title or "") + " " + (category or "")
    for target, keywords in TARGET_KEYWORDS.items():
        if any(k.lower() in text.lower() for k in keywords):
            return target
    return "성인"


def parse_schedule(schedule_text: str) -> dict:
    result = {"days": [], "start_time": None, "end_time": None,
               "start_date": None, "end_date": None, "total_sessions": None}
    if not schedule_text:
        return result
    day_names = ["월", "화", "수", "목", "금", "토", "일"]
    result["days"] = [d for d in day_names if d in schedule_text]
    t = re.search(r"(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})", schedule_text)
    if t:
        result["start_time"], result["end_time"] = t.group(1), t.group(2)
    d = re.search(r"(\d{4}[./]\d{2}[./]\d{2})\s*~\s*(\d{4}[./]\d{2}[./]\d{2})", schedule_text)
    if d:
        result["start_date"] = d.group(1).replace("/", ".")
        result["end_date"] = d.group(2).replace("/", ".")
    s = re.search(r"(\d+)\s*회", schedule_text)
    if s:
        result["total_sessions"] = int(s.group(1))
    return result


def run_with_playwright(store_codes: list[str] | None = None):
    """Playwright로 브라우저를 실행해 API 요청을 가로챈다"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[emart] playwright가 설치되지 않았습니다. 설치: pip install playwright && playwright install chromium")
        return

    init_db()
    conn = get_connection()
    captured_responses = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        def handle_response(response):
            url = response.url
            # API 응답만 캡처 (JSON 반환하는 엔드포인트)
            if "lecture" in url.lower() or "class" in url.lower() or "course" in url.lower():
                if "application/json" in (response.headers.get("content-type", "")):
                    try:
                        body = response.json()
                        captured_responses.append({"url": url, "body": body})
                        print(f"[emart] 캡처: {url}")
                    except Exception:
                        pass

        page.on("response", handle_response)

        print("[emart] 이마트 문화센터 접속 중...")
        page.goto(f"{BASE_URL}/enrolment", wait_until="networkidle", timeout=30000)
        time.sleep(3)

        # 검색 버튼 클릭 (전체 강좌 로드)
        try:
            page.click("button[type='submit'], .search-btn, .btn-search", timeout=5000)
            page.wait_for_load_state("networkidle", timeout=10000)
        except Exception:
            pass

        # 페이지네이션 순환
        for _ in range(10):
            try:
                next_btn = page.query_selector(".pagination .next:not(.disabled), .btn-next:not(:disabled)")
                if not next_btn:
                    break
                next_btn.click()
                page.wait_for_load_state("networkidle", timeout=10000)
                time.sleep(1)
            except Exception:
                break

        browser.close()

    # 캡처된 API 응답 파싱
    all_classes_by_store: dict[str, list] = {}

    for item in captured_responses:
        body = item["body"]
        # 다양한 응답 구조 처리
        classes_data = []
        if isinstance(body, list):
            classes_data = body
        elif isinstance(body, dict):
            for key in ["data", "list", "result", "items", "lectures", "courses"]:
                if key in body and isinstance(body[key], list):
                    classes_data = body[key]
                    break

        for cls in classes_data:
            if not isinstance(cls, dict):
                continue

            # 공통 필드 추출 (이마트 API 구조에 따라 키 이름 다를 수 있음)
            store_code = str(cls.get("strCd", cls.get("storeCd", cls.get("storeCode", "unknown"))))
            store_name = cls.get("strNm", cls.get("storeName", cls.get("storeNm", f"이마트 {store_code}점")))
            title = cls.get("ltrNm", cls.get("lectureNm", cls.get("title", cls.get("className", ""))))
            category = cls.get("genreNm", cls.get("categoryNm", cls.get("category", "")))
            price_raw = cls.get("fee", cls.get("price", cls.get("amt", 0)))
            price = int(re.sub(r"[^\d]", "", str(price_raw))) if price_raw else None
            schedule_text = cls.get("schedule", cls.get("time", cls.get("schDt", "")))
            image_url = cls.get("imgUrl", cls.get("imageUrl", cls.get("img", "")))
            if image_url and image_url.startswith("/"):
                image_url = BASE_URL + image_url
            detail_url = cls.get("detailUrl", cls.get("url", ""))

            schedule = parse_schedule(str(schedule_text))
            target = infer_target(title, category)
            class_type = "원데이" if (schedule["total_sessions"] or 0) <= 1 else "정규"

            if store_code not in all_classes_by_store:
                all_classes_by_store[store_code] = {"name": store_name, "classes": []}

            all_classes_by_store[store_code]["classes"].append({
                "title": title,
                "category": category,
                "target": target,
                "price": price,
                "days": json.dumps(schedule["days"], ensure_ascii=False),
                "start_time": schedule["start_time"],
                "end_time": schedule["end_time"],
                "start_date": schedule["start_date"],
                "end_date": schedule["end_date"],
                "total_sessions": schedule["total_sessions"],
                "class_type": class_type,
                "image_url": image_url,
                "detail_url": detail_url,
                "last_updated": datetime.now().isoformat(),
            })

    cur = conn.cursor()
    for store_code, data in all_classes_by_store.items():
        store_name = data["name"]
        classes = data["classes"]

        cur.execute(
            "INSERT OR IGNORE INTO stores (brand, code, name) VALUES ('emart', ?, ?)",
            (store_code, store_name),
        )
        conn.commit()
        row = cur.execute("SELECT id FROM stores WHERE code = ?", (store_code,)).fetchone()
        store_id = row["id"]

        cur.execute("DELETE FROM classes WHERE store_id = ?", (store_id,))
        for c in classes:
            cur.execute(
                """INSERT INTO classes
                   (store_id, category, title, target, price, days, start_time, end_time,
                    start_date, end_date, total_sessions, class_type, image_url, detail_url, last_updated)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (store_id, c["category"], c["title"], c["target"], c["price"],
                 c["days"], c["start_time"], c["end_time"], c["start_date"], c["end_date"],
                 c["total_sessions"], c["class_type"], c["image_url"], c["detail_url"], c["last_updated"]),
            )
        conn.commit()
        print(f"[emart] {store_name}: {len(classes)}개 저장")

    conn.close()
    if not all_classes_by_store:
        print("[emart] 캡처된 데이터 없음. 이마트 사이트 구조가 변경되었을 수 있습니다.")
    else:
        print(f"\n[emart] 완료! {sum(len(v['classes']) for v in all_classes_by_store.values())}개 저장")


if __name__ == "__main__":
    run_with_playwright()
