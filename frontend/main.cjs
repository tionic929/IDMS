const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true, // Keep this true
      allowRunningInsecureContent: false
    },
  });

  const { session } = require('electron');
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Origin'] = 'http://localhost:5173';
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.loadURL('http://localhost:5173'); 
}

app.whenReady().then(createWindow);

// Listen for the silent print command from your React UI
ipcMain.on('print-to-printer', (event, options) => {
  const win = BrowserWindow.getFocusedWindow();
  
  const printOptions = {
    silent: true,                // Bypasses the print dialog
    deviceName: 'CX-D80 U1',    // Must match your Windows printer name exactly
    printBackground: true,
    margins: { marginType: 'none' },
    pageSize: { width: 54000, height: 86000 } // CR80 dimensions in microns
  };

  win.webContents.print(printOptions, (success, failureReason) => {
    event.reply('print-reply', { success, failureReason });
  });
});