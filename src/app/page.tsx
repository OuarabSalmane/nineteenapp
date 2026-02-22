"use client";

import { useState, useCallback } from "react";
import quranData from "@/data/quran.json";

interface VerseNumerics {
  numWords: number;
  numChars: number;
  abjadValue: number;
}

interface Verse {
  number: number;
  text: string;
  numerics?: VerseNumerics;
}

interface SurahData {
  surahNumber: number;
  name: string;
  bismillah: string;
  bismillahNumerics?: VerseNumerics;
  verses: Verse[];
  rawText: string;
}

// Type-cast the imported JSON
const allSurahsData = quranData as SurahData[];

// Build a lookup map by surah name for fast access
const surahByName = new Map<string, SurahData>(
  allSurahsData.map((s) => [s.name, s])
);

function numberToArabicIndic(num: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((d) => digits[parseInt(d)])
    .join("");
}

/** Small badge showing a numeric stat */
function StatBadge({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono ${
        highlight
          ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
          : "bg-emerald-800/50 border border-emerald-600/30 text-emerald-400"
      }`}
    >
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{value}</span>
    </span>
  );
}

export default function Home() {
  const [selectedSurahName, setSelectedSurahName] = useState(
    allSurahsData[9].name // يونس (surah 10, index 9)
  );
  const [data, setData] = useState<SurahData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"verses" | "raw">("verses");
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

  const loadSurah = useCallback(
    (name: string) => {
      setError(null);
      const surah = surahByName.get(name);
      if (!surah) {
        setError(`Surah "${name}" not found in data`);
        setData(null);
        return;
      }
      setData(surah);
    },
    []
  );

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const name = e.target.value;
      setSelectedSurahName(name);
      loadSurah(name);
    },
    [loadSurah]
  );

  const copyToClipboard = useCallback((text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => {
        // Fallback if clipboard API is blocked
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return Promise.resolve();
    }
  }, []);

  const copyVerse = useCallback(
    async (verse: Verse) => {
      const text = `${verse.text} (${numberToArabicIndic(verse.number)})`;
      await copyToClipboard(text);
      setCopiedVerse(verse.number);
      setTimeout(() => setCopiedVerse(null), 2000);
    },
    [copyToClipboard]
  );

  const copyAll = useCallback(async () => {
    if (!data) return;
    const text = data.verses.map((v) => `${v.text}`).join("\n\n");
    await copyToClipboard(text);
  }, [data, copyToClipboard]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900">
      {/* Header */}
      <header className="border-b border-emerald-700/50 bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
            📖
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              القرآن الكريم
            </h1>
            <p className="text-emerald-400 text-xs">
              {allSurahsData.length} سورة · بيانات محلية
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Surah Select Section */}
        <div className="bg-emerald-900/40 border border-emerald-700/40 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-emerald-300 text-sm font-semibold uppercase tracking-wider mb-4">
            اختر السورة
          </h2>

          <div className="flex gap-3">
            <select
              value={selectedSurahName}
              onChange={handleSelectChange}
              dir="rtl"
              className="flex-1 bg-emerald-950/60 border border-emerald-600/40 rounded-xl px-4 py-3 text-white text-right text-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all cursor-pointer"
            >
              {allSurahsData.map((s) => (
                <option key={s.surahNumber} value={s.name} className="bg-emerald-950 text-white">
                  {s.surahNumber}. {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => loadSurah(selectedSurahName)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              عرض
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 flex items-start gap-3">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-4">
            {/* Surah Header */}
            <div className="bg-gradient-to-r from-emerald-800/50 to-teal-800/50 border border-emerald-600/40 rounded-2xl p-6 text-center">
              <div className="text-emerald-400 text-xs uppercase tracking-widest mb-2">
                Surah {data.surahNumber}
              </div>
              <h2
                className="text-white text-4xl font-bold mb-3"
                dir="rtl"
                style={{ fontFamily: "serif" }}
              >
                سُورَةُ {data.name}
              </h2>
              {data.bismillah && (
                <div className="mt-3">
                  <p
                    className="text-emerald-200 text-xl"
                    dir="rtl"
                    style={{ fontFamily: "serif" }}
                  >
                    {data.bismillah}
                  </p>
                  {/* Bismillah numerics */}
                  {data.bismillahNumerics && (
                    <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                      <StatBadge label="كلمات" value={data.bismillahNumerics.numWords} />
                      <StatBadge label="حروف" value={data.bismillahNumerics.numChars} />
                      <StatBadge label="قيمة" value={data.bismillahNumerics.abjadValue} highlight />
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 flex items-center justify-center gap-6 text-sm text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {data.verses.length} آية
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("verses")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "verses"
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 hover:text-white"
                }`}
              >
                الآيات ({data.verses.length})
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "raw"
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 hover:text-white"
                }`}
              >
                النص الكامل
              </button>
              <div className="flex-1" />
              <button
                onClick={copyAll}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 hover:text-white hover:border-emerald-500/60 transition-all flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                نسخ الكل
              </button>
            </div>

            {/* Verses Tab */}
            {activeTab === "verses" && (
              <div className="space-y-3">
                {data.verses.map((verse) => (
                  <div
                    key={verse.number}
                    className="group bg-emerald-900/30 border border-emerald-700/30 hover:border-emerald-500/50 rounded-xl p-5 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Verse Number Badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-800/60 border border-emerald-600/40 flex items-center justify-center">
                        <span
                          className="text-emerald-300 text-sm font-bold"
                          dir="rtl"
                        >
                          {numberToArabicIndic(verse.number)}
                        </span>
                      </div>

                      {/* Verse Text + Numerics */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-white text-xl leading-loose text-right"
                          dir="rtl"
                          style={{ fontFamily: "serif" }}
                        >
                          {verse.text}
                        </p>

                        {/* Numerical stats row */}
                        {verse.numerics ? (
                          <div className="flex items-center gap-2 mt-2 flex-wrap justify-end">
                            <StatBadge label="كلمات" value={verse.numerics.numWords} />
                            <StatBadge label="حروف" value={verse.numerics.numChars} />
                            <StatBadge label="قيمة عددية" value={verse.numerics.abjadValue} highlight />
                          </div>
                        ) : (
                          <p className="text-emerald-500 text-xs mt-2 text-right">
                            الآية {numberToArabicIndic(verse.number)} من سورة {data.name}
                          </p>
                        )}
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => copyVerse(verse)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-emerald-800/60 hover:bg-emerald-700/60 text-emerald-300 hover:text-white transition-all"
                        title="Copy verse"
                      >
                        {copiedVerse === verse.number ? (
                          <svg
                            className="w-4 h-4 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Raw Text Tab */}
            {activeTab === "raw" && (
              <div className="bg-emerald-950/60 border border-emerald-700/40 rounded-xl p-6">
                <pre
                  className="text-emerald-200 text-base leading-loose whitespace-pre-wrap text-right font-serif overflow-auto max-h-[600px]"
                  dir="rtl"
                >
                  {data.rawText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!data && !error && (
          <div className="text-center py-16 text-emerald-500">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-lg">اختر سورة من القائمة أعلاه لعرضها</p>
          </div>
        )}
      </main>
    </div>
  );
}
