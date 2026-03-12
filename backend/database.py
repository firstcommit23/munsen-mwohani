import sqlite3
import os

# Railway 볼륨: /data, 로컬: ../data/classes.db
DB_PATH = os.environ.get(
    "DB_PATH",
    os.path.join(os.path.dirname(__file__), "..", "data", "classes.db")
)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS stores (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            brand     TEXT NOT NULL,        -- 'emart' | 'lotte'
            code      TEXT NOT NULL UNIQUE, -- 사이트 내부 지점 코드
            name      TEXT NOT NULL,        -- '이마트 광교점'
            address   TEXT,
            lat       REAL,                 -- 위도
            lng       REAL                  -- 경도
        );

        CREATE TABLE IF NOT EXISTS classes (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id       INTEGER NOT NULL REFERENCES stores(id),
            category       TEXT,            -- 'Kids & Children'
            title          TEXT NOT NULL,
            description    TEXT,
            target         TEXT,            -- '성인' | '어린이' | '영아'
            price          INTEGER,
            days           TEXT,            -- JSON 배열 e.g. '["월","수"]'
            start_time     TEXT,            -- '11:00'
            end_time       TEXT,            -- '11:50'
            start_date     TEXT,            -- '2026.01.01'
            end_date       TEXT,            -- '2026.03.03'
            total_sessions INTEGER,
            class_type     TEXT,            -- '정규' | '원데이'
            image_url      TEXT,
            detail_url     TEXT,
            last_updated   TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_classes_store ON classes(store_id);
        CREATE INDEX IF NOT EXISTS idx_classes_target ON classes(target);
        CREATE INDEX IF NOT EXISTS idx_classes_type ON classes(class_type);
    """)

    conn.commit()
    conn.close()
    print(f"DB initialized: {DB_PATH}")


if __name__ == "__main__":
    init_db()
