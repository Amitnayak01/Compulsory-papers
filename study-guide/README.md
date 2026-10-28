# OAVS TGT Computer Study Guide

Static site, no build step, no server needed.

## Setup
1. Copy this `study-guide` folder INSIDE `COMPUTER STUDY GUIDE` (next to `BASIC_JAVA`, `C_Programming`, ...).
2. Open `study-guide/index.html` in Chrome or Edge. Make sure OneDrive files are downloaded locally (green check).
   If the browser blocks PDFs or quizzes from file://, run `python -m http.server` inside `COMPUTER STUDY GUIDE` and open `http://localhost:8000/study-guide/`.

## Add new material (the only file you edit: `data/registry.js`)
- New topic/files: add a `{name, folder, files:[[exact filename, kind]]}` entry under its subject.
- New subject: add `{id, name, folder, topics:[...]}`. Subjects with empty `topics` display as Pending.
- Navigation, search, progress and bookmarks update automatically.
- Interactive MCQs (optional): add real questions from your materials to `data/questions.js` (format shown inside).

## Features
Dashboard, subject/topic navigation, PDF and HTML quiz viewer with download, global search, bookmarks,
done-tracking, recently opened, revision list, light/dark mode, responsive layout.
Progress is saved in your browser (localStorage) by file path, so renaming a file resets its bookmark and progress.

## Run as a desktop window (no browser tabs)
- Easiest: double-click `Start Study Guide.bat` (uses Edge in app mode; nothing to install).
- Real desktop app: install Node.js, then in the `desktop` folder run `npm install` once and `npm start`.

## Project layout
- `index.html` loads everything.
- `data/registry.js` lists your subjects, topics and files (the only file you edit to add material).
- `assets/app.js` pages, search, bookmarks, progress.
- `assets/viewers/` one file per kind of viewer:
  - `viewer-common.js` shared toolbar, full screen, settings (`allowDownload`)
  - `quiz-viewer.js` HTML quizzes
  - `pdf-viewer.js` PDF documents (page numbers, jump, zoom, fit to screen)
- `assets/vendor/` PDF.js library used by the document viewer.

## Documents that belong to no subject (for example the syllabus)
Put the file directly inside `COMPUTER STUDY GUIDE` (next to the subject folders) and list it under
`documents` in `data/registry.js`. It gets a card on the dashboard and a link in the sidebar, and it works
in search, bookmarks and recently opened. It is not counted in the study progress numbers.
