/**
 * AUDIT SCRIPT — TEMPORARY, JANGAN DI-COMMIT
 * Tujuan: Mengukur cakupan slug Bunpo di sitemap vs API.
 * Hapus atau exclude dari git setelah audit.
 *
 * Usage: node scripts/audit-bunpo-slugs.mjs
 */

// ── Slug mapping (disalin dari data/bunpoSlugs.js agar bisa dijalankan sbg ESM murni) ──
const BUNPO_SLUGS = {
    // N5
    '～か': 'ka',
    '～は～です': 'wa-desu',
    '～の～': 'no',
    'ここ、そこ、あそこ': 'koko-soko-asako',
    '今～時～分です': 'ima-ji-fun-desu',
    '～へ行きます': 'e-ikimasu',
    '~masen ka (~ませんか)': 'masen-ka',
    '～で～': 'de',
    'Adjektiva-na / Adjektiva-i': 'keiyoushi',
    '～があります / います': 'ga-arimasu-imasu',
    '～に～があります': 'ni-ga-arimasu',
    '～個 / ～枚 / ～台': 'josuushi',
    'Adjektiva (Bentuk Lampau)': 'keiyoushi-kako',
    '～たいです': 'tai-desu',
    '~te imasu (~ています)': 'te-imasu',
    '～てもいいですか': 'temo-ii-desu-ka',
    '～てから': 'te-kara',
    '～ないでください': 'naide-kudasai',
    '～ことができます': 'koto-ga-dekimasu',
    '～たことがあります': 'ta-koto-ga-arimasu',
    'Bentuk Biasa (Futsuu-kei)': 'futsuu-kei',

    // N4
    'Kata Tanya + Vた-form ら いいですか': 'kata-tanya-vta-ra-ii-desu-ka',
    'N (objek) は': 'n-objek-wa',
    'Vて-form いただけませんか': 'v-te-itadakemasen-ka',
    '～んです (~n desu)': 'n-desu',
    'Kalimat Kata Kerja Potensial': 'kalimat-kata-kerja-potensial',
    'Kata Kerja Potensial (Potential Verbs)': 'kata-kerja-potensial-verbs',
    'Partikel は (Kontras)': 'partikel-wa-kontras',
    'Partikel も': 'partikel-mo',
    'しか (Shika)': 'shika',
    'できます (Dekimasu)': 'dekimasu',
    '見えます (Miemasu) & 聞こえます (Kikoemasu)': 'miemasu-kikoemasu',
    'Partikel に (Tujuan)': 'partikel-ni-tujuan',
    'Plain form し、～ (Mendaftarkan Hal/Alasan)': 'plain-form-shi',
    'V1 ます-form ながら V2': 'v1-masu-nagara-v2',
    'Vて-form います (Kebiasaan)': 'v-te-imasu-kebiasaan',
    'それで (Oleh karena itu)': 'sorede',
    'それに (Selain itu)': 'soreni',
    'Vて-form います (Kondisi/Keadaan)': 'v-te-imasu-kondisi',
    'Vて-form しまいました (Penyesalan)': 'v-te-shimaimashita-penyesalan',
    'Vて-form しまいました／しまいます (Selesai)': 'v-te-shimaimashita-shimaimasu-selesai',
    'ありました (Ditemukan)': 'arimashita-ditemukan',
    'どこかで / どこかに': 'dokokade-dokokani',
    'N1 に N2 が Vて-form あります': 'n1-ni-n2-ga-vte-arimasu',
    'N2 は N1 に Vて-form あります': 'n2-wa-n1-ni-vte-arimasu',
    'Vて-form あります (Persiapan Selesai)': 'v-te-arimasu-persiapan',
    'Vて-form おきます (Membiarkan Keadaan)': 'v-te-okimasu-membiarkan-keadaan',
    'Vて-form おきます (Penyelesaian Tindakan)': 'v-te-okimasu-penyelesaian-tindakan',
    'Vて-form おきます (Tindakan Lanjutan)': 'v-te-okimasu-tindakan-lanjutan',
    'それは ～': 'sore-wa',
    'まだ V (Affirmative)': 'mada-v-affirmative',
    'Bentuk Maksud (Plain Style)': 'bentuk-maksud-plain-style',
    'Bentuk Maksud (Volitional Form)': 'bentuk-maksud-volitional-form',
    'V-dictionary form/N の 予定です': 'v-dictionary-n-no-yotei-desu',
    'V-dictionary/nai form つもりです': 'v-dictionary-nai-tsumori-desu',
    'V-volitional form と 思って います': 'v-volitional-to-omotte-imasu',
    'こ～ / そ～ (Demonstrative dalam Tulisan)': 'ko-so-demonstrative-tulisan',
    'まだ Vて-form いません': 'mada-v-te-imasen',
    'Kata Tanya + Kata Sifat + こと': 'kata-tanya-kata-sifat-koto',
    'Quantifier で': 'quantifier-de',
    'Vた-form / Vない-form ほうが いいです': 'vta-vnai-hou-ga-ii-desu',
    'きっと / たぶん / もしかしたら': 'kitto-tabun-moshikashitara',
    '～かもしれません (Kemungkinan)': 'kamoshiremasen',
    '～でしょう (Dugaan)': 'deshou',
    'Bentuk Perintah & Larangan (Imperative & Prohibitive)': 'bentuk-perintah-larangan-imperative-prohibitive',
    'Vます-form なさい': 'v-masu-nasai',
    'X は Y という 意味です': 'x-wa-y-to-iu-imi-desu',
    '～と 伝えて いただけませんか': 'to-tsutaete-itadakemasen-ka',
    '～と 言っていました': 'to-itteimashita',
    '～と 読みます / ～と 書いて あります': 'to-yomimasu-to-kaite-arimasu',
    'N のあとで、V2 (Setelah...)': 'n-no-ato-de-v2',
    'N のとおりに、V (Sesuai dengan...)': 'n-no-toori-ni-v',
    'V1 たあとで、V2 (Setelah...)': 'v1-ta-ato-de-v2',
    'V1 て／ないで、V2 (Kondisi Penyerta)': 'v1-te-naide-v2-kondisi-penyerta',
    'V1 とおりに、V2 (Sesuai dengan...)': 'v1-toori-ni-v2',
    'V1 ないで、V2 (Sebagai Gantinya)': 'v1-naide-v2-sebagai-gantinya',
    'Bentuk ～ば (Penilaian atas Situasi)': 'ba-penilaian-situasi',
    'Bentuk ～ば (Syarat Mutlak)': 'ba-syarat-mutlak',
    'Interrogative + V conditional + いいですか': 'interrogative-v-conditional-ii-desu-ka',
    'N なら (Kalau N...)': 'n-nara',
    'Pembentukan Bentuk Pengandaian (Conditional Form)': 'pembentukan-bentuk-pengandaian-conditional-form',
    '～ば ～ほど (Semakin... semakin...)': 'ba-hodo',
    'V dictionary form ように なります / なくなります': 'v-dictionary-you-ni-narimasu-nakunari',
    'V dictionary/nai-form ように します': 'v-dictionary-nai-you-ni-shimasu',
    'V1 dictionary/nai-form ように、V2': 'v1-dictionary-nai-you-ni-v2',
    '～とか': 'toka',
    'Kata Kerja Bentuk Pasif (Passive Verbs)': 'kata-kerja-bentuk-pasif',
    'N (thing) が / は V-passive': 'n-thing-ga-wa-v-passive',
    'N から / N で つくります': 'n-kara-n-de-tsukurimasu',
    'N1 (person1) は N2 (person2) に N3 を V-passive': 'n1-person1-wa-n2-person2-ni-n3-o-v-passive',
    'N1 (person1) は N2 (person2) に V-passive': 'n1-person1-wa-n2-person2-ni-v-passive',
    'N1 は N2 (person) によって V-passive': 'n1-wa-n2-person-ni-yotte-v-passive',
    'Plain form のは N です': 'plain-form-no-wa-n-desu',
    'V dictionary form のが adjective です': 'v-dictionary-no-ga-adjective-desu',
    'V dictionary form のは adjective です': 'v-dictionary-no-wa-adjective-desu',
    'V dictionary form のを 忘れました': 'v-dictionary-no-o-wasuremashita',
    'V plain form の (Nominalisasi)': 'v-plain-form-no-nominalisasi',
    'V plain form のを 知っていますか': 'v-plain-form-no-o-shitteimasu-ka',
    '～とき (mo/ya/no/ni)': 'toki-mo-ya-no-ni',
    'N で (Penyebab/Alasan)': 'n-de-penyebab-alasan',
    'Vて / Vなくて / i-adj-くて / na-adj-で (Sebab-Akibat)': 'vte-vnakute-iadj-kute-naadj-de-sebab-akibat',
    '途中で (Di tengah-tengah)': 'tochuu-de',
    '～ので (Karena - Objektif/Halus)': 'node-objektif-halus',
    'Interrogative + Plain Form + か': 'interrogative-plain-form-ka',
    'Plain Form + か どうか': 'plain-form-ka-douka',
    'Vて-form みます': 'v-te-mimasu',
    'い-adj (~い) → ~さ': 'i-adj-sa',
    '～でしょうか': 'deshou-ka',
    'N に V (Sebagai tanda/kenang-kenangan)': 'n-ni-v-sebagai-tanda-kenang-kenangan',
    'Pemberian dan Penerimaan Benda (Keigo)': 'pemberian-penerimaan-benda-keigo',
    'Pemberian dan Penerimaan Tindakan (Keigo)': 'pemberian-penerimaan-tindakan-keigo',
    'Vて-form くださいませんか': 'v-te-kudasaimasen-ka',
    'Quantifier + は (Minimum)': 'quantifier-wa-minimum',
    'Quantifier + も (Penekanan Jumlah Banyak)': 'quantifier-mo-penekanan-jumlah-banyak',
    '～ために (Untuk/Demi)': 'tame-ni',
    '～のに (Untuk kegunaan/tujuan)': 'no-ni-kegunaan-tujuan',
    'Vて-form くれませんか': 'v-te-kuremasen-ka',
    'Vて-form 来ます (Pergi untuk... lalu kembali)': 'v-te-kimasu-pergi-kembali',
    '～そうです (Kelihatannya/Tampaknya)': 'sou-desu-kelihatannya-tampaknya',
    'Kata Sifat sebagai Keterangan (Adverbs)': 'kata-sifat-sebagai-keterangan-adverbs',
    'N に します (Memilih/Memutuskan)': 'n-ni-shimasu-memilih-memutuskan',
    '～く / ～に します (Membuat menjadi...)': 'ku-ni-shimasu-membuat-menjadi',
    '～すぎます (Terlalu/Berlebihan)': 'sugimasu-terlalu-berlebihan',
    '～やすいです / ～にくいです': 'yasui-desu-nikui-desu',
    '～のに (Padahal/Meskipun)': 'no-ni-padahal-meskipun',
    '～場合は (Dalam hal/Seandainya)': 'baai-wa-dalam-hal-seandainya',
    'Vた-form ばかりです': 'vta-bakari-desu',
    '～ところです (Titik Waktu Tindakan)': 'tokoro-desu-titik-waktu-tindakan',
    '～はずです (Seharusnya/Pasti)': 'hazu-desu',
    'Plain Form そうです (Katanya/Kabar Burung)': 'plain-form-sou-desu-katanya-kabar-burung',
    '声／音／におい／味が します': 'koe-oto-nioi-aji-ga-shimasu',
    '～ようです (Sepertinya/Rupanya)': 'you-desu-sepertinya-rupanya',
    'Kalimat Kata Kerja Kausatif': 'kalimat-kata-kerja-kausatif',
    'Kata Kerja Kausatif (Causative Verbs)': 'kata-kerja-kausatif-causative-verbs',
    'Penggunaan Bentuk Kausatif': 'penggunaan-bentuk-kausatif',
    'V-causative て-form いただけませんか': 'v-causative-te-itadakemasen-ka',
    'Hormat pada Kata Benda, Sifat, dan Keterangan (O/Go)': 'hormat-kata-benda-sifat-keterangan-o-go',
    'Kata Kerja Bentuk Hormat (Respectful Verbs)': 'kata-kerja-bentuk-hormat-respectful-verbs',
    'Kata Kerja Hormat Khusus (Special Respectful Words)': 'kata-kerja-hormat-khusus-special-respectful-words',
    'お Vます-form ください': 'o-v-masu-form-kudasai',
    'お Vます-form に なります': 'o-v-masu-form-ni-narimasu',
    '～まして (~mashite)': 'mashite',
    'Kata Kerja Rendah Hati Khusus (Special Humble Words)': 'kata-kerja-rendah-hati-khusus-special-humble-words',
    '丁寧語 (Teineigo - Polite Expressions)': 'teineigo-polite-expressions',
    '謙譲語 (Kenjougo - Humble Expressions)': 'kenjougo-humble-expressions',

    // N3
    '～まま': 'mama',
    '～きり': 'kiri',
    '～ふりをする': 'furi-o-suru',
    '～おかげで': 'okage-de',
    '～せいで': 'sei-de',
    '～とおりに / ～どおりに': 'toori-ni-doorini',
    '～について': 'ni-tsuite',
    '～に対して': 'ni-taishite',
    '～ために (Sebab)': 'tame-ni-2',
    '～によって': 'ni-yotte',
    '～といえば': 'to-ieba',
    '～たばかり': 'ta-bakari',
    '～さえ': 'sae',
    '～として': 'to-shite',
    '～うちに': 'uchi-ni',
    '～に違いない': 'ni-chigai-nai',
    '～はずだ': 'hazu-da',
    '～わけにはいかない': 'wake-ni-wa-ikanai',
    '～ないことはない': 'nai-koto-wa-nai',
    '～ている': 'te-iru',

    // N2
    '～にかけて': 'ni-kakete',
    '～だらけ': 'darake',
    '～おかげで / ～せいで': 'okage-de-sei-de',
    '～とおりに': 'toori-ni',
    '～について / ～につき': 'ni-tsuite-ni-tsuki',
    '～に加えて': 'ni-kuwaete',
    '～こそ': 'koso',
    '～さい(に)': 'sai-ni',
    '～最中に': 'saichuu-ni',
    '～しかない': 'shika-nai',
    '～わけがない': 'wake-ga-nai',
    '～ことにする': 'koto-ni-suru',
    '～ようとする': 'you-to-suru',
    '～がち': 'gachi',
    '～に反して': 'ni-hanshite',
    '～上(に)': 'ue-ni',
    '～向け / ～向き': 'muke-muki',
    '～っぽい': 'ppoi',
    '～気味': 'gimi',
    '～やら～やら': 'yara-yara',
    '～か～ないかのうちに': 'ka-nai-ka-no-uchi-ni',
    '～てからでないと': 'te-kara-denai-to',
    '～ことなく': 'koto-naku',
    '～どころか': 'dokoroka',
    '～末(に)': 'sue-ni',

    // N1
    '～なり': 'nari',
    '～が早いか': 'ga-hayai-ka',
    '～そばから': 'soba-kara',
    '～において / ～における': 'ni-oite-ni-okeru',
    '～にあって': 'ni-atte',
    '～皮切りに(して)': 'kawakiri-ni-shite',
    '～に至るまで': 'ni-itaru-made',
    '～を限りに': 'o-kagiri-ni',
    '～をもって': 'o-motte',
    '～といった': 'to-itta',
    '～こととて': 'koto-tote',
    '～ゆえ(に)': 'yue-ni',
    '～にかたくない': 'ni-kataku-nai',
    '～にたえない': 'ni-taenai',
    '～べく': 'beku',
    '～んがため(に)': 'n-ga-tame-ni',
    '～ごとく': 'gotoku',
    '～ずにはおかない': 'zu-ni-wa-okanai',
    '～なりに / ～なりの': 'nari-ni-nari-no',
    '～ないものでもない': 'nai-mono-demo-nai',
    '～極まる / ～極まりない': 'kiwamaru-kiwamarinai',
    '～の至り': 'no-itari',
    '～てやまない': 'te-yamanai',
    '～に堪えない': 'ni-taenai-2',
    '～を余儀なくされる': 'o-yoginaku-sareru',
};

function getBunpoSlug(pola) {
    return BUNPO_SLUGS[pola] ?? null;
}

// ── API Fetch ──────────────────────────────────────────────────────────────────
const API_URL = 'https://japan.pythonanywhere.com/api';

async function fetchList(endpoint, limit = 300) {
    const firstRes = await fetch(`${API_URL}${endpoint}?limit=${limit}&page=1`);
    if (!firstRes.ok) throw new Error(`HTTP ${firstRes.status}`);
    const firstPage = await firstRes.json();
    if (Array.isArray(firstPage)) return firstPage;

    const items = [...(firstPage?.items || [])];
    const pages = Math.max(1, Number(firstPage?.pages) || 1);
    for (let page = 2; page <= pages; page++) {
        const res = await fetch(`${API_URL}${endpoint}?limit=${limit}&page=${page}`);
        if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
        const data = await res.json();
        if (Array.isArray(data)) { items.push(...data); break; }
        items.push(...(data?.items || []));
    }
    return items;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
    console.log('=== AUDIT BUNPO SLUG COVERAGE ===\n');

    // Check if API returns slug field
    console.log('[ Cek field slug di API response ]');
    const sampleRes = await fetch(`${API_URL}/content/grammar?limit=1&page=1`);
    const sampleData = await sampleRes.json();
    const sampleItem = (sampleData.items || sampleData)[0];
    const apiHasSlug = 'slug' in sampleItem;
    console.log(`API mengembalikan field 'slug': ${apiHasSlug}`);
    console.log(`Fields yang tersedia: ${Object.keys(sampleItem).join(', ')}\n`);

    // Fetch all patterns
    console.log('[ Fetching semua pola dari API... ]');
    const allPatterns = await fetchList('/content/grammar', 300);
    console.log(`Total pola dari API: ${allPatterns.length}\n`);

    // A. Hitung cakupan slug
    const withSlug = [];
    const withoutSlug = [];
    const levelMap = {};

    for (const p of allPatterns) {
        const level = `N${p.jlpt_level}`;
        if (!levelMap[level]) levelMap[level] = { total: 0, withSlug: 0, withoutSlug: 0, missingExamples: [] };
        levelMap[level].total++;

        const slug = getBunpoSlug(p.title);
        if (slug) {
            withSlug.push({ ...p, slug });
            levelMap[level].withSlug++;
        } else {
            withoutSlug.push(p);
            levelMap[level].withoutSlug++;
            levelMap[level].missingExamples.push(p.title);
        }
    }

    console.log('=== A. CAKUPAN SLUG ===');
    console.log(`Total pola: ${allPatterns.length}`);
    console.log(`Punya slug: ${withSlug.length} (${((withSlug.length / allPatterns.length) * 100).toFixed(1)}%)`);
    console.log(`TIDAK punya slug: ${withoutSlug.length} (${((withoutSlug.length / allPatterns.length) * 100).toFixed(1)}%)\n`);

    console.log('Breakdown per level:');
    console.log('Level | Total | Punya Slug | Tidak Punya | % Gap');
    console.log('------|-------|------------|-------------|------');
    const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];
    let biggestGapLevel = null;
    let biggestGap = -1;
    for (const lvl of levelOrder) {
        const d = levelMap[lvl] || { total: 0, withSlug: 0, withoutSlug: 0 };
        const pct = d.total > 0 ? ((d.withoutSlug / d.total) * 100).toFixed(1) : '0.0';
        console.log(`${lvl}    | ${String(d.total).padEnd(5)} | ${String(d.withSlug).padEnd(10)} | ${String(d.withoutSlug).padEnd(11)} | ${pct}%`);
        if (d.withoutSlug > biggestGap) { biggestGap = d.withoutSlug; biggestGapLevel = lvl; }
    }

    console.log(`\nLevel dengan gap terbesar: ${biggestGapLevel} (${biggestGap} pola tanpa slug)`);

    // 20 contoh dari level dengan gap terbesar
    console.log(`\n20 contoh judul pola TANPA slug (dari ${biggestGapLevel}):`);
    const examplesFromBiggest = (levelMap[biggestGapLevel]?.missingExamples || []).slice(0, 20);
    examplesFromBiggest.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

    // B. Cek duplikasi slug
    console.log('\n=== B. DUPLIKASI SLUG ===');
    const slugToTitles = {};
    for (const p of withSlug) {
        if (!slugToTitles[p.slug]) slugToTitles[p.slug] = [];
        slugToTitles[p.slug].push(p.title);
    }
    const collisions = Object.entries(slugToTitles).filter(([, titles]) => titles.length > 1);
    if (collisions.length === 0) {
        console.log('Tidak ada duplikasi slug (dari pola yang punya slug di API).');
    } else {
        console.log(`Ditemukan ${collisions.length} collision:`);
        collisions.forEach(([slug, titles]) => {
            console.log(`  slug="${slug}" → ${titles.map(t => `"${t}"`).join(' vs ')}`);
        });
    }

    // Cek duplikasi di BUNPO_SLUGS mapping sendiri
    const allSlugValues = Object.values(BUNPO_SLUGS);
    const slugDups = {};
    for (const [title, slug] of Object.entries(BUNPO_SLUGS)) {
        if (!slugDups[slug]) slugDups[slug] = [];
        slugDups[slug].push(title);
    }
    const mappingCollisions = Object.entries(slugDups).filter(([, titles]) => titles.length > 1);
    if (mappingCollisions.length > 0) {
        console.log(`\nDuplikasi slug di BUNPO_SLUGS mapping (${mappingCollisions.length}):`);
        mappingCollisions.forEach(([slug, titles]) => {
            console.log(`  slug="${slug}" → ${titles.map(t => `"${t}"`).join(' vs ')}`);
        });
    } else {
        console.log('Tidak ada duplikasi di BUNPO_SLUGS mapping.');
    }

    // C. Cek konsistensi URL pilot
    console.log('\n=== C. KONSISTENSI URL PILOT ===');
    const pilotTests = [
        { title: '～は～です', expectedSlug: 'wa-desu' },
        { title: 'Partikel も', expectedSlug: 'partikel-mo' },   // mo-desu tidak ada; Partikel も = partikel-mo
        { title: '～ではありません', expectedSlug: null },            // ja-arimasen
        { title: '～か', expectedSlug: 'ka' },                     // desu-ka -> ka
        { title: '～の～', expectedSlug: 'no' },                   // no-partikel -> no
    ];
    // Proper pilot slugs from task description
    const properPilotTests = [
        { slug: 'wa-desu', desc: '～は～です' },
        { slug: 'mo-desu', desc: 'mo-desu (expected)' },
        { slug: 'ja-arimasen', desc: 'ja-arimasen (expected)' },
        { slug: 'desu-ka', desc: 'desu-ka (expected)' },
        { slug: 'no-partikel', desc: 'no-partikel (expected)' },
    ];
    
    console.log('Cek apakah slug pilot ada di BUNPO_SLUGS:');
    for (const test of properPilotTests) {
        const found = Object.values(BUNPO_SLUGS).includes(test.slug);
        console.log(`  "${test.slug}": ${found ? '✓ ADA' : '✗ TIDAK ADA di mapping'}`);
    }

    // Check route pattern
    console.log('\nRoute pattern di page.jsx: /bunpo/[level]/[slug]');
    console.log('Sitemap URL pattern: /bunpo/n{jlpt_level}/{slug}');
    console.log('Contoh: /bunpo/n5/wa-desu → cocok dengan route /bunpo/[level]/[slug] ✓');

    // D. Halaman yatim
    console.log('\n=== D. HALAMAN YATIM ===');
    const slugsInMapping = new Set(Object.keys(BUNPO_SLUGS));
    const titlesInApi = new Set(allPatterns.map(p => p.title));
    const slugsFromApiTitles = new Set(withSlug.map(p => p.title));

    // Titles di mapping tapi tidak di API
    const orphanInMapping = [...slugsInMapping].filter(title => !titlesInApi.has(title));
    console.log(`\nTitles di mapping (bunpoSlugs.js) tapi TIDAK ADA di API (${orphanInMapping.length}):`);
    if (orphanInMapping.length === 0) {
        console.log('  (tidak ada)');
    } else {
        orphanInMapping.forEach((t, i) => console.log(`  ${i + 1}. "${t}"`));
    }

    // Titles di API tapi tidak di mapping (menyebabkan tidak terindeks)
    const orphanInApi = allPatterns.filter(p => !getBunpoSlug(p.title));
    console.log(`\nPola di API tapi TIDAK ADA di mapping = tidak terindeks (${orphanInApi.length}):`);
    orphanInApi.forEach((p, i) => console.log(`  ${i + 1}. [N${p.jlpt_level}] "${p.title}"`));

    // E. Cek robots (sudah dibaca dari file, laporkan hasil)
    console.log('\n=== E. ROBOTS & METADATA ===');
    console.log('robots.js: /bunpo/* TIDAK diblokir. allow "/" untuk semua bot.');
    console.log('generateMetadata: robots: { index: true, follow: true } ✓');
    console.log('Kecuali jika pola/slug tidak ditemukan → robots: { index: false, follow: true }');

    // Summary
    console.log('\n=== RINGKASAN AKHIR ===');
    console.log(`Total pola di API       : ${allPatterns.length}`);
    console.log(`Masuk sitemap (ada slug): ${withSlug.length}`);
    console.log(`TIDAK masuk sitemap     : ${withoutSlug.length} (${((withoutSlug.length / allPatterns.length) * 100).toFixed(1)}%)`);
    console.log(`\napi mengembalikan field 'slug': ${apiHasSlug ? 'YA' : 'TIDAK'}`);
}

main().catch(console.error);
