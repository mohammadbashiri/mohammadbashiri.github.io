const canvas = document.querySelector('#living-field');
const {FieldLife, WIDTH, HEIGHT} = await import(`./field/engine.mjs?v=${canvas.dataset.engineVersion}`);
const toggle = document.querySelector('#field-toggle');
const portrait = document.querySelector('.hero-portrait');
const portraitHover = matchMedia('(hover: hover) and (pointer: fine)');
function portraitActive() {
    return portrait && (portrait.classList.contains('is-revealed') || (portraitHover.matches && portrait.matches(':hover')));
}
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let world, frame = 0, previous = 0, paused = reduced.matches;
let mouse = null, touch = null, suppressBackgroundMenuUntil = 0;
const excluded = 'a, button, input, select, textarea, label, .section-body, .section-heading, .hero-copy, .hero-portrait, .site-header, .site-footer, .field-toolbar';
function exposed(x, y) {
    const element = document.elementFromPoint(x, y);
    return element && !element.closest(excluded);
}
function endTouch() {
    touch = null;
    document.documentElement.classList.remove('field-touch-hold');
    if (world) world.brush.strength = 0;
}
function clearPointer() {mouse = null; endTouch();}
function updateBrush() {
    if (!world) return;
    if (portraitActive()) {
        const image = portrait.getBoundingClientRect();
        const field = canvas.getBoundingClientRect();
        if (image.bottom > 0 && image.top < innerHeight) {
            world.brush.x = (image.left + image.width / 2 - field.left) / field.width;
            world.brush.y = 1 - (image.top + image.height / 2 - field.top) / field.height;
            // A small outer margin keeps the resulting orbit outside the opaque portrait.
            world.brush.radius = Math.min(image.width, image.height) / 2 * WIDTH / field.width + 22;
            world.brush.strength = .5;
            return;
        }
    }
    const pointer = touch ?? mouse;
    if (!pointer || !exposed(pointer.x, pointer.y)) {world.brush.strength = 0; return;}
    const rect = canvas.getBoundingClientRect();
    world.brush.x = (pointer.x - rect.left) / rect.width;
    world.brush.y = 1 - (pointer.y - rect.top) / rect.height;
    // Touch needs a finger-sized influence region, not the tiny mouse brush.
    world.brush.radius = touch ? 70 : 14;
    world.brush.strength = .5;
}
function updatePortraitPatches() {
    const rect = portrait?.getBoundingClientRect();
    if (portraitActive() || !rect || rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) {
        world.portraitPatches = [[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        world.portraitPreparation = [0,0,0,0];
        return;
    }
    const field = canvas.getBoundingClientRect();
    const time = world.tick / 48;
    const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
    // Anticipate the revealed portrait's 1.05× scale without changing movement speed.
    world.portraitPreparation = [(centerX - field.left) / field.width,
        1 - (centerY - field.top) / field.height,
        Math.min(rect.width, rect.height) * 1.05 / 2 * WIDTH / field.width + 22, .006];
    world.portraitPatches = [0,1,2].map(index => {
        const phase = index * 2.17;
        const angle = phase + .45 * Math.sin(time * (.09 + index * .017) + phase);
        const x = centerX + Math.cos(angle) * (rect.width / 2 + 12);
        const y = centerY + Math.sin(angle) * (rect.height / 2 + 12);
        const strength = .003 + .009 * (.5 + .5 * Math.sin(time * .16 + phase));
        return [(x - field.left) / field.width, 1 - (y - field.top) / field.height,
            24 * WIDTH / field.width, strength];
    });
}
function label() {
    document.documentElement.classList.toggle('field-paused', paused);
    const action = paused ? 'Wake background' : 'Pause and dim background';
    toggle.setAttribute('aria-label', action);
    toggle.title = action;
    toggle.setAttribute('aria-pressed', String(!paused));
}
function resize() {
    // The same cover transform is used to map pointer coordinates into the field.
    const scale = Math.max(innerWidth / WIDTH, innerHeight / HEIGHT);
    canvas.style.width = `${WIDTH * scale}px`;
    canvas.style.height = `${HEIGHT * scale}px`;
    canvas.width = Math.round(WIDTH * Math.min(scale, 1.5));
    canvas.height = Math.round(HEIGHT * Math.min(scale, 1.5));
    world?.draw();
}
function animate(now) {
    frame = 0;
    if (paused || document.hidden || !world) return;
    if (now - previous >= 1000 / 24) {
        previous = now;
        updateBrush();
        updatePortraitPatches();
        world.step(); world.step(); world.draw();
    }
    frame = requestAnimationFrame(animate);
}
function start() { if (!frame && !paused && !document.hidden && world) frame = requestAnimationFrame(animate); }
function stop() { cancelAnimationFrame(frame); frame = 0; clearPointer(); }
try {
    resize();
    world = new FieldLife(canvas, {seed: 93, preset: 'tides'});
    world.mode = 'both'; world.exposure = 1.8;
    world.palette = document.documentElement.dataset.fieldPalette ?? 'neon-blue';
    // A composed initial field, including when motion is disabled.
    for (let i = 0; i < 240; i++) world.step();
    world.draw();
    document.documentElement.classList.add('field-ready');
    toggle.hidden = false; label(); start();
} catch (error) {
    canvas.hidden = true; toggle.hidden = true;
    console.warn('Living background unavailable; using the static background.', error.message);
}
toggle.addEventListener('click', () => {paused = !paused; label(); if (paused) stop(); else start();});
reduced.addEventListener('change', () => {paused = reduced.matches; label(); if (paused) stop(); else start();});
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {if (document.hidden) stop(); else {previous = 0; start();}});
document.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') {
        mouse = {x: event.clientX, y: event.clientY};
    } else if (touch?.id === event.pointerId && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 12) {
        endTouch();
    }
}, {passive: true});
document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    mouse = null;
    if (!event.isPrimary) {endTouch(); return;}
    if (!paused && world && exposed(event.clientX, event.clientY)) {
        touch = {id: event.pointerId, x: event.clientX, y: event.clientY};
        document.documentElement.classList.add('field-touch-hold');
        suppressBackgroundMenuUntil = performance.now() + 2000;
    }
}, {passive: true});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    document.addEventListener(name, event => {
        if (touch?.id === event.pointerId) endTouch();
    }, {passive: true});
}
// Never capture a touch or prevent scrolling. Scrolling ends a background hold.
document.addEventListener('scroll', endTouch, {passive: true, capture: true});
document.addEventListener('selectstart', event => {if (touch) event.preventDefault();});
document.addEventListener('contextmenu', event => {
    if ((touch || performance.now() < suppressBackgroundMenuUntil) && exposed(event.clientX, event.clientY)) event.preventDefault();
});
document.addEventListener('pointerout', event => {if (!event.relatedTarget) clearPointer();}, {passive: true});
window.addEventListener('blur', clearPointer);
canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); stop(); canvas.hidden = true; toggle.hidden = true;
    document.documentElement.classList.remove('field-ready');
});
