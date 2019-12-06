'use strict'

import { app, BrowserWindow, Menu } from 'electron'
import initIPC from './ipc'

import menu from './menu'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 768,
    useContentSize: true,
    title: 'Integem iCreator',
    width: 1366,
    webPreferences: {
      // --allow-file-access-from-files
      webSecurity: false,
      experimentalFeatures: true,
    },
    show: false, // show window when app.vue is created
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.setMenu(null)
  mainWindow.loadURL(winURL)

  mainWindow.on('closed', (e) => {
    mainWindow = null
  })
}

app.on('ready', () => {
  if (process.platform === 'darwin') Menu.setApplicationMenu(menu)
  createWindow()
  initIPC()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
console.log('chrome version:', process.versions.chrome, 'electron version:', process.versions.electron)
