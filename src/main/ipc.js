import { ipcMain as ipc, app, BrowserWindow } from 'electron'
import * as CONST from 'type/constants'
import fs from 'fs-extra'
import { readyFileSync, writeFileSync } from 'fs'
import path from 'path'
import { createShoutcutFile } from 'lib/utils'
import { version } from '../../package.json'
import { download } from 'electron-dl'
import os from 'os'
const appVersion = process.env.NODE_ENV === 'production' ? app.getVersion() : version

async function ensureInstructionFolder(p) {
  // Because asar will pack all directory with file mode 0100644
  // If use fs.copy to copy folder, it would copy mode to dst folder without 'x' permission
  // So I have to copy file one by one manually.
  await fs.ensureDir(p)
  await fs.ensureDir(path.join(p, 'img'))
  await fs.ensureDir(path.join(p, 'css'))
  await fs.ensureDir(path.join(p, 'music'))
  // 复制Action图片
  if (await fs.pathExists(path.join(p, 'sysimg')) === false) {
    for (const type of ['close-hand', 'hand', 'head', 'hit', 'lasso-hand', 'open-hand', 'two-hands', 'body-move', 'hand-touch', 'one-hand', 'other']) {
      await fs.ensureDir(path.join(p, 'sysimg', type))
      await fs.copy(path.join(__static, 'template', 'instruction/images/actions', type), path.join(p, 'sysimg', type), {
        overwrite: false,
      })
    }
  }
  // 复制Goody图片
  await fs.ensureDir(path.join(p, 'goodies'))
  await fs.copy(path.join(__static, 'template', 'instruction/images/goodies'), path.join(p, 'goodies'), {
    overwrite: false,
  })
}

export default function InitIPC() {
  ipc.on(CONST.IPC_PROJECT_SAVE, (event, projectPath, project, fromProjectPath) => {
    console.log('on save')

    // add stage indexId
    project.stages.forEach((stage, index) => (stage.indexId = index + 1))
    // add app version to project file
    project.appVersion = appVersion

    fs.ensureDir(projectPath)
      .then(() => fs.writeJson(path.join(projectPath, 'project.json'), project))
      .then(() => {
        if (fromProjectPath && fs.pathExistsSync(path.join(fromProjectPath, 'images'))) {
          return fs.copy(path.join(fromProjectPath, 'images'), path.join(projectPath, 'images'))
        } else {
          return fs.ensureDir(path.join(projectPath, 'images'))
        }
      })
      .then(() => {
        if (fromProjectPath && fs.pathExistsSync(path.join(fromProjectPath, 'instruction'))) {
          return fs.copy(path.join(fromProjectPath, 'instruction'), path.join(projectPath, 'instruction'))
        } else {
          return ensureInstructionFolder(path.join(projectPath, 'instruction'))
        }
      }).then(() => {
        // create quick start file
        return createShoutcutFile(projectPath)
      })
      .then(() => {
        event.sender.send(CONST.IPC_PROJECT_SAVED, true, '')
      }).catch(err => {
        event.sender.send(CONST.IPC_PROJECT_SAVED, !err, (err && err.message) || '')
      })
  })

  ipc.on(CONST.IPC_PROJECT_EXPORT, (event, projectPath, project) => {

  })

  ipc.on(CONST.IPC_APP_ONLOAD, function() {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow.show()
  })

  // get the project folder and send to the render process
  ipc.on(CONST.IPC_APP_OPEN_EXTENSION, function(event) {
    const openFilePath = process.argv[1]
    if (process.platform === 'win32' && openFilePath && ~openFilePath.indexOf('.ic')) {
      event.returnValue = path.dirname(openFilePath)
    } else {
      event.returnValue = null
    }
  })

  ipc.on(CONST.IPC_GET_APP_VERSION, function(event) {
    event.returnValue = appVersion
  })

  ipc.on(CONST.IPC_DOWNLOAD, function(event, options) {
    download(BrowserWindow.getAllWindows()[0], options.url, {
      ...options,
      onStarted() {
        event.sender.send(CONST.IPC_START_DOWNLOAD)
      },
      onProgress(percent) {
        event.sender.send(CONST.IPC_DOWNLOAD_PROGRESS, percent)
      },
    }).then(dl => {
      const p = dl.getSavePath()
      event.sender.send(CONST.IPC_DOWNLOADED, p)
    })
  })
}
