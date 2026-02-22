#!/usr/bin/env node
/**
 * Script to scrape all 114 surahs from ghazi369.pythonanywhere.com
 * and save them as static JSON data.
 *
 * Data structure from API:
 *   TextofSura[0] = header (ﵧ سُورَةُ ... ﵦ)
 *   TextofSura[1] = blank line
 *   TextofSura[2] = Bismillah (for most surahs) OR first verse (for Al-Fatihah)
 *   TextofSura[3+] = verse content (verse numbers appear at END of each verse)
 *
 * Special cases:
 *   - Al-Fatihah (1): Bismillah IS verse 1, so item[2] = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ ١"
 *   - At-Tawbah (9): No Bismillah at all, content starts from item[2]
 *
 * Verse format: verse text followed by Arabic-Indic number at the end
 * e.g. "الٓرۚ تِلۡكَ ءَايَٰتُ ٱلۡكِتَٰبِ ٱلۡحَكِيمِ ١"
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// All 114 surahs in order
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

// Surah At-Tawbah has no Bismillah (index 8, 0-based = surah 9)
const NO_BISMILLAH_SURAH = "التوبة";
// Al-Fatihah: Bismillah IS verse 1
const FATIHAH_SURAH = "الفاتحة";

function arabicIndicToNumber(str) {
  const arabicIndicDigits = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };
  return parseInt(
    str.split("").map((c) => arabicIndicDigits[c] ?? c).join("")
  );
}

/**
 * Parse verses from content where verse numbers appear at the END of each verse.
 * Pattern: "verse text ١ more verse text ٢ ..."
 * We split by the verse number markers and reconstruct verses.
 */
function parseVersesFromContent(content) {
  // The verse number appears at the end of each verse, followed by whitespace or end of string
  // We use a regex to split on verse number boundaries
  // Pattern: split on (arabic-indic number) that is followed by whitespace or end
  // We capture the number so we can use it
  
  // Split the content by verse number markers
  // Verse numbers are Arabic-Indic digits at word boundaries
  const parts = content.split(/([٠-٩۰-۹]+)(?:\s|$)/);
  
  const verses = [];
  let currentText = "";
  let expectedVerseNum = 1;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isVerseNum = /^[٠-٩۰-۹]+$/.test(part);

    if (isVerseNum) {
      const num = arabicIndicToNumber(part);
      if (num === expectedVerseNum) {
        // This number ends the current verse
        const verseText = currentText.trim();
        if (verseText) {
          verses.push({ number: expectedVerseNum, text: verseText });
        }
        currentText = "";
        expectedVerseNum++;
      } else {
        // Not a sequential verse number, treat as text
        currentText += part;
      }
    } else {
      currentText += part;
    }
  }

  // Add remaining text as the last verse if any
  const remainingText = currentText.trim();
  if (remainingText) {
    verses.push({ number: expectedVerseNum, text: remainingText });
  }

  return verses;
}

async function fetchSurah(name) {
  const encodedName = encodeURIComponent(name);
  const url = `https://ghazi369.pythonanywhere.com/surat/${encodedName}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const rawData = await response.json();

  if (!rawData.NameofSura || !rawData.TextofSura) {
    throw new Error("Invalid data format from source API");
  }

  const isNoBismillah = name === NO_BISMILLAH_SURAH;
  const isFatihah = name === FATIHAH_SURAH;

  let bismillah = "";
  let mainContent = "";

  if (isNoBismillah) {
    // At-Tawbah: no Bismillah, content starts from item[2]
    bismillah = "";
    mainContent = rawData.TextofSura.slice(2).join("").trim();
  } else if (isFatihah) {
    // Al-Fatihah: Bismillah IS verse 1, so we treat item[2] as part of content
    // The bismillah display should be empty (it's verse 1, not a header)
    bismillah = "";
    mainContent = rawData.TextofSura.slice(2).join("").trim();
  } else {
    // Normal surahs: item[2] = Bismillah (no verse number), item[3+] = content
    bismillah = rawData.TextofSura[2]?.trim() || "";
    mainContent = rawData.TextofSura.slice(3).join("").trim();
  }

  const verses = parseVersesFromContent(mainContent);
  const fullText = rawData.TextofSura.join("").trim();

  return {
    name: rawData.NameofSura,
    bismillah,
    verses,
    rawText: fullText,
  };
}

async function main() {
  console.log(`Starting to scrape ${allSurahs.length} surahs...`);

  const results = [];
  const errors = [];

  for (let i = 0; i < allSurahs.length; i++) {
    const name = allSurahs[i];
    const num = i + 1;

    try {
      process.stdout.write(`[${num}/114] Fetching ${name}... `);
      const data = await fetchSurah(name);
      results.push({ surahNumber: num, ...data });
      console.log(`✓ (${data.verses.length} verses)`);

      // Small delay to be respectful to the server
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`✗ ERROR: ${err.message}`);
      errors.push({ surahNumber: num, name, error: err.message });
    }
  }

  console.log(`\nDone! ${results.length} surahs scraped, ${errors.length} errors.`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.forEach((e) => console.log(`  - Surah ${e.surahNumber} (${e.name}): ${e.error}`));
  }

  // Save to src/data/quran.json
  const outputDir = join(__dirname, "..", "src", "data");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, "quran.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nData saved to ${outputPath}`);
  console.log(`Total size: ${(JSON.stringify(results).length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
