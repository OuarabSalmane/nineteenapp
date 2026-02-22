"use client";

import { useState, useCallback } from "react";

interface Verse {
  number: number;
  text: string;
}

interface SurahData {
  name: string;
  bismillah: string;
  verses: Verse[];
  rawText: string;
}

function numberToArabicIndic(num: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((d) => digits[parseInt(d)])
    .join("");
}

export default function Home() {
  const [surahName, setSurahName] = useState("يونس");
  const [data, setData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"verses" | "raw">("verses");
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

  const scrape = useCallback(async () => {
    if (!surahName.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `/api/scrape?surah=${encodeURIComponent(surahName.trim())}`
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to fetch data");
        return;
      }

      setData(json);
    } catch (err) {
      setError("Network error: " + String(err));
    } finally {
      setLoading(false);
    }
  }, [surahName]);

  const copyVerse = useCallback(async (verse: Verse) => {
    const text = `${verse.text} (${numberToArabicIndic(verse.number)})`;
    await navigator.clipboard.writeText(text);
    setCopiedVerse(verse.number);
    setTimeout(() => setCopiedVerse(null), 2000);
  }, []);

  const copyAll = useCallback(async () => {
    if (!data) return;
    const text = data.verses.map((v) => `${v.text}`).join("\n\n");
    await navigator.clipboard.writeText(text);
  }, [data]);

  const allSurahs = [
    "الفاتحة",
    "البقرة",
    "آل_عمران",
    "النساء",
    "المائدة",
    "الأنعام",
    "الأعراف",
    "الأنفال",
    "التوبة",
    "يونس",
    "هود",
    "يوسف",
    "الرعد",
    "إبراهيم",
    "الحجر",
    "النحل",
    "الإسراء",
    "الكهف",
    "مريم",
    "طه",
    "الأنبياء",
    "الحج",
    "المؤمنون",
    "النور",
    "الفرقان",
    "الشعراء",
    "النمل",
    "القصص",
    "العنكبوت",
    "الروم",
    "لقمان",
    "السجدة",
    "الأحزاب",
    "سبأ",
    "فاطر",
    "يس",
    "الصافات",
    "ص",
    "الزمر",
    "غافر",
    "فصلت",
    "الشورى",
    "الزخرف",
    "الدخان",
    "الجاثية",
    "الأحقاف",
    "محمد",
    "الفتح",
    "الحجرات",
    "ق",
    "الذاريات",
    "الطور",
    "النجم",
    "القمر",
    "الرحمن",
    "الواقعة",
    "الحديد",
    "المجادلة",
    "الحشر",
    "الممتحنة",
    "الصف",
    "الجمعة",
    "المنافقون",
    "التغابن",
    "الطلاق",
    "التحريم",
    "الملك",
    "القلم",
    "الحاقة",
    "المعارج",
    "نوح",
    "الجن",
    "المزمل",
    "المدثر",
    "القيامة",
    "الإنسان",
    "المر‏سلات",
    "النبأ",
    "النازعات",
    "عبس",
    "التكوير",
    "الإنفطار",
    "المطففين",
    "الإنشقاق",
    "البروج",
    "الطارق",
    "الأعلى",
    "الغاشية",
    "الفجر",
    "البلد",
    "الشمس",
    "الليل",
    "الضحى",
    "الشرح",
    "التين",
    "العلق",
    "القدر",
    "البينة",
    "الزلزلة",
    "العاديات",
    "القارعة",
    "التكاثر",
    "العصر",
    "الهمزة",
    "الفيل",
    "قريش",
    "الماعون",
    "الكوثر",
    "الكافرون",
    "النصر",
    "المسد",
    "الإخلاص",
    "الفلق",
    "الناس",
  ];

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
              Quran Scraper
            </h1>
            <p className="text-emerald-400 text-xs">
              ghazi369.pythonanywhere.com
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Search Section */}
        <div className="bg-emerald-900/40 border border-emerald-700/40 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-emerald-300 text-sm font-semibold uppercase tracking-wider mb-4">
            Enter Surah Name (Arabic)
          </h2>

          <div className="flex gap-3">
            <input
              type="text"
              value={surahName}
              onChange={(e) => setSurahName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scrape()}
              placeholder="e.g. يونس"
              dir="rtl"
              className="flex-1 bg-emerald-950/60 border border-emerald-600/40 rounded-xl px-4 py-3 text-white placeholder-emerald-600 text-right text-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all"
            />
            <button
              onClick={scrape}
              disabled={loading || !surahName.trim()}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Scraping...
                </>
              ) : (
                <>
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Scrape
                </>
              )}
            </button>
          </div>

          {/* Quick Select */}
          <div className="mt-4">
            <p className="text-emerald-500 text-xs mb-2">Quick select (all 114 surahs):</p>
            <select
              value={surahName}
              onChange={(e) => setSurahName(e.target.value)}
              dir="rtl"
              className="w-full bg-emerald-950/60 border border-emerald-600/40 rounded-xl px-4 py-3 text-white text-right text-base focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all cursor-pointer"
            >
              {allSurahs.map((s, i) => (
                <option key={s} value={s} className="bg-emerald-950 text-white">
                  {i + 1}. {s}
                </option>
              ))}
            </select>
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
                Surah
              </div>
              <h2
                className="text-white text-4xl font-bold mb-3"
                dir="rtl"
                style={{ fontFamily: "serif" }}
              >
                سُورَةُ {data.name}
              </h2>
              {data.bismillah && (
                <p
                  className="text-emerald-200 text-xl mt-3"
                  dir="rtl"
                  style={{ fontFamily: "serif" }}
                >
                  {data.bismillah}
                </p>
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
                  {data.verses.length} verses
                </span>
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
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  Source: ghazi369.pythonanywhere.com
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
                Parsed Verses ({data.verses.length})
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "raw"
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 hover:text-white"
                }`}
              >
                Raw Text
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
                Copy All
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

                      {/* Verse Text */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-white text-xl leading-loose text-right"
                          dir="rtl"
                          style={{ fontFamily: "serif" }}
                        >
                          {verse.text}
                        </p>
                        <p className="text-emerald-500 text-xs mt-2 text-right">
                          Verse {verse.number} of {data.name}
                        </p>
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

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="text-center py-16 text-emerald-600">
            <div className="text-6xl mb-4">🕌</div>
            <p className="text-lg font-medium text-emerald-400">
              Enter a Surah name to begin scraping
            </p>
            <p className="text-sm mt-2">
              Data sourced from ghazi369.pythonanywhere.com
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-800/50 mt-12 py-6 text-center text-emerald-600 text-sm">
        <p>
          Scraping{" "}
          <code className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded text-xs">
            ghazi369.pythonanywhere.com/surat/[name]
          </code>
        </p>
      </footer>
    </div>
  );
}
