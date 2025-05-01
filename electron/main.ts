import { BrowserWindow as ElectronBrowserWindow, IpcMainInvokeEvent } from 'electron'
import { app, BrowserWindow, screen, shell, ipcMain, globalShortcut } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'
import net from 'net'
import fsSync from 'fs'

// Constants
const isDev = process.env.NODE_ENV === 'development'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Application State
let mainWindow: ElectronBrowserWindow | null = null
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
    minWidth: 750,
    minHeight: 550,
    x: 0,
    y: 50,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, isDev ? '../electron/preload.js' : 'preload.js')
    },
    show: false,
    frame: false,
    transparent: true,
    fullscreenable: false,
    hasShadow: false,
    opacity: 1.0,
    backgroundColor: '#00000000',
    focusable: true,
    skipTaskbar: true,
    type: 'panel',
    paintWhenInitiallyHidden: true,
    titleBarStyle: 'hidden',
    enableLargerThanScreen: true,
    movable: true,
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
  mainWindow!.setOpacity(0)
  state.isWindowVisible = false
  console.log('Window hidden, opacity set to 0')
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
  mainWindow!.setOpacity(0) // Set opacity to 0 before showing
  mainWindow!.showInactive() // Use showInactive instead of show+focus
  mainWindow!.setOpacity(1) // Then set opacity to 1 after showing
  state.isWindowVisible = true
  console.log('Window shown with showInactive(), opacity set to 1')
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

// Add keyboard shortcuts
function registerGlobalShortcuts(): void {
  // Toggle window visibility
  globalShortcut.register('CommandOrControl+B', () => {
    toggleMainWindow()
  })

  // Window movement
  globalShortcut.register('CommandOrControl+Left', () => {
    moveWindowHorizontal((x) => Math.max(-(state.windowSize?.width || 0) / 2, x - state.step))
  })

  globalShortcut.register('CommandOrControl+Right', () => {
    moveWindowHorizontal((x) => Math.min(state.screenWidth - (state.windowSize?.width || 0) / 2, x + state.step))
  })

  globalShortcut.register('CommandOrControl+Up', () => {
    moveWindowVertical((y) => y - state.step)
  })

  globalShortcut.register('CommandOrControl+Down', () => {
    moveWindowVertical((y) => y + state.step)
  })

  // Opacity control
  globalShortcut.register('CommandOrControl+[', () => {
    if (mainWindow && state.isWindowVisible) {
      const currentOpacity = mainWindow.getOpacity()
      mainWindow.setOpacity(Math.max(0.1, currentOpacity - 0.1))
    }
  })

  globalShortcut.register('CommandOrControl+]', () => {
    if (mainWindow && state.isWindowVisible) {
      const currentOpacity = mainWindow.getOpacity()
      mainWindow.setOpacity(Math.min(1.0, currentOpacity + 0.1))
    }
  })
}

// Initialize application
async function initializeApp() {
  try {
    await createWindow()
    registerGlobalShortcuts() // Register shortcuts after window creation
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
}

// App lifecycle handlers
app.whenReady().then(initializeApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
}) 