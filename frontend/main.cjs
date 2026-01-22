const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
    },
    autoHideMenuBar: true,
  });

  const { session } = require('electron');
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Origin'] = 'http://localhost:5173';
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);

ipcMain.on('print-card-images', async (event, options) => {
  const { frontImage, backImage, deviceName } = options;

  try {
    const tempDir = os.tmpdir();
    const htmlPath = path.join(tempDir, `print_portrait_${Date.now()}.html`);
    
    // Sized for Portrait Card: 54mm width, 86mm height (CR80)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { 
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 0; 
            width: 100vw; 
            height: 100vh;
          }
          .page { 
            width: 100vw; 
            height: 100vh; 
            page-break-after: always; 
            display: flex;
            align-items: center;
            justify-content: center;
          }
          img { 
            width: 100%; 
            height: 100%; 
          }
        </style>
      </head>
      <body>
        <div class="page"><img src="${frontImage}" /></div>
        <div class="page"><img src="${backImage}" /></div>
      </body>
      </html>`;

    fs.writeFileSync(htmlPath, htmlContent);

    const printWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } });

    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({
        silent: true,
        deviceName: deviceName || '',
        printBackground: true,
        margins: { marginType: 'none' },
        // CR80 Portrait in microns: 54,000 x 86,000
        pageSize: { width: 54000, height: 86000 } 
      }, (success, failureReason) => {
        printWindow.close();
        if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
        event.reply('print-reply', { success, failureReason });
      });
    });

    printWindow.loadFile(htmlPath);

  } catch (error) {
    event.reply('print-reply', { success: false, failureReason: error.message });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});