/*! Drago Katić Development | GPL-2.0-or-later | https://dkd.rs/LICENSE.txt */
(function () {
    "use strict";

    /* The viewport for Instagram's in-app browser is set by a one-line inline script in
       each page's <head> (it must run before the first layout; this file is deferred). */

    /* JSON-LD structured data is written statically in each page's <head>. */

    /* ===============================
       COOKIE CONSENT
       Nothing optional is loaded until the visitor allows it:
       - analytics: Google Analytics 4, Microsoft Clarity
       - marketing: Meta Pixel
       The choice is kept in localStorage and asked again after 12 months
       or when CONSENT_VERSION is raised (e.g. a new tracker is added).
       =============================== */
    var TRACKERS = {
        ga: "G-L1P8VCRL9Y",
        clarity: "z03mtf4mjn",
        metaPixel: "24487415660862968",
        linkedin: "11141657"
    };
    var CONSENT_KEY = "dkd_consent";
    var CONSENT_VERSION = 2;
    var CONSENT_MAX_AGE = 365 * 24 * 60 * 60 * 1000;
    var TRACKER_COOKIES = /^(_ga|_gid|_gat|_clck|_clsk|_fbp|_fbc|li_fat_id)/;

    var loaded = { analytics: false, marketing: false };

    function readConsent() {
        try {
            var c = JSON.parse(window.localStorage.getItem(CONSENT_KEY));
            if (c && c.v === CONSENT_VERSION && Date.now() - c.ts < CONSENT_MAX_AGE) {
                return c;
            }
        } catch (e) {}
        return null;
    }

    function saveConsent(analytics, marketing) {
        var c = { v: CONSENT_VERSION, analytics: !!analytics, marketing: !!marketing, ts: Date.now() };
        try {
            window.localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
        } catch (e) {}
        return c;
    }

    function addScript(src) {
        var s = document.createElement("script");
        s.async = true;
        s.src = src;
        document.head.appendChild(s);
    }

    // Google Consent Mode v2: everything denied until the visitor decides
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied"
    });

    function loadAnalytics(c) {
        var ads = c.marketing ? "granted" : "denied";

        window.gtag("consent", "update", {
            analytics_storage: "granted",
            ad_storage: ads,
            ad_user_data: ads,
            ad_personalization: ads
        });
        if (TRACKERS.clarity) {
            window.clarity = window.clarity || function () {
                (window.clarity.q = window.clarity.q || []).push(arguments);
            };
            window.clarity("consentv2", { ad_Storage: ads, analytics_Storage: "granted" });
        }

        // consent signals above are re-sent on every change; the scripts load once
        if (loaded.analytics) { return; }
        loaded.analytics = true;

        window.gtag("js", new Date());
        window.gtag("config", TRACKERS.ga);
        addScript("https://www.googletagmanager.com/gtag/js?id=" + TRACKERS.ga);
        if (TRACKERS.clarity) { addScript("https://www.clarity.ms/tag/" + TRACKERS.clarity); }
    }

    function loadMarketing() {
        if (loaded.marketing) { return; }
        loaded.marketing = true;

        /* Meta Pixel base code */
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) { return; }
            n = f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) { f._fbq = n; }
            n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
            t = b.createElement(e); t.async = !0; t.src = v;
            s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
        window.fbq("consent", "grant");
        window.fbq("init", TRACKERS.metaPixel);
        window.fbq("track", "PageView");

        /* LinkedIn Insight Tag (loader as given by Campaign Manager) */
        if (TRACKERS.linkedin) {
            window._linkedin_partner_id = TRACKERS.linkedin;
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(TRACKERS.linkedin);
            if (!window.lintrk) {
                window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); };
                window.lintrk.q = [];
            }
            var li = document.createElement("script");
            li.async = true;
            li.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            document.head.appendChild(li);
        }
    }

    function applyConsent(c) {
        if (c.analytics) { loadAnalytics(c); }
        if (c.marketing) { loadMarketing(); }
    }

    function deleteTrackerCookies() {
        var host = window.location.hostname;
        document.cookie.split(";").forEach(function (part) {
            var name = part.split("=")[0].trim();
            if (!TRACKER_COOKIES.test(name)) { return; }
            ["", "; domain=" + host, "; domain=." + host].forEach(function (domain) {
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + domain;
            });
        });
    }

    var consent = readConsent();
    if (consent) {
        applyConsent(consent);
    }

    /* ---------- banner ----------
       Accessibility: the banner is the first thing in <body> (before the skip link and the menu),
       so a screen reader meets it at the start of the page, not after the footer. Focus never gets
       lost: "Settings" moves it to the first choice, and closing the banner returns it to the link
       that opened it (Cookie Settings) or, on a first visit, to the skip link at the top. */
    var BANNER_HTML =
        '<div class="container">' +
            '<div class="row align-items-center">' +
                '<div class="col-lg-7 col-12">' +
                    '<p class="cookie-consent-title mb-2" id="cookie-consent-title">Your privacy</p>' +
                    '<p class="cookie-consent-text mb-3 mb-lg-0" id="cookie-consent-text">' +
                        'This site can use optional cookies to understand how it is used (analytics) and to measure ' +
                        'advertising (marketing). Nothing optional is loaded unless you allow it, and you can change ' +
                        'your choice at any time via &ldquo;Cookie Settings&rdquo; at the bottom of every page. ' +
                        '<a href="privacy.html">Privacy Policy</a>' +
                    '</p>' +
                    '<div class="cookie-consent-options mb-3" hidden>' +
                        '<label class="cookie-consent-option">' +
                            '<input type="checkbox" checked disabled> ' +
                            '<strong>Necessary</strong> &ndash; remembers your cookie choice. Always on.' +
                        '</label>' +
                        '<label class="cookie-consent-option">' +
                            '<input type="checkbox" data-consent="analytics"> ' +
                            '<strong>Analytics</strong> &ndash; statistics about visits and site usage.' +
                        '</label>' +
                        '<label class="cookie-consent-option">' +
                            '<input type="checkbox" data-consent="marketing"> ' +
                            '<strong>Marketing</strong> &ndash; measuring the results of advertising on social networks.' +
                        '</label>' +
                    '</div>' +
                '</div>' +
                '<div class="col-lg-5 col-12">' +
                    '<div class="cookie-consent-buttons">' +
                        '<button type="button" class="btn dkd-btn outline-btn" data-consent-action="reject">Reject all</button>' +
                        '<button type="button" class="btn dkd-btn outline-btn" data-consent-action="settings">Settings</button>' +
                        '<button type="button" class="btn dkd-btn outline-btn" data-consent-action="save" hidden>Save choices</button>' +
                        '<button type="button" class="btn dkd-btn outline-btn" data-consent-action="accept">Accept all</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    var banner = null;

    function buildBanner() {
        banner = document.createElement("section");
        banner.className = "cookie-consent";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-labelledby", "cookie-consent-title");
        banner.setAttribute("aria-describedby", "cookie-consent-text");
        banner.hidden = true;
        banner.innerHTML = BANNER_HTML;
        document.body.insertBefore(banner, document.body.firstChild);

        banner.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-consent-action]");
            if (!btn) { return; }
            var action = btn.getAttribute("data-consent-action");

            if (action === "settings") {
                showOptions(true);
                // the Settings button is hidden now; keep focus inside the banner
                banner.querySelector('[data-consent="analytics"]').focus();
                return;
            }
            if (action === "accept") {
                decide(true, true);
            } else if (action === "reject") {
                decide(false, false);
            } else if (action === "save") {
                decide(
                    banner.querySelector('[data-consent="analytics"]').checked,
                    banner.querySelector('[data-consent="marketing"]').checked
                );
            }
        });
    }

    function showOptions(show) {
        banner.querySelector(".cookie-consent-options").hidden = !show;
        banner.querySelector('[data-consent-action="settings"]').hidden = show;
        banner.querySelector('[data-consent-action="save"]').hidden = !show;
    }

    var opener = null;

    function openBanner(withOptions, from) {
        opener = from || null;
        var c = readConsent();
        banner.querySelector('[data-consent="analytics"]').checked = !!(c && c.analytics);
        banner.querySelector('[data-consent="marketing"]').checked = !!(c && c.marketing);
        showOptions(!!withOptions);
        banner.hidden = false;
        if (opener) {
            // opened on request: take the visitor straight to the choices
            banner.querySelector('[data-consent="analytics"]').focus();
        }
    }

    function closeBanner() {
        var hadFocus = banner.contains(document.activeElement);
        banner.hidden = true;
        if (hadFocus) {
            var back = opener || document.querySelector(".skip-link");
            if (back) { back.focus(); }
        }
        opener = null;
    }

    function decide(analytics, marketing) {
        var previous = consent;
        consent = saveConsent(analytics, marketing);
        closeBanner();

        var withdrawn = previous &&
            ((previous.analytics && !analytics) || (previous.marketing && !marketing));
        if (withdrawn && (loaded.analytics || loaded.marketing)) {
            // scripts that already run cannot be unloaded: tell them, clear their cookies, reload clean
            if (loaded.analytics && !analytics && window.clarity) { window.clarity("consent", false); }
            if (loaded.marketing && !marketing && window.fbq) { window.fbq("consent", "revoke"); }
            deleteTrackerCookies();
            window.location.reload();
            return;
        }
        if (withdrawn) {
            deleteTrackerCookies();
        }
        applyConsent(consent);
    }

    /* Service worker (app shell, offline page): registered after load so it never delays the first render. */
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
            var self = document.querySelector('script[src*="js/core.js"]');
            if (self) { navigator.serviceWorker.register(self.src.replace(/js\/core\.js.*$/, "sw.js")).catch(function () {}); }
        });
    }

    /* ===============================
       INSTALL APP (menu item on phones and tablets)
       Shown only where installing makes sense: not in the installed app, not on computers.
       Chrome-based browsers: the browser's own install dialog (beforeinstallprompt); Safari on iPhone/iPad,
       Firefox and in-app browsers (Instagram, Facebook ...) have none, so a short instruction panel opens.
       =============================== */
    (function () {
        var item = document.querySelector(".dkd-menu-install");
        if (!item) { return; }
        var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone;
        var ua = navigator.userAgent;
        var ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        var touch = ios || /android/i.test(ua) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
        if (standalone || !touch) { return; }
        item.hidden = false;

        var deferred = null;
        var panel = null;
        var opener = null;

        window.addEventListener("beforeinstallprompt", function (e) {
            e.preventDefault();
            deferred = e;
        });
        window.addEventListener("appinstalled", function () {
            item.hidden = true;
            deferred = null;
            closePanel();
        });

        function steps() {
            if (/Instagram|FBAN|FBAV|FB_IAB|Snapchat|LinkedInApp|Pinterest|Line\//i.test(ua)) {
                return ["This browser inside another app cannot install it.",
                        "Open this page in Chrome or Safari: tap the menu (three dots or the share icon) and choose Open in browser.",
                        "Then tap Install app again."];
            }
            if (ios) {
                return ["Tap the Share button (the square with an arrow) in Safari.",
                        "Scroll down and tap Add to Home Screen.",
                        "Tap Add."];
            }
            return ["Open the browser menu (three dots).",
                    "Tap Install app or Add to Home screen.",
                    "Confirm."];
        }

        function buildPanel() {
            panel = document.createElement("div");
            panel.className = "dkd-install";
            panel.hidden = true;
            var html = '<div class="dkd-install-box" role="dialog" aria-modal="true" aria-labelledby="dkd-install-title">' +
                       '<h2 id="dkd-install-title" class="dkd-install-title">Install the app</h2><ol class="dkd-install-steps">';
            steps().forEach(function (text) { html += "<li>" + text + "</li>"; });
            html += '</ol><button type="button" class="dkd-btn outline-btn btn dkd-install-close">Close</button></div>';
            panel.innerHTML = html;
            document.body.appendChild(panel);
            panel.addEventListener("click", function (e) {
                if (e.target === panel || e.target.closest(".dkd-install-close")) { closePanel(); }
            });
            document.addEventListener("keydown", function (e) {
                if (panel && !panel.hidden) {
                    if (e.key === "Escape") { closePanel(); }
                    if (e.key === "Tab") { e.preventDefault(); panel.querySelector(".dkd-install-close").focus(); }
                }
            });
        }

        function openPanel() {
            if (!panel) { buildPanel(); }
            panel.hidden = false;
            panel.querySelector(".dkd-install-close").focus();
        }

        function closePanel() {
            if (!panel || panel.hidden) { return; }
            panel.hidden = true;
            if (opener) { opener.focus(); }
        }

        item.addEventListener("click", function (e) {
            e.preventDefault();
            opener = e.target.closest("a") || null;
            if (deferred) {
                var d = deferred;
                deferred = null;
                d.prompt();
                if (d.userChoice) { d.userChoice.then(function () {}, function () {}); }
                return;
            }
            openPanel();
        });
    })();

    document.addEventListener("DOMContentLoaded", function () {
        buildBanner();
        if (!consent) {
            openBanner(false);
        }
        // "Cookie Settings" links (footer, privacy page); without JS they lead to privacy.html#cookies
        document.addEventListener("click", function (e) {
            var link = e.target.closest(".cookie-settings-link");
            if (!link) { return; }
            e.preventDefault();
            openBanner(true, link);
        });
    });

})();
