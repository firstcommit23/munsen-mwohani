"""
전체 크롤러 실행 스크립트
사용법:
    python run_crawlers.py            # 전체 실행
    python run_crawlers.py lotte      # 롯데마트만
    python run_crawlers.py emart      # 이마트만
"""

import sys


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"

    if target in ("all", "lotte"):
        print("=" * 50)
        print("롯데마트 문화센터 크롤링 시작")
        print("=" * 50)
        try:
            from lotte_crawler import run as run_lotte
            run_lotte()
        except Exception as e:
            print(f"[lotte] 오류: {e}")

    if target in ("all", "emart"):
        print("\n" + "=" * 50)
        print("이마트 문화센터 크롤링 시작")
        print("=" * 50)
        try:
            from emart_crawler import run_with_playwright
            run_with_playwright()
        except Exception as e:
            print(f"[emart] 오류: {e}")

    print("\n전체 크롤링 완료!")


if __name__ == "__main__":
    main()
