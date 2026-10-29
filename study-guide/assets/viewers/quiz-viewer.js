/*
 * Quiz viewer: shows the HTML quizzes (.html / .htm) in a frame.
 * Zoom scales the page; Fit to screen goes full screen and enlarges it (100% to 150%).
 * Two-finger pinch zoom works on touch devices.
 */
(function () {
  'use strict';

  const V = window.Viewers;
  const $ = V.$;

  const MIN_ZOOM = 50;
  const MAX_ZOOM = 300;
  const STEP = 10;
  const QUIZ_BASE_WIDTH = 900; // layout width the quiz is assumed to look good at
  const QUIZ_MAX_ZOOM = 150; //   Fit to screen never enlarges beyond this

  V.register({
    name: 'quiz',

    handles(resource) {
      return ['html', 'htm'].includes(resource.ext);
    },

    markup(resource) {
      const download = `<a class="btn" id="download-btn" href="${resource.path}" download title="Download this file">⬇ <span>Download</span></a>`;
      const tools = V.buttons.fullscreen + V.buttons.fit + V.buttons.zoom + download;
      const frame = `<iframe src="${resource.path}" title="${V.escapeHtml(resource.title)}"></iframe>`;
      return V.shell(tools, frame);
    },

    mount() {
      const viewer = $('#viewer');
      const frame = $('#viewer-frame');
      const zoomLabel = $('#zoom-label');
      const fullscreen = V.setupFullscreen(viewer);
      V.bindZoomToggle();

      let zoom = 100;

      // Scale the page. No scaling at 100%, so text stays crisp.
      function applyZoom(value) {
        zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
        zoomLabel.textContent = zoom + '%';
        frame.style.setProperty('--zoom', zoom / 100);
        frame.classList.toggle('zoomed', zoom !== 100);
      }

      // Full screen, then enlarge to fill the width (between 100% and QUIZ_MAX_ZOOM).
      async function fitToScreen() {
        if (!fullscreen.isFullscreen()) await fullscreen.enter();
        await V.wait(150); // let the new size settle
        const fitZoom = Math.round((frame.clientWidth / QUIZ_BASE_WIDTH) * 20) * 5;
        applyZoom(Math.min(QUIZ_MAX_ZOOM, Math.max(100, fitZoom)));
      }

      $('#fit-screen-btn').addEventListener('click', fitToScreen);
      $('#zoom-in').addEventListener('click', () => applyZoom(zoom + STEP));
      $('#zoom-out').addEventListener('click', () => applyZoom(zoom - STEP));
      $('#zoom-reset').addEventListener('click', () => applyZoom(100));

      // Two-finger pinch zoom (mobile). Touches land inside the iframe,
      // so the listeners are attached to the iframe's own document.
      function enablePinch(doc) {
        if (!doc || !doc.documentElement || doc.__pinchReady) return;
        doc.__pinchReady = true;
        const win = doc.defaultView;

        // Force the browser to leave two-finger gestures to us, on every element
        const style = doc.createElement('style');
        style.textContent = 'html, body, * { touch-action: pan-x pan-y !important; }';
        (doc.head || doc.documentElement).appendChild(style);

        // screenX/Y are not affected by the zoom transform, so the pinch stays stable
        const px = t => (typeof t.screenX === 'number' ? t.screenX : t.clientX);
        const py = t => (typeof t.screenY === 'number' ? t.screenY : t.clientY);
        const dist = t => Math.hypot(px(t[0]) - px(t[1]), py(t[0]) - py(t[1]));

        let startDist = 0, startZoom = 100, gestureActive = false;

        doc.addEventListener('touchstart', e => {
          if (gestureActive) return;
          if (e.touches.length === 2) {
            startDist = dist(e.touches) || 1;
            startZoom = zoom;
          }
        }, { passive: true, capture: true });

        doc.addEventListener('touchmove', e => {
          if (gestureActive || e.touches.length !== 2 || !startDist) return;
          if (e.cancelable) e.preventDefault();
          applyZoom(Math.round(startZoom * (dist(e.touches) / startDist)));
        }, { passive: false, capture: true });

        const endTouch = e => { if (e.touches.length < 2) startDist = 0; };
        doc.addEventListener('touchend', endTouch, { passive: true, capture: true });
        doc.addEventListener('touchcancel', endTouch, { passive: true, capture: true });

        // iPhone Safari: uses its own gesture events for pinch
        doc.addEventListener('gesturestart', e => {
          e.preventDefault();
          gestureActive = true;
          startZoom = zoom;
        }, { passive: false });
        doc.addEventListener('gesturechange', e => {
          e.preventDefault();
          applyZoom(Math.round(startZoom * e.scale));
        }, { passive: false });
        doc.addEventListener('gestureend', e => {
          e.preventDefault();
          gestureActive = false;
        }, { passive: false });
      }

      function hookFrame() {
        try { enablePinch(frame.contentDocument); }
        catch (err) { console.warn('Pinch zoom unavailable:', err); }
      }

      frame.addEventListener('load', hookFrame); // runs again if the quiz reloads
      hookFrame();                               // in case it already loaded
    },
  });
})();