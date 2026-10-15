import { loadGSAP } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';

interface DistanceGeometry {
  scale: number;
  leftX: number;
  rightX: number;
  leftY: number;
  rightY: number;
  leftFirstY: number;
  leftSecondX: number;
  rightFirstX: number;
  rightFirstY: number;
  measureScaleX: number;
  measureX: number;
  measureY: number;
}

/** Zero-size inline marker gives the actual baseline in offset-parent coordinates.
 * It is inserted and removed only during setup/refresh, never during a scroll tick. */
function baselineOffset(span: HTMLElement): number {
  const marker = document.createElement('i');
  marker.setAttribute('aria-hidden', 'true');
  marker.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline;position:static;font:inherit;line-height:0;';
  span.append(marker);
  const world = span.closest<HTMLElement>('.distance-world');
  let node: HTMLElement | null = marker;
  let baseline = 0;
  // A transformed word can become the marker's offset parent during refresh.
  // Summing offsets preserves the original world coordinate without reading a
  // transform-dependent bounding rectangle.
  while (node && node !== world) {
    baseline += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  marker.remove();
  return baseline;
}

function measureDistanceGeometry(stage: HTMLElement, left: HTMLElement, right: HTMLElement, measure: HTMLElement, leftFirst: HTMLElement, leftSecond: HTMLElement, rightFirst: HTMLElement, rightSecond: HTMLElement): DistanceGeometry {
  const style = getComputedStyle(stage);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const viewportWidth = stage.clientWidth;
  const available = Math.max(1, viewportWidth - paddingLeft - paddingRight);
  const gap = Math.max(32, viewportWidth * .04);
  const wordSpace = 20;
  const leftWidth = leftFirst.offsetWidth + wordSpace + leftSecond.offsetWidth;
  const rightWidth = rightFirst.offsetWidth + wordSpace + rightSecond.offsetWidth;
  const scale = Math.min(.58, Math.max(.01, (available - gap) / (leftWidth + rightWidth)));
  const pairWidth = scale * (leftWidth + rightWidth) + gap;
  const pairLeft = paddingLeft + (available - pairWidth) / 2;
  const pairRight = pairLeft + pairWidth;
  const leftRowStart = leftFirst.offsetLeft;
  const rightRowEnd = rightSecond.offsetLeft + rightSecond.offsetWidth;
  const leftBaseline = baselineOffset(leftSecond);
  const rightBaseline = baselineOffset(rightSecond);
  const finalBaseline = stage.clientHeight * .43;
  const leftRowCenter = leftSecond.offsetTop + leftSecond.offsetHeight / 2;
  const rightRowCenter = rightSecond.offsetTop + rightSecond.offsetHeight / 2;
  const finalRowCenter = finalBaseline - scale * ((leftBaseline - leftRowCenter) + (rightBaseline - rightRowCenter)) / 2;
  const gapCenter = pairLeft + scale * leftWidth + gap / 2;

  return {
    scale,
    // Parent origins are left-center and right-center respectively.
    leftX: pairLeft - (left.offsetLeft + scale * leftRowStart),
    rightX: pairRight - (right.offsetLeft + right.offsetWidth * (1 - scale) + scale * rightRowEnd),
    leftY: finalBaseline - left.offsetTop - left.offsetHeight / 2 * (1 - scale) - scale * leftBaseline,
    rightY: finalBaseline - right.offsetTop - right.offsetHeight / 2 * (1 - scale) - scale * rightBaseline,
    leftFirstY: leftSecond.offsetTop - leftFirst.offsetTop,
    leftSecondX: leftRowStart + leftFirst.offsetWidth + wordSpace - leftSecond.offsetLeft,
    rightFirstX: rightSecond.offsetLeft - wordSpace - rightFirst.offsetWidth - rightFirst.offsetLeft,
    rightFirstY: rightSecond.offsetTop - rightFirst.offsetTop,
    measureScaleX: gap / Math.max(1, measure.offsetWidth),
    measureX: gapCenter - (measure.offsetLeft + measure.offsetWidth / 2),
    measureY: finalRowCenter - (measure.offsetTop + measure.offsetHeight / 2),
  };
}

export async function mountScene(root: HTMLElement, name: 'hero' | 'distance', tier: MotionTier, signal?: AbortSignal) {
  const { gsap, ScrollTrigger } = await loadGSAP();
  if (signal?.aborted || !root.isConnected) return () => {};
  let alive = true;
  let cleanupListeners = () => {};
  const context = gsap.context(() => {}, root);
  const cleanup = () => {
    alive = false;
    cleanupListeners();
    context.revert();
    delete root.dataset.sceneReady;
    if (window.__sceneRanges) delete window.__sceneRanges[name];
    window.__stCount = ScrollTrigger.getAll().length;
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
  try {
    context.add(() => {
    const q = gsap.utils.selector(root);
    const debug = new URLSearchParams(location.search).has('debug');
    const range = (start: number, end: number) => {
      window.__sceneRanges ??= {};
      window.__sceneRanges[name] = { start, end };
      window.__stCount = ScrollTrigger.getAll().length;
    };
    const lite = tier === 1;
    const vertical = lite && innerWidth < 768;
    if (name === 'hero') {
      const stage = root.querySelector<HTMLElement>('.hero-stage');
      const left = root.querySelector<HTMLElement>('.hero-photo-left');
      const right = root.querySelector<HTMLElement>('.hero-photo-right');
      const dos = root.querySelector<HTMLElement>('.hero-title-dos');
      const orillas = root.querySelector<HTMLElement>('.hero-title-orillas');
      if (!stage || !left || !right || !dos || !orillas) return;
      const willChange = [left.style.willChange, right.style.willChange];
      cleanupListeners = () => { left.style.willChange = willChange[0] ?? ''; right.style.willChange = willChange[1] ?? ''; };
      const photoGap = () => (right.offsetLeft - (left.offsetLeft + left.offsetWidth)) / 2;
      const titleGap = () => Math.max(0, (orillas.offsetLeft - (dos.offsetLeft + dos.offsetWidth) - innerWidth * .015) / 2);
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
        trigger: root, start: 'top top', end: lite ? 'bottom bottom' : () => `+=${innerHeight * 2.5}`,
        pin: lite ? false : stage, pinSpacing: false, scrub: true, anticipatePin: 1, invalidateOnRefresh: true, markers: debug,
        onRefresh: st => range(st.start, st.end), onToggle: st => {
          [left, right].forEach(el => { el.style.willChange = st.isActive ? 'transform' : ''; });
        },
      } });
      tl.addLabel('separar', 0).to(q('.hero-scroll'), { autoAlpha: 0, duration: .08 }, 0);
      if (vertical) {
        // Narrow screens reserve a title band; wider lite scenes converge in X.
        const travel = () => innerHeight * .03;
        tl.to(left, { y: travel, duration: .55 }, 0)
          .to(right, { y: () => -travel(), duration: .55 }, .04);
      } else {
        tl.to(left, { x: photoGap, duration: .55 }, 0)
          .to(right, { x: () => -photoGap(), y: () => left.offsetTop - right.offsetTop, duration: .62 }, .03)
          .to(dos, { x: titleGap, duration: .55 }, 0)
          .to(orillas, { x: () => -titleGap(), duration: .55 }, 0);
      }
      tl.addLabel('acercar', .2).fromTo(q('.hero-horizon'), { scaleX: 0 }, { scaleX: 1, duration: .25 }, .2)
        .to(q('.hero-image-inner'), { scale: 1.08, duration: .7 }, .1)
        .to(q('.hero-camera'), { scale: lite ? 1 : 1.04, duration: .8 }, 0)
        .addLabel('entender', .35).fromTo(q('.hero-first'), { y: 18, opacity: 1 }, { y: 0, opacity: 1, duration: .22 }, .35)
        .addLabel('conectar', .55).fromTo(q('.hero-seam'), { scaleY: 0 }, { scaleY: 1, duration: .2 }, .55)
        .addLabel('hacer', .6).fromTo(q('.hero-second'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .22 }, .6)
        .addLabel('cruzar', .82).to(q('.hero-title'), { yPercent: vertical ? 0 : -7, opacity: .65, duration: .18 }, .82);
      if (!lite) tl.to(q('.hero-actions'), { autoAlpha: .0, duration: .15 }, .3);
      tl.to({}, { duration: .01 }, .99);
      root.dataset.sceneReady = 'true';
      if (!lite) {
        const focus = () => tl.scrollTrigger && window.scrollTo({ top: tl.scrollTrigger.start, behavior: 'instant' });
        root.querySelectorAll<HTMLAnchorElement>('.hero-actions a').forEach(link => link.addEventListener('focus', focus));
        const previous = cleanupListeners;
        cleanupListeners = () => { previous(); root.querySelectorAll<HTMLAnchorElement>('.hero-actions a').forEach(link => link.removeEventListener('focus', focus)); };
        const layers = q('.hero-pointer-layer') as HTMLElement[];
        const setters = layers.map(layer => ({ x: gsap.quickTo(layer, 'x', { duration: .6, ease: 'power3.out' }), y: gsap.quickTo(layer, 'y', { duration: .6, ease: 'power3.out' }) }));
        const move = (event: PointerEvent) => setters.forEach((set, index) => { const sign = index === 0 ? 1 : -1; set.x((event.clientX / innerWidth - .5) * 12 * sign); set.y((event.clientY / innerHeight - .5) * 12 * sign); });
        const leave = () => setters.forEach(set => { set.x(0); set.y(0); });
        stage.addEventListener('pointermove', move, { passive: true }); stage.addEventListener('pointerleave', leave);
        const previousCleanup = cleanupListeners;
        cleanupListeners = () => { previousCleanup(); stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave); };
      }
    } else {
      const stage = root.querySelector<HTMLElement>('.distance-stage');
      const left = root.querySelector<HTMLElement>('.distance-left');
      const right = root.querySelector<HTMLElement>('.distance-right');
      if (!stage || !left || !right) return;
      const leftFirst = left.querySelector<HTMLElement>('h3 span:first-child');
      const leftSecond = left.querySelector<HTMLElement>('h3 span:last-child');
      const rightFirst = right.querySelector<HTMLElement>('h3 span:first-child');
      const rightSecond = right.querySelector<HTMLElement>('h3 span:last-child');
      const measure = root.querySelector<HTMLElement>('.distance-measure');
      let geometry: DistanceGeometry | undefined;
      const cacheGeometry = () => {
        if (!vertical && measure && leftFirst && leftSecond && rightFirst && rightSecond) {
          geometry = measureDistanceGeometry(stage, left, right, measure, leftFirst, leftSecond, rightFirst, rightSecond);
        }
      };
      cacheGeometry();
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
        trigger: root, start: 'top top', end: lite ? 'bottom bottom' : () => `+=${innerHeight * 3}`,
        pin: lite ? false : stage, pinSpacing: false, scrub: true, anticipatePin: 1, invalidateOnRefresh: true, markers: debug,
        onRefreshInit: cacheGeometry, onRefresh: st => range(st.start, st.end),
      } });
      tl.addLabel('separar', 0).fromTo(left, { xPercent: vertical ? 0 : -8, opacity: .7 }, { xPercent: 0, opacity: 1, duration: .18 }, 0)
        .fromTo(right, { xPercent: vertical ? 0 : 8, opacity: .7 }, { xPercent: 0, opacity: 1, duration: .18 }, 0)
        .addLabel('acercar', .18);
      if (vertical) {
        tl.to(left, { y: () => innerHeight * .085, scale: .65, duration: .44 }, .18)
          .to(right, { y: () => -innerHeight * .085, scale: .65, duration: .44 }, .18)
          .to(q('.distance-measure'), { scaleY: .4, duration: .44 }, .18);
      } else {
        tl.to(left, { x: () => geometry?.leftX ?? 0, y: () => geometry?.leftY ?? 0, scale: () => geometry?.scale ?? .58, duration: .44 }, .18)
          .to(right, { x: () => geometry?.rightX ?? 0, y: () => geometry?.rightY ?? 0, scale: () => geometry?.scale ?? .58, duration: .44 }, .18)
          .to(q('.distance-measure'), { x: () => geometry?.measureX ?? 0, y: () => geometry?.measureY ?? 0, scaleX: () => geometry?.measureScaleX ?? 1, duration: .44 }, .18);
        if (leftFirst && leftSecond) tl.to(leftFirst, { y: () => geometry?.leftFirstY ?? 0, duration: .44 }, .18)
          .to(leftSecond, { x: () => geometry?.leftSecondX ?? 0, duration: .44 }, .18);
        if (rightFirst && rightSecond) tl.to(rightFirst, { x: () => geometry?.rightFirstX ?? 0, y: () => geometry?.rightFirstY ?? 0, duration: .44 }, .18);
      }
      tl.to(q('.distance-description'), { opacity: 0, duration: .12 }, .3)
        .to(q('.measure-label'), { opacity: 0, duration: .12 }, .3)
        .addLabel('conectar', .72).fromTo(q('.distance-bridge'), { scaleX: 0 }, { scaleX: 1, duration: .12 }, .72)
        .fromTo(q('.distance-connection p'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .12 }, .72)
        .addLabel('resolver', .82).fromTo(q('.distance-statement'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: .045, duration: .09 }, .82)
        .fromTo(q('.distance-endline'), { scaleX: 0 }, { scaleX: 1, duration: .1 }, .9)
        .to({}, { duration: .01 }, .99);
      root.dataset.sceneReady = 'true';
    }
    });
  } catch (error) {
    cleanup();
    throw error;
  }
  document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); }).catch(() => {});
  return cleanup;
}
