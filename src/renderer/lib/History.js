// @flow
import { cloneDeep } from 'lodash'
import { Debounce } from 'lib/helper.js'

class History {
  record: Array<*>
  index: number
  constructor() {
    this.init()
  }
  init() {
    this.record = []
    this.index = -1
  }
  get current() {
    return cloneDeep(~this.index ? this.record[this.index] : null)
  }
  @Debounce(500)
  push(item: any) {
    this.record.push(cloneDeep(item))
    this.index++
    return this
  }
  undo() {
    if (this.index > -1) { this.index-- }
    return this
  }
  redo() {
    if (this.index < this.record.length) { this.index++ }
    return this
  }
}

export default History
