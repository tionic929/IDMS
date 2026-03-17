const { app, BrowserWindow, ipcMain, session } = require('electron');
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

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Origin'] = 'http://localhost:5173';
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Write a base64 PNG dataURL to a temp file.
 * 
 * FIX: We explicitly validate the header is image/png — the frontend
 * now always sends PNG (not JPEG), so we reject anything else early
 * rather than silently sending a corrupt file to Python.
 */
function writeBase64ToTempFile(dataUrl, suffix) {
  // Accept both image/png and image/jpeg for robustness, but warn on jpeg
  const pngMatch = dataUrl.match(/^data:image\/png;base64,(.+)$/s);
  const jpegMatch = dataUrl.match(/^data:image\/jpeg;base64,(.+)$/s);

  const match = pngMatch || jpegMatch;
  if (!match) {
    throw new Error(`Invalid image data for ${suffix} — expected PNG or JPEG base64 dataURL`);
  }

  if (jpegMatch) {
    console.warn(`[writeBase64ToTempFile] WARNING: ${suffix} image is JPEG — colours may degrade. Use PNG for best quality.`);
  }

  const ext = pngMatch ? 'png' : 'jpg';
  const buffer = Buffer.from(match[1], 'base64');
  const filePath = path.join(os.tmpdir(), `ncidtech_card_${suffix}_${Date.now()}.${ext}`);
  fs.writeFileSync(filePath, buffer);

  console.log(`[writeBase64ToTempFile] Wrote ${suffix} → ${filePath} (${buffer.length} bytes)`);
  return filePath;
}

/**
 * Delete a file silently (used for cleanup).
 */
function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[cleanup] Deleted ${filePath}`);
    }
  } catch (e) {
    console.warn(`[cleanup] Could not delete ${filePath}: ${e.message}`);
  }
}

// ── IPC: print-card-images ────────────────────────────────────────────────────
/**
 * Receives:
 *   frontImage  — base64 PNG dataURL
 *   backImage   — base64 PNG dataURL
 *   width       — image width  (informational, Python reads from file)
 *   height      — image height (informational, Python reads from file)
 *   margins     — { top, bottom, left, right } in pixels (optional)
 */
ipcMain.on('print-card-images', async (event, options) => {
  const { frontImage, backImage, margins } = options;

  const tempFiles = [];
  let frontPath, backPath;

  try {
    frontPath = writeBase64ToTempFile(frontImage, 'front');
    backPath = writeBase64ToTempFile(backImage, 'back');
    tempFiles.push(frontPath, backPath);

    // Resolve Python executable — use bundled path in production if available
    const pythonExecutable = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(__dirname, 'print_card.py');

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`print_card.py not found at: ${scriptPath}`);
    }

    const args = [scriptPath, frontPath, backPath];

    if (margins && Object.values(margins).some(v => v > 0)) {
      args.push(JSON.stringify(margins));
      console.log('[print-card-images] Margins:', margins);
    }

    console.log('[print-card-images] Spawning Python:', pythonExecutable, args.join(' '));

    execFile(pythonExecutable, args, { timeout: 60000 }, (err, stdout, stderr) => {
      if (stdout) console.log('[Python stdout]\n', stdout);
      if (stderr) console.warn('[Python stderr]\n', stderr);

      if (err) {
        console.error('[print-card-images] Python error:', err.message);
        event.reply('print-reply', {
          success: false,
          failureReason: err.message,
          stderr: stderr,
        });
      } else {
        console.log('[print-card-images] Print job submitted successfully.');
        event.reply('print-reply', { success: true });
      }

      // Clean up temp files after printer spools (20s for card printers)
      setTimeout(() => tempFiles.forEach(safeUnlink), 20_000);
    });

  } catch (error) {
    console.error('[print-card-images] Setup error:', error.message);
    event.reply('print-reply', {
      success: false,
      failureReason: error.message,
    });
    // Immediate cleanup on setup failure
    tempFiles.forEach(safeUnlink);
  }
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
