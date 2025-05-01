const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    loadFile: () => ipcRenderer.invoke('load-file'),
    saveFile: (content: string) => ipcRenderer.invoke('save-file', content),
    onFileChange: (callback: (content: string) => void) => {
      ipcRenderer.on('file-changed', (_event: Electron.IpcRendererEvent, content: string) => callback(content))
      return () => {
        ipcRenderer.removeAllListeners('file-changed')
      }
    },
    joinRoom: (roomId: string) => ipcRenderer.invoke('join-room', roomId),
    leaveRoom: () => ipcRenderer.invoke('leave-room'),
    onUserJoined: (callback: (user: any) => void) => {
      ipcRenderer.on('user-joined', (_event: Electron.IpcRendererEvent, user: any) => callback(user))
      return () => {
        ipcRenderer.removeAllListeners('user-joined')
      }
    },
    onUserLeft: (callback: (userId: string) => void) => {
      ipcRenderer.on('user-left', (_event: Electron.IpcRendererEvent, userId: string) => callback(userId))
      return () => {
        ipcRenderer.removeAllListeners('user-left')
      }
    },
    onMessage: (callback: (message: any) => void) => {
      ipcRenderer.on('message', (_event: Electron.IpcRendererEvent, message: any) => callback(message))
      return () => {
        ipcRenderer.removeAllListeners('message')
      }
    },
    // Window visibility functions
    toggleWindow: () => ipcRenderer.invoke('toggle-window'),
    hideWindow: () => ipcRenderer.invoke('hide-window'),
    showWindow: () => ipcRenderer.invoke('show-window')
  }
) 