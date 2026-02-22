import { NextResponse } from "next/server";

export interface Verse {
  number: number;
  text: string;
}

export interface SurahData {
  name: string;
  bismillah: string;
  verses: Verse[];
  rawText: string;
}

function arabicIndicToNumber(str: string): number {
  const arabicIndicDigits: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
  };
  return parseInt(
    str
      .split("")
      .map((c) => arabicIndicDigits[c] ?? c)
      .join("")
  );
}

function parseVerses(fullText: string): Verse[] {
  // Remove the header line (ﵧ سُورَةُ ... ﵦ) and Bismillah
  // Split by verse numbers: Arabic-Indic numerals surrounded by spaces or at end
  // Pattern: a standalone Arabic-Indic number (possibly multi-digit)
  const verseNumberPattern = /\s([٠-٩۰-۹]+)\s/g;

  const verses: Verse[] = [];
  let lastIndex = 0;
  let lastVerseNum = 0;
  let match: RegExpExecArray | null;

  // Find all verse number positions
  const positions: { index: number; num: number; fullMatch: string }[] = [];

  while ((match = verseNumberPattern.exec(fullText)) !== null) {
    const num = arabicIndicToNumber(match[1]);
    // Only count sequential verse numbers
    if (num === lastVerseNum + 1) {
      positions.push({
        index: match.index,
        num,
        fullMatch: match[0],
      });
      lastVerseNum = num;
    }
  }

  // Extract verse texts based on positions
  for (let i = 0; i < positions.length; i++) {
    const start = i === 0 ? 0 : positions[i - 1].index + positions[i - 1].fullMatch.length;
    const end = positions[i].index + positions[i].fullMatch.length;
    const verseText = fullText.slice(start, end).trim();

    verses.push({
      number: positions[i].num,
      text: verseText,
    });
  }

  // Add the last verse (text after the last verse number)
  if (positions.length > 0) {
    const lastPos = positions[positions.length - 1];
    const remainingText = fullText.slice(lastPos.index + lastPos.fullMatch.length).trim();
    if (remainingText) {
      verses.push({
        number: lastPos.num + 1,
        text: remainingText,
      });
    }
  }

  return verses;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const surahName = searchParams.get("surah") || "يونس";

  try {
    const encodedName = encodeURIComponent(surahName);
    const apiUrl = `https://ghazi369.pythonanywhere.com/surat/${encodedName}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch surah: ${response.statusText}` },
        { status: response.status }
      );
    }

    const rawData = await response.json();

    if (!rawData.NameofSura || !rawData.TextofSura) {
      return NextResponse.json(
        { error: "Invalid data format from source API" },
        { status: 500 }
      );
    }

    // Join all text items into a single string
    const fullText = rawData.TextofSura.join("").trim();

    // Extract Bismillah (3rd item typically)
    const bismillah = rawData.TextofSura[2]?.trim() || "";

    // Find the main content (after header and bismillah)
    // The header is item[0], blank is item[1], bismillah is item[2]
    const mainContent = rawData.TextofSura.slice(3).join("").trim();

    // Parse verses from the main content
    const verses = parseVersesFromContent(mainContent);

    const result: SurahData = {
      name: rawData.NameofSura,
      bismillah,
      verses,
      rawText: fullText,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Failed to scrape data", details: String(error) },
      { status: 500 }
    );
  }
}

function parseVersesFromContent(content: string): Verse[] {
  // Arabic-Indic digit ranges: ٠-٩ (U+0660-U+0669) and ۰-۹ (U+06F0-U+06F9)
  // Split the content by verse number markers
  // Verse numbers appear as standalone numbers between spaces
  const parts = content.split(/\s([٠-٩۰-۹]+)(?:\s|$)/);

  const verses: Verse[] = [];
  let currentText = "";
  let expectedVerseNum = 1;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Check if this part is a verse number
    const isVerseNum = /^[٠-٩۰-۹]+$/.test(part);

    if (isVerseNum) {
      const num = arabicIndicToNumber(part);
      if (num === expectedVerseNum) {
        // Save the current accumulated text as a verse
        const verseText = currentText.trim();
        if (verseText) {
          verses.push({
            number: expectedVerseNum,
            text: verseText,
          });
        }
        currentText = "";
        expectedVerseNum++;
      } else {
        // Not a sequential verse number, treat as text
        currentText += " " + part;
      }
    } else {
      currentText += (currentText ? " " : "") + part;
    }
  }

  // Add remaining text as the last verse
  const remainingText = currentText.trim();
  if (remainingText) {
    verses.push({
      number: expectedVerseNum,
      text: remainingText,
    });
  }

  return verses;
}
