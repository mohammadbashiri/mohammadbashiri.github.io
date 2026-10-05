(() => {
    const root = document.documentElement;
    const toggle = document.querySelector('.theme-toggle');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = () => { try { return localStorage.getItem('theme'); } catch { return null; } };
    const applyTheme = (theme) => {
        root.dataset.theme = theme;
        toggle.setAttribute('aria-pressed', String(theme === 'dark'));
        toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    };
    applyTheme(storedTheme() || (systemTheme.matches ? 'dark' : 'light'));
    toggle.addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch { /* theme still works for this visit */ }
    });
    systemTheme.addEventListener('change', (event) => {
        if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light');
    });

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
