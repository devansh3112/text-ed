import { BrowserWindow as ElectronBrowserWindow, IpcMainInvokeEvent } from 'electron'
import { app, BrowserWindow, screen, shell, ipcMain, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import net from 'net'
import fsSync from 'fs'
import { IntegratedServer } from './server'

// Constants
const isDev = process.env.NODE_ENV === 'development'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

// Application State
let mainWindow: BrowserWindow | null = null
let server: IntegratedServer | null = null
const state = {
  isWindowVisible: false,
  windowPosition: null as { x: number; y: number } | null,
  windowSize: null as { width: number; height: number } | null,
  screenWidth: 0,
  screenHeight: 0,
  step: 60, // Add step for window movement
  currentX: 0,
  currentY: 50,
}

// Force Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Window management functions
async function findAvailablePort(startPort: number): Promise<number> {
  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.once('listening', () => {
        server.close()
        resolve(true)
      })
      server.listen(port)
    })
  }

  let port = startPort
  while (!(await isPortAvailable(port))) {
    port++
  }
  return port
}

async function waitForDevServer(url: string, maxAttempts = 20): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const response = await fetch(url)
        if (response.ok) {
          clearInterval(interval)
          resolve(true)
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval)
          resolve(false)
        }
      }
    }, 500)
  })
}

async function createWindow(): Promise<void> {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const workArea = primaryDisplay.workAreaSize
  state.screenWidth = workArea.width
  state.screenHeight = workArea.height

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 300,
    x: 0,
    y: 50,
    alwaysOnTop: true,
    movable: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#23272a', // visible dark background
    fullscreenable: false,
    hasShadow: false,
    opacity: 1.0,
    focusable: true,
    skipTaskbar: true,
    type: 'panel',
    paintWhenInitiallyHidden: true,
    titleBarStyle: 'hidden',
    enableLargerThanScreen: true,
  })

  if (!mainWindow) {
    console.error('Failed to create main window')
    app.quit()
    return
  }

  // Enhanced screen capture resistance
  mainWindow.setContentProtection(true)
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  })
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)

  // Additional screen capture resistance settings
  if (process.platform === 'darwin') {
    mainWindow.setHiddenInMissionControl(true)
    mainWindow.setWindowButtonVisibility(false)
    mainWindow.setBackgroundColor('#00000000')
    mainWindow.setSkipTaskbar(true)
    mainWindow.setHasShadow(false)
  }

  // Prevent the window from being captured by screen recording
  mainWindow.webContents.setBackgroundThrottling(false)
  mainWindow.webContents.setFrameRate(60)

  // Load the app
  if (isDev) {
    const port = await findAvailablePort(5173)
    const devServerUrl = `http://localhost:${port}`
    const isDevServerReady = await waitForDevServer(devServerUrl)
    if (!isDevServerReady) {
      console.error('Dev server not ready')
      app.quit()
      return
    }
    await mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Attempting to load index.html from:', indexPath)
    if (!fsSync.existsSync(indexPath)) {
      console.error('index.html not found at', indexPath)
      const { dialog } = require('electron')
      dialog.showErrorBox('Missing index.html', `Could not find index.html at: ${indexPath}`)
      app.quit()
      return
    }
    await mainWindow.loadFile(indexPath)
  }

  // Initialize window state
  const bounds = mainWindow.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.windowSize = { width: bounds.width, height: bounds.height }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Register keyboard shortcuts
  globalShortcut.register('CommandOrControl+B', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
    }
  })

  // Arrow key movement
  globalShortcut.register('CommandOrControl+Left', () => {
    if (!mainWindow) return
    const bounds = mainWindow.getBounds()
    mainWindow.setPosition(bounds.x - state.step, bounds.y)
  })

  globalShortcut.register('CommandOrControl+Right', () => {
    if (!mainWindow) return
    const bounds = mainWindow.getBounds()
    mainWindow.setPosition(bounds.x + state.step, bounds.y)
  })

  globalShortcut.register('CommandOrControl+Up', () => {
    if (!mainWindow) return
    const bounds = mainWindow.getBounds()
    mainWindow.setPosition(bounds.x, bounds.y - state.step)
  })

  globalShortcut.register('CommandOrControl+Down', () => {
    if (!mainWindow) return
    const bounds = mainWindow.getBounds()
    mainWindow.setPosition(bounds.x, bounds.y + state.step)
  })

  // Quit application
  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit()
  })

  // Window controls
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('close-window', () => {
    mainWindow?.close()
  })

  // Make window draggable from any empty space
  mainWindow.setMovable(true)
}

// Handle file operations
const defaultFilePath = path.join(app.getPath('userData'), 'content.txt')

ipcMain.handle('load-file', async () => {
  try {
    const content = await fs.readFile(defaultFilePath, 'utf-8')
    return content
  } catch (error) {
    return ''
  }
})

ipcMain.handle('save-file', async (_event: IpcMainInvokeEvent, content: string) => {
  try {
    await fs.writeFile(defaultFilePath, content, 'utf-8')
    return true
  } catch (error) {
    console.error('Error saving file:', error)
    return false
  }
})

// Handle room operations
ipcMain.handle('join-room', async (_event: IpcMainInvokeEvent, roomId: string) => {
  // TODO: Implement room joining logic
  return true
})

ipcMain.handle('leave-room', async () => {
  // TODO: Implement room leaving logic
  return true
})

// Window visibility handlers
ipcMain.handle('toggle-window', async () => {
  try {
    toggleMainWindow()
    return { success: true }
  } catch (error: unknown) {
    console.error('Error toggling window:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('hide-window', async () => {
  try {
    hideMainWindow()
    return { success: true }
  } catch (error: unknown) {
    console.error('Error hiding window:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('show-window', async () => {
  try {
    showMainWindow()
    return { success: true }
  } catch (error: unknown) {
    console.error('Error showing window:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// Window visibility functions
function hideMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  
  const bounds = mainWindow!.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.windowSize = { width: bounds.width, height: bounds.height }
  mainWindow!.setIgnoreMouseEvents(true, { forward: true })
  state.isWindowVisible = false
  console.log('Window hidden')
}

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  
  if (state.windowPosition && state.windowSize) {
    mainWindow!.setBounds({
      ...state.windowPosition,
      ...state.windowSize
    })
  }
  mainWindow!.setIgnoreMouseEvents(false)
  mainWindow!.setAlwaysOnTop(true, 'screen-saver', 1)
  mainWindow!.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  })
  mainWindow!.setContentProtection(true)
  mainWindow!.showInactive()
  state.isWindowVisible = true
  console.log('Window shown with showInactive()')
}

function toggleMainWindow(): void {
  console.log(`Toggling window. Current state: ${state.isWindowVisible ? 'visible' : 'hidden'}`)
  if (state.isWindowVisible) {
    hideMainWindow()
  } else {
    showMainWindow()
  }
}

// Window movement functions
function moveWindowHorizontal(updateFn: (x: number) => number): void {
  if (!mainWindow) return

  const newX = updateFn(state.currentX)
  const maxLeftLimit = (-(state.windowSize?.width || 0) * 2) / 3
  const maxRightLimit = state.screenWidth + ((state.windowSize?.width || 0) * 2) / 3

  if (newX >= maxLeftLimit && newX <= maxRightLimit) {
    state.currentX = newX
    mainWindow.setPosition(
      Math.round(state.currentX),
      Math.round(state.currentY)
    )
  }
}

function moveWindowVertical(updateFn: (y: number) => number): void {
  if (!mainWindow) return

  const newY = updateFn(state.currentY)
  const maxUpLimit = (-(state.windowSize?.height || 0) * 2) / 3
  const maxDownLimit = state.screenHeight + ((state.windowSize?.height || 0) * 2) / 3

  if (newY >= maxUpLimit && newY <= maxDownLimit) {
    state.currentY = newY
    mainWindow.setPosition(
      Math.round(state.currentX),
      Math.round(state.currentY)
    )
  }
}

// Initialize application
async function initializeApp() {
  try {
    // Start the integrated server
    const port = await findAvailablePort(3000)
    server = new IntegratedServer(port)
    await server.start()
    
    // Set the server port in the environment for the renderer process
    process.env.VITE_SERVER_PORT = port.toString()
    
    await createWindow()
  } catch (error) {
    console.error('Failed to initialize app:', error)
    app.quit()
  }
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.stop()
    }
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeApp()
  }
})

app.whenReady().then(initializeApp)

// Clean up on quit
app.on('before-quit', () => {
  if (server) {
    server.stop()
  }
  globalShortcut.unregisterAll()
}) 