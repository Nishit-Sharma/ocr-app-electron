const { app, BrowserWindow } = require('electron');
const path = require('path');
const httpServer = require('http-server');

let server;
const PORT = 3000;

function createWindow () {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webSecurity: true,
      sandbox: false
    }
  });

  // Load from local HTTP server
  win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(() => {
  // Start static server serving the 'out' directory
  server = httpServer.createServer({ root: path.join(__dirname, 'out') });
  server.listen(PORT, () => {
    createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  if (server) server.close();
}); 