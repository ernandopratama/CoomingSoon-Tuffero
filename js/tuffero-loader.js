/**
 * TUFFERO LOGO LIGHT-DRAW LOADER
 * File: js/tuffero-loader.js
 *
 * Animasi murni CSS (css/style-product.css). Script ini:
 * - menambah percikan cahaya,
 * - menunggu gambar halaman + slide Vegas pertama,
 * - menahan loader sampai animasi logo selesai,
 * - memicu event "tuffero:loaded" agar main.js memulai intro halaman.
 */

(function () {
    "use strict";

    const loader = document.getElementById("tuffero-loader");
    const stage = document.getElementById("tuffero-logo-stage");
    const logo = document.getElementById("tuffero-logo-source");

    if (!loader || !stage || !logo) return;

    // Animasi logo di CSS selesai ≈ 5.55s, lalu tahan 1s sebelum halaman tampil
    const MIN_VISIBLE_MS = 5550 + 1000;
    const SPARK_COUNT = 18;
    // Animasi CSS mulai di frame pertama, bukan saat script ini jalan (CSS CDN bisa menunda render).
    let startedAt = Date.now();
    requestAnimationFrame(function () {
        startedAt = Date.now();
    });

    let loaderHidden = false;

    /*
     * Percikan di sepanjang jalur pena, muncul mengikuti
     * waktu pena melewati posisi tersebut.
     */
    function buildSparks() {
        for (let i = 0; i < SPARK_COUNT; i++) {
            const spark = document.createElement("span");
            const progress = i / (SPARK_COUNT - 1);

            spark.className = "tuffero-spark";
            spark.style.setProperty("--x", (progress * 100) + "%");
            spark.style.setProperty("--y", (35 + Math.random() * 35) + "%");
            spark.style.setProperty("--size", (1 + Math.random() * 2.5) + "px");
            spark.style.setProperty("--dx", (-20 - Math.random() * 50) + "px");
            spark.style.setProperty("--dy", (Math.random() * 40 - 20) + "px");
            spark.style.setProperty("--delay", (1050 + progress * 2550) + "ms");

            stage.appendChild(spark);
        }
    }

    /*
     * Tunggu satu gambar. Jika gagal, lanjut agar loader tidak macet.
     */
    function waitForImage(url) {
        return new Promise(function (resolve) {
            const image = new Image();
            image.onload = resolve;
            image.onerror = resolve;
            image.src = url;
            if (image.complete) resolve();
        });
    }

    /*
     * Tunggu gambar HTML yang tersedia di halaman
     * (loading="lazy" yang belum dimulai dilewati agar tidak menunggu selamanya).
     */
    function waitForPageImages() {
        const images = Array.from(document.images).filter(function (image) {
            return image.loading !== "lazy";
        });

        return Promise.all(images.map(function (image) {
            if (image.complete) return Promise.resolve();

            return new Promise(function (resolve) {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
            });
        }));
    }

    /*
     * Tunggu slide Vegas pertama saja (lihat js/vegasq.js); slide lain
     * dimuat Vegas sendiri selama jeda antarslide.
     */
    function waitForFirstSlide() {
        return waitForImage("img/slide/qslide-1.webp");
    }

    function hideLoader() {
        if (loaderHidden) return;
        loaderHidden = true;

        loader.classList.add("is-hidden");
        loader.setAttribute("aria-hidden", "true");
        document.dispatchEvent(new Event("tuffero:loaded"));

        window.setTimeout(function () {
            loader.style.display = "none";
        }, 1000);
    }

    function hideAfterAnimation() {
        const remaining = MIN_VISIBLE_MS - (Date.now() - startedAt);
        window.setTimeout(hideLoader, Math.max(0, remaining));
    }

    // Logo gagal dimuat: tampilkan teks fallback
    logo.addEventListener("error", function () {
        stage.innerHTML =
            '<span class="tuffero-loader__fallback">Tuffero</span>';
    }, { once: true });

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        buildSparks();
    }

    // Tanpa menunggu window "load": itu ikut menunggu semua slide (±11 MB).
    Promise.all([
        waitForPageImages(),
        waitForFirstSlide()
    ]).then(hideAfterAnimation, hideAfterAnimation);
})();
