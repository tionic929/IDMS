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
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { 
            margin: 0; 
            size: 54mm 86mm; /* Exact CR80 */
          }
          html, body { 
            margin: 0; 
            padding: 0; 
            width: 54mm; 
            height: 86mm;
            overflow: hidden;
            background-color: white;
          }
          .page { 
            position: relative;
            width: 54mm; 
            height: 86mm; 
            page-break-after: always; 
          }
          img { 
            position: absolute;
            top: 0;
            left: 0;
            width: 54mm; 
            height: 86mm; 
            display: block;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div class="page"><img src="${frontImage}" /></div>
        <div class="page"><img src="${backImage}" /></div>
      </body>
      </html>`;

    fs.writeFileSync(htmlPath, htmlContent);

    // Default width 200 and height 180 as requested
    const printWindow = new BrowserWindow({ 
      show: false, 
      width: 200, 
      height: 180, 
      webPreferences: { nodeIntegration: false } 
    });

    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({
        silent: true, // Margin issue usually happens here
        deviceName: deviceName || '',
        printBackground: true,
        margins: { marginType: 'none' },
        pageSize: { width: 54000, height: 86000 },
        scaleFactor: 100,
        preferCSSPageSize: true // This tells Electron to respect the @page CSS above
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