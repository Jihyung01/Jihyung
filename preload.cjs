const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action, data) => {
      callback(action, data)
    })
  },

  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action')
  },

  // File operations
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Notifications
  showNotification: (title, body) => {
    new Notification(title, { body })
  },

  // System info
  isElectron: true,

  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window')
})

// Expose a limited API for the renderer
contextBridge.exposeInMainWorld('sparkAPI', {
  // Environment info
  isDev: process.env.NODE_ENV === 'development',
  platform: process.platform,

  // Electron-specific features
  isElectron: true,

  // App metadata
  appName: 'Spark AI',
  appVersion: '1.0.0'
})