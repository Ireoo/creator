import fs from 'fs-extra'
import path from 'path'
import { remote } from 'electron'
import { findFiles } from 'lib/project'

async function ensureStaticFolder() {
  // if the enviroment is in production,the root is electron directory.
  const root = remote.app.getPath('userData')
  fs.removeSync(path.join(root, 'static'))
  const imagePath = path.join(root, 'static', 'images')
  const peoplePath = path.join(imagePath, 'people')
  const ffmpegPath = path.join(root, 'static', 'ffmpeg')
  const projectsPath = path.join(root, 'static', 'projects')
  fs.ensureDirSync(peoplePath)
  fs.ensureDirSync(ffmpegPath)
  fs.ensureDirSync(projectsPath)
  fs.copySync(path.join(__static, 'template', 'home', 'images', 'obj'), peoplePath)
  fs.copySync(path.join(__static, 'ffmpeg'), ffmpegPath)
  // 自带的项目模板
  fs.copySync(path.join(__static, 'projects'), projectsPath)
}

try {
  ensureStaticFolder()
} catch (err) {
  console.error(err)
}
