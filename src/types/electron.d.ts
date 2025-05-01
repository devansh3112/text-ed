export interface ElectronAPI {
  loadFile: () => Promise<string>
  saveFile: (content: string) => Promise<boolean>
  onFileChange: (callback: (content: string) => void) => () => void
  joinRoom: (roomId: string) => Promise<boolean>
  leaveRoom: () => Promise<boolean>
  onUserJoined: (callback: (user: any) => void) => () => void
  onUserLeft: (callback: (userId: string) => void) => () => void
  onMessage: (callback: (message: any) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
} 