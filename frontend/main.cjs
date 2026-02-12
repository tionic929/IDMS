const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'icon.ico'), // Use your new vector here
    width: 1280,
    height: 800,
    titleBarOverlay: {
      symbolColor: '#ffffff', // Color of the Min/Max/Exit icons
      height: 40
    },
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
 * IPC: Print via Python service with margin support
 * 
 * Receives:
 *   - frontImage: base64 PNG
 *   - backImage: base64 PNG
 *   - width: image width (px)
 *   - height: image height (px)
 *   - margins: { top, bottom, left, right } in pixels
 */
ipcMain.on('print-card-images', async (event, options) => {
  const { frontImage, backImage, margins } = options;

  let frontPath, backPath;
  const tempFiles = [];

  try {
    frontPath = writeBase64ToTempFile(frontImage, 'front');
    backPath = writeBase64ToTempFile(backImage, 'back');
    
    tempFiles.push(frontPath, backPath);

    const pythonExecutable = 'python'; // or absolute path if bundled
    const scriptPath = path.join(__dirname, 'print_card.py');

    // ============================================================
    // Prepare arguments for Python script
    // ============================================================
    const args = [scriptPath, frontPath, backPath];
    
    // If margins are provided, add as JSON string
    if (margins && (margins.top || margins.bottom || margins.left || margins.right)) {
      args.push(JSON.stringify(margins));
      console.log('[print-card-images] Margins:', margins);
    }

    console.log('[print-card-images] Calling Python with:', args.length, 'arguments');

    // Execute print job
    execFile(pythonExecutable, args, (err, stdout, stderr) => {
      if (err) {
        console.error('Print Error:', err.message);
        console.error('Stderr:', stderr);
        event.reply('print-reply', { 
          success: false, 
          failureReason: err.message,
          stderr: stderr 
        });
        return;
      }

      console.log('Print job submitted successfully');
      if (stdout) console.log('Stdout:', stdout);
      
      event.reply('print-reply', { success: true });

      // Clean up temp files after a delay
      // This gives Windows printer driver time to spool
      setTimeout(() => {
        tempFiles.forEach(filePath => {
          if (filePath && fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log(`Deleted temp file: ${filePath}`);
            } catch (cleanupErr) {
              console.warn(`Failed to delete ${filePath}:`, cleanupErr.message);
            }
          }
        });
      }, 20000); // 20 seconds
    });

  } catch (error) {
    console.error('IPC Error:', error);
    event.reply('print-reply', { 
      success: false, 
      failureReason: error.message 
    });

    // Cleanup on error
    tempFiles.forEach(filePath => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn(`Failed to cleanup ${filePath}`);
        }
      }
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
