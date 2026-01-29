const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
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
 * 
 * KEY CHANGES:
 * 1. Both front and back images sent to Python in ONE call
 * 2. Python handles duplex/back-to-back in single print job
 * 3. Longer cleanup timeout (20s) for printer spooling
 * 4. Better error handling with print status feedback
 */
ipcMain.on('print-card-images', async (event, options) => {
  const { frontImage, backImage } = options;

  let frontPath, backPath;
  const tempFiles = [];

  try {
    frontPath = writeBase64ToTempFile(frontImage, 'front');
    backPath = writeBase64ToTempFile(backImage, 'back');
    
    tempFiles.push(frontPath, backPath);

    const pythonExecutable = 'python'; // or absolute path if bundled
    const scriptPath = path.join(__dirname, 'print_card.py');

    // IMPORTANT: Pass BOTH images in a SINGLE call
    // Python will handle combining them into one duplex job
    execFile(pythonExecutable, [scriptPath, frontPath, backPath], (err, stdout, stderr) => {
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
      console.log('Stdout:', stdout);
      
      event.reply('print-reply', { success: true });

      // Clean up temp files after a longer delay
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
      }, 20000); // Increased from 5s to 20s
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
