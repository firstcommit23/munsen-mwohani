import { useEffect, useState } from "react";
import { getLastUpdated } from "../api/client";

function formatTimestamp(ts: string): string {
  // "2026-03-13T03:33:14.123456" → "2026.03.13 03:33"
  try {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  } catch {
    return ts;
  }
}

export default function Footer() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    getLastUpdated().then((ts) => {
      if (ts) setLastUpdated(formatTimestamp(ts));
    });
  }, []);

  return (
    <footer className="max-w-2xl mx-auto px-4 pt-6 pb-10 border-t border-slate-100 mt-8">
      <p className="text-xs text-slate-400 leading-relaxed">
        본 서비스는 이마트·롯데마트 문화센터 강좌 조회를 목적으로 제공되며,
        실시간 업데이트 데이터가 아닙니다. 이용 중 불편한 점이나 개선 의견은{" "}
        <a
          href="mailto:jm131313.kim@gmail.com"
          className="text-blue-400 underline underline-offset-2"
        >
          문의하기
        </a>
        를 통해 알려주시면 검토하겠습니다.
      </p>
      {lastUpdated && (
        <p className="text-xs text-slate-300 mt-2">데이터 기준일시: {lastUpdated}</p>
      )}
    </footer>
  );
}
