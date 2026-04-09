"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase, Memo } from "@/lib/supabase";

export function MemosView() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearMonth, setYearMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemos = async () => {
      setLoading(true);
      const { data, error } = await getSupabase()
        .from("memos")
        .select("*")
        .eq("year_month", yearMonth)
        .order("created_at", { ascending: false });

      if (error) {
        setError("メモの読み込みに失敗しました");
      } else {
        setMemos(data as Memo[]);
      }
      setLoading(false);
    };

    fetchMemos();
  }, [yearMonth]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 前月・翌月の移動
  const changeMonth = (delta: number) => {
    const [y, m] = yearMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← カンバン</Link>
            <h1 className="text-base font-bold text-gray-900">メモ一覧</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-sm"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              {yearMonth.replace("-", "年")}月
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-sm"
            >
              ›
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400 text-sm">読み込み中...</p>
          </div>
        ) : memos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-gray-400 text-sm">この月のメモはありません</p>
            <p className="text-gray-300 text-xs">Claudeに「メモして」と話しかけてみてください</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {memos.map((memo) => (
              <div
                key={memo.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-sm font-semibold text-gray-800">{memo.title}</h2>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(memo.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {memo.content}
                </p>
                {memo.tags && memo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {memo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
