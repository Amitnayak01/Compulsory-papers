/*
 * Shared parts used by every viewer: settings, toolbar buttons, full screen.
 * Each viewer file (quiz-viewer.js, pdf-viewer.js) registers itself here with:
 *   Viewers.register({ name, handles(resource), markup(resource), mount(resource) })
 * app.js then picks the right viewer for each file automatically.
 */
(function () {
  'use strict';

  const $ = (selector) => document.querySelector(selector);

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, (ch) => map[ch]);
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ----- Settings -----
  // Set allowDownload to true to show Download / Open in new tab buttons.
  const config = { allowDownload: false };

  // ----- Toolbar buttons shared by all viewers -----
  const buttons = {
    fullscreen: '<button class="btn" id="fullscreen-btn">⛶ Full screen</button>',

    fit: `<button class="btn" id="fit-screen-btn" title="Fit to screen" aria-label="Fit to screen">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
            <span>Fit to screen</span>
          </button>`,

    zoom: `<button class="btn" id="zoom-toggle" aria-expanded="false">🔍 Zoom</button>
          <span class="zoom-controls" id="zoom-controls" hidden>
            <button class="btn" id="zoom-out" aria-label="Zoom out">−</button>
            <span id="zoom-label">100%</span>
            <button class="btn" id="zoom-in" aria-label="Zoom in">+</button>
            <button class="btn" id="zoom-reset">Reset</button>
          </span>`,
  };

  // The outer box every viewer sits in: toolbar on top, content below.
  function shell(toolsHtml, frameHtml) {
    return `
      <div class="viewer" id="viewer">
        <div class="viewer-tools">${toolsHtml}</div>
        <div class="viewer-frame" id="viewer-frame">${frameHtml}</div>
      </div>`;
  }

  // The Zoom button shows the − / + controls on the first click, hides them on the second.
  function bindZoomToggle() {
    const toggle = $('#zoom-toggle');
    const controls = $('#zoom-controls');
    toggle.addEventListener('click', () => {
      const show = controls.hidden; // currently hidden -> show it
      controls.hidden = !show;
      toggle.classList.toggle('on', show);
      toggle.setAttribute('aria-expanded', String(show));
    });
  }

  // ----- Full screen -----
  // Where the browser has no full-screen support (for example iPhone),
  // the viewer expands to fill the whole page instead.
  function setupFullscreen(viewer) {
    const button = $('#fullscreen-btn');
    const nativeFullscreen = Boolean(document.fullscreenEnabled && viewer.requestFullscreen);

    function isFullscreen() {
      return Boolean(document.fullscreenElement) || viewer.classList.contains('is-expanded');
    }

    function updateUi() {
      viewer.classList.toggle('is-fullscreen', Boolean(document.fullscreenElement));
      button.textContent = isFullscreen() ? '✕ Exit full screen' : '⛶ Full screen';
    }

    async function enter() {
      if (nativeFullscreen) {
        try {
          await viewer.requestFullscreen();
        } catch (err) {
          viewer.classList.add('is-expanded');
        }
      } else {
        viewer.classList.add('is-expanded');
      }
      updateUi();
    }

    function exit() {
      viewer.classList.remove('is-expanded');
      if (document.fullscreenElement) document.exitFullscreen();
      updateUi();
    }

    button.addEventListener('click', () => (isFullscreen() ? exit() : enter()));

    // Assigning (not adding) handlers means pages don't pile up listeners.
    document.onfullscreenchange = updateUi;
    document.onkeydown = (event) => {
      if (event.key === 'Escape' && viewer.classList.contains('is-expanded')) exit();
    };

    return { isFullscreen, enter, exit };
  }

  // ----- Registry of viewers -----
  const viewers = [];

  function register(viewer) {
    viewers.push(viewer);
  }

  function find(resource) {
    return viewers.find((v) => v.handles(resource)) || null;
  }

  // Starts the viewer for a file. Returns a cleanup function (or null).
  function mount(resource) {
    const viewer = find(resource);
    if (!viewer) return null;
    return viewer.mount(resource) || null;
  }

  window.Viewers = { $, escapeHtml, wait, config, buttons, shell, bindZoomToggle, setupFullscreen, register, find, mount };
})();
