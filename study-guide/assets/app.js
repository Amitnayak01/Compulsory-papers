/*
 * OAVS TGT Computer Study Guide
 * Reads window.REGISTRY (data/registry.js) and window.QUESTIONS (data/questions.js)
 * and builds every page from them. No build step needed.
 */
(function () {
  'use strict';

  // ---------- Helpers ----------

  const $ = (selector) => document.querySelector(selector);

  // Escape text before putting it into HTML.
  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, (ch) => map[ch]);
  }

  // Lets long file names wrap after an underscore instead of in the middle of a word.
  function breakable(text) {
    return escapeHtml(text).replace(/_/g, '_<wbr>');
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  // ---------- Saved state (bookmarks, progress, history, theme) ----------

  const STORAGE_KEY = 'csg';
  const state = { bookmarks: [], done: [], recent: [], theme: '', days: [] };

  try {
    Object.assign(state, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch (err) {
    console.warn('Could not read saved progress:', err);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save progress:', err);
    }
  }

  // Add the id to the list if missing, remove it if present.
  function toggleInList(listName, id) {
    const list = state[listName];
    state[listName] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    saveState();
  }

  // ---------- Build the data model from the registry ----------

  const registry = window.REGISTRY || { subjects: [] };
  const questionBank = window.QUESTIONS || {};

  const KIND_LABELS = {
    notes: 'Notes',
    quiz: 'HTML quiz',
    bank: 'MCQ bank',
    syllabus: 'Syllabus',
    other: 'Resource',
  };

  // Subject folders sit one level above study-guide/. Override with root in registry.js.
  const rootFolder = registry.root !== undefined ? registry.root : '../';

  // Download setting lives in assets/viewers/viewer-common.js (config.allowDownload).
  const ALLOW_DOWNLOAD = Viewers.config.allowDownload;

  // Each subject gets a colour (set `color` in registry.js to choose your own).
  const PALETTE = ['#fb923c', '#38bdf8', '#34d399', '#a78bfa', '#f472b6', '#22d3ee'];

  // Simple line icons. Subject icons are named in registry.js (`icon`).
  const ICONS = {
    java: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 3c-1 1.5 1 2.5 0 4M12 3c-1 1.5 1 2.5 0 4"/>',
    c: '<path d="M17 7.5A6.5 6.5 0 1 0 17 16.5"/>',
    db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    it: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    vb: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13l-2 2 2 2M16 13l2 2-2 2"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M8 7h7"/>',
    notes: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    syllabus: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    bank: '<path d="M12 3l9 4-9 4-9-4 9-4z"/><path d="M3 12l9 4 9-4M3 17l9 4 9-4"/>',
  };
  ICONS.other = ICONS.notes;

  function iconSvg(name) {
    const paths = ICONS[name] || ICONS.book;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  const allResources = []; // flat list, used for search and stats
  const resourceById = {}; // lookup by id

  const subjects = registry.subjects.map((subject, index) => {
    subject.color = subject.color || PALETTE[index % PALETTE.length];
    const topics = (subject.topics || []).map((topic) => {
      const topicId = slugify(topic.folder);

      const resources = (topic.files || []).map(([fileName, kind]) => {
        const id = `${subject.folder}/${topic.folder}/${fileName}`;
        const resource = {
          id,
          file: fileName,
          title: fileName.replace(/\.[^.]+$/, ''),
          ext: fileName.split('.').pop().toLowerCase(),
          kind: KIND_LABELS[kind] ? kind : 'other',
          // URL used by the viewer and download buttons
          path: encodeURI(rootFolder + id)
            .replace(/#/g, '%23')
            .replace(/\?/g, '%3F'),
          subject,
          topic: { ...topic, id: topicId },
        };
        allResources.push(resource);
        resourceById[id] = resource;
        return resource;
      });

      return { ...topic, id: topicId, resources };
    });

    return { ...subject, topics };
  });

  // Documents that belong to no subject (for example the exam syllabus).
  const documents = (registry.documents || []).map((doc) => {
    const id = `docs/${doc.file}`;
    const resource = {
      id,
      general: true,
      doc,
      file: doc.file,
      title: doc.file.replace(/\.[^.]+$/, ''),
      ext: doc.file.split('.').pop().toLowerCase(),
      kind: KIND_LABELS[doc.kind] ? doc.kind : 'syllabus',
      path: encodeURI(rootFolder + doc.file).replace(/#/g, '%23').replace(/\?/g, '%3F'),
      subject: { id: 'docs', name: 'Documents', color: doc.color || '#facc15', icon: 'syllabus' },
      topic: { id: 'docs', name: doc.name },
    };
    allResources.push(resource);
    resourceById[id] = resource;
    return resource;
  });

  // ---------- Small HTML building blocks ----------

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  }

  // Remember each day the guide was opened, for the streak counter.
  function recordToday() {
    const today = dayKey();
    if (!state.days.includes(today)) {
      state.days = [...state.days, today].slice(-120);
      saveState();
    }
  }

  function currentStreak() {
    let count = 0;
    const day = new Date();
    while (state.days.includes(dayKey(day))) {
      count++;
      day.setDate(day.getDate() - 1);
    }
    return count;
  }

  // Numbers count up and the progress ring fills when the dashboard opens.
  function animateCounts() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      if (reducedMotion || !end) {
        el.textContent = end;
        return;
      }
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / 700);
        el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    document.querySelectorAll('.ring').forEach((ring) => {
      requestAnimationFrame(() => ring.style.setProperty('--p', ring.dataset.p));
    });
  }

  // A small burst of colour when a file is marked done.
  function burst(button) {
    if (reducedMotion) return;
    const box = button.getBoundingClientRect();
    const colors = ['#22d3ee', '#f0abfc', '#818cf8', '#34d399', '#fb923c', '#facc15'];
    for (let i = 0; i < 16; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti';
      bit.style.left = box.left + box.width / 2 + 'px';
      bit.style.top = box.top + box.height / 2 + 'px';
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty('--dx', (Math.random() - 0.5) * 160 + 'px');
      bit.style.setProperty('--dy', -30 - Math.random() * 110 + 'px');
      bit.style.setProperty('--r', Math.random() * 540 + 'deg');
      document.body.appendChild(bit);
      setTimeout(() => bit.remove(), 950);
    }
  }

  const clearRecentButton = '<button class="btn remove" data-clear-recent>Clear all</button>';

  // Percentage of the given resources marked done.
  function percentDone(resources) {
    if (!resources.length) return 0;
    const doneCount = resources.filter((r) => state.done.includes(r.id)).length;
    return Math.round((doneCount / resources.length) * 100);
  }

  function progressBar(resources) {
    return `<div class="bar"><i style="width:${percentDone(resources)}%"></i></div>`;
  }

  function resourceRow(r, options = {}) {
    const bookmarked = state.bookmarks.includes(r.id) ? 'on' : '';
    const done = state.done.includes(r.id) ? 'on' : '';
    return `
      <div class="row" style="--c:${r.subject.color}">
        <span class="kind-ico" data-kind="${r.kind}" title="${KIND_LABELS[r.kind]}">${iconSvg(r.kind)}</span>
        <span class="tag" data-kind="${r.kind}">${KIND_LABELS[r.kind]}</span>
        <a href="#/view/${encodeURIComponent(r.id)}">
          ${breakable(r.title)}<span class="muted">.${r.ext}</span><br>
          <span class="muted">${escapeHtml(r.subject.name)} / ${escapeHtml(r.topic.name)}</span>
        </a>
        <button class="btn ${bookmarked}" data-bookmark="${escapeHtml(r.id)}" title="Bookmark">★</button>
        <button class="btn ${done}" data-done="${escapeHtml(r.id)}" title="Mark as done">✓</button>
        ${options.removable ? `<button class="btn remove" data-remove-recent="${escapeHtml(r.id)}" title="Remove from recently opened" aria-label="Remove from recently opened">✕</button>` : ''}
      </div>`;
  }

  function resourceList(resources, emptyMessage, options = {}) {
    if (!resources.length) return `<p class="muted">${emptyMessage}</p>`;
    return resources.map((r) => resourceRow(r, options)).join('');
  }

  function idsToResources(ids) {
    return ids.map((id) => resourceById[id]).filter(Boolean);
  }

  // ---------- Pages ----------

  function renderSidebar(currentPath) {
    const topLinks = `
      <a href="#/" class="${currentPath === '/' ? 'cur' : ''}">Dashboard</a>
      <a href="#/bookmarks">Bookmarks</a>
      <a href="#/revise">Revision</a>
      <a href="#/recent">Recently opened</a>
      ${documents.map((d) => `
        <a class="s doc-link" style="--c:${d.subject.color}" href="#/view/${encodeURIComponent(d.id)}">
          <span class="s-ico">${iconSvg(d.kind)}</span>${escapeHtml(d.topic.name)}
        </a>`).join('')}`;

    const subjectLinks = subjects
      .map((subject) => {
        const pending = subject.topics.length === 0;
        let lastGroup = '';
        const topicLinks = subject.topics
          .map((topic) => {
            const path = `/topic/${subject.id}/${topic.id}`;
            // A small heading when several topics share a parent folder.
            const heading = topic.group && topic.group !== lastGroup ? `<div class="nav-group">${escapeHtml(topic.group)}</div>` : '';
            lastGroup = topic.group || '';
            return `${heading}<a class="t ${currentPath === path ? 'cur' : ''}" href="#${path}">${escapeHtml(topic.name)}</a>`;
          })
          .join('');
        return `
          <a class="s ${pending ? 'p' : ''}" style="--c:${subject.color}" href="#/subject/${subject.id}">
            <span class="s-ico">${iconSvg(subject.icon)}</span>${escapeHtml(subject.name)}${pending ? ' (pending)' : ''}
          </a>${topicLinks}`;
      })
      .join('');

    $('#nav').innerHTML = topLinks + subjectLinks;
    document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('cur', a.dataset.tab === currentPath));
  }

  // The big button in the dashboard banner: icon, short label, friendly name, arrow.
  function resumeButton({ href, kind, label, name, detail }) {
    return `
      <a class="resume" href="${href}">
        <span class="kind-ico" data-kind="${kind}">${iconSvg(kind)}</span>
        <span class="resume-text">
          <small>${escapeHtml(label)}</small>
          <b>${escapeHtml(name)}</b>
          <em>${escapeHtml(detail)}</em>
        </span>
        <span class="resume-go" aria-hidden="true">→</span>
      </a>`;
  }

  // The pill-shaped button in the dashboard banner: icon, label, optional note, arrow.
  function heroAction({ href, icon, label, note }) {
    return `
      <a class="hero-btn" href="${href}">
        <span class="hero-btn-ico">${iconSvg(icon)}</span>
        <span class="hero-btn-text"><b>${escapeHtml(label)}</b>${note ? `<small>${escapeHtml(note)}</small>` : ''}</span>
        <span class="hero-btn-go" aria-hidden="true">→</span>
      </a>`;
  }

  function pageHome() {
    // The syllabus is a reference, so it is not counted in the study progress numbers.
    const studyFiles = allResources.filter((r) => !r.general);
    const topicCount = subjects.reduce((sum, s) => sum + s.topics.length, 0);

    const subjectCards = subjects
      .map((subject) => {
        const files = subject.topics.flatMap((t) => t.resources);
        const summary = subject.topics.length
          ? `${subject.topics.length} topics, ${files.length} files`
          : 'Pending: files not added yet';
        return `
          <a class="card subject-card ${subject.topics.length ? '' : 'pending'}" style="--c:${subject.color}" href="#/subject/${subject.id}">
            <span class="s-badge">${iconSvg(subject.icon)}</span>
            <b>${escapeHtml(subject.name)}</b>
            <div class="muted">${summary}</div>
            ${progressBar(files)}
          </a>`;
      })
      .join('');

    const last = idsToResources(state.recent)[0];
    const firstWithFiles = subjects.find((x) => x.topics.length);
    // The big button in the banner: continue the last file, or start from the first subject.
    const heroButton = last
      ? heroAction({
          href: `#/view/${encodeURIComponent(last.id)}`,
          icon: last.kind,
          label: last.general ? last.doc.action || `Open ${last.topic.name}` : 'Continue studying',
          note: last.general ? '' : last.title,
        })
      : firstWithFiles
        ? heroAction({
            href: `#/subject/${firstWithFiles.id}`,
            icon: firstWithFiles.icon,
            label: 'Start studying',
            note: firstWithFiles.name,
          })
        : '';
    const doneCount = studyFiles.filter((r) => state.done.includes(r.id)).length;
    const pct = percentDone(studyFiles);

    return `
      <section class="hero">
        <div>
          <h2>${greeting()}</h2>
          <p class="muted">${escapeHtml(registry.title || 'Study Guide')}. ${doneCount} of ${studyFiles.length} files marked done.</p>
          ${heroButton}
        </div>
        <div class="ring" data-p="${pct}"><div><b><em data-count="${pct}">0</em>%</b><span>done</span></div></div>
      </section>
      <div class="grid stats">
        <div class="card stat"><b data-count="${topicCount}">0</b>topics</div>
        <div class="card stat"><b data-count="${studyFiles.length}">0</b>resources</div>
        <div class="card stat"><b data-count="${currentStreak()}">0</b>day streak</div>
      </div>
      <h3>Subjects</h3>
      <div class="grid">${subjectCards}</div>
      <div class="section-head">
        <h3>Continue where you left off</h3>
        ${last ? clearRecentButton : ''}
      </div>
      ${resourceList(idsToResources(state.recent).slice(0, 4), 'Nothing opened yet. Pick a topic on the left.', { removable: true })}`;
  }

  // ----- Shared pieces for the subject and topic pages -----

  const SLOT_LABELS = { notes: 'Study notes', quiz: 'HTML quiz', bank: 'MCQ question bank', other: 'Resource' };

  // Breadcrumb trail. Each part is [label, href]; the last one has no link.
  function crumbs(...parts) {
    const items = parts.map(([label, href]) =>
      href ? `<a href="${href}">${escapeHtml(label)}</a>` : `<span>${escapeHtml(label)}</span>`
    );
    return `<div class="crumbs">${items.join('<i>›</i>')}</div>`;
  }

  // Coloured page header with a badge, title, small facts and a progress bar.
  function banner({ color, badge, sub, title, chips, resources }) {
    return `
      <section class="banner" style="--c:${color}">
        <span class="s-badge big">${badge}</span>
        <div class="banner-text">
          ${sub ? `<p class="banner-sub">${escapeHtml(sub)}</p>` : ''}
          <h2>${escapeHtml(title)}</h2>
          <div class="chips">${chips.map((c) => `<span>${escapeHtml(c)}</span>`).join('')}</div>
          ${progressBar(resources)}
        </div>
      </section>`;
  }

  // ----- Subject page: a topic card for each topic -----

  function pageSubject(subjectId) {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return pageNotFound();

    const files = subject.topics.flatMap((t) => t.resources);
    const doneCount = files.filter((r) => state.done.includes(r.id)).length;
    const head =
      crumbs(['Dashboard', '#/'], [subject.name]) +
      banner({
        color: subject.color,
        badge: iconSvg(subject.icon),
        title: subject.name,
        chips: subject.topics.length
          ? [`${subject.topics.length} topics`, `${files.length} files`, `${doneCount} done`]
          : ['Pending'],
        resources: files,
      });

    if (!subject.topics.length) {
      return `${head}
        <div class="card pending">
          <b>Pending</b>
          <p class="muted">No files have been added for this subject yet.
            ${escapeHtml(subject.note || 'Add its folders to data/registry.js when you have them.')}</p>
        </div>`;
    }

    const cards = subject.topics
      .map((topic, i) => {
        const done = topic.resources.filter((r) => state.done.includes(r.id)).length;
        const kinds = ['notes', 'quiz', 'bank']
          .map((kind) => {
            const has = topic.resources.some((r) => r.kind === kind);
            const title = SLOT_LABELS[kind] + (has ? '' : ' (pending)');
            return `<span class="kind-ico small ${has ? '' : 'missing'}" data-kind="${kind}" title="${title}">${iconSvg(kind)}</span>`;
          })
          .join('');
        return `
          <a class="topic-card" style="--c:${subject.color}" href="#/topic/${subject.id}/${topic.id}">
            <span class="num">Topic ${pad(i + 1)}</span>
            <b>${escapeHtml(topic.name)}</b>
            ${topic.group ? `<span class="muted">${escapeHtml(topic.group)}</span>` : ''}
            <div class="kinds">${kinds}</div>
            <div class="muted">${done} of ${topic.resources.length} done</div>
            ${progressBar(topic.resources)}
            <span class="go">Open topic →</span>
          </a>`;
      })
      .join('');

    return `${head}<h3>Topics</h3><div class="topic-grid">${cards}</div>`;
  }

  // ----- Topic page: one card per file, previous / next topic -----

  function fileSlot(r) {
    const bookmarked = state.bookmarks.includes(r.id) ? 'on' : '';
    const done = state.done.includes(r.id) ? 'on' : '';
    const link = `#/view/${encodeURIComponent(r.id)}`;
    return `
      <div class="slot" data-kind="${r.kind}">
        <span class="kind-ico big" data-kind="${r.kind}">${iconSvg(r.kind)}</span>
        <div class="slot-body">
          <span class="slot-label">${SLOT_LABELS[r.kind]}</span>
          <a class="slot-title" href="${link}">${breakable(r.title)}<span class="muted">.${r.ext}</span></a>
        </div>
        <div class="slot-actions">
          <a class="btn primary" href="${link}">Open</a>
          <button class="btn ${bookmarked}" data-bookmark="${escapeHtml(r.id)}" title="Bookmark">★</button>
          <button class="btn ${done}" data-done="${escapeHtml(r.id)}" title="Mark as done">✓</button>
        </div>
      </div>`;
  }

  function pageTopic(subjectId, topicId) {
    const subject = subjects.find((s) => s.id === subjectId);
    const topic = subject && subject.topics.find((t) => t.id === topicId);
    if (!topic) return pageNotFound();

    const index = subject.topics.indexOf(topic);
    const done = topic.resources.filter((r) => state.done.includes(r.id)).length;

    // Notes, quiz and MCQ bank come first. A missing one shows as "pending".
    const slots = ['notes', 'quiz', 'bank']
      .map((kind) => {
        const found = topic.resources.filter((r) => r.kind === kind);
        if (found.length) return found.map(fileSlot).join('');
        return `
          <div class="slot pending" data-kind="${kind}">
            <span class="kind-ico big" data-kind="${kind}">${iconSvg(kind)}</span>
            <div class="slot-body">
              <span class="slot-label">${SLOT_LABELS[kind]}</span>
              <span class="muted">Pending: file not added yet</span>
            </div>
          </div>`;
      })
      .join('');
    const extras = topic.resources.filter((r) => r.kind === 'other').map(fileSlot).join('');

    const prev = subject.topics[index - 1];
    const next = subject.topics[index + 1];
    const pager = `
      <div class="pager">
        ${prev ? `<a href="#/topic/${subject.id}/${prev.id}"><span>← Previous topic</span><b>${escapeHtml(prev.name)}</b></a>` : '<span></span>'}
        ${next ? `<a class="next" href="#/topic/${subject.id}/${next.id}"><span>Next topic →</span><b>${escapeHtml(next.name)}</b></a>` : ''}
      </div>`;

    return (
      crumbs(['Dashboard', '#/'], [subject.name, `#/subject/${subject.id}`], [topic.name]) +
      banner({
        color: subject.color,
        badge: pad(index + 1),
        sub: topic.group ? `${subject.name} › ${topic.group}` : subject.name,
        title: topic.name,
        chips: [`${topic.resources.length} files`, `${done} of ${topic.resources.length} done`],
        resources: topic.resources,
      }) +
      `<div class="slots">${slots}${extras}</div>${pager}`
    );
  }

  function pageViewer(resourceId) {
    const r = resourceById[resourceId];
    if (!r) return pageNotFound();

    // Remember it in the "recently opened" list (max 20).
    state.recent = [resourceId, ...state.recent.filter((x) => x !== resourceId)].slice(0, 20);
    saveState();

    // The matching viewer file (PDF or quiz) builds the viewer box for this file.
    const viewer = Viewers.find(r);
    const viewerHtml = viewer ? viewer.markup(r) : '';
    const bookmarked = state.bookmarks.includes(resourceId) ? 'on' : '';
    const done = state.done.includes(resourceId) ? 'on' : '';

    return `
      ${r.general
        ? crumbs(['Dashboard', '#/'], [r.topic.name])
        : crumbs(['Dashboard', '#/'], [r.subject.name, `#/subject/${r.subject.id}`], [r.topic.name, `#/topic/${r.subject.id}/${r.topic.id}`])}
      <h2>${breakable(r.file)}</h2>
      <div class="actions">
        <button class="btn ${bookmarked}" data-bookmark="${escapeHtml(resourceId)}">★ Bookmark</button>
        <button class="btn ${done}" data-done="${escapeHtml(resourceId)}">✓ Done</button>
        ${ALLOW_DOWNLOAD ? `<a class="btn" href="${r.path}" download>Download</a>
        <a class="btn" href="${r.path}" target="_blank" rel="noopener">Open in new tab</a>` : ''}
      </div>
      ${viewerHtml}
      <p class="muted">If the viewer is blank, the file is missing or still cloud-only in OneDrive.
        Check that this site folder is inside COMPUTER STUDY GUIDE and the name matches exactly.</p>
      <h3>Practice</h3>
      ${renderPractice(r)}`;
  }

  function pageSearch(rawQuery) {
    const query = decodeURIComponent(rawQuery).toLowerCase();
    const matches = allResources.filter((r) =>
      [r.title, r.subject.name, r.topic.name, KIND_LABELS[r.kind]].join(' ').toLowerCase().includes(query)
    );
    return `<h2>Search: ${escapeHtml(query)}</h2>${resourceList(matches, 'No matches.')}`;
  }

  function pageBookmarks() {
    return `<h2>Bookmarks</h2>${resourceList(idsToResources(state.bookmarks), 'No bookmarks yet. Tap ★ on any file.')}`;
  }

  function pageRecent() {
    const items = idsToResources(state.recent);
    return `
      <div class="section-head">
        <h2>Recently opened</h2>
        ${items.length ? clearRecentButton : ''}
      </div>
      ${resourceList(items, 'Nothing opened yet.', { removable: true })}`;
  }

  function pageRevision() {
    const bookmarkedNotDone = allResources.filter(
      (r) => state.bookmarks.includes(r.id) && !state.done.includes(r.id)
    );
    const completed = allResources.filter((r) => state.done.includes(r.id));
    return `
      <h2>Revision</h2>
      <button class="btn" id="random-revision">Pick a random completed file</button>
      <h3>Bookmarked, not done</h3>
      ${resourceList(bookmarkedNotDone, 'Nothing pending.')}
      <h3>Completed, ready to revisit</h3>
      ${resourceList(completed, 'Mark files done with ✓ to build your revision list.')}`;
  }

  function pageNotFound() {
    return `<h2>Not found</h2>
      <p class="muted">That page isn't in the registry. <a href="#/">Go to the dashboard</a>.</p>`;
  }

  // ---------- Interactive MCQ practice (only if questions exist) ----------

  function renderPractice(resource) {
    const questions = questionBank[resource.id];
    if (!questions || !questions.length) {
      return `<p class="muted">No interactive questions registered for this file.
        Use the file above, or add questions in data/questions.js.</p>`;
    }

    const cards = questions
      .map((q, i) => {
        const options = q.options
          .map((text, j) => `<button class="option" data-q="${i}" data-o="${j}">${escapeHtml(text)}</button>`)
          .join('');
        return `
          <div class="card question">
            <b>${i + 1}. ${escapeHtml(q.q)}</b>
            ${options}
            <div class="explanation" id="explanation-${i}"></div>
          </div>`;
      })
      .join('');

    return `${cards}<p id="score"></p>`;
  }

  function setupPractice(resourceId) {
    const questions = questionBank[resourceId];
    if (!questions) return;

    let correct = 0;
    let answered = 0;

    document.querySelectorAll('.option').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.parentNode;
        if (card.dataset.answered) return; // one attempt per question
        card.dataset.answered = '1';
        answered++;

        const questionIndex = Number(button.dataset.q);
        const chosen = Number(button.dataset.o);
        const question = questions[questionIndex];
        if (chosen === question.answer) correct++;

        card.querySelectorAll('.option').forEach((opt, index) => {
          if (index === question.answer) opt.classList.add('good');
          else if (index === chosen) opt.classList.add('bad');
        });

        if (question.explanation) {
          $('#explanation-' + questionIndex).textContent = question.explanation;
        }
        $('#score').textContent = `Score: ${correct}/${answered} answered, ${questions.length} total`;
      });
    });
  }

  // ---------- Viewer cleanup ----------

  let viewerCleanup = null; // stops the current viewer when you leave the page

  // ---------- Router ----------

  function render() {
    if (viewerCleanup) {
      viewerCleanup();
      viewerCleanup = null;
    }
    const parts = (location.hash.slice(1) || '/').split('/').filter(Boolean);
    const [page, arg1, arg2] = parts;
    let html;

    try {
      if (!page) html = pageHome();
      else if (page === 'subject') html = pageSubject(arg1);
      else if (page === 'topic') html = pageTopic(arg1, arg2);
      else if (page === 'view') html = pageViewer(decodeURIComponent(arg1));
      else if (page === 'search') html = pageSearch(arg1 || '');
      else if (page === 'bookmarks') html = pageBookmarks();
      else if (page === 'recent') html = pageRecent();
      else if (page === 'revise') html = pageRevision();
      else html = pageNotFound();
    } catch (err) {
      console.error(err);
      html = `<h2>Something went wrong</h2><p class="muted">${escapeHtml(err.message)}</p>`;
    }

    $('#app').innerHTML = html;
    $('#app').classList.toggle('wide', page === 'view');
    animateCounts();
    renderSidebar('/' + parts.slice(0, 3).join('/'));
    setNav(false);
    window.scrollTo(0, 0);

    if (page === 'view') setupPractice(decodeURIComponent(arg1));
    if (page === 'view') viewerCleanup = Viewers.mount(resourceById[decodeURIComponent(arg1)]);

    const randomButton = $('#random-revision');
    if (randomButton) {
      randomButton.addEventListener('click', () => {
        const completed = allResources.filter((r) => state.done.includes(r.id));
        if (!completed.length) return;
        const pick = completed[Math.floor(Math.random() * completed.length)];
        location.hash = '#/view/' + encodeURIComponent(pick.id);
      });
    }
  }

  // ---------- Events ----------

  // Bookmark and done buttons (work on every page).
  document.addEventListener('click', (event) => {
    // Remove one file from "recently opened", or clear the whole list.
    const removeButton = event.target.closest('[data-remove-recent], [data-clear-recent]');
    if (removeButton) {
      event.preventDefault();
      if (removeButton.dataset.clearRecent !== undefined) {
        if (!window.confirm('Clear the whole recently opened list? Your bookmarks and progress are not affected.')) return;
        state.recent = [];
      } else {
        state.recent = state.recent.filter((id) => id !== removeButton.dataset.removeRecent);
      }
      saveState();
      const scrollY = window.scrollY;
      render();
      window.scrollTo(0, scrollY);
      return;
    }

    const button = event.target.closest('[data-bookmark], [data-done]');
    if (!button) return;
    event.preventDefault();

    if (button.dataset.bookmark) {
      toggleInList('bookmarks', button.dataset.bookmark);
    } else {
      toggleInList('done', button.dataset.done);
      if (state.done.includes(button.dataset.done)) burst(button);
    }

    // On the viewer page, just flip the button so the open file isn't reloaded.
    if ($('#viewer')) {
      button.classList.toggle('on');
    } else {
      const scrollY = window.scrollY;
      render();
      window.scrollTo(0, scrollY);
    }
  });

  $('#q').addEventListener('input', (event) => {
    const text = event.target.value.trim();
    location.hash = text ? '#/search/' + encodeURIComponent(text) : '#/';
  });

  // Sidebar drawer on small screens: opens from the menu buttons, closes when you
  // tap outside it, press Esc, or pick a page.
  function setNav(open) {
    $('#nav').classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open); // dims the page behind the drawer
  }

  const toggleNav = () => setNav(!$('#nav').classList.contains('open'));
  $('#menu').addEventListener('click', toggleNav);
  $('#tab-subjects').addEventListener('click', toggleNav);

  document.addEventListener('click', (event) => {
    const isOpen = $('#nav').classList.contains('open');
    if (isOpen && !event.target.closest('#nav, #menu, #tab-subjects')) setNav(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setNav(false);
  });

  // Theme: saved choice first, otherwise follow the system setting.
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }
  applyTheme(state.theme || 'dark'); // Midnight neon is dark first

  // The logo goes to the dashboard. If you are already there, it refreshes the page
  // and scrolls back to the top. It also clears the search box.
  $('.brand').addEventListener('click', () => {
    $('#q').value = '';
    setNav(false);
    if ((location.hash || '#/') === '#/') render();
  });

  $('#theme').addEventListener('click', () => {
    state.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    saveState();
  });

  window.addEventListener('hashchange', render);
  recordToday();
  render();
})();
