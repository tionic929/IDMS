const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http'); // Using native http to avoid extra dependencies

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'icon.ico'),
    width: 1280,
    height: 800,
    titleBarOverlay: {
      symbolColor: '#ffffff',
      height: 40
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    autoHideMenuBar: true,
  });

  const url = 'http://localhost:5173';

  mainWindow.loadURL(url);

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Origin'] = url;
    callback({ requestHeaders: details.requestHeaders });
  });
}

app.whenReady().then(createWindow);

/**
 * IPC: Print via Python API Service
 */
ipcMain.on('print-card-images', async (event, options) => {
  const { frontImage, backImage, margins } = options;

  console.log('[main.cjs] Forwarding print request to Python API...');

  const postData = JSON.stringify({
    frontImage,
    backImage,
    margins: margins || { top: 0, bottom: 0, left: 0, right: 0 }
  });

  const requestOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/print_card',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(requestOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.success) {
          console.log('[main.cjs] Print API Success');
          event.reply('print-reply', { success: true });
        } else {
          console.error('[main.cjs] Print API Error:', response.error);
          event.reply('print-reply', { success: false, failureReason: response.error });
        }
      } catch (e) {
        event.reply('print-reply', { success: false, failureReason: 'Invalid API response' });
      }
    });
  });

  req.on('error', (error) => {
    console.error('[main.cjs] Connection to Python Service failed:', error.message);
    event.reply('print-reply', {
      success: false,
      failureReason: 'Python Service not running (Connection Refused)'
    });
  });

  req.write(postData);
  req.end();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});