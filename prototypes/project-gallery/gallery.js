/* Local-only project deck prototype. No production mutations. */
(() => {
    const base = '/prototype-project-gallery/';
    const projects = [
        {
            name: 'Pipal', category: 'Agentic tools', context: 'Open source · Human–agent collaboration',
            description: 'A persistent layer for Pi agents: identity, memory, topic-based sessions, messaging, and delegation between agents.',
            href: 'https://github.com/mohammadbashiri/pipal', link: 'View on GitHub', logo: 'pipal.svg',
        },
        {
            name: 'GittyGo', category: 'Agentic tools', context: 'Open source · Developer tools',
            description: 'A local, PR-style review workflow for AI-assisted development. Comment on exact diff lines and work through feedback with an agent.',
            href: 'https://github.com/mohammadbashiri/gittygo', link: 'View on GitHub', logo: 'gittygo.svg',
        },
        {
            name: 'AI for evidence and clinical data', category: 'Applied AI', context: 'At Noselab',
            description: 'Machine learning analyses for biomarker discovery, agentic literature workflows, and an internal assistant for exploring the team’s knowledge base.',
            href: 'https://noselab.com/', link: 'About Noselab', monogram: 'N',
        },
        {
            name: 'LAMINR', category: 'Comp neuro', context: 'Open source · Visual neuroscience',
            description: 'A Python package born from work on learning and aligning single-neuron invariances in visual cortex.',
            href: 'https://github.com/sinzlab/laminr', link: 'View on GitHub', monogram: 'L',
        },
        {
            name: 'Sensorium', category: 'Comp neuro', context: 'NeurIPS competition · Visual neuroscience',
            description: 'A competition on predicting large-scale mouse primary visual cortex activity.',
            href: 'https://github.com/sinzlab/sensorium', link: 'View on GitHub', monogram: 'S',
        },
    ];
    const section = document.querySelector('#projects');
    const host = section.querySelector('.projects-list');
    section.querySelector('#projects-title').innerHTML = 'Projects<span class="accent">.</span>';
    let deckPosition = 0;
    let deckVelocity = 0;
    let deckTarget = null;
    let lastWheel = 0;
    let lastFrame = performance.now();
    let touchStartY = null;

    function logo(project) {
        return `<span class="gallery-logo" aria-hidden="true">${project.logo
            ? `<img src="${base}${project.logo}" alt="">`
            : `<span class="gallery-monogram">${project.monogram}</span>`}</span>`;
    }
    function card(project, extraClass = '') {
        return `<article class="gallery-card ${extraClass}">
            <div class="gallery-card-top">${logo(project)}<span class="gallery-category">${project.category}</span></div>
            <p class="gallery-context">${project.context}</p>
            <h4>${project.name}</h4>
            <p class="gallery-description">${project.description}</p>
            <a href="${project.href}">${project.link} <span aria-hidden="true">↗</span></a>
        </article>`;
    }
    function render() {
        host.className = 'section-body projects-list gallery-prototype';
        host.innerHTML = `<div class="gallery-deck-cue" aria-hidden="true">
            <span>scroll through<br>projects</span>
            <svg viewBox="0 0 114 82" fill="none" aria-hidden="true">
                <path d="M5 57 Q7 64 10 68 Q14 64 21 60 M10 68 C14 54 18 41 31 29 C43 18 57 16 70 15 C82 12 94 15 105 14 M95 8 Q100 11 105 14 L96 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        </div><div class="gallery-deck" tabindex="0" role="region" aria-label="Project card deck">
            ${projects.map(project => card(project, 'gallery-deck-card')).join('')}
        </div><div class="gallery-deck-controls">
            <span class="gallery-deck-count"></span>
            <div><button type="button" data-deck="-1" aria-label="Previous project">←</button>
            <button type="button" data-deck="1" aria-label="Next project">→</button></div>
        </div>`;
        paintDeck();
    }
    function paintDeck() {
        const active = ((Math.round(deckPosition) % projects.length) + projects.length) % projects.length;
        host.querySelectorAll('.gallery-deck-card').forEach((element, index) => {
            let depth = (index - deckPosition % projects.length + projects.length) % projects.length;
            if (depth > projects.length - 1) depth -= projects.length;
            const past = depth < 0;
            element.style.zIndex = String(past ? 6 : Math.round(5 - depth));
            element.style.opacity = String(past ? Math.max(0, 1 + depth) : Math.max(0, Math.min(1, 3 - depth)));
            element.style.transform = past
                ? `translate(${depth * 64}px, ${-depth * 20}px) rotate(${depth * 4}deg) scale(${1 + depth * .06})`
                : `translate(${depth * 20}px, ${depth * -14}px) rotate(${depth * 1.5}deg) scale(${1 - depth * .045})`;
            element.style.pointerEvents = index === active ? 'auto' : 'none';
            element.setAttribute('aria-hidden', String(index !== active));
            element.querySelector('a').tabIndex = index === active ? 0 : -1;
        });
        host.querySelector('.gallery-deck-count').textContent = `${String(active + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
    }
    function advanceDeck(direction) {
        deckTarget = (deckTarget ?? Math.round(deckPosition)) + direction;
        deckVelocity = 0;
    }
    function overActiveCard(x, y) {
        const card = host.querySelector('.gallery-deck-card[aria-hidden="false"]');
        if (!card) return false;
        const rect = card.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }
    function animateDeck(now) {
        const dt = Math.min((now - lastFrame) / 1000, .033);
        lastFrame = now;
        if (dt > 0 && (deckVelocity !== 0 || deckTarget !== null)) {
            if (deckTarget === null) {
                deckPosition += deckVelocity * dt;
                deckVelocity *= Math.exp(-3.8 * dt);
                if (now - lastWheel > 240 && Math.abs(deckVelocity) < 1.3) {
                    deckTarget = Math.round(deckPosition + deckVelocity * .08);
                }
            } else {
                deckVelocity += ((deckTarget - deckPosition) * 55 - deckVelocity * 13) * dt;
                deckPosition += deckVelocity * dt;
                if (Math.abs(deckTarget - deckPosition) < .002 && Math.abs(deckVelocity) < .02) {
                    deckPosition = deckTarget;
                    deckVelocity = 0;
                    deckTarget = null;
                }
            }
            paintDeck();
        }
        requestAnimationFrame(animateDeck);
    }
    requestAnimationFrame(animateDeck);
    host.addEventListener('click', event => {
        const deck = event.target.closest('[data-deck]');
        if (deck) advanceDeck(Number(deck.dataset.deck));
    });
    host.addEventListener('wheel', event => {
        if (!event.target.closest('.gallery-deck') ||
            !overActiveCard(event.clientX, event.clientY) || event.ctrlKey ||
            Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        if (!event.deltaY) return;
        event.preventDefault();
        deckTarget = null;
        deckVelocity = Math.max(-8, Math.min(8, deckVelocity + event.deltaY * .023));
        lastWheel = performance.now();
    }, { passive: false });
    host.addEventListener('keydown', event => {
        if (!event.target.matches('.gallery-deck') ||
            !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        advanceDeck(event.key === 'ArrowDown' ? 1 : -1);
        event.preventDefault();
    });
    host.addEventListener('touchstart', event => {
        const touch = event.touches[0];
        if (event.target.closest('.gallery-deck') &&
            overActiveCard(touch.clientX, touch.clientY)) touchStartY = touch.clientY;
    }, { passive: true });
    host.addEventListener('touchmove', event => {
        if (touchStartY === null) return;
        const difference = touchStartY - event.touches[0].clientY;
        if (Math.abs(difference) > 20) event.preventDefault();
    }, { passive: false });
    host.addEventListener('touchend', event => {
        if (touchStartY === null) return;
        const difference = touchStartY - event.changedTouches[0].clientY;
        if (Math.abs(difference) > 35) {
            deckTarget = null;
            deckVelocity = Math.max(-7, Math.min(7, difference * .023));
            lastWheel = performance.now();
        }
        touchStartY = null;
    });
    render();
})();
