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

        gsap.utils.toArray('.acc-panel').forEach((el, i) => {
            gsap.from(el, { opacity: 0, x: -20, duration: 0.5, delay: i * 0.08, ease: 'power2.out',
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

    /* ─── HERO REEL PORTAL ─── */
    function initHeroPortal() {
        const portal = document.getElementById('hero-portal');
        if (!portal) return;
        const frame = portal.querySelector('.portal-frame');

        // 3D tilt on mousemove
        frame.addEventListener('mousemove', e => {
            const rect = frame.getBoundingClientRect();
            const cx = (e.clientX - rect.left) / rect.width - 0.5;
            const cy = (e.clientY - rect.top) / rect.height - 0.5;
            frame.style.transform = `perspective(800px) rotateY(${cx * 12}deg) rotateX(${-cy * 8}deg) scale(1.03)`;
        });

        frame.addEventListener('mouseleave', () => {
            frame.style.transform = '';
        });

        // Hide fallback if video loads
        const video = portal.querySelector('.portal-video');
        const fallback = portal.querySelector('.portal-fallback');
        if (video && fallback) {
            video.addEventListener('playing', () => { fallback.style.display = 'none'; });
            video.addEventListener('error', () => { fallback.style.display = 'flex'; });
            // If no src, show fallback
            if (!video.querySelector('source[src]') || !video.querySelector('source').src) {
                fallback.style.display = 'flex';
            }
        }
    }

    /* ─── LOAD PROJECTS ─── */
    async function loadProjects() {
        const list = document.getElementById('proj-list');
        if (!list) return;
        try {
            const res = await fetch('projects.json');
            const projects = await res.json();
            const arrow = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';
            const close = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            list.innerHTML = projects.map((p, i) => {
                const imgs = (p.images || []).map(src =>
                    `<img src="${src}" alt="${p.name}" loading="lazy">`
                ).join('');
                const vid = p.video ? `<video src="${p.video}" controls playsinline></video>` : '';
                return `
                <div class="proj-item" data-id="${p.id}">
                    <div class="proj-row" data-cat="${p.category}" data-cursor="Voir">
                        <span class="proj-num">${String(i + 1).padStart(2, '0')}</span>
                        <span class="proj-name">${p.name}</span>
                        <span class="proj-type">${p.type}</span>
                        <span class="proj-arrow">${arrow}</span>
                        <div class="proj-thumb">
                            <div class="proj-thumb-inner" ${p.thumbnail ? `style="background-image:url('${p.thumbnail}')"` : `style="background:linear-gradient(135deg,hsl(${p.thumbHue},30%,12%),hsl(${p.thumbHue},25%,20%),hsl(${p.thumbHue},20%,8%))"`}>
                                <span class="thumb-label">${p.name}</span>
                            </div>
                        </div>
                    </div>
                    <div class="proj-detail">
                        <div class="proj-detail-inner">
                            <div class="proj-detail-head">
                                <div>
                                    <span class="proj-detail-type">${p.type}</span>
                                    <h3 class="proj-detail-title">${p.name}</h3>
                                </div>
                                <button class="proj-close" aria-label="Fermer">${close}</button>
                            </div>
                            <p class="proj-detail-desc">${p.description || ''}</p>
                            <div class="proj-detail-media">
                                ${vid}${imgs}
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
            initProjThumbs();
            initProjExpand();
        } catch (e) {
            console.error('Failed to load projects:', e);
        }
    }

    /* ─── PROJECT EXPAND ─── */
    function initProjExpand() {
        const items = document.querySelectorAll('.proj-item');
        items.forEach(item => {
            const row = item.querySelector('.proj-row');
            const detail = item.querySelector('.proj-detail');
            const closeBtn = item.querySelector('.proj-close');

            row.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = item.classList.contains('open');

                // Close all others
                items.forEach(it => {
                    if (it !== item) it.classList.remove('open');
                });

                if (!isOpen) {
                    item.classList.add('open');
                    // Scroll to detail smoothly
                    setTimeout(() => {
                        detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                } else {
                    item.classList.remove('open');
                }
            });

            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                item.classList.remove('open');
            });
        });
    }

    /* ─── INIT ─── */
    document.addEventListener('DOMContentLoaded', async () => {
        playIntro();
        initCursor();
        initNav();
        await loadProjects();
        initScrollAnims();
        initForm();
        initHeroPortal();
    });
})();
