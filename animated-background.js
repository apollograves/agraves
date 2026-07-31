/* Drifting boids background.
   Same flocking rules as before, but the three neighbour passes are
   folded into one symmetric i<j sweep and the dot count is capped, so
   the cost stays flat instead of growing with screen area. */

(() => {
    "use strict";

    const canvas = document.getElementById("bgCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const accent = getComputedStyle(document.documentElement)
        .getPropertyValue("--thirdColor").trim() || "#5fa9e0";

    // --- Tuning ---------------------------------------------------------
    const DOT_RADIUS = 2;
    const DOT_ALPHA = 0.5;
    const DOTS_PER_PIXEL = 1 / 7000;
    const MAX_DOTS = 200;

    const SEPARATION_DIST = 18;
    const VIEW_DIST = 45;
    const CURSOR_DIST = 60;
    const EDGE_MARGIN = 30;

    const AVOID_FACTOR = 0.05;
    const ALIGN_FACTOR = 0.05;
    const CENTER_FACTOR = 0.000005;
    const EDGE_FACTOR = 0.2;

    const MIN_SPEED = 0.5;
    const MAX_SPEED = 2;

    const SEPARATION_SQ = SEPARATION_DIST * SEPARATION_DIST;
    const VIEW_SQ = VIEW_DIST * VIEW_DIST;
    const CURSOR_SQ = CURSOR_DIST * CURSOR_DIST;

    // --- State ----------------------------------------------------------
    let width = 0;
    let height = 0;
    let points = [];
    let frameId = null;
    const mouse = { x: null, y: null };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function makePoint() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            dx: (Math.random() * 2 - 1) * MIN_SPEED,
            dy: (Math.random() * 2 - 1) * MIN_SPEED,
        };
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const target = Math.min(MAX_DOTS, Math.round(width * height * DOTS_PER_PIXEL));
        while (points.length < target) points.push(makePoint());
        points.length = target;
    }

    function step() {
        const n = points.length;
        const sepX = new Float32Array(n);
        const sepY = new Float32Array(n);
        const aliX = new Float32Array(n);
        const aliY = new Float32Array(n);
        const cohX = new Float32Array(n);
        const cohY = new Float32Array(n);
        const neighbours = new Int32Array(n);

        // One sweep over each unique pair feeds separation, alignment and
        // cohesion at once — the old code walked every pair three times.
        for (let i = 0; i < n; i++) {
            const a = points[i];
            for (let j = i + 1; j < n; j++) {
                const b = points[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distSq = dx * dx + dy * dy;
                if (distSq >= VIEW_SQ) continue;

                aliX[i] += b.dx; aliY[i] += b.dy;
                aliX[j] += a.dx; aliY[j] += a.dy;
                cohX[i] += b.x;  cohY[i] += b.y;
                cohX[j] += a.x;  cohY[j] += a.y;
                neighbours[i]++; neighbours[j]++;

                if (distSq < SEPARATION_SQ) {
                    sepX[i] += dx; sepY[i] += dy;
                    sepX[j] -= dx; sepY[j] -= dy;
                }
            }
        }

        for (let i = 0; i < n; i++) {
            const p = points[i];

            p.dx += sepX[i] * AVOID_FACTOR;
            p.dy += sepY[i] * AVOID_FACTOR;

            if (neighbours[i] > 0) {
                const count = neighbours[i];
                p.dx += (aliX[i] / count - p.dx) * ALIGN_FACTOR;
                p.dy += (aliY[i] / count - p.dy) * ALIGN_FACTOR;
                p.dx += (cohX[i] / count - p.x) * CENTER_FACTOR;
                p.dy += (cohY[i] / count - p.y) * CENTER_FACTOR;
            }

            if (mouse.x !== null) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                if (dx * dx + dy * dy < CURSOR_SQ) {
                    p.dx += dx * AVOID_FACTOR;
                    p.dy += dy * AVOID_FACTOR;
                }
            }

            if (p.x < EDGE_MARGIN) p.dx += EDGE_FACTOR;
            if (p.y < EDGE_MARGIN) p.dy += EDGE_FACTOR;
            if (p.x > width - EDGE_MARGIN) p.dx -= EDGE_FACTOR;
            if (p.y > height - EDGE_MARGIN) p.dy -= EDGE_FACTOR;

            let speed = Math.hypot(p.dx, p.dy);
            if (speed === 0) {
                // Nudge a stalled dot rather than dividing by zero.
                p.dx = MIN_SPEED;
                speed = MIN_SPEED;
            }
            if (speed > MAX_SPEED) {
                p.dx = (p.dx / speed) * MAX_SPEED;
                p.dy = (p.dy / speed) * MAX_SPEED;
            } else if (speed < MIN_SPEED) {
                p.dx = (p.dx / speed) * MIN_SPEED;
                p.dy = (p.dy / speed) * MIN_SPEED;
            }

            p.x += p.dx;
            p.y += p.dy;
        }
    }

    function render() {
        ctx.clearRect(0, 0, width, height);
        ctx.globalAlpha = DOT_ALPHA;
        ctx.fillStyle = accent;
        for (const p of points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function loop() {
        step();
        render();
        frameId = requestAnimationFrame(loop);
    }

    function start() {
        if (frameId === null) frameId = requestAnimationFrame(loop);
    }

    function stop() {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }
    }

    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resize();
            if (reduceMotion) render();
        }, 150);
    });

    window.addEventListener("mousemove", (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else if (!reduceMotion) start();
    });

    resize();
    if (reduceMotion) render();
    else start();
})();
