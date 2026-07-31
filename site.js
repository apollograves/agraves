/* Small bits of behaviour for the landing page.
   Everything here degrades gracefully — with JS off the page still
   renders fully, project videos just stay on their poster frame. */

(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* --- Footer year ------------------------------------------------ */
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    /* --- Project videos --------------------------------------------
       Videos are marked preload="none" so nothing downloads until the
       card is actually scrolled into view. Off-screen videos pause so
       we never decode more than what's visible. */
    const videos = document.querySelectorAll(".project__video");
    if (!videos.length) return;

    if (reduceMotion) {
        // Respect the preference: show the poster, offer manual controls.
        videos.forEach((video) => { video.controls = true; });
        return;
    }

    if (!("IntersectionObserver" in window)) {
        videos.forEach((video) => {
            video.preload = "auto";
            video.play().catch(() => {});
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) {
                target.play().catch(() => {
                    // Autoplay blocked (rare for muted video) — give the
                    // visitor a way to start it themselves.
                    target.controls = true;
                });
            } else {
                target.pause();
            }
        });
    }, { rootMargin: "150px 0px", threshold: 0.15 });

    videos.forEach((video) => observer.observe(video));

    // Don't keep decoding frames in a background tab.
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) videos.forEach((video) => video.pause());
    });
})();
