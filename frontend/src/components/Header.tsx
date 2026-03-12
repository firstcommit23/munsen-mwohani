import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">
            문센<span className="text-blue-600">뭐하니</span>
            <span className="text-slate-400 font-normal text-base">?</span>
          </span>
        </div>
        <span className="ml-auto text-xs text-slate-400">이마트 · 롯데마트</span>
      </div>
    </header>
  );
}
