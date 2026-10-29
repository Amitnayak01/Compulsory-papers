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
      const tools = V.buttons.fullscreen + V.buttons.fit + V.buttons.zoom;
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

      // Two-finger pinch zoom (mobile). Listeners go inside the iframe,
      // because that is where the touches happen.
      function enablePinch(doc) {
        if (!doc || doc.__pinchReady) return;
        doc.__pinchReady = true;

        // Stop the browser's own page zoom; one-finger scrolling still works
        doc.documentElement.style.touchAction = 'pan-x pan-y';

        // screenX/Y are not affected by the zoom transform, so the pinch stays stable
        const dist = t => Math.hypot(t[0].screenX - t[1].screenX, t[0].screenY - t[1].screenY);
        let startDist = 0, startZoom = 100;

        doc.addEventListener('touchstart', e => {
          if (e.touches.length === 2) {
            startDist = dist(e.touches);
            startZoom = zoom;
          }
        }, { passive: true });

        doc.addEventListener('touchmove', e => {
          if (e.touches.length !== 2 || !startDist) return;
          e.preventDefault();
          applyZoom(Math.round(startZoom * (dist(e.touches) / startDist)));
        }, { passive: false });

        doc.addEventListener('touchend', e => {
          if (e.touches.length < 2) startDist = 0;
        }, { passive: true });
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