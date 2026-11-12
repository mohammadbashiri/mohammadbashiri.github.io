(() => {
    const root = document.documentElement;
    const toggle = document.querySelector('.theme-toggle');
    const storedTheme = () => { try { return localStorage.getItem('theme'); } catch { return null; } };
    const applyTheme = (theme) => {
        root.dataset.theme = theme;
        toggle.setAttribute('aria-pressed', String(theme === 'dark'));
        toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    };
    applyTheme(storedTheme() === 'light' ? 'light' : 'dark');
    toggle.addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch { /* theme still works for this visit */ }
    });
    const portrait = document.querySelector('button.hero-portrait');
    if (portrait) {
        let start = null;
        const reveal = active => {
            portrait.classList.toggle('is-revealed', active);
            portrait.setAttribute('aria-pressed', String(active));
        };
        portrait.addEventListener('pointerdown', event => {
            if (event.pointerType === 'mouse') return;
            start = {x: event.clientX, y: event.clientY};
            portrait.setPointerCapture(event.pointerId);
            reveal(true);
        });
        portrait.addEventListener('pointermove', event => {
            if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) {
                start = null; reveal(false);
            }
        });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) {
            portrait.addEventListener(name, () => {start = null; reveal(false);});
        }
        portrait.addEventListener('contextmenu', event => event.preventDefault());
        portrait.addEventListener('keydown', event => {
            if (event.key === ' ' || event.key === 'Enter') {event.preventDefault(); reveal(true);}
        });
        portrait.addEventListener('keyup', event => {
            if (event.key === ' ' || event.key === 'Enter') {event.preventDefault(); reveal(false);}
        });
    }
    // Track the reading position without changing the URL or moving keyboard focus.
    const header = document.querySelector('.site-header');
    const navSections = [...document.querySelectorAll('.site-nav a[href^="#"]')]
        .map(link => ({link, section: document.getElementById(link.hash.slice(1))}))
        .filter(item => item.section);
    let navFrame = 0;
    const updateNavigation = () => {
        navFrame = 0;
        const marker = Math.min(innerHeight - 1, (header?.getBoundingClientRect().bottom ?? 0) + 80);
        const current = navSections.find(({section}) => {
            const rect = section.getBoundingClientRect();
            return rect.top <= marker && rect.bottom > marker;
        });
        for (const item of navSections) {
            if (item === current) item.link.setAttribute('aria-current', 'location');
            else item.link.removeAttribute('aria-current');
        }
    };
    const scheduleNavigation = () => {if (!navFrame) navFrame = requestAnimationFrame(updateNavigation);};
    window.addEventListener('scroll', scheduleNavigation, {passive: true});
    window.addEventListener('resize', scheduleNavigation);
    window.addEventListener('pageshow', scheduleNavigation);
    if ('ResizeObserver' in window) {
        const layoutObserver = new ResizeObserver(scheduleNavigation);
        const main = document.querySelector('main');
        if (main) layoutObserver.observe(main);
        if (header) layoutObserver.observe(header);
    }
    document.fonts?.ready.then(scheduleNavigation);
    scheduleNavigation();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
    const sections = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.06, rootMargin: '0px 0px 70px 0px' });
    sections.forEach((section) => observer.observe(section));
    root.classList.add('js-motion');
})();
