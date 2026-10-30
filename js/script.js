
/* =========================================================
   TUFFERO COMING SOON
   Custom JavaScript
   ========================================================= */

// CSS non-kritis dimuat dengan media="print" agar tidak memblokir render;
// aktifkan di sini karena CSP (script-src 'self') melarang onload inline.
// tuffero-loader.js menunggu window.tufferoCssReady sebelum menampilkan halaman.
window.tufferoCssReady = Promise.race([
    Promise.all(Array.from(document.querySelectorAll("link[data-deferred-css]")).map(function (link) {
        link.media = "all";
        if (link.sheet) return Promise.resolve();

        return new Promise(function (resolve) {
            link.addEventListener("load", resolve, { once: true });
            link.addEventListener("error", resolve, { once: true });
        });
    })),
    // Error CSS yang terjadi sebelum script ini jalan tidak terdengar lagi: jangan macet.
    new Promise(function (resolve) {
        window.setTimeout(resolve, 10000);
    })
]).then(function () {
    document.documentElement.classList.add("tuffero-css-ready");
});

// Handler $(document).ready (main.js, mCustomScrollbar, dll.) mengukur layout: tahan sampai CSS aktif.
if (window.jQuery) {
    window.jQuery.holdReady(true);
    window.tufferoCssReady.then(function () {
        window.jQuery.holdReady(false);
    });
}

(function ($) {
    "use strict";

    /* 1. Configuration
       ===================================================== */

    const CONFIG = {
        // Ubah tanggal ini sesuai jadwal peluncuran Tuffero.
        // Format ISO 8601 dengan zona WIB (+07:00) agar countdown
        // sama untuk semua pengunjung, di zona waktu mana pun.
        launchDate: "2027-01-04T00:00:00+07:00",
    };

    /* 2. Countdown
       ===================================================== */

    function initCountdown() {
        // Previously "now + 64 days", which reset on every page load.
        const launchDate = new Date(CONFIG.launchDate);

        const elements = {
            days: document.getElementById("countdown-days"),
            hours: document.getElementById("countdown-hours"),
            minutes: document.getElementById("countdown-minutes"),
            seconds: document.getElementById("countdown-seconds"),
        };

        if (Object.values(elements).some(function (element) {
            return !element;
        })) {
            return;
        }

        function formatNumber(value) {
            return String(value).padStart(2, "0");
        }

        function updateCountdown() {
            const distance = Math.max(0, launchDate.getTime() - Date.now());
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
                (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const minutes = Math.floor(
                (distance % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            elements.days.textContent = formatNumber(days);
            elements.hours.textContent = formatNumber(hours);
            elements.minutes.textContent = formatNumber(minutes);
            elements.seconds.textContent = formatNumber(seconds);
        }

        updateCountdown();
        window.setInterval(updateCountdown, 1000);
    }

    /* 3. Current year
       ===================================================== */

    function initCurrentYear() {
        const yearElement = document.getElementById("current-year");

        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    /* 4. Newsletter dialog
       ===================================================== */

    function initNewsletterDialog() {
        const dialog = document.getElementById("somedialog");

        if (!dialog) {
            return;
        }

        const openButtons = document.querySelectorAll(
            '[data-dialog="somedialog"]'
        );

        const closeButtons = dialog.querySelectorAll(
            "[data-dialog-close]"
        );

        const overlay = dialog.querySelector(".dialog__overlay");

        function openDialog(event) {
            if (event) {
                event.preventDefault();
            }

            dialog.classList.add("dialog--open");
            dialog.setAttribute("aria-hidden", "false");
            document.body.classList.add("newsletter-open");

            const emailInput = dialog.querySelector(
                'input[name="email"]'
            );

            if (emailInput) {
                window.setTimeout(function () {
                    emailInput.focus();
                }, 100);
            }
        }

        function closeDialog() {
            dialog.classList.remove("dialog--open");
            dialog.setAttribute("aria-hidden", "true");
            document.body.classList.remove("newsletter-open");
        }

        openButtons.forEach(function (button) {
            button.addEventListener("click", openDialog);
        });

        closeButtons.forEach(function (button) {
            button.addEventListener("click", closeDialog);
        });

        if (overlay) {
            overlay.addEventListener("click", closeDialog);
        }

        document.addEventListener("keydown", function (event) {
            if (
                event.key === "Escape" &&
                dialog.classList.contains("dialog--open")
            ) {
                closeDialog();
            }
        });

        dialog.setAttribute("aria-hidden", "true");
    }

    function initAboutButton() {
        const button = document.getElementById("tuffero-about-btn");
        const rightSide = document.getElementById("right-side");

        if (!button || !rightSide) {
            return;
        }

        button.addEventListener("click", function () {
            // Mobile/tablet: panel already sits below, so only scroll; overlay state stays untouched.
            if (window.matchMedia("(max-width: 1024px)").matches) {
                rightSide.scrollIntoView({ behavior: "smooth" });
                return;
            }

            const overlay = document.querySelector(".overlay");
            const closeButton = document.getElementById("close-more-info");
            const scrollbarTools = document.querySelector(".mCSB_scrollTools");

            if (overlay) {
                overlay.classList.toggle("skew-part");
            }

            rightSide.classList.toggle("hide-right");

            if (closeButton) {
                closeButton.classList.toggle("hide-close");
            }

            if (scrollbarTools) {
                scrollbarTools.classList.toggle("mCSB_scrollTools-left");
            }

            window.setTimeout(function () {
                if ($.fn.mCustomScrollbar) {
                    $("#mcs_container").mCustomScrollbar("scrollTo", "#right-side", {
                        scrollInertia: 500,
                        callbacks: false,
                    });
                }
            }, 350);
        });
    }

    /* 5. Social links
       ===================================================== */

    function initPlaceholderLinks() {
        document.querySelectorAll('.social-icons a[href="#"]').forEach(
            function (link) {
                link.addEventListener("click", function (event) {
                    event.preventDefault();
                });
            }
        );
    }

    /* 6. Form validation
       ===================================================== */

    function initFormValidation() {
        const contactForm = document.getElementById("contact-form");

        if (contactForm) {
            contactForm.addEventListener("submit", function (event) {
                const message = document.getElementById("text-area");

                if (message && message.value.trim().length < 20) {
                    event.preventDefault();
                    message.setCustomValidity(
                        "Pesan minimal harus terdiri dari 20 karakter."
                    );
                    message.reportValidity();
                    return;
                }

                if (message) {
                    message.setCustomValidity("");
                }

                /*
                 * Form kontak belum mempunyai endpoint backend.
                 * Mencegah pengiriman kosong ke halaman saat ini.
                 * Hubungkan ke backend sebelum digunakan di produksi.
                 */
                if (!contactForm.getAttribute("action")) {
                    event.preventDefault();

                    const answer = document.getElementById("answer");

                    if (answer) {
                        answer.textContent =
                            "Formulir kontak belum terhubung ke layanan pengiriman pesan.";
                    }
                }
            });

            const message = document.getElementById("text-area");

            if (message) {
                message.addEventListener("input", function () {
                    message.setCustomValidity("");
                });
            }
        }

        /*
         * Form newsletter (#notifyMe) divalidasi dan dikirim ke
         * Google Apps Script oleh js/notifyMe.js
         * (lihat docs/apps-script-notify.gs).
         */
    }

    /* 7. Concierge form
       ===================================================== */

    // Belum ada backend: pesan dikirim lewat WhatsApp Tuffero.
    function initConciergeForm() {
        const form = document.getElementById("concierge-form");

        if (!form) {
            return;
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!form.reportValidity()) {
                return;
            }

            const text =
                "Halo Tuffero, saya " + form.elements.name.value.trim() +
                " (" + form.elements.contact.value.trim() + ").\n\n" +
                form.elements.message.value.trim();

            window.open(
                "https://wa.me/6285726526802?text=" + encodeURIComponent(text),
                "_blank",
                "noopener"
            );
        });
    }

    /* 8. PhotoSwipe on demand
       ===================================================== */

    // PhotoSwipe (±33 KiB) baru diunduh saat galeri pertama kali diklik;
    // handler galeri di main.js baru memakai PhotoSwipe saat itu.
    // shortcut: link berbagi #&gid=..&pid=.. tidak didukung (history: false di main.js tidak pernah membuatnya).
    let photoSwipeLoading = null;

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    function initLazyPhotoSwipe() {
        document.addEventListener("click", function (event) {
            if (window.PhotoSwipe) {
                return;
            }

            const link = event.target.closest && event.target.closest(".my-gallery a");

            if (!link) {
                return;
            }

            // Tahan klik ini (capture) sebelum sampai ke handler galeri, ulangi setelah script siap.
            event.preventDefault();
            event.stopPropagation();

            photoSwipeLoading = photoSwipeLoading || Promise.all([
                loadScript("js/photoswipe.js"),
                loadScript("js/photoswipe-ui-default.js"),
            ]);

            photoSwipeLoading.then(function () {
                link.click();
            }, function () {
                // Gagal memuat: buka gambarnya langsung.
                photoSwipeLoading = null;
                window.location.href = link.href;
            });
        }, true);
    }

    /* 9. Initialize
       ===================================================== */

    $(function () {
        initLazyPhotoSwipe();
        initCountdown();
        initCurrentYear();
        initNewsletterDialog();
        initAboutButton();
        initPlaceholderLinks();
        initFormValidation();
        initConciergeForm();
    });

})(window.jQuery);
