// @flow
import { intersperse, flatten, path } from 'ramda'

type Menu = {
  label?: string,
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio',
  click?: Function,
  enabled?: boolean,
}
type BuildOption = {
  formatter?: Function
}

const sep: Menu = {
  type: 'separator',
}
const joinSep = intersperse(sep)
const noop = () => { }

export class MenuGroup extends Array<Menu | MenuGroup> {
  build(options: ?BuildOption): Menu[] {
    const formatter = path(['formatter'], options)
    const result = []
    for (const menu of this) {
      if (menu instanceof MenuGroup) {
        result.push(menu.build())
      } else {
        result.push([menu])
      }
    }
    const menu = flatten(joinSep(result)).filter(item => item.show !== false)
    if (formatter) {
      const format = menu => menu.filter(m => !!m.label).forEach(m => {
        formatter(m)
        m.submenu && format(m.submenu)
      })
      format(menu)
    }
    return menu
  }

  top() {
    return 1
  }
}

export class RootMenuGroup extends MenuGroup {
  static init(e: Event): RootMenuGroup {
    const me = ((e: any): MenuEvent)
    me.menu = new RootMenuGroup()
    return me.menu
  }

  copyPasteGroup: CopyPasteGroup = new CopyPasteGroup({})
  deleteGroup: DeleteGroup = new DeleteGroup({})

  constructor() {
    super()
    this.push(this.copyPasteGroup)
    this.push(this.deleteGroup)
  }
}

export class CopyPasteGroup extends MenuGroup {
  onCut: ?Function
  onCopy: ?Function
  onPaste: ?Function

  constructor({ onCopy, onPaste }: {
    onCopy?: Function,
    onPaste?: Function,
  }) {
    super()
    this.onCopy = onCopy
    this.onPaste = onPaste
  }

  build() {
    return [{
      label: 'Cut',
      enabled: !!this.onCut,
      click: this.onCut || noop,
    }, {
      label: 'Copy',
      enabled: !!this.onCopy,
      click: this.onCopy || noop,
    }, {
      label: 'Paste',
      enabled: !!this.onPaste,
      click: this.onPaste || noop,
    }, {
      label: 'Duplicate stage below',
      show: !!this.duplicateStage,
      enabled: !!this.duplicateStage,
      click: this.duplicateStage || noop,
    }]
  }
}

export class DeleteGroup extends MenuGroup {
  onDelete: ?Function
  onClearTransition: ?Function
  constructor({ onDelete, onClearTransition }: {
    onDelete?: Function,
    onClearTransition?: Function
  }) {
    super()
    this.onDelete = onDelete
    this.onClearTransition = onClearTransition
  }

  build() {
    return [{
      label: 'Delete',
      enabled: !!this.onDelete,
      click: this.onDelete || noop,
    }, {
      label: 'Clear transition',
      enabled: !!this.onClearTransition,
      click: this.onClearTransition || noop,
    }]
  }
}

export class FileHandleGroup extends MenuGroup {
  onRename: ?Function

  constructor({ onRename }: {
    onRename: ?Function,
  }) {
    super()
    this.onRename = onRename
  }

  build() {
    return [{
      label: 'Rename',
      enabled: !!this.onRename,
      click: this.onRename || noop,
    }]
  }
}

// 分组menu专用，传入type和menu列表
export class StageGroup extends MenuGroup {
  menu: Array<any>
  type: string
  constructor(type: string, menu: Array<any>) {
    super()
    this.type = type
    this.menu = menu
  }
  build() {
    return this.menu
  }
}

type MenuEvent = Event & {
  menu: RootMenuGroup,
}
