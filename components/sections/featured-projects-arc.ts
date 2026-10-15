import { featuredProjectsCopy } from '@/content/featured-projects';

export interface FeaturedArcAnimator { dispose: () => void; }
const idle: FeaturedArcAnimator = { dispose: () => {} };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const poseProperties = ['--featured-x', '--featured-y', '--featured-z', '--featured-angle', '--featured-scale', '--featured-alpha', '--featured-layer'];

/** Native, finite, user-controlled arc. No autoplay, GSAP, WebGL or scroll pin. */
export function mountFeaturedArc(root: HTMLElement, signal: AbortSignal): FeaturedArcAnimator {
  if (signal.aborted || !root.isConnected) return idle;
  const list = root.querySelector<HTMLOListElement>('.featured-list');
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-featured-slide]'));
  const controls = root.querySelector<HTMLElement>('.featured-controls');
  if (!list || !slides.length || !controls) return idle;
  const buttons = Array.from(controls.querySelectorAll<HTMLButtonElement>('button'));
  const roll = root.querySelector<HTMLElement>('.featured-counter-roll');
  const hint = root.querySelector<HTMLElement>('.featured-interaction-hint');
  const live = root.querySelector<HTMLElement>('[data-featured-live]');
  const cards = slides.map(slide => slide.querySelector<HTMLElement>('.featured-card-scale'));
  const focusedSlide = document.activeElement instanceof Element ? document.activeElement.closest<HTMLElement>('[data-featured-slide]') : null;
  let active = clamp(focusedSlide && root.contains(focusedSlide) ? Number(focusedSlide.dataset.featuredSlide) : Number(root.dataset.featuredIndex) || 0, 0, slides.length - 1);
  let alive = true;
  let enabled = false;
  let frame = 0;
  let quietFrame = 0;
  let failedProfile = '';
  let fontRevision = 0;
  let radius = 1;
  let blockedClickUntil = 0;
  let gesture: { id: number; x: number; y: number } | undefined;
  const rootAttributes = ['data-featured-mode', 'data-featured-index', 'data-featured-ready', 'data-featured-quiet', 'aria-roledescription'];
  const previousRoot = rootAttributes.map(name => [name, root.getAttribute(name)] as const);
  const previousSlides = slides.map(slide => ({ inert: slide.inert, hidden: slide.getAttribute('aria-hidden'), active: slide.getAttribute('data-featured-active'),
    styles: poseProperties.map(name => [name, slide.style.getPropertyValue(name), slide.style.getPropertyPriority(name)] as const) }));
  const previousButtons = buttons.map(button => ({ disabled: button.disabled, tab: button.getAttribute('tabindex'), current: button.getAttribute('aria-current'), disabledAria: button.getAttribute('aria-disabled') }));
  const previousTab = list.getAttribute('tabindex');
  const previousControls = controls.hidden;
  const previousHint = hint?.hidden;
  const previousRoll = roll?.style.transform;
  const previousLive = live?.textContent;
  const restoreAttribute = (element: HTMLElement, name: string, value: string | null) => { if (value === null) element.removeAttribute(name); else element.setAttribute(name, value); };

  const textProfile = () => {
    let effectiveTitleFont = 0;
    const typography = cards.map(card => {
      if (!card) return null;
      const nodes = card.querySelectorAll<HTMLElement>('.featured-project-title,.featured-project-title *,.featured-category,.featured-context,.featured-project-link,.featured-project-link *,.kv-caption,.kv-caption *,.kv-legend,.kv-legend *');
      const styles = Array.from(nodes, node => {
        const style = getComputedStyle(node);
        const size = parseFloat(style.fontSize);
        if (node.closest('.featured-project-title') && Number.isFinite(size)) effectiveTitleFont = Math.max(effectiveTitleFont, size);
        return [style.fontSize, style.fontFamily, style.fontWeight, style.fontStyle, style.lineHeight, style.letterSpacing, style.whiteSpace];
      });
      return [card.textContent, styles];
    });
    // Do not key this latch to widths/heights: flow itself changes those.
    return { effectiveTitleFont, key: `${innerWidth}:${innerHeight}:${document.fonts.status}:${fontRevision}:${JSON.stringify(typography)}` };
  };
  const cardsFit = () => {
    const capacity = list.clientHeight;
    return capacity > 0 && cards.every((card, index) => {
      if (!card || card.scrollHeight + slides[index]!.offsetTop > capacity + 3 || card.scrollWidth > card.clientWidth + 3) return false;
      const copy = card.querySelector<HTMLElement>('.featured-copy');
      const readings = card.querySelectorAll<HTMLElement>('.featured-project-title,.featured-category,.featured-context,.featured-project-link');
      return Boolean(copy && copy.scrollWidth <= copy.clientWidth + 3)
        && Array.from(readings).every(node => node.scrollWidth <= node.clientWidth + 3 && node.scrollHeight <= node.clientHeight + 3);
    });
  };

  const pose = () => {
    // Geometry is cached by measure. Interaction changes only transforms/opacity.
    slides.forEach((slide, index) => {
      const offset = index - active;
      const bounded = clamp(offset, -3, 3);
      const angle = bounded * .5;
      slide.style.setProperty('--featured-x', `${Math.sin(angle) * radius}px`);
      slide.style.setProperty('--featured-y', `${Math.abs(bounded) * 18}px`);
      slide.style.setProperty('--featured-z', `${(Math.cos(angle) - 1) * radius}px`);
      slide.style.setProperty('--featured-angle', `${-bounded * 22}deg`);
      slide.style.setProperty('--featured-scale', String(1 - Math.min(3, Math.abs(bounded)) * .055));
      slide.style.setProperty('--featured-alpha', Math.abs(offset) > 2 ? '0' : offset === 0 ? '1' : '.54');
      slide.style.setProperty('--featured-layer', String(slides.length - Math.abs(offset)));
      slide.dataset.featuredActive = String(offset === 0);
      slide.inert = offset !== 0;
      if (offset !== 0) slide.setAttribute('aria-hidden', 'true'); else slide.removeAttribute('aria-hidden');
    });
    root.dataset.featuredIndex = String(active);
    if (roll) roll.style.transform = `translateY(-${active * 1.5}em)`;
    buttons.forEach(button => {
      const direction = Number(button.dataset.featuredDirection);
      if (direction) button.setAttribute('aria-disabled', String(active + direction < 0 || active + direction >= slides.length));
      if (button.dataset.featuredSelect !== undefined) {
        if (Number(button.dataset.featuredSelect) === active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      }
    });
  };
  const select = (next: number, announce = true) => {
    if (!enabled || !alive) return;
    const index = clamp(next, 0, slides.length - 1);
    const focused = document.activeElement;
    const focusWasInCard = focused instanceof Element && slides[active]?.contains(focused);
    // A style/content change can precede RO delivery. Validate at selection,
    // never while dragging or on a scroll/animation frame.
    const typography = textProfile();
    if (typography.effectiveTitleFont > 46 || !cardsFit()) {
      active = index;
      failedProfile = typography.key;
      flow();
      root.dataset.featuredIndex = String(active);
      root.dataset.featuredReady = 'true';
      if (focusWasInCard || focused instanceof Element && controls.contains(focused)) {
        slides[active]?.querySelector<HTMLAnchorElement>('.featured-project-link')?.focus();
      }
      window.dispatchEvent(new Event('dos-orillas:refresh'));
      return;
    }
    if (index === active) return;
    active = index;
    pose();
    // Focus must never remain in a card made inert by a control or arrow key.
    if (focusWasInCard) slides[active]?.querySelector<HTMLAnchorElement>('.featured-project-link')?.focus({ preventScroll: true });
    if (announce && live) live.textContent = featuredProjectsCopy.announcement(active + 1, slides.length, slides[active]?.dataset.projectTitle ?? '');
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
  const flow = () => {
    enabled = false;
    root.dataset.featuredMode = 'flow';
    root.removeAttribute('aria-roledescription');
    controls.hidden = true;
    if (hint) hint.hidden = true;
    list.tabIndex = -1;
    slides.forEach(slide => { slide.inert = false; slide.removeAttribute('aria-hidden'); delete slide.dataset.featuredActive; });
    buttons.forEach(button => { button.disabled = true; button.tabIndex = -1; });
  };
  const measure = () => {
    frame = 0;
    if (!alive || signal.aborted) return;
    const typography = textProfile();
    const profile = typography.key;
    if (innerWidth < 340 || innerHeight < 580 || typography.effectiveTitleFont > 46 || failedProfile === profile) { flow(); root.dataset.featuredReady = 'true'; return; }
    root.dataset.featuredQuiet = 'true';
    root.dataset.featuredMode = 'arc';
    // Setup/resize only. No clientRects or boundingClientRect in gesture/update.
    const card = cards[active];
    if (!cardsFit()) { failedProfile = profile; flow(); root.dataset.featuredReady = 'true'; return; }
    radius = Math.max(1, (card?.offsetWidth ?? list.clientWidth) * 1.6);
    enabled = true;
    root.setAttribute('aria-roledescription', featuredProjectsCopy.collectionLabel);
    controls.hidden = false;
    if (hint) hint.hidden = false;
    list.tabIndex = 0;
    buttons.forEach(button => { button.disabled = false; button.tabIndex = 0; });
    pose();
    root.dataset.featuredReady = 'true';
    cancelAnimationFrame(quietFrame);
    quietFrame = requestAnimationFrame(() => { quietFrame = 0; if (alive) delete root.dataset.featuredQuiet; });
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
  const scheduleMeasure = () => { if (alive && !frame) frame = requestAnimationFrame(measure); };
  const click = (event: MouseEvent) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-featured-direction],[data-featured-select]') : null;
    if (!button || !controls.contains(button) || button.getAttribute('aria-disabled') === 'true') return;
    select(button.dataset.featuredSelect !== undefined ? Number(button.dataset.featuredSelect) : active + Number(button.dataset.featuredDirection));
  };
  const keyboard = (event: KeyboardEvent) => {
    if (!enabled || event.altKey || event.ctrlKey || event.metaKey || !(event.target instanceof Element)) return;
    if (!list.contains(event.target) && !controls.contains(event.target)) return;
    const keys: Record<string, number> = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: slides.length - 1 };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  };
  const pointerDown = (event: PointerEvent) => {
    if (!enabled || event.button !== 0 || !event.isPrimary || event.pointerType === 'mouse') return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const pointerUp = (event: PointerEvent) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const x = event.clientX - gesture.x;
    const y = event.clientY - gesture.y;
    gesture = undefined;
    if (Math.abs(x) < 36 || Math.abs(x) < Math.abs(y) * 1.25) return;
    blockedClickUntil = performance.now() + 350;
    select(active + (x < 0 ? 1 : -1));
  };
  const cancelGesture = () => { gesture = undefined; };
  const clickCapture = (event: MouseEvent) => {
    if (performance.now() < blockedClickUntil) { event.preventDefault(); event.stopPropagation(); blockedClickUntil = 0; }
  };
  const resize = new ResizeObserver(scheduleMeasure);
  resize.observe(list);
  cards.forEach(card => { if (card) resize.observe(card); });
  // Limited to reading content: pose writes on slides and KV packet animation
  // attributes never wake this observer.
  const textChanges = new MutationObserver(scheduleMeasure);
  cards.forEach(card => {
    card?.querySelectorAll('.featured-copy,.kv-caption,.kv-legend').forEach(target => textChanges.observe(target, {
      childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'],
    }));
  });
  const fontsChanged = () => { fontRevision += 1; scheduleMeasure(); };
  document.fonts.addEventListener('loadingdone', fontsChanged);
  root.addEventListener('click', click);
  root.addEventListener('keydown', keyboard);
  list.addEventListener('pointerdown', pointerDown, { passive: true });
  window.addEventListener('pointerup', pointerUp, { passive: true });
  window.addEventListener('pointercancel', cancelGesture, { passive: true });
  list.addEventListener('click', clickCapture, true);
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  void document.fonts.ready.then(scheduleMeasure).catch(() => {});
  scheduleMeasure();
  const dispose = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(quietFrame);
    resize.disconnect();
    textChanges.disconnect();
    root.removeEventListener('click', click);
    root.removeEventListener('keydown', keyboard);
    list.removeEventListener('pointerdown', pointerDown);
    window.removeEventListener('pointerup', pointerUp);
    window.removeEventListener('pointercancel', cancelGesture);
    list.removeEventListener('click', clickCapture, true);
    window.removeEventListener('resize', scheduleMeasure);
    document.fonts.removeEventListener('loadingdone', fontsChanged);
    signal.removeEventListener('abort', dispose);
    gesture = undefined;
    for (const [name, value] of previousRoot) restoreAttribute(root, name, value);
    restoreAttribute(list, 'tabindex', previousTab);
    controls.hidden = previousControls;
    if (hint && previousHint !== undefined) hint.hidden = previousHint;
    if (roll) roll.style.transform = previousRoll ?? '';
    if (live) live.textContent = previousLive ?? '';
    slides.forEach((slide, index) => {
      const previous = previousSlides[index]!;
      slide.inert = previous.inert;
      restoreAttribute(slide, 'aria-hidden', previous.hidden);
      restoreAttribute(slide, 'data-featured-active', previous.active);
      previous.styles.forEach(([name, value, priority]) => { if (value) slide.style.setProperty(name, value, priority); else slide.style.removeProperty(name); });
    });
    buttons.forEach((button, index) => {
      const previous = previousButtons[index]!;
      button.disabled = previous.disabled;
      restoreAttribute(button, 'tabindex', previous.tab);
      restoreAttribute(button, 'aria-current', previous.current);
      restoreAttribute(button, 'aria-disabled', previous.disabledAria);
    });
  };
  signal.addEventListener('abort', dispose, { once: true });
  return { dispose };
}
