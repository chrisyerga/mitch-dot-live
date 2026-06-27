const CANVAS_SIZE = 256;
const ICON_SRC = "/favicon-96x96.png";
const TEXT_COLOR = "#0a3161";
const FONT_HEIGHT_RATIO = 0.8;
const SCROLL_DURATION_MS = 2800;
const FAVICON_LINK_ID = "animated-favicon";

export const FAVICON_STATUS_EVENT = "mitch-status";
export const FAVICON_DEBUG_PREVIEW_ID = "favicon-debug-preview";

let faviconLink: HTMLLinkElement | null = null;
let staticFaviconsDisabled = false;
let bootCleanup: (() => void) | null = null;

function isDebugPreviewEnabled(): boolean {
  return document.getElementById(FAVICON_DEBUG_PREVIEW_ID) !== null;
}

function isDesktopFaviconContext(): boolean {
  return window.matchMedia("(min-width: 768px) and (hover: hover)").matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shouldAnimate(): boolean {
  return (
    isDebugPreviewEnabled() ||
    (isDesktopFaviconContext() && !prefersReducedMotion())
  );
}

function disableStaticFaviconLinks() {
  if (staticFaviconsDisabled) {
    return;
  }

  for (const el of document.querySelectorAll(
    `link[rel~="icon"]:not(#${FAVICON_LINK_ID})`,
  )) {
    const link = el as HTMLLinkElement;
    link.dataset.faviconOriginalMedia = link.media;
    link.media = "not all";
  }

  staticFaviconsDisabled = true;
}

function restoreStaticFaviconLinks() {
  if (!staticFaviconsDisabled) {
    return;
  }

  for (const el of document.querySelectorAll("link[data-favicon-original-media]")) {
    const link = el as HTMLLinkElement;
    link.media = link.dataset.faviconOriginalMedia ?? "";
    delete link.dataset.faviconOriginalMedia;
  }

  staticFaviconsDisabled = false;
}

function ensureFaviconLink(): HTMLLinkElement {
  if (faviconLink?.isConnected) {
    return faviconLink;
  }

  const existing = document.getElementById(FAVICON_LINK_ID) as HTMLLinkElement | null;
  if (existing) {
    faviconLink = existing;
    return faviconLink;
  }

  faviconLink = document.createElement("link");
  faviconLink.id = FAVICON_LINK_ID;
  faviconLink.rel = "icon";
  faviconLink.type = "image/png";
  faviconLink.sizes = "any";
  document.head.appendChild(faviconLink);
  return faviconLink;
}

type AnimationHandle = {
  stop: () => void;
  setAnswer: (answer: string) => void;
};

function createAnimatedFavicon(initialAnswer: string): AnimationHandle {
  const debugPreview = document.getElementById(
    FAVICON_DEBUG_PREVIEW_ID,
  ) as HTMLImageElement | null;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { stop: () => {}, setAnswer: () => {} };
  }

  const icon = new Image();
  icon.decoding = "async";

  const linkEl = ensureFaviconLink();
  disableStaticFaviconLinks();

  let answer = initialAnswer;
  let frameId = 0;
  let scrollX = CANVAS_SIZE;
  let lastTimestamp = 0;
  let textWidth = 0;
  let iconReady = false;
  let faviconPrimed = false;

  const fontSize = CANVAS_SIZE * FONT_HEIGHT_RATIO;

  const measureText = () => {
    ctx.font = `900 ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
    textWidth = ctx.measureText(answer).width;
  };

  const applyFavicon = (dataUrl: string) => {
    linkEl.href = dataUrl;
    if (!faviconPrimed) {
      document.head.appendChild(linkEl);
      faviconPrimed = true;
    }
  };

  const drawFrame = () => {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (iconReady) {
      ctx.drawImage(icon, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    ctx.font = `900 ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = TEXT_COLOR;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(answer, scrollX, CANVAS_SIZE / 2);

    const dataUrl = canvas.toDataURL("image/png");
    applyFavicon(dataUrl);
    if (debugPreview) {
      debugPreview.src = dataUrl;
    }
  };

  const tick = (timestamp: number) => {
    if (lastTimestamp === 0) {
      lastTimestamp = timestamp;
    }

    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const travelDistance = CANVAS_SIZE + textWidth;
    scrollX -= (travelDistance / SCROLL_DURATION_MS) * delta;

    if (scrollX < -textWidth) {
      scrollX = CANVAS_SIZE;
    }

    drawFrame();
    frameId = window.requestAnimationFrame(tick);
  };

  const startAnimation = () => {
    measureText();
    scrollX = CANVAS_SIZE;
    lastTimestamp = 0;
    iconReady = true;
    if (frameId === 0) {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      lastTimestamp = 0;
      return;
    }

    if (iconReady && frameId === 0) {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  icon.onload = startAnimation;
  icon.onerror = () => {
    iconReady = false;
    measureText();
    if (frameId === 0) {
      frameId = window.requestAnimationFrame(tick);
    }
  };
  icon.src = ICON_SRC;

  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    setAnswer(nextAnswer: string) {
      if (nextAnswer === answer) {
        return;
      }

      answer = nextAnswer;
      measureText();
      scrollX = CANVAS_SIZE;
      lastTimestamp = 0;
    },
    stop() {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      restoreStaticFaviconLinks();
    },
  };
}

export function bootAnimatedFavicon(initialIsAlive: boolean): () => void {
  if (bootCleanup) {
    return bootCleanup;
  }

  if (!shouldAnimate()) {
    return () => {};
  }

  let handle = createAnimatedFavicon(initialIsAlive ? "YES" : "NO");

  const onStatus = (event: Event) => {
    const detail = (event as CustomEvent<{ isAlive: boolean }>).detail;
    if (typeof detail?.isAlive !== "boolean") {
      return;
    }

    handle.setAnswer(detail.isAlive ? "YES" : "NO");
  };

  window.addEventListener(FAVICON_STATUS_EVENT, onStatus);

  bootCleanup = () => {
    window.removeEventListener(FAVICON_STATUS_EVENT, onStatus);
    handle.stop();
    bootCleanup = null;
  };

  return bootCleanup;
}
