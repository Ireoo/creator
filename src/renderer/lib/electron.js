// @flow
import { remote } from 'electron'

export function openFileSelectDialog(options: {
  title?: string,
  defaultPath?: string,
  buttonLabel?: string,
  directory?: boolean,
  multi?: boolean,
  filters?: Array<any>,
  createDirectory?: boolean,
}): Promise<string[]> {
  return new Promise((resolve, reject) => {
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: [
        options.directory ? 'openDirectory' : 'openFile',
        options.multi ? 'multiSelections' : '',
        options.createDirectory ? 'createDirectory' : '', // macOS
      ],
      filters: options.filters || [],
      buttonLabel: options.buttonLabel,
      defaultPath: options.defaultPath,
    }, (paths) => {
      if (!paths) return reject(paths)
      resolve(options.multi ? paths : paths[0])
    })
  })
}
