import { loadGSAP, loadOptionalPlugin } from '@/lib/gsap';

export interface ProjectTransitionFallback {
  close: (destination?: HTMLElement) => Promise<void>;
  cancel: () => void;
}

/** Imported after pointer/focus. GSAP/Flip are requested only by this click-time function. */
export function startProjectTransitionFallback({ source, signal }: {
  source?: HTMLElement; signal: AbortSignal;
}): ProjectTransitionFallback {
  const overlay = document.createElement('div');
  overlay.className = source ? 'project-transition-clone' : 'project-transition-curtain';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.inert = true;
  let clone: HTMLElement | undefined;
  if (source) {
    const bounds = source.getBoundingClientRect();
    const computed = getComputedStyle(source);
    clone = source.cloneNode(true) as HTMLElement;
    // Isolate SVG ids/references too: removing ids alone would break clip paths/gradients.
    const idMap = new Map<string, string>();
    const prefix = `transition-${Math.round(performance.now())}-`;
    [clone, ...clone.querySelectorAll<HTMLElement>('[id]')].forEach(element => {
      if (element.id) { idMap.set(element.id, prefix + element.id); element.id = prefix + element.id; }
    });
    [clone, ...clone.querySelectorAll<Element>('*')].forEach(element => {
      for (const attribute of Array.from(element.attributes)) {
        let next = attribute.value;
        idMap.forEach((replacement, id) => {
          next = next.replaceAll(`url(#${id})`, `url(#${replacement})`);
          if ((attribute.name === 'href' || attribute.name === 'xlink:href') && next === `#${id}`) next = `#${replacement}`;
        });
        if (next !== attribute.value) element.setAttribute(attribute.name, next);
      }
      element.removeAttribute('autofocus');
      if (element.matches('a,button,input,select,textarea,[tabindex]')) element.setAttribute('tabindex', '-1');
      if (element instanceof HTMLElement) {
        delete element.dataset.projectCoverSourceId;
        delete element.dataset.projectCoverRole;
        element.style.viewTransitionName = 'none';
      }
    });
    Object.assign(overlay.style, {
      left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`,
      backgroundColor: computed.backgroundColor, color: computed.color,
      fontFamily: computed.fontFamily, fontSize: computed.fontSize, lineHeight: computed.lineHeight,
      borderRadius: computed.borderRadius,
    });
    Array.from(computed).filter(property => property.startsWith('--')).forEach(property => {
      overlay.style.setProperty(property, computed.getPropertyValue(property));
    });
    Object.assign(clone.style, {
      width: '100%', height: '100%', margin: '0', padding: computed.padding,
      boxSizing: computed.boxSizing, transform: 'none', clipPath: 'none',
    });
    overlay.append(clone);
  } else {
    const logo = document.createElement('img');
    logo.src = '/brand/logo-horizontal-light.svg';
    logo.alt = '';
    logo.width = 894;
    logo.height = 121;
    overlay.append(logo);
  }
  document.body.append(overlay);
  let alive = true;
  let closeStarted = false;
  let finishExpansion = () => {};
  const expanded = new Promise<void>(resolve => { finishExpansion = resolve; });
  let disposeAnimation = () => {};
  let fade: Animation | undefined;
  const cancel = () => {
    if (!alive) return;
    alive = false;
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
    try {
      disposeAnimation();
      fade?.cancel();
    } finally {
      finishExpansion();
      overlay.remove();
    }
  };
  const timeout = window.setTimeout(cancel, 4500);
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  if (source && alive) {
    void Promise.all([loadGSAP(), loadOptionalPlugin('Flip')]).then(([{ gsap }, Flip]) => {
      if (!alive) return;
      const context = gsap.context(() => {
        const state = Flip.getState(overlay, { props: 'borderRadius' });
        Object.assign(overlay.style, { top: '0px', left: '0px', width: '100vw', height: '100svh', borderRadius: '0px' });
        // The overlay already sits outside flow; keep fixed while navigation changes document scroll.
        Flip.from(state, { duration: .9, ease: 'power4.inOut', onComplete: finishExpansion });
      }, overlay);
      disposeAnimation = () => context.revert();
    }).catch(cancel);
  } else if (alive) {
    const animation = overlay.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
      { duration: 450, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
    animation.onfinish = finishExpansion;
    disposeAnimation = () => animation.cancel();
  }
  const close = async (destination?: HTMLElement) => {
    if (!alive || closeStarted) return;
    closeStarted = true;
    try {
      const images = Array.from(destination?.querySelectorAll<HTMLImageElement>('img') ?? []);
      await Promise.race([
        Promise.all(images.map(image => image.decode().catch(() => {}))),
        new Promise<void>(resolve => setTimeout(resolve, 350)),
      ]);
      await expanded;
      if (!alive) return;
      fade = overlay.animate(source ? [{ opacity: 1 }, { opacity: 0 }] : [
        { transform: 'translateY(0)' }, { transform: 'translateY(-100%)' },
      ], { duration: source ? 200 : 450, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
      await fade.finished.catch(() => {});
    } finally { cancel(); }
  };
  return { close, cancel };
}
