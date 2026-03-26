/* ═══════════════════════════════════════════
   MAIN — Intro, Cursor, Animations
   ═══════════════════════════════════════════ */

(function () {
    'use strict';

    /* ─── INTRO ─── */
    function playIntro() {
        const chars = document.querySelectorAll('.intro-char');
        const sub = document.querySelector('.intro-sub');
        const fill = document.querySelector('.intro-loader-fill');

        gsap.to(fill, { width: '100%', duration: 2.8, ease: 'power1.inOut' });

        setTimeout(() => { chars.forEach(c => c.classList.add('assembled')); }, 400);
        setTimeout(() => { sub.classList.add('show'); }, 1200);

        let done = false;
        const dismiss = () => {
            if (done) return;
            done = true;
            const intro = document.getElementById('intro');
            intro.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            intro.style.opacity = '0';
            intro.style.transform = 'scale(1.04)';
            intro.style.pointerEvents = 'none';
            setTimeout(() => { intro.style.display = 'none'; }, 900);
            setTimeout(revealPage, 200);
        };

        setTimeout(() => {
            window.addEventListener('wheel', dismiss, { once: true, passive: true });
            window.addEventListener('touchstart', dismiss, { once: true, passive: true });
        }, 1400);

        setTimeout(dismiss, 3800);
    }

    function revealPage() {
        const h = document.getElementById('header');
        h.classList.add('visible');
        gsap.to(h, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
        gsap.to('.hero-eyebrow', { opacity: 1, duration: 0.5, delay: 0.1 });
        gsap.to('.h1-inner', { y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.15 });
        gsap.to('.hero-p', { opacity: 1, duration: 0.5, delay: 0.6 });
        gsap.to('.hero-btns', { opacity: 1, duration: 0.5, delay: 0.75 });
        gsap.to('.scroll-hint', { opacity: 1, duration: 0.4, delay: 0.9 });
    }

    /* ─── CURSOR ─── */
    function initCursor() {
        if (window.matchMedia('(pointer: coarse)').matches) return;

        const dot = document.querySelector('.cur-dot');
        const ring = document.querySelector('.cur-ring');
        const label = document.querySelector('.cur-label');
        let cx = 0, cy = 0, tx = 0, ty = 0;

        document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

        (function tick() {
            cx += (tx - cx) * 0.13;
            cy += (ty - cy) * 0.13;
            dot.style.left = tx + 'px'; dot.style.top = ty + 'px';
            ring.style.left = cx + 'px'; ring.style.top = cy + 'px';
            label.style.left = cx + 'px'; label.style.top = cy + 'px';
            requestAnimationFrame(tick);
        })();

        document.querySelectorAll('[data-cursor]').forEach(el => {
            el.addEventListener('mouseenter', () => { document.body.classList.add('cur-active'); label.textContent = el.dataset.cursor; });
            el.addEventListener('mouseleave', () => { document.body.classList.remove('cur-active'); label.textContent = ''; });
        });

        document.querySelectorAll('a:not([data-cursor]), button:not([data-cursor]), input, textarea, select').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cur-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cur-hover'));
        });
    }

    /* ─── NAV ─── */
    function initNav() {
        const header = document.getElementById('header');
        const burger = document.getElementById('burger');
        const mob = document.getElementById('mob-menu');
        const links = document.querySelectorAll('.nav-link, .mob-link');

        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 60);
            ['accueil', 'projets', 'contact'].forEach(id => {
                const s = document.getElementById(id);
                if (!s) return;
                const r = s.getBoundingClientRect();
                if (r.top <= 180 && r.bottom > 180) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === id));
                }
            });
        }, { passive: true });

        burger.addEventListener('click', () => {
            burger.classList.toggle('open');
            mob.classList.toggle('open');
            document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
        });

        links.forEach(l => {
            l.addEventListener('click', e => {
                e.preventDefault();
                const t = document.getElementById(l.dataset.section);
                if (t) t.scrollIntoView({ behavior: 'smooth' });
                burger.classList.remove('open');
                mob.classList.remove('open');
                document.body.style.overflow = '';
            });
        });

        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const t = document.querySelector(a.getAttribute('href'));
                if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
            });
        });
    }

    /* ─── SCROLL ANIMATIONS ─── */
    function initScrollAnims() {
        gsap.registerPlugin(ScrollTrigger);

        gsap.utils.toArray('.skill-tile').forEach((el, i) => {
            gsap.to(el, { opacity: 1, y: 0, duration: 0.6, delay: i * 0.08, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        });

        gsap.utils.toArray('.proj-row').forEach((el, i) => {
            gsap.from(el, { opacity: 0, x: -30, duration: 0.6, delay: i * 0.07, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
        });

        gsap.utils.toArray('.sec-head, .contact-head, .contact-left, .form').forEach(el => {
            gsap.from(el, { opacity: 0, y: 40, duration: 0.7, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
        });
    }

    /* ─── FORM ─── */
    function initForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        form.addEventListener('submit', e => {
            e.preventDefault();
            const txt = form.querySelector('.btn-chrome-text');
            const orig = txt.textContent;
            txt.textContent = 'Envoyé !';
            setTimeout(() => { txt.textContent = orig; form.reset(); }, 2500);
        });
    }

    /* ─── PROJECT THUMBNAIL FOLLOW CURSOR ─── */
    function initProjThumbs() {
        const rows = document.querySelectorAll('.proj-row');
        rows.forEach(row => {
            const thumb = row.querySelector('.proj-thumb');
            if (!thumb) return;

            // Move to body so position:fixed works correctly
            document.body.appendChild(thumb);

            row.addEventListener('mouseenter', () => {
                thumb.classList.add('visible');
            });

            row.addEventListener('mouseleave', () => {
                thumb.classList.remove('visible');
            });

            row.addEventListener('mousemove', e => {
                thumb.style.left = e.clientX + 'px';
                thumb.style.top = e.clientY + 'px';
                thumb.style.transform = 'rotate(-2deg)';
            });
        });
    }

    /* ─── INIT ─── */
    document.addEventListener('DOMContentLoaded', () => {
        playIntro();
        initCursor();
        initNav();
        initScrollAnims();
        initForm();
        initProjThumbs();
    });
})();
