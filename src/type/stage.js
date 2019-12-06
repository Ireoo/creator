import { clone, last, omit } from 'ramda'
import { get } from 'lodash'
import PeopleImage from '@/assets/people.png'
import { getDeltaUnitBaseCommon, getStickItemType } from 'lib/project'
import { CHG_CTR_FOLLOW_TWO_HANDS_ACTION } from 'type/constants'
import type { Vector3 } from './threed'
import uuid from 'uuid/v1'

export type ParameterTransparentChange = '0' | '4' | '5' | '6' | '11' | '12' | '13'
export type ParameterColorChange = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
export type ParamterChangeControl = '0' | '1' | '2' | '3' | '4' | '5' | '6'

export type StageTransition = {
  stageFile: number,
  NextStage: [string, string],
  NextStageTime: number,
  ROITimes: number,
  hitAction: string,
  EndTimeChoice: number,
  ROI: string,
  TLx: number,
  TLy: number,
  BRx: number,
  BRy: number,
  MoveThr: number,
  GoodyName: string,
  GoodyChangeMethod: number,
  GoodyChangeValue: number
}

export type StageAction = {
  stageAction: [string, string],
  actROI: string,
  actTLx: number,
  actTLy: number,
  actBRx: number,
  actBRy: number,
  angelSensible: string,
  MoveThr: number,
}

export type ChangeTypeAdded = {
  timeCh: number,
  stepOrEnd: string, // '0' - step '1' - end
  stickItem: string,
  up: UnitBase,
  down: UnitBase,
  rotation: UnitBase,
  antiRotation: UnitBase,
  chgCtr: ?string,
  twoHandsType: string
}

export type twoHandsType = 'up' | 'down' | 'rotation' | 'antiRotation'

// 资源元数据
export type ResourceMetadata = {
  type: 'image' | 'video',
  width: number,
  height: number,
  src: string,
}

export type Metadata3D = {
  stageId: string,
  imageFolder: string,
  fileName: string,
  keep: boolean,
  lightColor: string,
  lightPosition: Vector3,
  position: Vector3,
  rotation: Vector3,
  scale: Vector3,
  diffusionMap: string,
  normalMap: string,
  rotationRate: Vector3 & { play: boolean }
}

// 导入资源数据
export type SourceType = {
  directory: string,
  file: string,
  reference: string,
  metadata: ?ResourceMetadata,
  metadata3D: ?Metadata3D
}

//
export type ObjCommonType = {
  clean: number,
}

export type InitCommonType = {
  ...ObjCommonType,
  playVideo: boolean,
  videoLoop: boolean,
}

export type ChangeCommonType = {
  playVideo: boolean,
}

export type UnitBase = ChangeTypeAdded & {
  x0: number,
  y0: number,
  width: number,
  height: number,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  opacity: number,
  angle: number,
  skewH: number,
  skewV: number,
  transparencyChange: ParameterTransparentChange,
  colorChange: ParameterColorChange,
  keep: boolean,
  fps: number,
  frame: number,
  description: string,
  scaleX2?: number,
  scaleY2?: number,
  opacity2?: number,
  angle2?: number,
  skewH2?: number,
  skewV2?: number,
  x2?: number,
  y2?: number
}

export type StageParameterUnit<UnitInitType, UnitChangeType> = {
  init: UnitInitType,
  change: UnitChangeType,
}

export type BGUnit = UnitBase & {}

export type FGUnit = UnitBase & {}

export type CUSUnit = UnitBase & {
  customerPosIni: string,
}

export type OBJUnit = UnitBase & {
  skinSmooth: boolean,
  handPower: boolean,
  brighterness: number,
  saturation: number,
}

export type BGCUnit = BGUnit & ChangeTypeAdded
export type FGCUnit = FGUnit & ChangeTypeAdded
export type CUSCUnit = CUSUnit & ChangeTypeAdded
export type OBJCUnit = OBJUnit & ChangeTypeAdded

export type StageParameterSingle<InitCommonType, ChangeCommonType, UnitType> = {
  init: InitCommonType,
  change: ChangeCommonType,
  units: UnitType[],
  source: SourceType,
}

export type StageParameters = {
  bg: StageParameterSingle<InitCommonType,
    ChangeCommonType,
    StageParameterUnit<BGUnit,
      BGCUnit>>,
  fg: StageParameterSingle<InitCommonType,
    ChangeCommonType,
    StageParameterUnit<FGUnit,
      FGCUnit>>,
  cus: StageParameterSingle<InitCommonType,
    ChangeCommonType,
    StageParameterUnit<CUSUnit,
      CUSCUnit>>,
  obj: StageParameterSingle<ObjCommonType,
    {},
    StageParameterUnit<OBJUnit,
      OBJCUnit>>,
}

export type StageParameterType = $Keys<StageParameters>
export type StageParameterSingleType = $Keys<StageParameterSingle>

export type StageHistoryItem = {
  type: string,
  element: StageParameterType[],
  createTime: number,
}

export type InstructionPosition = 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
export type TextInstructionItem = {
  type: 'text',
  delay: number,
  txt: string,
  // position: InstructionPosition,
  // css: {
  //   background: ?string,
  //   color: string,
  // },
  font: string
}
export type ImageInstructionItem = {
  type: 'image',
  delay: number,
  src: string,
  position: InstructionPosition,
}
export type StopStage = {
  stage: string,
  delay: number,
}

export type VideoInstructionGlobalItem = {
  type: 'video',
  start: {
    stage: string,
    delay: number,
  },
  stop: Array<StopStage>
}
export type PhotoInstructionItem = {
  type: 'photo',
  delay: number,
  takephoto: boolean,
}
export type MusicInstructionItemStatus = 'continue' | 'pause' | 'false' | 'remove'

export type MusicInstructionGlobalItem = {
  type: 'music',
  src: string,
  loop: boolean,
  volume: number,
  start: {
    stage: string,
    delay: number,
  },
  stop: Array<StopStage>,
}
export type CommandInstructionItem = {
  type: 'command',
  delay: number,
  command: string,
}
export type InstructionItemType =
  TextInstructionItem |
  ImageInstructionItem |
  PhotoInstructionItem |
  CommandInstructionItem

export type InstructionGlobalItemType = VideoInstructionGlobalItem | MusicInstructionGlobalItem

// 操作记录
export class StageHistory {
  static MAX_HISTORY = 30
  static HISTORY_COMBINE_THRESHOLD = 500

  undoStack: Array<StageHistoryItem> = []
  redoStack: Array<StageHistoryItem> = []

  push(history: StageHistoryItem, stackType = 'undoStack') {
    // this.redoStack.splice(0)
    if (this[stackType].length > 0) {
      // combine history
      const lastHistory = last(this[stackType])
      if (
        history.type === lastHistory.type &&
        history.createTime - lastHistory.createTime < StageHistory.HISTORY_COMBINE_THRESHOLD) {
        this[stackType].pop()
        history = lastHistory
        history.createTime = Date.now()
      }
    }
    this[stackType].push(history)
    if (this[stackType].length > StageHistory.MAX_HISTORY) {
      this[stackType].splice(0, StageHistory.MAX_HISTORY - this[stackType].length)
    }
  }

  get undo(): boolean {
    return this.undoStack.length !== 0
  }

  get redo(): boolean {
    return this.redoStack.length !== 0
  }

  clear(): void {
    this.undoStack.splice(0)
    this.redoStack.splice(0)
  }
}

// 舞台类型，倒数第二个舞台为preEnd，最后一个为end
export type StageType = 'normal' | 'end' | 'preEnd' | 'if'

export type Parameter3D = {
  ambientColor: string,
  ambientColorIntensity: number,
  cameraPosition: Vector3,
  cameraRotationAngle: { x: number, y: number },
  cameraRotationRate: { x: number, y: number, play: boolean },
  playSpeed: number,
  weraable3D: number,
}

export type Loop = {
  name: string,
  start: string,
  end: string,
  loopNumber: number,
  type: 'loop'
}

export type Continue = {
  name: string,
  type: 'continue',
  stage: string,
  method: 0 | 1,
  condition: number
}

export type Break = Continue & {
  type: 'break'
}

export class ConditionItem {
  id = ''
  parent: string | null = null
  logic = 0
  type = 0
  name = ''
  method = 0
  compare = 0
  threshold = 0
  children: string[] = []
  constructor() {
    this.id = uuid()
  }
}

export class ConditionGroup {
  id = ''
  parent: string | null = null
  name = ''
  logic = 0
  children: string[] = []
  constructor(name: string) {
    this.id = uuid()
    this.name = name
  }
}

export type Condition = {
  then: string,
  else: string,
  conditions: Array<ConditionItem>,
  groups: Array<ConditionGroup>
}

export class Stage {
  id: string

  // Starting with 1 ,FOR OUTPUT ONLY!
  // indexId: number = 1

  type: StageType = 'normal'
  parameter: StageParameters = clone(defaultParameter)
  action: StageAction = {
    stageAction: ['0', '0'],
    actROI: '0',
    actTLx: 200, // Top/Left左上角
    actTLy: 400, // 右上角
    actBRx: 600, //
    actBRy: 800,
    angelSensible: '1',
    MoveThr: 200,
  }
  transition: StageTransition[] = []
  instruction: InstructionItemType[] = []
  description: string = ''
  selected: boolean = false
  snapshot: string = ''
  history: StageHistory
  protect: boolean = true
  parameter3D: Parameter3D = {
    ambientColor: '#FFFFFF',
    ambientColorIntensity: 1,
    cameraPosition: { x: 0, y: 10, z: 100 },
    cameraRotationAngle: { x: 0, y: 0, z: 0 },
    cameraRotationRate: { x: 0, y: 0, play: false },
    playSpeed: 1,
    weraable3D: 0,
  }
  condition: Condition = {
    then: '',
    else: '',
    conditions: [],
    groups: [],
  }

  static load(stage: Object): Stage {
    const newStage = new Stage('')
    // TODO: restore history
    Object.assign(newStage, omit(['history'], stage))
    return newStage
  }

  constructor(id: string) {
    this.id = id
    this.history = new StageHistory()
  }

  clone(): Stage {
    const copyStage = new Stage('')
    copyStage.action = clone(this.action)
    copyStage.parameter = clone(this.parameter)
    copyStage.transition = clone(this.transition)
    copyStage.condition = clone(this.condition)
    copyStage.snapshot = this.snapshot
    copyStage.description = this.description
    copyStage.instruction = this.instruction
    copyStage.type = this.type
    return copyStage
  }

  getCurPeopleNo(): number {
    return Math.max(
      this.parameter.bg.units.length,
      this.parameter.fg.units.length,
      this.parameter.cus.units.length,
      this.parameter.obj.units.length,
    )
  }

  isParameterEnabled(type: StageParameterType): boolean {
    return this.parameter[type].units.length > 0
  }

  getChangeMode(type: StageParameterType, index: number): 'delta' | 'stick' | '' {
    const { change } = this.parameter[type].units[index]
    if ('12456'.indexOf(change.chgCtr) !== -1) {
      if ('15'.indexOf(change.chgCtr) !== -1 && change.stepOrEnd === '1') {
        return ''
      } else {
        return 'delta'
      }
    } else if (change.chgCtr === '3') {
      return 'stick'
    } else {
      return ''
    }
  }
  /**
   * get the delta value of the change type
   * @param {*} type
   * @param {*} index
   * @param {option} twoHandsType , Used to get the delta value of the specified twoHandsType.
   *                                get the delta value by change.twoHandsType when its null
   */
  getDeltaValue(type: StageParameterType, index: number, twoHandsType: ?string): Object {
    let { init, change } = this.parameter[type].units[index]
    if (change.chgCtr === CHG_CTR_FOLLOW_TWO_HANDS_ACTION) {
      change = Object.assign(clone(change), change[twoHandsType || change.twoHandsType] || {})
    }
    return {
      ...change,
      ...getDeltaUnitBaseCommon(init, change),
      scaleX: change.scaleX - init.scaleX,
      scaleY: change.scaleY - init.scaleY,
      opacity: change.opacity - init.opacity,
    }
  }

  getStickValue(type: StageParameterType, index: number): ?Object {
    // stick
    const { init, change } = this.parameter[type].units[index]
    const stickType = getStickItemType(change.stickItem)
    if (!stickType) return change
    let stickInit = get(this.parameter, `${stickType}.units.${index}.init`)
    if (!stickInit) return change
    return {
      ...change,
      ...getDeltaUnitBaseCommon(stickInit, change),
      x0: change.x0 - init.x0,
      y0: change.y0 - init.y0,
      width: change.width - init.width,
      height: change.height - init.height,
      scaleX: change.scaleX / stickInit.scaleX,
      scaleY: change.scaleY / stickInit.scaleY,
      // opacity: change.opacity / stickInit.scaleY,
    }
  }
}

const baseValue: UnitBase = {
  description: '',
  x0: 0,
  y0: 0,
  width: 0, // should initial after
  height: 0, // should initial after
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
  angle: 0,
  skewH: 0,
  skewV: 0,
  transparencyChange: '0',
  colorChange: '0',
  keep: false,
  fps: 30,
  frame: 0,
  opacity2: undefined,
  scaleX2: undefined,
  scaleY2: undefined,
  angle2: undefined,
  skewH2: undefined,
  skewV2: undefined,
  x2: undefined,
  y2: undefined,
}

export const initCommon: InitCommonType = {
  clean: '2',
  playVideo: false,
  videoLoop: false,
}

export const changeCommon: ChangeCommonType = {
  playVideo: false,
}

export const defaultSource: SourceType = {
  directory: '',
  file: '',
  reference: '',
  metadata: null,
  metadata3D: null,
}

export const changeValue: ChangeTypeAdded = {
  chgCtr: '0',
  twoHandsType: 'up',
  timeCh: 1,
  stepOrEnd: '1',
  stickItem: '0',
}

export const defaultBG: BGUnit = {
  ...baseValue,
}

export const defaultFG: FGUnit = {
  ...baseValue,
}

export const defaultCUS: CUSUnit = {
  ...baseValue,
  customerPosIni: '1',
}

export const defaultOBJ: OBJUnit = {
  ...baseValue,
  skinSmooth: true,
  handPower: false,
  brighterness: 5,
  saturation: 0.25,
}

export const defaultBGC: BGCUnit = {
  ...defaultBG,
  ...changeValue,
}

export const defaultFGC: FGCUnit = {
  ...defaultFG,
  ...changeValue,
}

export const defaultCUSC: CUSCUnit = {
  ...defaultCUS,
  ...changeValue,
}

export const defaultOBJC: OBJCUnit = {
  ...defaultOBJ,
  ...changeValue,
}

export const defaultParameter: StageParameters = {
  bg: {
    init: clone(initCommon),
    change: clone(changeCommon),
    source: clone(defaultSource),
    units: [],
  },
  fg: {
    init: clone(initCommon),
    change: clone(changeCommon),
    source: clone(defaultSource),
    units: [],
  },
  cus: {
    init: clone(initCommon),
    change: clone(changeCommon),
    source: clone(defaultSource),
    units: [],
  },
  obj: {
    init: {
      clean: '2',
    },
    change: {
      clean: '2',
    },
    source: {
      directory: '',
      file: '',
      reference: '',
      metadata: {
        type: 'image',
        width: 1920,
        height: 1080,
        src: PeopleImage,
      },
    },
    units: [],
  },
}

export const defaultParameterValue = {
  bg: { init: defaultBG, change: defaultBGC },
  fg: { init: defaultFG, change: defaultFGC },
  cus: { init: defaultCUS, change: defaultCUSC },
  obj: { init: defaultOBJ, change: defaultOBJC },
}

export const defaultInstruction: {
  music: MusicInstructionGlobalItem,
  photo: PhotoInstructionItem,
  video: VideoInstructionGlobalItem,
  text: TextInstructionItem,
  image: ImageInstructionItem,
  command: CommandInstructionItem,
} = {
  music: {
    type: 'music',
    src: '',
    loop: false,
    volume: 0.5,
    start: {
      stage: '',
      delay: 0,
    },
    stop: [{
      stage: '',
      delay: 0,
    }],
  },
  photo: {
    type: 'photo',
    takephoto: true,
    delay: 0,
  },
  video: {
    type: 'video',
    start: {
      stage: '',
      delay: 0,
    },
    stop: [{
      stage: '',
      delay: 0,
    }],
  },
  text: {
    type: 'text',
    delay: 0,
    txt: '',
    position: 'topLeft',
    // css: { background: null, color: '#000000' },
    font: 'Raleway',
  },
  image: {
    type: 'image',
    delay: 0,
    src: '',
    position: 'topLeft',
  },
  command: {
    type: 'command',
    delay: 0,
    command: 'done',
  },
  goody: {
    type: 'goody',
    image: '',
    position: 'topRight',
    initNum: 0,
    endStage: null,
  },
}
