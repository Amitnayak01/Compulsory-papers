// Opens ../index.html in a standalone desktop window.
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Lets the document viewer read your local PDF files from the app page.
app.commandLine.appendSwitch('allow-file-access-from-files');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'OAVS TGT Computer Study Guide',
    autoHideMenuBar: true,
    webPreferences: {
      plugins: true, // enables the built-in PDF viewer inside the page
    },
  });

  // "Open in new tab" opens the file in its own window.
  win.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      autoHideMenuBar: true,
      webPreferences: { plugins: true },
    },
  }));

  // Block all downloads (change this if you want to allow them later).
  win.webContents.session.on('will-download', (event) => event.preventDefault());

  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
