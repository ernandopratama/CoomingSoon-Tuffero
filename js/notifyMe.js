/*
 notifyMe jQuery Plugin v1.0.0
 Copyright (c)2014 Sergey Serafimovich
 Licensed under The MIT License.

 Diubah untuk Tuffero: modal ditutup selama loading,
 sukses tampil sebagai toast, gagal membuka modal kembali.
*/
(function(e) {
    var TOAST_DURATION = 3000;
    var MSG_INVALID = "Alamat email tidak valid. Periksa kembali lalu coba lagi.";
    var MSG_OFFLINE = "Tidak dapat terhubung. Periksa koneksi internet Anda lalu coba lagi.";
    var MSG_GENERIC = "Maaf, terjadi kesalahan. Silakan coba lagi nanti.";

    e.fn.notifyMe = function() {
        var form = e(this);
        var input = form.find("input[name=email]");
        var url = form.attr("action");
        var error = form.find(".notify-error");
        var dialog = e("#somedialog");
        var loader = e("#notify-loader");
        var toast = e("#notify-toast");
        var toastTimer;
        var p = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        function showError(text) {
            error.find(".notify-error-text").text(text);
            error.prop("hidden", false);
            input.attr("aria-invalid", "true");
        }

        function clearError() {
            error.prop("hidden", true);
            input.removeAttr("aria-invalid");
        }

        // Klik tombol asli agar script.js dan DialogFx (main.js) tetap sinkron.
        function setDialog(open) {
            if (open !== dialog.hasClass("dialog--open")) {
                (open ? e('[data-dialog="somedialog"]') : dialog.find("[data-dialog-close]"))[0].click();
            }
        }

        function setLoading(on) {
            loader.toggleClass("is-visible", on).attr("aria-hidden", String(!on));
        }

        function hideToast() {
            clearTimeout(toastTimer);
            toast.removeClass("is-visible");
        }

        function showToast() {
            hideToast();
            toast[0].offsetWidth; // restart progress animation
            toast.addClass("is-visible");
            toastTimer = setTimeout(hideToast, TOAST_DURATION);
        }

        function fail(text) {
            setDialog(true);
            showError(text);
        }

        toast.find(".notify-toast-close").on("click", hideToast);
        input.on("input", clearError);

        form.on("submit", function(t) {
            t.preventDefault();
            var h = e.trim(input.val());

            if (!p.test(h)) {
                showError(MSG_INVALID);
                input.trigger("focus");
                return;
            }

            clearError();
            hideToast();
            setDialog(false);
            setLoading(true);

            e.ajax({
                type: "POST",
                url: url,
                data: {
                    email: h,
                    website: form.find("input[name=website]").val()
                },
                dataType: "json"
            }).always(function() {
                setLoading(false);
            }).done(function(res) {
                if (res && res.status === "success") {
                    form[0].reset();
                    showToast();
                } else {
                    fail(res && res.type === "ValidationError" ? MSG_INVALID : MSG_GENERIC);
                }
            }).fail(function(xhr) {
                fail(xhr.status === 0 ? MSG_OFFLINE : MSG_GENERIC);
            });
        });
    }

})(jQuery)
