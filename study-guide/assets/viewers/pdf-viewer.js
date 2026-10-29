/*
 * Document viewer: shows PDFs using PDF.js (assets/vendor/pdf.min.js).
 * Part 1 is the drawing engine. Part 2 connects it to the toolbar.
 *
 * Zooming never reloads the document: pages resize at once (the old picture is
 * stretched as a preview), then each page is redrawn sharply in the background and
 * swapped in only when finished, so nothing blinks or goes blank.
 *
 * Two-finger pinch zoom (mobile) zooms around the point between your fingers.
 */
(function () {
  'use strict';

  const V = window.Viewers;
  const $ = V.$;

  // ===========================================================
  // Part 1: drawing engine
  // ===========================================================
  const CSS_UNITS = 96 / 72; // PDF.js scale 1 is 72 dpi; screens use 96, like browser viewers
  const MIN_PERCENT = 25;
  const MAX_PERCENT = 400;
  const SIDE_GAP = 16; // total space left beside a page when fitting the width

  async function createEngine(scroller, url, onChange) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument(url).promise;
    const pixelRatio = window.devicePixelRatio || 1;

    let percent = 100; // zoom shown to the user
    // On narrow screens (phones) open fitted to the width, so the whole page is visible.
    let fitting = scroller.clientWidth < 720; // true while "fit width" is active
    const pages = [];
    const visible = new Set();

    // An empty, correctly sized holder for every page
    scroller.innerHTML = '';
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const holder = document.createElement('div');
      holder.className = 'pdf-page';
      scroller.appendChild(holder);
      pages.push({ n, page, holder, canvas: null, drawnAt: 0, task: null });
    }

    const scaleFor = (pct) => (pct / 100) * CSS_UNITS;

    // Draw one page sharply, then swap it in when finished
    async function draw(p) {
      const wanted = percent;
      if (p.drawnAt === wanted) return;
      if (p.task) p.task.cancel();

      const viewport = p.page.getViewport({ scale: scaleFor(wanted) * pixelRatio });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      p.task = p.page.render({ canvasContext: canvas.getContext('2d'), viewport });
      try {
        await p.task.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') console.error('Page render failed:', err);
        return;
      }
      if (wanted !== percent) return; // zoom changed meanwhile; a newer draw is coming

      if (p.canvas) p.holder.replaceChild(canvas, p.canvas);
      else p.holder.appendChild(canvas);
      p.canvas = canvas;
      p.drawnAt = wanted;
    }

    // Only draw pages on (or near) the screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const p = pages[Number(entry.target.dataset.index)];
          if (entry.isIntersecting) {
            visible.add(p);
            draw(p);
          } else {
            visible.delete(p);
          }
        });
      },
      { root: scroller, rootMargin: '800px 0px' }
    );
    pages.forEach((p, index) => {
      p.holder.dataset.index = index;
      observer.observe(p.holder);
    });

    function widthFitPercent() {
      const first = pages[0].page.getViewport({ scale: 1 });
      return ((scroller.clientWidth - SIDE_GAP) / first.width / CSS_UNITS) * 100;
    }

    function currentPage() {
      const line = scroller.scrollTop + scroller.clientHeight / 3;
      let current = 1;
      pages.forEach((p) => {
        if (p.holder.offsetTop <= line) current = p.n;
      });
      return current;
    }

    function notify() {
      onChange({ page: currentPage(), numPages: pdf.numPages, zoom: Math.round(percent), fit: fitting });
    }

    let redrawTimer = null;

    // Resize every page now; redraw sharply shortly after the last change
    function layout() {
      const position = scroller.scrollHeight ? scroller.scrollTop / scroller.scrollHeight : 0;
      if (fitting) percent = widthFitPercent();
      percent = Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent));

      pages.forEach((p) => {
        const size = p.page.getViewport({ scale: scaleFor(percent) });
        p.holder.style.width = size.width + 'px';
        p.holder.style.height = size.height + 'px';
      });

      scroller.scrollTop = position * scroller.scrollHeight; // keep your place
      notify();

      clearTimeout(redrawTimer);
      redrawTimer = setTimeout(() => visible.forEach(draw), 150);
    }

    let scrollQueued = false;
    scroller.addEventListener('scroll', () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        notify();
      });
    });

    // Re-fit when the window or full-screen size changes
    let resizeQueued = false;
    const resizeObserver = new ResizeObserver(() => {
      if (!fitting || resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        layout();
      });
    });
    resizeObserver.observe(scroller);

    layout();

    return {
      goTo(number) {
        const n = Math.min(pdf.numPages, Math.max(1, Math.round(number) || 1));
        scroller.scrollTop = pages[n - 1].holder.offsetTop - 8;
      },
      setZoom(value) {
        fitting = false;
        percent = value;
        layout();
      },
      // Pinch zoom: zoom to `value`, keeping the point (cx, cy) under the fingers in place.
      // cx and cy are measured from the top-left corner of the scroller.
      setZoomAt(value, cx, cy) {
        const before = percent;
        const target = Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(value)));
        if (target === Math.round(before) && !fitting) return;

        const left = scroller.scrollLeft;
        const top = scroller.scrollTop;

        fitting = false;
        percent = target;
        layout();

        const ratio = percent / before;
        scroller.scrollLeft = (left + cx) * ratio - cx;
        scroller.scrollTop = (top + cy) * ratio - cy;
      },
      getZoom() {
        return percent;
      },
      zoomBy(delta) {
        this.setZoom(Math.round(percent) + delta);
      },
      fitWidth() {
        fitting = true;
        layout();
      },
      destroy() {
        clearTimeout(redrawTimer);
        observer.disconnect();
        resizeObserver.disconnect();
        pdf.destroy();
      },
    };
  }

  // ===========================================================
  // Pinch zoom (two fingers, mobile)
  // ===========================================================
  function enablePinch(scroller, engine) {
    // Leave one-finger scrolling to the browser, but take over two-finger pinch
    scroller.style.touchAction = 'pan-x pan-y';

    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    let startDist = 0;
    let startZoom = 100;

    scroller.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 2) {
          startDist = dist(e.touches) || 1;
          startZoom = engine.getZoom();
        }
      },
      { passive: true }
    );

    scroller.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length !== 2 || !startDist) return;
        if (e.cancelable) e.preventDefault(); // stop the browser's own page zoom

        const rect = scroller.getBoundingClientRect();
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        engine.setZoomAt(startZoom * (dist(e.touches) / startDist), cx, cy);
      },
      { passive: false }
    );

    const endPinch = (e) => {
      if (e.touches.length < 2) startDist = 0;
    };
    scroller.addEventListener('touchend', endPinch, { passive: true });
    scroller.addEventListener('touchcancel', endPinch, { passive: true });

    // iPhone Safari: block its own page zoom while pinching on the document
    scroller.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    scroller.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  }

  // ===========================================================
  // Part 2: the viewer (toolbar and page controls)
  // ===========================================================
  const STEP = 10; // zoom change per click of + or -

  const pageTools = `
          <span class="pdf-tools" id="pdf-tools">
            <button class="btn" id="page-prev" aria-label="Previous page" title="Previous page">‹</button>
            <input class="page-input" id="page-input" type="number" min="1" value="1" aria-label="Page number" title="Type a page number and press Enter">
            <span class="muted" id="page-total">/ …</span>
            <button class="btn" id="page-next" aria-label="Next page" title="Next page">›</button>
          </span>`;

  V.register({
    name: 'document',

    handles(resource) {
      return resource.ext === 'pdf';
    },

    markup(resource) {
      const tools = V.buttons.fullscreen + V.buttons.fit + pageTools + V.buttons.zoom;
      // The iframe is only a fallback, used if the PDF library cannot load.
      const options = V.config.allowDownload ? '' : '#toolbar=0&navpanes=0';
      const frame = `<iframe src="${resource.path}${options}" title="${V.escapeHtml(resource.title)}"></iframe>`;
      return V.shell(tools, frame);
    },

    mount(resource) {
      const viewer = $('#viewer');
      const frame = $('#viewer-frame');
      const zoomLabel = $('#zoom-label');
      const pageInput = $('#page-input');
      const pageTotal = $('#page-total');
      const fullscreen = V.setupFullscreen(viewer);
      V.bindZoomToggle();

      let engine = null;
      const fallbackHtml = frame.innerHTML;
      frame.innerHTML = '<div class="pdf-scroll" id="pdf-scroll"><p class="pdf-note">Loading PDF…</p></div>';

      async function start() {
        const scroller = $('#pdf-scroll');
        try {
          if (!window.pdfjsLib) throw new Error('PDF library not loaded');
          engine = await createEngine(scroller, resource.path, (info) => {
            if (document.activeElement !== pageInput) pageInput.value = info.page;
            pageInput.max = info.numPages;
            pageTotal.textContent = '/ ' + info.numPages;
            zoomLabel.textContent = info.fit ? 'Fit' : info.zoom + '%';
          });
        } catch (err) {
          // Could not load: use the browser's own viewer. Page and zoom tools are hidden there.
          console.warn('Document viewer unavailable, using the browser viewer:', err);
          frame.innerHTML = fallbackHtml;
          $('#pdf-tools').hidden = true;
          $('#zoom-toggle').hidden = true;
          $('#zoom-controls').hidden = true;
          return;
        }

        enablePinch(scroller, engine);

        // Light deterrent: no right-click "save" menu while downloads are off.
        scroller.addEventListener('contextmenu', (event) => {
          if (!V.config.allowDownload) event.preventDefault();
        });
      }

      // Full screen, then make the page width fill the screen.
      async function fitToScreen() {
        if (!fullscreen.isFullscreen()) await fullscreen.enter();
        await V.wait(150); // let the new size settle
        if (engine) engine.fitWidth();
      }

      $('#fit-screen-btn').addEventListener('click', fitToScreen);
      $('#zoom-in').addEventListener('click', () => engine && engine.zoomBy(STEP));
      $('#zoom-out').addEventListener('click', () => engine && engine.zoomBy(-STEP));
      $('#zoom-reset').addEventListener('click', () => engine && engine.setZoom(100));

      pageInput.addEventListener('change', () => engine && engine.goTo(Number(pageInput.value)));
      pageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') pageInput.blur();
      });
      $('#page-prev').addEventListener('click', () => engine && engine.goTo(Number(pageInput.value) - 1));
      $('#page-next').addEventListener('click', () => engine && engine.goTo(Number(pageInput.value) + 1));

      start();

      // Called when you leave the page
      return () => engine && engine.destroy();
    },
  });
})();