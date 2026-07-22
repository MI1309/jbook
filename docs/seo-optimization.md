# Panduan Peningkatan SEO JBook

Dokumen ini menjelaskan langkah-langkah yang telah diterapkan untuk mengoptimalkan Search Engine Optimization (SEO) pada aplikasi JBook agar bisa meraih peringkat atas di hasil pencarian Google, meskipun dihosting melalui Vercel.

## 1. Meta Tags Global (app/layout.jsx)
Kami telah memperbarui konfigurasi `metadata` bawaan dari Next.js untuk menyertakan informasi yang komprehensif bagi mesin pencari:
- **Title & Description**: Menyediakan judul dan deskripsi yang relevan dan mengandung kata kunci utama.
- **Keywords**: Menambahkan kata kunci spesifik seperti "belajar bahasa jepang", "kanji", "bunpo", "kotoba", dan "JLPT".
- **Open Graph (OG) & Twitter Cards**: Metadata khusus untuk media sosial agar saat link dibagikan, preview yang muncul (gambar, judul, deskripsi) terlihat profesional dan menarik klik (Click-Through Rate).
- **Canonical URL**: Mengatur URL kanonikal untuk mencegah duplikasi konten di mata Google.

## 2. Peta Situs (Sitemap - app/sitemap.js)
File `sitemap.js` akan menghasilkan `sitemap.xml` secara dinamis.
Sitemap membantu Googlebot menemukan dan mengindeks seluruh halaman penting di aplikasi (seperti beranda, about, blog, kanji, bunpo, kotoba, dan practice) beserta informasi prioritas dan seberapa sering konten diperbarui.

## 3. Robots.txt (app/robots.js)
File `robots.js` mengontrol perilaku bot mesin pencari (crawler). 
- Mengizinkan (`allow: '/'`) bot untuk merayapi seluruh situs.
- Melarang (`disallow`) bot merayapi direktori yang bersifat privat seperti `/admin/`.
- Menyertakan link ke `sitemap.xml` agar mesin pencari langsung tahu struktur situs.

## 4. Hosting Vercel & SEO
Aplikasi yang di-hosting di Vercel menggunakan Next.js otomatis dioptimalkan untuk SEO karena adanya fitur **Server-Side Rendering (SSR)** dan **Static Site Generation (SSG)**. Mesin pencari dapat langsung membaca HTML yang sudah ter-render sehingga mempercepat proses indeksing dan meningkatkan skor *Core Web Vitals* yang menjadi faktor krusial dalam algoritma ranking Google.

## Rekomendasi Selanjutnya untuk SEO
Untuk terus meningkatkan ranking di halaman pencarian:
1. **Google Search Console**: Daftarkan domain aplikasi ke [Google Search Console](https://search.google.com/search-console) dan submit link `https://jbook.vercel.app/sitemap.xml`.
2. **Backlink**: Perbanyak tautan masuk (backlink) dari situs lain yang membahas tentang belajar bahasa jepang.
3. **Konten Berkualitas (Blog)**: Rutin membuat artikel/blog tentang materi pelajaran Bahasa Jepang atau JLPT untuk memperluas jangkauan kata kunci.
4. **Tag Semantik HTML**: Pastikan setiap halaman menggunakan tag HTML yang tepat seperti `<h1>` (hanya satu per halaman), `<h2>`, `<h3>`, dan atribut `alt` pada setiap gambar.
