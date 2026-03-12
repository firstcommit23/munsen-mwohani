"""
롯데마트 문화센터 크롤러
POST /cu/gus/course/courseinfo/searchList.do → HTML 응답 (tr 구조)
"""

import json
import re
import sys
import os
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from database import get_connection, init_db

BASE_URL = "https://culture.lottemart.com"
SEARCH_API = f"{BASE_URL}/cu/gus/course/courseinfo/searchList.do"
PAGE_SIZE = 20

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36",
    "Referer": f"{BASE_URL}/cu/course/courseList.do",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
}

TARGET_FROM_CATEGORY = {
    "성인": "성인", "시니어": "성인",
    "어린이": "어린이", "아동": "어린이", "주니어": "어린이", "청소년": "어린이",
    "유아": "영아", "영아": "영아", "영유아": "영아",
}


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": HEADERS["User-Agent"]})
    s.get(BASE_URL, timeout=15)
    return s


def parse_schedule(text: str) -> dict:
    result = {"days": [], "start_time": None, "end_time": None, "start_date": None}
    result["days"] = [d for d in ["월","화","수","목","금","토","일"] if d in text]
    t = re.search(r"(\d{1,2}:\d{2})\s*[~\-]\s*(\d{1,2}:\d{2})", text)
    if t:
        result["start_time"], result["end_time"] = t.group(1), t.group(2)
    d = re.search(r"(\d{4}\.\d{2}\.\d{2})", text)
    if d:
        result["start_date"] = d.group(1)
    return result


def parse_price_sessions(text: str) -> tuple:
    sessions = None
    price = None
    s = re.search(r"(\d+)\s*회", text)
    if s:
        sessions = int(s.group(1))
    p = re.search(r"([\d,]+)\s*원", text)
    if p:
        price = int(p.group(1).replace(",", ""))
    return price, sessions


def infer_target(category: str) -> str:
    for kw, tgt in TARGET_FROM_CATEGORY.items():
        if kw in category:
            return tgt
    return "성인"


def fetch_page(session: requests.Session, page: int) -> tuple:
    payload = {
        "currPageNo": str(page),
        "pageSize": str(PAGE_SIZE),
        "search_str_cd": "",
        "search_order_gbn": "",
        "search_list_type": "",
        "search_cat_cd": "",
        "search_cls_target": "",
        "search_reg_status": "",
        "search_fee_min": "",
        "search_fee_max": "",
    }
    try:
        resp = session.post(SEARCH_API, data=payload, headers=HEADERS, timeout=20)
    except Exception as e:
        print(f"  [오류] {e}")
        return [], False

    soup = BeautifulSoup(resp.text, "html.parser")
    rows = soup.find_all("tr")
    classes = []

    for row in rows:
        info_txt = row.find("div", class_="info-txt")
        if not info_txt:
            continue
        try:
            span = info_txt.find("span")
            store_raw = span.get_text(strip=True).strip("[]") if span else ""

            apply_a = row.find("a", onclick=re.compile(r"fn_courseApp"))
            store_code_val = None
            if apply_a:
                m = re.search(r"fn_courseApp\('[^']+',\s*'[^']+',\s*'(\d+)'\)", apply_a["onclick"])
                store_code_val = m.group(1) if m else None

            link_a = info_txt.find("a")
            full_title = link_a.get_text(strip=True) if link_a else ""
            title = full_title.replace(f"[{store_raw}]", "").strip()
            if not title:
                continue

            p_tag = info_txt.find("p")
            category_full = p_tag.get_text(strip=True) if p_tag else ""
            target = infer_target(category_full)
            category = category_full.split(">")[-1].strip() if ">" in category_full else category_full

            detail_lis = row.find_all("li", class_="bg-none dis-block dis-tablet")
            time_text = detail_lis[0].get_text(strip=True) if len(detail_lis) > 0 else ""
            price_text = detail_lis[1].get_text(strip=True) if len(detail_lis) > 1 else ""

            schedule = parse_schedule(time_text)
            price, sessions = parse_price_sessions(price_text)

            if not schedule["start_date"]:
                first_li = row.find("li", class_="dis-block dis-tablet")
                if first_li:
                    s2 = parse_schedule(first_li.get_text(strip=True))
                    schedule["start_date"] = s2.get("start_date")

            view_a = info_txt.find("a", onclick=re.compile(r"fn_clsView"))
            detail_url = None
            if view_a:
                m = re.search(r"fn_clsView\('([^']+)'\)", view_a["onclick"])
                if m:
                    detail_url = f"{BASE_URL}/cu/course/courseView.do?cls_id={m.group(1)}"

            classes.append({
                "store_raw": store_raw,
                "store_code": store_code_val or store_raw,
                "title": title,
                "category": category,
                "target": target,
                "price": price,
                "days": json.dumps(schedule["days"], ensure_ascii=False),
                "start_time": schedule["start_time"],
                "end_time": schedule["end_time"],
                "start_date": schedule["start_date"],
                "total_sessions": sessions,
                "class_type": "원데이" if (sessions or 0) <= 1 else "정규",
                "detail_url": detail_url,
                "last_updated": datetime.now().isoformat(),
            })
        except Exception:
            continue

    return classes, len(classes) >= PAGE_SIZE


def run():
    init_db()
    conn = get_connection()
    cur = conn.cursor()
    session = make_session()

    print("[lotte] 전체 강좌 크롤링 시작...")
    all_classes = []
    page = 1

    while True:
        classes, has_next = fetch_page(session, page)
        all_classes.extend(classes)
        print(f"  page {page}: {len(classes)}개 수집")
        if not has_next or page >= 30:
            break
        page += 1
        time.sleep(0.3)

    # 지점별 분류
    stores: dict = {}
    for c in all_classes:
        key = c["store_code"]
        if key not in stores:
            stores[key] = {"name": f"롯데마트 {c['store_raw']}", "code": key, "classes": []}
        stores[key]["classes"].append(c)

    print(f"\n[lotte] 총 {len(all_classes)}개 강좌, {len(stores)}개 지점")

    for key, sd in stores.items():
        cur.execute(
            "INSERT OR IGNORE INTO stores (brand, code, name) VALUES ('lotte', ?, ?)",
            (sd["code"], sd["name"]),
        )
        conn.commit()
        store_id = cur.execute("SELECT id FROM stores WHERE code = ?", (sd["code"],)).fetchone()["id"]
        cur.execute("DELETE FROM classes WHERE store_id = ?", (store_id,))
        for c in sd["classes"]:
            cur.execute(
                """INSERT INTO classes
                   (store_id, category, title, target, price, days, start_time, end_time,
                    start_date, end_date, total_sessions, class_type, image_url, detail_url, last_updated)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (store_id, c["category"], c["title"], c["target"], c["price"],
                 c["days"], c["start_time"], c["end_time"], c["start_date"], None,
                 c["total_sessions"], c["class_type"], None, c["detail_url"], c["last_updated"]),
            )
        conn.commit()
        print(f"  저장: {sd['name']} ({len(sd['classes'])}개)")

    conn.close()
    print("\n[lotte] 완료!")


if __name__ == "__main__":
    run()
