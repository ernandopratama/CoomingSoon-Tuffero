# Audit Performa Tuffero Coming Soon

Tanggal audit: 30 Oktober 2026
URL produksi: https://tuffero.comingsoon.ernando.my.id/
Commit dasar: `2ca4276` (perf(img): convert images to webp)

## Ringkasan

Sebelum optimasi, skor produksi adalah **76 di Mobile** dan **92 di Desktop**. Masalah terbesar ada di LCP Mobile (4.9 s). Elemen LCP adalah logo pada loader. Gambar logo terlalu besar dan tertahan oleh CSS dari CDN yang memblokir render.

Lima perbaikan sudah diterapkan di lokal, belum di-deploy:

1. Logo loader dibuat versi 1086 px dan dipasang dengan `srcset`.
2. CSS Font Awesome dan PhotoSwipe tidak lagi memblokir render.
3. Semua script memakai `defer`.
4. Animasi pena loader memakai `transform`, sehingga CLS menjadi 0.
5. Gambar produk diberi `width`/`height`.

Pada uji Lighthouse lokal, Desktop naik dari 87 ke 90, CLS turun ke 0, dan FCP membaik. Angka akhir untuk produksi baru bisa dipastikan setelah deploy dan uji ulang di PageSpeed Insights.

## 1. Kondisi awal

- Struktur: `index.html`, `css/style-product.css` (CSS template, sebagian minified), `css/style.css` (CSS Tuffero), 17 file JS lokal, dan folder `img/`. Semua gambar sudah dalam format WebP.
- Library: jQuery, Velocity, Vegas, mCustomScrollbar, PhotoSwipe, dialogFx, dan Modernizr. Font Awesome 7.3.1 dan PhotoSwipe CSS dimuat dari cdnjs. Font dimuat dari Google Fonts (Bodoni Moda + Manrope).
- Hosting: LiteSpeed/Apache di cPanel, dengan deploy dari Git (`.cpanel.yml`). `.htaccess` memasang CSP `script-src 'self'`, sehingga handler `onload` inline tidak boleh dipakai.
- Loader: tampil minimal 6.55 s (animasi 5.55 s + jeda 1 s). Setelah itu loader memicu event `tuffero:loaded` untuk Vegas dan intro.
- Ukuran gambar yang tampil di halaman:

| File | Dimensi | Ukuran |
|---|---|---|
| Logo loader (`Tuffero Script Logo White - NoBckgrnd.webp`) | 2172×724 | 112 KiB |
| Produk (4 file) | 1181–1417 px persegi | 74–130 KiB |
| Slide Vegas (6 file) | ±1800×873 | 68–132 KiB |

## 2. Hasil PageSpeed Insights sebelum optimasi

Diambil dari pagespeed.web.dev pada 30 Oktober 2026, 08:33 WIB, dengan Lighthouse 13.6.0. PSI API tanpa key ditolak dengan `429 Quota exceeded`, jadi pengujian dilakukan lewat UI web.

| Metrik | Mobile | Desktop |
|---|---|---|
| Performance | 76 | 92 |
| FCP | 1.7 s | 0.5 s |
| LCP | 4.9 s | 1.3 s |
| TBT | 0 ms | 0 ms |
| CLS | 0.055 | 0.014 |
| Speed Index | 5.5 s | 2.0 s |
| Accessibility / Best Practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 |

Rincian LCP Mobile: TTFB 60 ms, resource load delay 1,250 ms, load duration 390 ms, element render delay 1,120 ms.

## 3. Masalah yang ditemukan dan penyebabnya

| # | Temuan PSI | Penyebab |
|---|---|---|
| 1 | Improve image delivery: hemat 368 KiB (Mobile) | Logo loader berukuran 2172×724, padahal tampil ±637×212. Gambar produk 1181–1417 px tampil ±718 px. |
| 2 | Render-blocking requests: hemat 1,010 ms (Mobile) | `all.min.css` Font Awesome, 2 CSS PhotoSwipe (cdnjs), `modernizr.custom.js` sinkron di `<head>`, `style.css`, `style-product.css`, dan Google Fonts. |
| 3 | LCP breakdown: load delay 1.25 s | LCP (logo loader) baru bisa dirender setelah semua CSS pemblokir selesai. |
| 4 | Network dependency tree: 2.9 s | 14 script sinkron di akhir `<body>` membentuk rantai panjang. |
| 5 | Layout shift culprits: CLS 0.055 | `.tuffero-pen` dianimasikan lewat properti `left`, sehingga tiap frame memicu layout shift. |
| 6 | Image elements do not have explicit width and height | 4 gambar produk dan logo brand belum punya atribut dimensi. |
| 7 | Avoid non-composited animations | Pena (`left`), plus `mask-position` dan `filter` pada logo. |
| 8 | Use efficient cache lifetimes (TTL 7 hari) | Diatur di server. Tidak diubah, lihat bagian 8. |
| 9 | Font display: 20 ms | Webfont Font Awesome dari CDN memakai `font-display: block`. File CDN tidak bisa diubah. |
| 10 | Reduce unused CSS/JS, Minify CSS/JS | `all.min.css` hanya terpakai sebagian kecil. `photoswipe.js` dan `jquery.mCustomScrollbar.js` belum di-minify. |

## 4. File yang diubah

| File | Perubahan |
|---|---|
| `index.html` | `srcset`/`sizes` pada logo loader. Logo brand memakai versi 1086 dengan `width`/`height`. Gambar produk diberi `width`/`height`. CSS CDN diberi `media="print"` + `data-deferred-css`. Semua `<script>` diberi `defer`. Versi aset naik ke `?v=20261030a`. |
| `css/style-product.css` | `.tuffero-logo-stage` diberi `container-type: inline-size`. `@keyframes tuffero-pen-travel` memakai `transform: translateX(...cqw)`, tidak lagi `left`. |
| `js/script.js` | 3 baris di awal file yang mengubah `link[data-deferred-css]` menjadi `media="all"`. |
| `img/Tuffero Script Logo White - NoBckgrnd-1086.webp` | File baru: logo 1086×362, 50 KiB (asli 112 KiB). File asli tetap ada untuk layar resolusi tinggi. |

Hal yang tidak diubah: isi dan URL gambar produk, slide Vegas, desain, durasi animasi loader, dan library yang dipakai.

## 5. Perbaikan yang dilakukan

1. **Gambar LCP.** Logo loader memakai `srcset` 1086w/2172w dengan `sizes="(max-width: 600px) 100vw, 680px"`. Ponsel dan desktop biasa mengunduh 50 KiB, bukan 112 KiB. Layar retina desktop tetap mendapat versi 2172. `fetchpriority="high"` dipertahankan.
2. **CSS non-kritis.** Font Awesome dan PhotoSwipe tetap di posisi semula di `<head>`, karena `style.css` meng-override `.pswp` dan `.fa`, sehingga urutan cascade harus sama. Bedanya, ketiganya sekarang dimuat dengan `media="print"` dan diaktifkan oleh `js/script.js`. Ikon dan galeri hanya terlihat setelah loader hilang (±6.5 s), jadi tidak ada kedipan gaya.
3. **JavaScript.** Semua script memakai `defer`, sehingga urutan eksekusi tetap sama, termasuk Modernizr sebelum `dialogFx.js`. HTML selesai di-parse lebih dulu, dan tidak ada script inline yang bergantung pada urutan lama.
4. **CLS.** Pena loader bergerak dengan `transform`. Jarak tempuhnya sama dengan sebelumnya (`120cqw + 96px` = dari `-10% - 48px` ke `110% + 48px`). Ini sudah diverifikasi: pena melintas dari -99 px ke ±553 px pada stage 459 px.
5. **Dimensi gambar.** `width`/`height` sesuai ukuran asli file. Karena CSS memakai `width: 100%; height: auto`, tampilan tidak berubah dan rasio ruang sudah dipesan sejak awal.

## 6. Hasil pengujian setelah optimasi

### Fungsi (server lokal `python -m http.server`, Chrome)

| Fitur | Hasil |
|---|---|
| Loader muncul lalu hilang (`is-hidden`) | OK |
| Animasi logo, pena, dan percikan | OK. Pena bergerak di sepanjang logo, gambar 1086 tajam di DPR 2.625. |
| Vegas berganti slide | OK (qslide-3 → qslide-4 dalam 9 s) |
| Countdown | OK (65:15:21:47) |
| Modal newsletter buka/tutup | OK (`dialog--open` → `dialog`) |
| Panel Tentang buka/tutup (1440×900) | OK. Di layar ≤1024 px tombol hanya scroll, sesuai desain. |
| Galeri PhotoSwipe: buka, next, tutup | OK (1/4 → 2/4) |
| Ikon Font Awesome | OK, tampil di desktop dan mobile |
| Link media sosial | OK, URL tidak berubah |
| Console | Tanpa error. Ada 1 issue Chrome: "Lazy-loaded images should have explicit dimensions", padahal atribut sudah terpasang. |
| Request gagal (4xx/5xx) | Tidak ada |

### Lighthouse lokal (Lighthouse 13.6.0 CLI, median 3 run, sebelum = commit `2ca4276`, sesudah = working tree)

| Metrik | Mobile sebelum | Mobile sesudah | Desktop sebelum | Desktop sesudah |
|---|---|---|---|---|
| Performance | 41 | 43 | 87 | 90 |
| FCP | 2.73 s | 2.21 s | 0.65 s | 0.58 s |
| LCP | 10.74 s | 10.14 s | 1.84 s | 1.78 s |
| TBT | 1,178 ms | 1,489 ms | 95 ms | 31 ms |
| CLS | 0.073 | 0.000 | 0.022 | 0.000 |
| Speed Index | 5.43 s | 5.41 s | 2.00 s | 1.79 s |

### Kenapa angka Mobile lokal jauh lebih buruk dari produksi

- **LCP 10 s adalah hasil simulasi, bukan pengamatan.** LCP yang benar-benar teramati di run yang sama hanya 1.99–2.71 s, sama dengan FCP. Lighthouse lokal mensimulasikan CPU 4× lebih lambat di atas laptop yang `benchmarkIndex`-nya hanya 388–493. Hasilnya, waktu kerja main thread membengkak. PSI berjalan di server yang jauh lebih cepat, karena itu produksi tercatat 4.9 s.
- **TBT sangat bervariasi.** Untuk kode yang sama, TBT berkisar 349–2,778 ms antar run. Kenaikan 1,178 → 1,489 ms masih di dalam rentang noise, bukan regresi.
- **Satu `Layout` pertama sangat mahal.** Trace DevTools (CPU 4×) mencatat 3.4 s untuk 301 objek, sebelum paint pertama. Masalah ini sudah ada sebelum optimasi. Uji varian menunjukkan:
  - Tanpa Google Fonts: LCP simulasi turun ke 7.9 s dan styleLayout turun dari 2.8 s ke 1.9 s.
  - Tanpa elemen `#stars`: tidak ada beda.

  Biaya layout ini lebih banyak berasal dari font, bukan dari efek bintang. Font tidak diubah karena menyangkut identitas tipografi Tuffero (lihat bagian 9).
- Server lokal tidak mengompresi file (tanpa gzip/brotli) dan tidak memasang header CSP. Jadi perbandingan yang valid hanya **sebelum vs sesudah di mesin yang sama**, bukan dibandingkan dengan angka produksi.

## 7. Perbandingan skor

Kolom "Sesudah" berisi hasil Lighthouse lokal. Angka PSI produksi setelah optimasi **belum ada**, karena perubahan belum di-deploy. Isi kolom ini setelah deploy dan uji ulang.

| Metrik | Sebelum (PSI produksi) | Sesudah (Lighthouse lokal) | Status |
|---|---|---|---|
| Performance Mobile | 76 | 43 (lokal, baseline lokal 41) | Naik 2 poin di lokal. PSI produksi menunggu deploy. |
| Performance Desktop | 92 | 90 (lokal, baseline lokal 87) | Naik 3 poin di lokal. PSI produksi menunggu deploy. |
| FCP (Mobile) | 1.7 s | 2.21 s (lokal, baseline 2.73 s) | Membaik 0.5 s di lokal |
| LCP (Mobile) | 4.9 s | 10.14 s simulasi / ±2.0 s observasi (lokal, baseline 10.74 s) | Membaik 0.6 s di lokal. Byte gambar LCP turun 55%. |
| TBT (Mobile) | 0 ms | 1,489 ms (lokal, baseline 1,178 ms) | Dalam rentang noise (349–2,778 ms) |
| CLS (Mobile) | 0.055 | 0.000 | Teratasi |
| Speed Index (Mobile) | 5.5 s | 5.41 s (lokal, baseline 5.43 s) | Tetap |

## 8. Masalah yang belum terselesaikan

| Masalah | Alasan belum dikerjakan |
|---|---|
| Gambar produk lebih besar dari ukuran tampilnya (hemat ±240 KiB) | Butuh file thumbnail baru. Brief melarang mengubah gambar produk tanpa persetujuan. |
| Cache TTL 7 hari | Butuh perubahan `.htaccess` di server. Beberapa JS tanpa `?v=` (misalnya `vegasq.js`) akan tetap basi lebih lama jika TTL diperpanjang. |
| Unused CSS Font Awesome (±18 KiB) | Butuh subset ikon atau SVG lokal. Ini perubahan dependensi. |
| Minify `photoswipe.js`, `jquery.mCustomScrollbar.js`, CSS lokal (±24 KiB) | Butuh langkah build. Proyek tidak punya build tool. |
| `font-display` Font Awesome | Diatur oleh file CDN |
| Layout pertama yang mahal (font) | Menyangkut tipografi. Perlu keputusan desain. |
| `mask-position`/`filter` logo bukan animasi composited | Inti dari efek "light-draw" logo. Tidak diubah. |

## 9. Rekomendasi tahap berikutnya

1. **Deploy, lalu uji ulang PSI produksi** untuk Mobile dan Desktop, dan isi kolom bagian 7. Ini prioritas pertama, karena angka lokal tidak bisa dibandingkan langsung dengan produksi.
2. **Thumbnail produk** ±720 px (`srcset` 720w + file asli untuk PhotoSwipe). Perkiraan hemat ±240 KiB. Perlu persetujuan karena menambah file gambar produk.
3. **Persempit Google Fonts.** Cek apakah Bodoni Moda benar-benar memakai seluruh rentang `opsz` 6..96 dan bobot 400..700 pada kedua gaya (tegak dan miring). Kurangi sesuai pemakaian, lalu bandingkan tampilannya. Uji varian menunjukkan font adalah biaya layout terbesar.
4. **Cache header** di `.htaccess`: `max-age` 30 hari untuk `img/`, dan untuk CSS/JS yang punya `?v=`. Tambahkan `?v=` ke semua JS lokal terlebih dulu.
5. **Font Awesome**: ganti dengan ±15 ikon SVG inline atau subset lokal, sehingga hemat ±250 KiB (CSS + 3 webfont).
6. Minify `photoswipe.js` dan `jquery.mCustomScrollbar.js` (atau pakai build `.min` resminya).
