import { ipcRenderer } from 'electron'
import { IPC_GET_APP_VERSION } from 'type/constants'
const appVersion = ipcRenderer.sendSync(IPC_GET_APP_VERSION)

export default {
  appVersion,
}
