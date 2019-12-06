// @flow
import { fileType, newImageDOM, newVideoDOM } from './utils'
import { pick, clamp, clone } from 'ramda'
import type {
  StageParameterSingle, UnitBase, StageParameterType,
  StageParameterSingleType, ParameterTransparentChange,
  ParameterColorChange, ParamterChangeControl,
} from 'type/stage'
import { CHG_CTR_FOLLOW_TWO_HANDS_ACTION } from 'type/constants'
import { isRandomPara } from 'lib/project'

export type IDFormat = {
  type: StageParameterType,
  index: number,
  status: 'init' | 'change',
}

const IDReg = /^(bg|fg|cus|obj)(\d+)-(init|change)$/

export default class Layer {
  id: string
  tag: string
  type: 'video' | 'image'
  chgCtr: ParamterChangeControl
  src: string
  parameter: StageParameterSingle<any, any, any>
  paraType: StageParameterSingleType

  left = 0
  top = 0

  // Left为random时，Random的第二个值
  left2 = null

  // Left为random时，Random的第二个值
  top2 = null
  width = 0
  height = 0
  rotate = 0
  skewH = 0
  skewV = 0
  scaleX = 1
  scaleY = 1
  opacity = 1
  cLeft = 0
  cTop = 0
  cWidth = 0
  cHeight = 0
  color: ParameterColorChange = '0'
  transparent: ParameterTransparentChange = '0'
  order = 10

  // video control property
  fps = 24
  playing = false
  currentFrame = 1
  muted = false

  static create(url: string): Promise<Layer> {
    let promise
    if (fileType(url) === 'video') {
      promise = newVideoDOM(url)
    } else {
      promise = newImageDOM(url)
    }
    return promise.then(dom => new Layer(dom))
  }

  static formatID({ type, index, status = 'init' }: IDFormat): string {
    return type + index + '-' + status
  }

  static parseID(id: string): IDFormat {
    const match = id.match(IDReg)
    if (!match) {
      throw new Error('invalid id')
    }
    const type = ((match[1]: any): StageParameterType)
    const index = +match[2]
    const status = ((match[3]: any): 'init' | 'change')
    return {
      type,
      index,
      status,
    }
  }

  constructor(dom: HTMLVideoElement | HTMLImageElement | {
    width: number,
    height: number,
    src: string,
    type: 'video' | 'image',
  }) {
    if (dom instanceof HTMLVideoElement) {
      this.type = 'video'
      this.width = dom.videoWidth
      this.height = dom.videoHeight
      this.cWidth = dom.videoWidth
      this.cHeight = dom.videoHeight
    } else if (dom instanceof HTMLImageElement) {
      this.type = 'image'
      this.width = dom.width
      this.height = dom.height
      this.cWidth = dom.width
      this.cHeight = dom.height
    } else {
      this.type = dom.type
      this.width = this.cWidth = dom.width
      this.height = this.cHeight = dom.height
    }

    this.src = dom.src
    this.left = (1920 - this.width) / 2
    this.top = (1080 - this.height) / 2
  }

  centerX() {
    return this.left + this.cWidth / 2 + this.cLeft - 1920 / 2
  }

  centerY() {
    return this.top + this.cHeight / 2 + this.cTop - 1080 / 2
  }

  centerX2() {
    if (!isRandomPara(this.left2)) return null
    return this.left2 + this.cWidth / 2 + this.cLeft - 1920 / 2
  }

  centerY2() {
    if (!isRandomPara(this.top2)) return null
    return this.top2 + this.cHeight / 2 + this.cTop - 1080 / 2
  }

  centerOffsetX() {
    return this.left + this.cWidth / 2 + this.cLeft
  }

  centerOffsetY() {
    return this.top + this.cHeight / 2 + this.cTop
  }

  // Left为random时，Random的第二个值
  centerOffsetX2() {
    if (!isRandomPara(this.left2)) return null
    return this.left2 + this.cWidth / 2 + this.cLeft
  }

  // Left为random时，Random的第二个值
  centerOffsetY2() {
    if (!isRandomPara(this.top2)) return null
    return this.top2 + this.cHeight / 2 + this.cTop
  }

  reset() {
    // TODO: so troublesome
    this.left = 0
    this.top = 0
    this.left2 = null
    this.top2 = null
    this.width = 0
    this.height = 0
    this.rotate = 0
    this.skewH = 0
    this.skewV = 0
    this.scaleX = 1
    this.scaleY = 1
    this.opacity = 1
    this.cLeft = 0
    this.cTop = 0
    this.cWidth = 0
    this.cHeight = 0
    this.color = '0'
    this.transparent = '0'
    this.fps = 24
    this.playing = false
    this.currentFrame = 1
    this.muted = false
  }

  loadFrom(parameter: StageParameterSingle<any, any, any>, type: StageParameterSingleType) {
    let unit = parameter[type]

    if (unit.chgCtr === CHG_CTR_FOLLOW_TWO_HANDS_ACTION) {
      // when the unit.chgCtr=CHG_CTR_FOLLOW_TWO_HANDS_ACTION,delta value save in unit.[unit.twoHandsType]
      unit = Object.assign(clone(unit), unit[unit.twoHandsType || 'up'] || {})
      parameter = Object.assign(clone(parameter), {
        [type]: unit,
      })
    }

    this.parameter = parameter
    this.paraType = type
    const width = clamp(0, this.width, unit.width)
    const height = clamp(0, this.height, unit.height)
    // const x0 = clamp(0, this.width - width, unit.x0)
    // const y0 = clamp(0, this.height - height, unit.y0)
    const x0 = unit.x0
    const y0 = unit.y0
    this.left = unit.x + 1920 / 2 - width / 2 - x0
    this.top = unit.y + 1080 / 2 - height / 2 - y0

    // undefined时表示不是random模式
    if (isRandomPara(unit.x2)) {
      this.left2 = unit.x2 + 1920 / 2 - width / 2 - x0
    } else {
      this.left2 = null
    }
    if (isRandomPara(unit.y2)) {
      this.top2 = unit.y2 + 1080 / 2 - height / 2 - y0
    } else {
      this.top2 = null
    }
    this.rotate = unit.angle
    this.skewH = unit.skewH
    this.skewV = unit.skewV
    this.opacity = clamp(0, 1, unit.opacity)
    this.color = unit.colorChange
    this.transparent = unit.transparencyChange
    this.cWidth = width
    this.cHeight = height
    this.cLeft = x0
    this.cTop = y0
    this.scaleX = unit.scaleX
    this.scaleY = unit.scaleY
    if (this.type === 'video') {
      this.fps = unit.fps
      this.currentFrame = unit.frame
    }
  }

  saveTo(unit: UnitBase) {
    unit.x = this.centerX()
    unit.y = this.centerY()
    unit.x2 = this.centerX2()
    unit.y2 = this.centerY2()

    unit.angle = this.rotate
    unit.skewH = this.skewH
    unit.skewV = this.skewV
    unit.scaleX = this.scaleX
    unit.scaleY = this.scaleY
    unit.opacity = this.opacity
    unit.x0 = this.cLeft
    unit.y0 = this.cTop
    unit.width = this.cWidth
    unit.height = this.cHeight
    if (this.type === 'video') {
      unit.fps = this.fps
      unit.frame = this.currentFrame
    }
  }

  valueOf() {
    return pick([
      'left',
      'top',
      'left2',
      'top2',
      'rotate',
      'skewH',
      'skewV',
      'scaleX',
      'scaleY',
      'cLeft',
      'cTop',
      'cWidth',
      'cHeight',
    ], this)
  }
}
