(() => {
    const host = document.querySelector('#projects .project-deck');
    const deck = host?.querySelector('.gallery-deck');
    const cards = [...(deck?.querySelectorAll('.gallery-deck-card') ?? [])];
    if (!deck || !cards.length) return;

    const count = host.querySelector('.gallery-deck-count');
    const links = cards.map(card => card.querySelector('a'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let position = 0;
    let velocity = 0;
    let target = null;
    let lastWheel = 0;
    let lastFrame = performance.now();
    let frame = 0;
    let touchStartY = null;
    let reducedWheelDistance = 0;

    function paint() {
        const active = ((Math.round(position) % cards.length) + cards.length) % cards.length;
        cards.forEach((card, index) => {
            let depth = (index - position % cards.length + cards.length) % cards.length;
            if (depth > cards.length - 1) depth -= cards.length;
            const past = depth < 0;
            card.style.zIndex = String(past ? cards.length + 1 : Math.round(cards.length - depth));
            card.style.opacity = String(past ? Math.max(0, 1 + depth) : Math.max(0, Math.min(1, 3 - depth)));
            card.style.transform = past
                ? `translate(${depth * 64}px, ${-depth * 20}px) rotate(${depth * 4}deg) scale(${1 + depth * .06})`
                : `translate(${depth * 20}px, ${depth * -14}px) rotate(${depth * 1.5}deg) scale(${1 - depth * .045})`;
            card.style.pointerEvents = index === active ? 'auto' : 'none';
            card.setAttribute('aria-hidden', String(index !== active));
            links[index].tabIndex = index === active ? 0 : -1;
        });
        const label = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
        if (count.textContent !== label) count.textContent = label;
    }
    function animate(now) {
        frame = 0;
        const dt = Math.min((now - lastFrame) / 1000, .033);
        lastFrame = now;
        if (dt > 0) {
            if (target === null) {
                position += velocity * dt;
                velocity *= Math.exp(-3.8 * dt);
                if (now - lastWheel > 240 && Math.abs(velocity) < 1.3) {
                    target = Math.round(position + velocity * .08);
                }
            } else {
                velocity += ((target - position) * 55 - velocity * 13) * dt;
                position += velocity * dt;
                if (Math.abs(target - position) < .002 && Math.abs(velocity) < .02) {
                    position = target;
                    velocity = 0;
                    target = null;
                }
            }
            paint();
        }
        if (velocity !== 0 || target !== null) startAnimation();
    }
    function startAnimation() {
        if (!frame) frame = requestAnimationFrame(animate);
    }
    function advance(direction) {
        if (reducedMotion.matches) {
            position = Math.round(position) + direction;
            velocity = 0;
            target = null;
            paint();
            return;
        }
        target = (target ?? Math.round(position)) + direction;
        velocity = 0;
        startAnimation();
    }
    function overActiveCard(x, y) {
        const card = cards.find(element => element.getAttribute('aria-hidden') === 'false');
        if (!card) return false;
        const rect = card.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }
    function sizeDeck() {
        deck.style.height = '';
        const minimum = deck.getBoundingClientRect().height;
        const tallest = Math.max(...cards.map(card => card.offsetHeight));
        deck.style.height = `${Math.max(minimum, 38 + tallest + 20)}px`;
    }
    function syncHash() {
        const index = location.hash === '#applied' ? 2 : location.hash === '#agentic' ? 0 : null;
        if (index === null) return;
        position = index;
        velocity = 0;
        target = null;
        paint();
    }

    host.classList.add('is-ready');
    paint();
    sizeDeck();
    window.addEventListener('resize', sizeDeck);
    syncHash();
    window.addEventListener('hashchange', syncHash);
    document.querySelectorAll('.hero-paths a[href="#applied"], .hero-paths a[href="#agentic"]').forEach(link => {
        link.addEventListener('click', () => requestAnimationFrame(syncHash));
    });
    host.addEventListener('click', event => {
        const button = event.target.closest('[data-deck]');
        if (button) advance(Number(button.dataset.deck));
    });
    host.addEventListener('wheel', event => {
        if (!event.target.closest('.gallery-deck') ||
            !overActiveCard(event.clientX, event.clientY) || event.ctrlKey ||
            Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
        event.preventDefault();
        if (reducedMotion.matches) {
            reducedWheelDistance += event.deltaY;
            if (Math.abs(reducedWheelDistance) >= 80) {
                advance(Math.sign(reducedWheelDistance));
                reducedWheelDistance = 0;
            }
            return;
        }
        target = null;
        velocity = Math.max(-8, Math.min(8, velocity + event.deltaY * .023));
        lastWheel = performance.now();
        startAnimation();
    }, { passive: false });
    deck.addEventListener('keydown', event => {
        if (event.target !== deck || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        advance(event.key === 'ArrowDown' ? 1 : -1);
        event.preventDefault();
    });
    host.addEventListener('touchstart', event => {
        const touch = event.touches[0];
        if (event.target.closest('.gallery-deck') && overActiveCard(touch.clientX, touch.clientY)) {
            touchStartY = touch.clientY;
        }
    }, { passive: true });
    host.addEventListener('touchmove', event => {
        if (touchStartY !== null && Math.abs(touchStartY - event.touches[0].clientY) > 20) event.preventDefault();
    }, { passive: false });
    host.addEventListener('touchend', event => {
        if (touchStartY === null) return;
        const difference = touchStartY - event.changedTouches[0].clientY;
        if (Math.abs(difference) > 35) {
            if (reducedMotion.matches) advance(Math.sign(difference));
            else {
                target = null;
                velocity = Math.max(-7, Math.min(7, difference * .023));
                lastWheel = performance.now();
                startAnimation();
            }
        }
        touchStartY = null;
    });
})();
