/**
 * Script to scrape numerical values (word count, letter count, abjad value)
 * for each verse of specified surahs from ghazi369.pythonanywhere.com/nineteen
 *
 * Usage: node scripts/scrape-numerical.mjs
 */

import https from 'https';
import querystring from 'querystring';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QURAN_JSON_PATH = path.join(__dirname, '../src/data/quran.json');

// Surahs to process (by surahNumber)
const TARGET_SURAHS = [1, 57, 104]; // Al-Fatihah, Al-Hadid, Al-Humaza

const DELAY_MS = 800; // delay between requests to be polite

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * POST to /nineteen endpoint and return parsed JSON
 */
function fetchNumericalData(text) {
  return new Promise((resolve, reject) => {
    // Clean the text: remove newlines, normalize whitespace
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    const data = querystring.stringify({
      txt: cleanText,
      searchChars: '',
      searchFwords: ''
    });

    const options = {
      hostname: 'ghazi369.pythonanywhere.com',
      path: '/nineteen',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://ghazi369.pythonanywhere.com/number-ayat',
        'User-Agent': 'Mozilla/5.0 (compatible; QuranScraper/1.0)'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
          return;
        }
        try {
          const parsed = JSON.parse(body);
          resolve({
            numWords: parsed.val_numOFwords,
            numChars: parsed.val_numChar,
            abjadValue: parsed.val_totalnum
          });
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}\nBody: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Loading quran.json...');
  const quranData = JSON.parse(fs.readFileSync(QURAN_JSON_PATH, 'utf-8'));

  let totalRequests = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const surah of quranData) {
    if (!TARGET_SURAHS.includes(surah.surahNumber)) continue;

    console.log(`\n=== Processing Surah ${surah.surahNumber}: ${surah.name} (${surah.verses.length} verses) ===`);

    // Process bismillah if present
    if (surah.bismillah && surah.bismillah.trim()) {
      console.log(`  Fetching bismillah...`);
      try {
        await sleep(DELAY_MS);
        const result = await fetchNumericalData(surah.bismillah);
        surah.bismillahNumerics = result;
        console.log(`  Bismillah: words=${result.numWords}, chars=${result.numChars}, abjad=${result.abjadValue}`);
        successCount++;
      } catch (e) {
        console.error(`  ERROR for bismillah: ${e.message}`);
        errorCount++;
      }
      totalRequests++;
    }

    // Process each verse
    for (const verse of surah.verses) {
      console.log(`  Fetching verse ${verse.number}...`);
      try {
        await sleep(DELAY_MS);
        const result = await fetchNumericalData(verse.text);
        verse.numerics = result;
        console.log(`  Verse ${verse.number}: words=${result.numWords}, chars=${result.numChars}, abjad=${result.abjadValue}`);
        successCount++;
      } catch (e) {
        console.error(`  ERROR for verse ${verse.number}: ${e.message}`);
        errorCount++;
      }
      totalRequests++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  console.log('\nSaving updated quran.json...');
  fs.writeFileSync(QURAN_JSON_PATH, JSON.stringify(quranData, null, 2), 'utf-8');
  console.log('Done!');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
