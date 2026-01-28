const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

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

/**
 * Convert base64 dataURL → temp PNG file
 */
function writeBase64ToTempFile(dataUrl, suffix) {
  const matches = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!matches) throw new Error('Invalid PNG base64 data');

  const buffer = Buffer.from(matches[1], 'base64');
  const filePath = path.join(os.tmpdir(), `card_${suffix}_${Date.now()}.png`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * IPC: Print via Python service (CX-D80 safe path)
 */
ipcMain.on('print-card-images', async (event, options) => {
  const { frontImage, backImage } = options;

  let frontPath, backPath;

  try {
    frontPath = writeBase64ToTempFile(frontImage, 'front');
    backPath = writeBase64ToTempFile(backImage, 'back');

    const pythonExecutable = 'python'; // or absolute path if bundled
    const scriptPath = path.join(__dirname, 'print_card.py');

    // FRONT
    execFile(pythonExecutable, [scriptPath, frontPath], (err) => {
      if (err) {
        event.reply('print-reply', { success: false, failureReason: err.message });
        return;
      }

      // BACK (printed immediately after)
      execFile(pythonExecutable, [scriptPath, backPath], (err2) => {
        if (err2) {
          event.reply('print-reply', { success: false, failureReason: err2.message });
          return;
        }

        event.reply('print-reply', { success: true });
      });
    });

  } catch (error) {
    event.reply('print-reply', { success: false, failureReason: error.message });
  } finally {
    setTimeout(() => {
      if (frontPath && fs.existsSync(frontPath)) fs.unlinkSync(frontPath);
      if (backPath && fs.existsSync(backPath)) fs.unlinkSync(backPath);
    }, 5000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
