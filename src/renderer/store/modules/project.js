// @flow
import { Stage, defaultParameterValue, ConditionItem, ConditionGroup } from 'type/stage'
import type {
  twoHandsType,
  StageTransition,
  StageAction,
  SourceType,
  StageParameterType,
  StageParameterUnit,
  ResourceMetadata,
  StageHistoryItem,
  StageType,
  InstructionGlobalItemType,
  InstructionItemType,
  UnitBase,
  Loop,
  Continue,
  Break,
} from 'type/stage'
import { Project } from 'type/project'
import type { ErrorType } from 'type/project'
import { removeChild } from 'lib/utils'
import { Debounce, getSourceSrc, urlToPath, pathToUrl } from 'lib/helper'
import { curry, pull, noop, uniq, delay, isEqual, findLast, get, set, clamp } from 'lodash'
import R, { clone, pick, flatten, last, difference } from 'ramda'
import Vue from 'vue'
import { ipcRenderer, clipboard } from 'electron'
import type { ActionContext } from 'vuex'
import { Message, MessageBox } from 'element-ui'
import path from 'path'
import fs from 'fs-extra'
import {
  exportProject,
  pickExchangableUnit,
  pickUnitBase,
  makeStageAsSame,
  openProject,
  checkErrorForStages,
  checkErrorForLoops,
  checkErrorForProject,
  generateInstruction,
  fixStageInstruction,
  changeSourceType,
  checkChangedMedia,
  compressMedia,
  isRandomTrans,
  getStageName,
  getAllgodies,
  deleteUnnecessaryImages,
} from 'lib/project'
import {
  IPC_PROJECT_SAVE,
  IPC_PROJECT_SAVED,
  EV_CANVAS_REFRESH,
  EV_CANVAS_DEEP_REFRESH,
  CHG_CTR_FOLLOW_TWO_HANDS_ACTION,
  MENU_NOT_GROUPED,
  CB_FORMAT_STAGE,
} from 'type/constants'
import { clearLocalMapData } from 'type/map'
import crypto from 'crypto'
import { value2Label } from 'lib/form'
import { state as defualtDebug } from './project/debug.js'
import color from 'material-colors'

delete color.black
delete color.white
const funColors = Object.keys(color)
  .filter(key => !/(deep|light)/.test(key))
  .map(key => color[key][300])

export type StageGroupItem = {
  stageIds: string[],
  title: string,
  color?: string
}

export type State = {
  counter: number,
  stages: Stage[],
  selectedStage: Stage,
  projectPath: ?string,
  lockAction: boolean,
  instruction: InstructionGlobalItemType[],
  errors: ErrorType[],
  stageGroup: StageGroupItem[],
  protectList: string[],
  password: string,
  protect: boolean,
  stagesFromOtherProject: string[],
  loops: Array<Loop | Continue | Break>,
  hdRtio: number,
}

export type ThumbnailGroupinfo = {
  isGroupHead: boolean,
  group: StageGroupItem,
  groupIndex: number
}

export type Thumbnail = Stage & {
  listType: 'stage' | 'group',
  groupInfo?: ThumbnailGroupinfo
}

const state: State = {
  counter: 0,
  stages: [],
  selectedStage: null,
  projectPath: null,
  lockAction: false,
  instruction: [],
  errors: [],
  stageGroup: [],
  protectList: [],
  password: '',
  protect: false,
  stagesFromOtherProject: [],
  loops: [],
  hdRtio: 1,
}

let lastSaveTime: number = 0

const getters = {
  projectExist(state: State): boolean {
    return !!state.projectPath
  },
  projectImagePath(state: State): string {
    return state.projectPath ? path.join(state.projectPath || '', 'images') : ''
  },
  ungroupedStages(state: State, { stageIndex }: { stageIndex: Function }): Array<State> {
    const ungroupedStages = state.stages.filter(stage => {
      return state.stageGroup.every(group => {
        return !group.stageIds.includes(stage.id)
      })
    })
    return ungroupedStages
  },
  stageIndex(state: State): Function {
    return stage => stage ? state.stages.findIndex(s => s.id === stage.id) : 0
  },
  /** shift multiple choice
   * return Array<stage>,contains selected first stage to last stage
   */
  getStagesInRange(state: State): Array<Stage> {
    const firstIndex = state.stages.findIndex(stage => stage.selected)
    const lastIndex = state.stages
      .map(stage => stage.selected)
      .lastIndexOf(true)
    if (firstIndex === -1) return []
    else return state.stages.slice(firstIndex, lastIndex + 1)
  },
  selectedThumbnails(state: State, { thumbnails }: { thumbnails: Array<Thumbnail> }): Array<Stage> {
    return thumbnails.filter(s => s.selected)
  },
  selectedStages(state: State) {
    return state.stages.filter(s => s.selected)
  },
  getStagesByGroup(state: State, { stageIndex }: { stageIndex: Function }): Function {
    return group => state.stages.filter(stage => group.stageIds.includes(stage.id))
  },
  // ONLY USED LIST SORT
  thumbnails(state: State): Array<Thumbnail> {
    const stages = state.stages
    const groups = state.stageGroup
    const list = stages.map((stage, index) => {
      const inGroupIndex = groups.findIndex(group => group.stageIds.includes(stage.id))
      const groupInfo: {
        listType: string,
        groupInfo: ?ThumbnailGroupinfo
      } = {
        listType: ~inGroupIndex ? 'group' : 'stage',
        groupInfo: null,
      }
      if (~inGroupIndex) {
        const isGroupHead = groups[inGroupIndex].stageIds.indexOf(stage.id) === 0
        groupInfo.groupInfo = {
          groupIndex: inGroupIndex,
          group: groups[inGroupIndex],
          isGroupHead,
        }
      }
      return Object.assign(groupInfo, stage)
    }).filter(({ groupInfo, listType }) => {
      return listType === 'stage' || groupInfo && groupInfo.isGroupHead
    })
    return list
  },
  thumbnailsIndexToStagesIndex(state: State, { thumbnails, stageIndex }: { thumbnails: Array<Thumbnail>, stageIndex: Function }): Function {
    return index => {
      const stage = thumbnails[index]
      return stageIndex(stage)
    }
  },
  lastStageIdInGroup(state: State, { thumbnails, stageIndex }: { thumbnails: Array<Thumbnail>, stageIndex: Function }): Function {
    return groupId => {
      const stage = findLast(thumbnails, t => get(t, 'groupInfo.groupIndex') === groupId)
      if (!stage) return
      return stage.id
    }
  },
  isInGroup(state: State) {
    return (id: string) => flatten(state.stageGroup.map(g => g.stageIds)).includes(id)
  },
  protectCheck(state: State) {
    return (type: string) => {
      if (!state.protectList.includes(type)) return true
      if (!state.protect || !state.selectedStage.protect) return true
      return false
    }
  },
  transitionLabel(state: State, getters: any, store: any) {
    return (trans: StageTransition) => {
      const label = value2Label(
        store.static.form.transition[2],
        trans.NextStage,
        true
      )
      return label
    }
  },
  getTransitionTo(state: State) {
    return (trans: StageTransition) => {
      if (!isRandomTrans(trans.stageFile)) {
        return trans.stageFile + 1
      } else {
        const r = trans.stages
          .map(id => state.stages.find(stage => stage.id === id))
          .map((stage, i) => i + 1)
          .join(',')
        return `R[${r}]`
      }
    }
  },
  getStageName(state: State) {
    return (stage: Stage, index?: number, description = false) => {
      if (!index) index = state.stages.indexOf(stage)
      let name = getStageName(stage, index)
      if (description && stage.description) name += ` (${stage.description})`
      return name
    }
  },
  goodies(state: State) {
    return getAllgodies(state.stages)
  },
  conditionText(state: State, getter, rootState) {
    return condition => {
      const staticState = rootState.static.condition
      const topGroups = condition.groups.filter(
        conditionGroup => !conditionGroup.parent
      )
      const topConditions = condition.conditions.filter(
        conditionItem => !conditionItem.parent
      )
      const { groups, conditions } = condition
      const isGroup = obj => obj.threshold === undefined
      const format = arr => {
        let text = ''
        const subGroups = arr.filter(item => isGroup(item))
        const subConditions = arr.filter(item => !isGroup(item))

        subGroups.forEach((item, index) => {
          const logic = staticState.logics[item.logic]
          const childGroups = groups.filter(g => g.parent === item.id)
          const childConditions = conditions.filter(c => c.parent === item.id)
          const children = [...childGroups, ...childConditions]
          if (children.length) {
            if (
              index !== 0 ||
              logic === 'Not'
            ) {
              text += `${logic} `
            }
            text += `(${format(children)}) `
          }
        })
        subConditions.forEach((item, index) => {
          const logic = staticState.logics[item.logic]
          const name = item.name
          const method = (() => {
            if (item.type === 0) return staticState.goodyMethods[item.method]
            if (item.type === 1) return staticState.loopMethods[item.method]
          })()
          const compare = staticState.compareMethods[item.compare]
          if (
            subGroups.length > 0 ||
            (subConditions.length > 1 && index !== 0) ||
            logic === 'Not'
          ) {
            text += `${logic} `
          }
          text += `(${item.name}.${method} ${compare} ${item.threshold}) `
        })
        return text
      }
      const arr = [...topGroups, ...topConditions]
      const text = `If Condition: ${format(arr)}`

      return text
    }
  },
}

function makeID(state: State): string {
  return 'stage_' + (state.counter++)
}

function IDtoNumber(id: string) {
  return parseInt(id.match(/[0-9]*$/))
}

function state2Project(state: State): Project {
  const project = new Project()
  project.counter = state.counter
  project.stages = state.stages
  project.instruction = state.instruction
  project.stageGroup = state.stageGroup
  project.protectList = state.protectList
  project.password = state.password
  project.protect = state.protect
  project.loops = state.loops
  project.debug = state.debug

  return project
}

async function ipcSaveProject(state: State, fromProjectPath?: string) {
  const project = state2Project(state)
  const promise = new Promise((resolve, reject) => {
    ipcRenderer.once(IPC_PROJECT_SAVED, (event, result, message) => {
      console.log('save project')
      resolve(result)
      if (result) {
        Message.success('Save Success')
      } else {
        Message.error('Save Failed, Please try again')
      }
    })
  })
  ipcRenderer.send(IPC_PROJECT_SAVE, state.projectPath, project, fromProjectPath)
  await promise
}

function autoSaveProject(state: State) {
  if (!state.projectPath) return
  const now = Date.now()
  if (now - lastSaveTime > 1000 * 5) {
    const project = state2Project(state)
    lastSaveTime = now
    ipcRenderer.send(IPC_PROJECT_SAVE, state.projectPath, project)
  }
}

function pushHistory(stage, type, stackType?: 'undoStack' | 'redoStack') {
  const history = {
    type,
    element: clone(stage.parameter[type]),
    createTime: Date.now(),
  }
  stage.history.push(history, stackType)
}

function doHistory(stage: Stage, history: StageHistoryItem) {
  const { type, element } = history
  stage.parameter[type] = clone(element)
  Vue.prototype.$events.emit(EV_CANVAS_REFRESH, stage)
}

function removeStageIdFromGroup(state: State, stageId: string) {
  const stageGroup = state.stageGroup
  const remove = ({ stageIds }) => pull(stageIds, stageId)
  stageGroup.forEach(remove)
}

//
function getChange(unit: UnitBase) {
  if (unit.chgCtr === CHG_CTR_FOLLOW_TWO_HANDS_ACTION) { return unit[unit.twoHandsType] } else return unit
}

function beforeOpenProject() {
  clearLocalMapData()
}

const mutations = {
  setErrors(state: State, errors: ErrorType[]) {
    state.errors = errors
  },
  historyUndo(state: State, stage: Stage) {
    const deleted = stage.history.undoStack.pop()
    const { type, element } = deleted
    pushHistory(stage, type, 'redoStack')
    doHistory(stage, deleted)
  },
  historyRedo(state: State, stage: Stage) {
    const deleted = stage.history.redoStack.pop()
    const { type, element } = deleted
    pushHistory(stage, type, 'undoStack')
    doHistory(stage, deleted)
  },
  loadProject(state: State, project: Project) {
    state.counter = project.counter || 0
    state.stages = project.stages.map(stage => Stage.load(stage)) || []
    state.stages.forEach(stage => delete stage.indexId)
    state.selectedStage = state.stages.find(stage => stage.selected) || null
    state.instruction = project.instruction || []
    state.stageGroup = project.stageGroup || []
    state.protectList = project.protectList || []
    state.password = project.password || ''
    state.protect = project.protect || false
    state.stagesFromOtherProject = []
    state.loops = project.loops || []
    state.debug = project.debug || clone(defualtDebug)

    mutations.checkInstruction(state)
  },
  importProject(state: State, project: any) {
    const projectPath: any = state.projectPath
    const fromProjectPath = project.projectPath
    const counter = state.counter
    // copy instruction file & change instruction stageFile
    project.instruction.forEach(instr => {
      const instrPath = path.join(fromProjectPath, 'instruction', instr.src)
      const extname = path.extname(instrPath)
      const fileName = path.basename(instrPath, extname)
      const newName = fileName + '_import' + extname
      const newPath = path.join(path.dirname(instrPath).replace(fromProjectPath, projectPath), newName)
      fs.copySync(instrPath, newPath)
      instr.src = newPath.replace(fromProjectPath, '')

      const changeId = (item: { stage: string, delay: number }) => {
        const number = IDtoNumber(item.stage)
        const newNumber = number + counter
        item.stage = item.stage.replace(number.toString(), newNumber + '')
      }
      if (instr.stop && instr.stop.length) instr.stop.forEach(changeId)
      if (instr.start) changeId(instr.start)
    })
    // change stage id
    // change parameter (bg | cus | fg | obj) source path
    try {
      project.stages.forEach(stage => {
        // const number = IDtoNumber(stage.id)
        // const newNumber = number + counter
        // stage.id = stage.id.replace(number.toString(), newNumber + '')
        // state.counter++
        for (let type of ['bg', 'cus', 'fg']) {
          const source = stage.parameter[type].source
          if (!source) continue
          const metadata = source.metadata
          if (!metadata) continue

          const src = metadata.src
          const unitPath = src.replace(/.*images/, path.join(fromProjectPath, 'images'))
          const unitDir = path.dirname(unitPath)
          const extname = path.extname(unitPath)
          const fileName = path.basename(unitPath, extname)
          const newName = fileName + '_import' + extname
          const newPath = path.join(projectPath, 'images', type, newName)
          fs.copySync(unitPath, newPath)
          metadata.src = pathToUrl(newPath)
        }
        mutations.copyStage(state, Stage.load(stage))
      })
    } catch (err) { console.error(err) }
    const newInstruction = state.instruction.slice()
    newInstruction.push(...project.instruction)
    state.instruction = newInstruction
    // const newStages = state.stages.slice()
    // newStages.push(...project.stages)
    // state.stages = newStages
    console.log(project)
  },
  updateSnapshot(state: State, { stage, snapshot }: { stage: Stage, snapshot: string }) {
    stage.snapshot = snapshot
  },
  changeLockAction(state: State, lock: boolean) {
    state.lockAction = lock
  },
  changeProjectPath(state: State, projectPath: string) {
    state.projectPath = projectPath
    if (projectPath) {
      document.title = path.basename(projectPath) + ' - Integem iCreator'
    }
  },
  initStage(state: State, project: Project) {
    // do init from some project
    console.log(arguments)
  },
  newStage(state: State, afterIndex?: number) {
    const stage = new Stage(makeID(state))
    const exsitObjSource = get(state, 'stages.0.parameter.obj.source') || {}
    if (exsitObjSource.file) { stage.parameter.obj.source = exsitObjSource }
    state.stages.push(stage)
    if (typeof afterIndex === 'number') {
      mutations.moveStage(state, { fromIndex: state.stages.indexOf(stage), toIndex: afterIndex })
    }

    return stage
  },
  newIfStage(state: State, afterIndex?: number) {
    const stage = mutations.newStage(...arguments)
    mutations.addCondition(state, { stage })
    stage.type = 'if'
  },
  onGrouping(state: State) {
    const thumbnails = this.getters.selectedThumbnails
    const child = thumbnails
      .map(t => this.getters.stageIndex(t) + 1)
      .join('_')
    const groupTitle = 'Group_' + child
    this.commit('newStageGroup', { groupTitle })
    this.commit('moveStagesToGroup', { groupTitle, stages: thumbnails })
  },
  moveStagesToGroup(state: State, { groupTitle, stages }: { [key: string]: string, stages: Stage[] }) {
    const destStages = stages || this.getters.selectedThumbnails
    destStages.forEach(stage => {
      this.commit('moveStageToGroup', {
        stage,
        groupTitle,
      })
    })
  },
  newStageGroup(state: State, { groupTitle }: { [key: string]: string }) {
    state.stageGroup.push({
      title: groupTitle,
      stageIds: [],
    })
  },
  moveStageToGroup(state: State, { groupTitle, stage }: { groupTitle: number, stage: Stage }) {
    const getIndex: Function = this.getters.stageIndex
    const fromIndex = stage.id
    const toGroupId = state.stageGroup.findIndex(g => g.title === groupTitle)
    if (~toGroupId) { state.stageGroup[toGroupId].stageIds.push(fromIndex) }
    // cancel selected
    this.getters.selectedThumbnails.forEach(stage => stage.selected = false)
  },
  changeGroupTitle(state: State, { groupId, groupTitle }: {
    groupId: number,
    groupTitle: string
  }) {
    if (!groupTitle) return
    state.stageGroup[groupId].title = groupTitle
  },
  ungroup(state: State, groupId: number) {
    state.stageGroup.splice(groupId, 1)
  },
  changeGroupColor(state: State, { groupIndex, color }: { groupIndex: number, color: string }) {
    const [group] = state.stageGroup.splice(groupIndex, 1)
    group.color = color
    state.stageGroup.splice(groupIndex, 1, group)
  },
  doStageCopy() {
    const selectedStages = this.getters.selectedStages
    clipboard.writeBuffer(
      CB_FORMAT_STAGE,
      Buffer.from(JSON.stringify(selectedStages))
    )
  },
  addStage(state: State, { stage, index }: { stage: Stage, index: number }) {
    if (typeof index === 'number') {
      // TODO: update transition stage file
      state.stages.splice(index, 0, stage)
    } else {
      state.stages.push(stage)
    }
    mutations.selectStage(state, stage)
  },
  deleteStage(state: State, stage: Stage) {
    const index = state.stages.indexOf(stage)
    state.stages.splice(index, 1)
    // change select
    if (stage.selected && state.stages.length > 0) {
      if (state.stages[index]) {
        state.stages[index].selected = true
        state.selectedStage = state.stages[index]
      } else if (state.stages[index - 1]) {
        state.stages[index - 1].selected = true
        state.selectedStage = state.stages[index - 1]
      }
    }

    removeStageIdFromGroup(state, stage.id)

    if (!state.stages.length) state.selectedStage = null

    if (!state.stages.length) {
      state.selectedStage = null
    } else {
      // update stage index
      for (const stage of state.stages) {
        stage.transition.forEach(trans => {
          if (!isRandomTrans(trans.stageFile) && trans.stageFile >= index) {
            trans.stageFile--
          }
          if (isRandomTrans(trans.stageFile)) {
            const i = trans.stages.findIndex(id => id === stage.id)
            if (i !== -1) trans.stages.splice(i, 1)
          }
        })
      }
    }

    mutations.sortLoop(state)

    deleteUnnecessaryImages(state, state.projectPath)
  },
  copyStage(state: State, stage: Stage) {
    const copyStage = stage.clone()
    copyStage.id = makeID(state)
    state.stages.push(copyStage)
    mutations.selectStage(state, copyStage)
  },
  copyStageAsSame(state: State, stage: Stage) {
    const copyStage = stage.clone()
    copyStage.id = makeID(state)
    makeStageAsSame(copyStage)
    state.stages.push(copyStage)
    mutations.selectStage(state, copyStage)
  },
  updateStageType(state: State, { stage, type }: { stage: Stage, type: StageType }) {
    state.stages.forEach(stage => {
      if (stage.type === type) {
        stage.type = 'normal'
        fixStageInstruction(stage)
      }
    })
    stage.type = type
    if (type !== 'normal') {
      stage.action.stageAction = ['0', '0'] // set stage action to no action
      for (const trans of stage.transition) {
        if (type === 'end') { trans.stageFile = 0 }
        if (trans.NextStage[0] !== '1') {
          trans.NextStage = ['1', '1'] // transition can only be time-based
        }
      }
    }
    fixStageInstruction(stage)
  },
  moveStage(state: State, { fromIndex, toIndex }: { fromIndex: number, toIndex: number }) {
    const raw = state.stages
    const list = raw.slice()
    const deleted = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, ...deleted)

    // update index
    for (let stage of list) {
      for (let trans of stage.transition) {
        if (isRandomTrans(trans.stageFile)) continue
        const target = raw[trans.stageFile]
        trans.stageFile = list.indexOf(target)
      }
    }
    state.stages = list

    mutations.sortLoop(state)
  },
  selectStage(state: State, stage: Stage) {
    for (const stage of state.stages) {
      stage.selected = false
    }
    if (!stage) return
    stage.selected = true
    state.selectedStage = stage
  },
  selectMultiStage(state: State, stage: Stage) {
    stage.selected = true
  },
  updateStageDescription(state: State, { desc, stage }: { stage: Stage, desc: string }) {
    stage.description = desc
  },
  updateStageSetting(state: State, { stage, desc, protect }: { stage: Stage, desc: string, protect: string }) {
    stage.description = desc
    stage.protect = protect
  },
  addStageTransition(state: State, { stage, transition }: { stage: Stage, transition: StageTransition }) {
    if (stage.transition.length >= 4) {
      console.warn(`stage ${stage.id} transition cannot more than four`)
      return
    }
    stage.transition.push(transition)
  },
  updateStageTransition(state: State, { stage, transIndex, transition }: { stage: Stage, transIndex: number, transition: StageTransition }) {
    stage.transition.splice(transIndex, 1, transition)
  },
  updateStageTransitionTarget(state: State, { stage, transIndex, targetIndex, randomIndex }: { stage: Stage, [key: string]: number }) {
    const trans = stage.transition[transIndex]
    const stageFile = trans.stageFile

    if (isRandomTrans(stageFile)) {
      Vue.set(trans.stages, randomIndex, state.stages[targetIndex].id)
    } else { trans.stageFile = targetIndex }
  },
  deleteStageTransition(state: State, { stage, transIndex }: { stage: Stage, transIndex: number }) {
    stage.transition.splice(transIndex, 1)
  },
  updateStageAction(state: State, { stage, action }: { stage: Stage, action: StageAction }) {
    stage.action = clone(action)
  },
  updateStageSource(state: State, { stage, type, source }: { stage: Stage, type: StageParameterType, source: SourceType }) {
    const oldSource = stage.parameter[type].source
    let deep = false
    if (oldSource.metadata && source.metadata && source.metadata.src !== oldSource.metadata.src) {
      // reset all unit cut info
      const { width, height } = source.metadata
      stage.parameter[type].units.forEach(unit => {
        unit.init.width = unit.change.width = width
        unit.init.height = unit.change.height = height
        unit.init.x0 = unit.change.x0 = 0
        unit.init.y0 = unit.change.y0 = 0
      })
      deep = true
    }
    stage.parameter[type].source = source
    // stage.history.clear()
    Vue.prototype.$events.emit(deep ? EV_CANVAS_DEEP_REFRESH : EV_CANVAS_REFRESH, stage)
  },
  changeObjImage(state: State, { directory, file }: { [key: string]: string }) {
    const projectPath = state.projectPath
    state.stages.map(R.path(['parameter', 'obj', 'source'])).forEach(source => {
      source.directory = directory
      source.file = file
      source.metadata.src = getSourceSrc(projectPath, source)
    })
    state.stages.forEach(stage => Vue.prototype.$events.emit(EV_CANVAS_DEEP_REFRESH, stage))
  },
  deleteStageSource(state: State, { stage, type }: { stage: Stage, type: StageParameterType }) {
    if (type === 'obj') return
    const source = stage.parameter[type].source
    source.directory = ''
    source.file = ''
    source.reference = ''
    source.metadata = null
    source.metadata3D = null
    // clear units
    stage.parameter[type].units = []
  },
  addStageParameterUnit(state: State, { stage, type, unit }: {
    stage: Stage,
    type: StageParameterType,
    unit?: StageParameterUnit<*,
      *>,
  }) {
    // TODO: check if resource added
    const parameter = stage.parameter[type]
    const metadata: ?ResourceMetadata = stage.parameter[type].source.metadata
    if (!metadata) return
    if (parameter.units.length >= 8) {
      Message.warning(`Reached the maximum allowed number (8) of Objects (fg, bk, cus).`)
      return
    }
    if (!unit) {
      unit = clone(defaultParameterValue[type])
      if (type === 'obj') {
        unit.init.width = unit.change.width = 1420
        unit.init.height = unit.change.height = 1080
        unit.init.x0 = unit.change.x0 = 250
      } else {
        unit.init.width = unit.change.width = metadata.width
        unit.init.height = unit.change.height = metadata.height
      }
    }
    parameter.units.push(unit)
    console.log(stage.history)
    // stage.history.clear()
    Vue.prototype.$events.emit(EV_CANVAS_REFRESH, stage)
  },
  updateStageParameterUnitValue(state: State, { stage, type, status, index, key, value }: {
    stage: Stage,
    type: StageParameterType,
    status: 'init' | 'change',
    index: number,
    key: string,
    value: any,
  }) {
    //  check key/value valid
    if (!key) return

    pushHistory(stage, type)
    const unit = stage.parameter[type].units[index][status]
    const changeDelta = unit.chgCtr === CHG_CTR_FOLLOW_TWO_HANDS_ACTION && !['chgCtr', 'twoHandsType'].includes(key)
    if (status === 'change' && changeDelta) {
      const twoHandsType = unit.twoHandsType
      if (!unit[twoHandsType]) {
        Vue.set(unit, twoHandsType, {})
        Vue.set(unit[twoHandsType], key, value)
      } else {
        Vue.set(unit[twoHandsType], key, value)
      }
    } else {
      Vue.set(unit, key, value)
    }
  },
  updateStageParameterUnit(state: State, { stage, type, status, index, value }: {
    stage: Stage,
    type: StageParameterType,
    status: 'init' | 'change',
    index: number,
    value: any,
  }) {
    pushHistory(stage, type)

    var unit = stage.parameter[type].units[index][status]
    const changeDelta = unit.chgCtr === CHG_CTR_FOLLOW_TWO_HANDS_ACTION
    if (status === 'change' && changeDelta) {
      const twoHandsType = unit.twoHandsType || 'up'
      // I don't know why using `unit` does not work,must be using `stage.parameter[type].units[index][status]`
      stage.parameter[type].units[index][status] = Object.assign({}, unit, {
        [twoHandsType]: pickUnitBase(value),
      })
    } else {
      Object.assign(unit, value)
    }
  },
  changeStageSourceType(state: State, { stage, type, sourceType }: {
    stage: Stage,
    type: StageParameterType,
    sourceType: '' | 'same' | 'random',
  }) {
    const source = stage.parameter[type].source
    changeSourceType(source, sourceType)
  },
  updateStageParameterCommon(state: State, { stage, type, status, key, value }: {
    stage: Stage,
    type: StageParameterType,
    status: 'init' | 'change',
    key: string,
    value: any,
  }) {
    // TODO: check key/value valid
    stage.parameter[type][status][key] = value
  },
  deleteStageParameterUnit(state: State, { stage, type, index }: { stage: Stage, type: StageParameterType, index: number }) {
    const parameter = stage.parameter[type]
    console.log('deleteStageParameterUnit', parameter)
    if (parameter.units.length > index) {
      pushHistory(stage, type)
      this.commit('changeIndex', 0)
      const [unit] = parameter.units.splice(index, 1)
    } else {
      console.warn('out of bound')
    }
    if (parameter.units.length === 0) {
      mutations.deleteStageSource(state, {
        stage: stage,
        type: type,
      })
    }
    // stage.history.clear()
    Vue.prototype.$events.emit(EV_CANVAS_REFRESH, stage)
  },
  addInstruction(state: State, { stage, instruct }: { stage: Stage, instruct: InstructionItemType | InstructionGlobalItemType }) {
    if (instruct.type === 'music' || instruct.type === 'video') {
      state.instruction.push(instruct)
    } else {
      stage.instruction.push(instruct)
    }
  },
  updateInstruction(state: State, { stage, instruct, index }: { stage: Stage, index: number, instruct: InstructionItemType | InstructionGlobalItemType }) {
    if (instruct.type === 'music' || instruct.type === 'video') {
      state.instruction.splice(index, 1, instruct)
    } else {
      stage.instruction.splice(index, 1, instruct)
    }
  },
  deleteInstruction(state: State, { stage, instruct, index }: { stage: Stage, index: number, instruct: InstructionItemType | InstructionGlobalItemType }) {
    if (instruct.type === 'music' || instruct.type === 'video') {
      state.instruction.splice(index, 1)
    } else {
      stage.instruction.splice(index, 1)
    }
  },
  checkInstruction(state: State) {
    for (const stage of state.stages) {
      fixStageInstruction(stage)
    }
  },
  autoGenerateInstruction(state: State, stage: Stage) {
    stage.instruction = generateInstruction(stage)
    fixStageInstruction(stage)
  },
  autoGenerateAllInstruction(state: State) {
    for (const stage of state.stages) {
      stage.instruction = generateInstruction(stage)
    }
    mutations.checkInstruction(state)
  },
  resetToInitial(state: State, { stage, type, index }: {
    stage: Stage,
    type: StageParameterType,
    index: number,
  }) {
    pushHistory(stage, type)
    const init = stage.parameter[type].units[index].init
    const change = getChange(stage.parameter[type].units[index].change)
    Object.assign(change, pickExchangableUnit(init))
  },
  resetToChange(state: State, { stage, type, index }: {
    stage: Stage,
    type: StageParameterType,
    index: number,
  }) {
    pushHistory(stage, type)
    const init = stage.parameter[type].units[index].init
    const change = getChange(stage.parameter[type].units[index].change)
    Object.assign(init, pickExchangableUnit(change))
  },
  exchangeInitialAndChange(state: State, { stage, type, index }: {
    stage: Stage,
    type: StageParameterType,
    index: number,
  }) {
    pushHistory(stage, type)
    const init = stage.parameter[type].units[index].init
    const change = getChange(stage.parameter[type].units[index].change)
    const initBase = pickExchangableUnit(init)
    const changeBase = pickExchangableUnit(change)
    Object.assign(change, initBase)
    Object.assign(init, changeBase)
  },
  resetUnit(state: State, { stage, type, index, status }: {
    stage: Stage,
    type: StageParameterType,
    index: number,
    status: 'init' | 'change',
  }) {
    pushHistory(stage, type)

    const unit = getChange(stage.parameter[type].units[index][status])
    const metadata = stage.parameter[type].source.metadata
    if (!metadata) return
    unit.width = metadata.width
    unit.height = metadata.height
    Object.assign(unit, pickUnitBase(defaultParameterValue[type][status]))
  },
  updatePassword(state: State, password: string) {
    state.password = password ? crypto.createHash('md5').update(password).digest('hex') : ''
  },
  updateProtectList(state: State, item: string[]) {
    state.protectList = item
  },
  updateProtect(state: State, protect: boolean) {
    state.protect = protect || false
  },
  // add stageId to `stagesFromOtherProject`
  addStageToSFOP(state: State, stageId: string) {
    state.stagesFromOtherProject.push(stageId)
  },
  removeStageFromSFOP(state: State, stageId: string) {
    const index = state.stagesFromOtherProject.findIndex(id => id === stageId)
    state.stagesFromOtherProject.splice(index, 1)
  },
  afterImageRename(state: State, { directory, oldFileName, newFileName, stage }: { [key: string]: string, stage?: Stage }) {
    let allSource
    if (stage) {
      allSource = flatten(['bg', 'cus', 'fg'].map(type => stage.parameter[type].source))
    } else {
      allSource = flatten(state.stages.map(stage => ['bg', 'cus', 'fg'].map(type => stage.parameter[type].source)))
    }
    allSource.filter(source => {
      if (source.file === 'same') {
        const filename = path.basename(source.reference)
        return path.dirname(source.reference) === directory && filename === oldFileName
      }
      return source.directory === directory && source.file === oldFileName
    })
      .forEach(source => {
        source.metadata.src = source.metadata.src.replace(oldFileName, newFileName)
        if (source.file === 'same') { source.reference = source.reference.replace(oldFileName, newFileName) } else source.file = newFileName
      })
  },
  updateParameter3D(state: State, { key, value }: { key: string, value: any }) {
    if (typeof value === 'number' && isNaN(value)) return
    const stage: Stage = state.stages.find(stage => stage.id === this.state.threed.stageId)
    if (stage) { set(stage.parameter3D, key, value) }
  },
  updateMetadata3D(state: State, options: any) {
    const stage = options.stage
    const cate = options.folderCate
    delete options.folderCate
    delete options.stage
    const metadata3D = stage.parameter[cate].source.metadata3D
    if (metadata3D) Object.assign(metadata3D, options)
    else set(stage.parameter[cate].source, 'metadata3D', options)
  },
  addLoop(state: State, loop: Loop) {
    // 循环使用颜色
    let colors = []
    colors = funColors.filter(color => !state.loops.find(l => l.color === color))
    if (!colors.length) colors = funColors
    loop.color = colors[0]
    if (loop.type !== 'loop') {
      loop.color = state.loops.filter(l => l.type === 'loop').find(l => l.name === loop.name).color
    }

    state.loops.push(loop)
    mutations.sortLoop(state)
  },
  assignLoop(state: State, loop: Loop) {
    const startIndex = state.stages.findIndex(stage => {
      const id = loop[loop.type === 'loop' ? 'start' : 'stage']
      return stage.id === id
    })
    const endIndex = state.stages.findIndex(stage => {
      const id = loop[loop.type === 'loop' ? 'end' : 'stage']
      return stage.id === id
    })
    const count = endIndex - startIndex
    Object.assign(loop, {
      startIndex,
      endIndex,
      count,
    })
  },
  updateLoop(state: State, { index, newLoop }: { index: number, newLoop: Loop }) {
    newLoop = Object.assign(state.loops[index], newLoop)
    mutations.sortLoop(state)
  },
  removeLoop(state: State, index: number) {
    state.loops.splice(index, 1)
    mutations.sortLoop(state)
  },
  sortLoop(stage: State) {
    const loops = state.loops
      // 排序
      .sort((a, b) => {
        const aStartIndex = state.stages.findIndex(stage => stage.id === a.start)
        const aEndIndex = state.stages.findIndex(stage => stage.id === a.end)
        const countA = clamp(aEndIndex - aStartIndex, 0, 10000)

        const bStartIndex = state.stages.findIndex(stage => stage.id === b.start)
        const bEndIndex = state.stages.findIndex(stage => stage.id === b.end)
        const countB = clamp(bEndIndex - bStartIndex, 0, 10000)

        if (countA > countB) return -1
        if (countA < countB) return 1
        return 0
      })
      // 设置颜色
      .map((loop, index) => {
        if (['continue', 'break'].includes(loop.type)) {
          index = state.loops.findIndex(l => l.name === loop.name)
        }
        // 更新index等属性
        mutations.assignLoop(state, loop)
        return loop
      })
    // 排序
    const regularLoops = loops.filter(loop => loop.type === 'loop')
    const continueLoops = loops.filter(loop => loop.type === 'continue')
    const breakLoops = loops.filter(loop => loop.type === 'break')
    state.loops = [...regularLoops, ...continueLoops, ...breakLoops]
  },
  addCondition(state: State, { stage }: { stage: Stage }) {
    const conditionItem = new ConditionItem()
    stage.condition.conditions.push(conditionItem)
  },
  updateCondition(state: State, { stage, key, value }: { stage: Stage, key: string, value: string }) {
    set(stage.condition, key, value)
  },
  removeCondition(state: State, { stage, conditionItem }: { stage: Stage, conditionItem: ConditionItem }) {
    const index = stage.condition.conditions.indexOf(conditionItem)
    stage.condition.conditions.splice(index, 1)
    // 删除子元素
  },
  addConditionGroup(state: State, { stage, conditionGroup }: { state: Stage, conditionGroup: ConditionGroup }) {
    stage.condition.groups.push(conditionGroup)
  },
  removeConditionGroup(state: State, { stage, conditionGroup }: { stage: Stage, conditionGroup: ConditionGroup }) {
    const index = stage.condition.groups.indexOf(conditionGroup)
    stage.condition.groups.splice(index, 1)
    // 删除子元素
  },
  /** 将conditionItem或conditionGrou移动到to中 */
  moveToConditionGroup(state: State, { to, conditionItem, conditionGroup }: { to: ConditionGroup, conditionItem?: ConditionItem, conditionGroup?: ConditionGroup }) {
    if (conditionItem) {
      to.children.push(conditionItem.id)
      conditionItem.parent = to.id
    } else if (conditionGroup) {
      to.children.push(conditionGroup.id)
      conditionGroup.parent = to.id
    }
  },
  /** 将conditionItem或conditionGrou从group中移除 */
  moveOutConditionGroup(state: State, { conditionItem, conditionGroup }: { conditionItem?: ConditionItem, conditionGroup: ConditionGroup }) {
    if (conditionItem) {
      conditionItem.parent = null
      const foundGroup = state.selectedStage.condition.groups.find(_conditionGroup => _conditionGroup.children.includes(conditionItem.id))
      const index = foundGroup.children.indexOf(conditionItem.id)
      foundGroup.children.splice(index, 1)
    } else if (conditionGroup) {
      conditionGroup.parent = null
      const foundGroup = state.selectedStage.condition.groups.find(_conditionGroup => _conditionGroup.children.includes(conditionGroup.id))
      const index = foundGroup.children.indexOf(conditionGroup.id)
      foundGroup.children.splice(index, 1)
    }
  },
}

const actions = {
  createProject({ state, commit, dispatch }: ActionContext<State, *>, projectPath: string): Promise<*> {
    return Promise.resolve().then(() => {
      const project = new Project()
      commit('loadProject', project)
      commit('newStage')
      commit('selectStage', state.stages[0])
      commit('changeProjectPath', projectPath)
      return dispatch('saveProject')
    })
  },
  openProject({ commit }: ActionContext<State, *>, projectPath: string) {
    beforeOpenProject()
    commit('changeLockAction', true)
    return openProject(projectPath).then(async(project) => {
      try {
        const changedMedia = checkChangedMedia(project)
        if (changedMedia.length) {
          Message.warning(`Warning: ${changedMedia.length} images/videos have been modified`)
          await compressMedia(changedMedia)
        }
      } catch (err) { console.error(err) }
      commit('loadProject', project)
      commit('changeProjectPath', projectPath)
      return project
    }).then(project => {
      commit('changeLockAction', false)
      setTimeout(() => {
        // 延迟防止delete时emit的Eevent未来得及注册。通过project.ic文件打开会出现此情况
        deleteUnnecessaryImages(project, projectPath)
      }, 10000)
      return project
    }).catch(err => {
      Message.warning('' + err)
      commit('changeLockAction', false)
    })
  },
  async saveProject({ state, commit }: ActionContext<State, *>, fromProjectPath?: string) {
    commit('changeLockAction', true)
    await ipcSaveProject(state, fromProjectPath)
    commit('changeLockAction', false)
  },
  exportProject({ commit }: ActionContext<State, *>) {
    return Promise.resolve().then(() => {
      commit('changeLockAction', true)
      const project = state2Project(state)
      if (state.projectPath) {
        return exportProject(project, state.projectPath)
      } else {
        throw new Error('must be save it before your export')
      }
    }).then(() => {
      commit('changeLockAction', false)
    }).catch(err => {
      commit('changeLockAction', false)
      throw err
    })
  },
  async checkErrors({ commit, state }: ActionContext<State, *>) {
    const project = state2Project(state)
    const stageErrors = await checkErrorForStages(project.stages)

    commit('sortLoop')
    const loopErrors = await checkErrorForLoops(project)

    const projectErrors = await checkErrorForProject(project, state.projectPath)
    commit('checkInstruction')
    commit('setErrors', [...stageErrors, ...projectErrors, ...loopErrors])
  },
  comparePassword({ state }: ActionContext<State, *>, password: string): boolean {
    return state.password === crypto.createHash('md5').update(password).digest('hex')
  },
  async addConditionGroup({ commit, state }) {
    return MessageBox.prompt('Input Group name').then(({ value: name }) => {
      if (!name) return Promise.reject(new Error('the name cannot be null'))
      const conditionGroup = new ConditionGroup(name)
      const stage = state.selectedStage
      commit('addConditionGroup', { stage, conditionGroup })
      return conditionGroup
    })
  },
}

const AUTO_SAVE_MUTATION: Array<$Keys<typeof mutations>> = [
  'updateSnapshot',
  'updateStageDescription',
  'updateStageSetting',
  'addStage',
  'deleteStage',
  'copyStage',
  'copyStageAsSame',
  'moveStage',
  'addStage',
  'updateStageTransition',
  'deleteStageTransition',
  'updateStageAction',
  'updateStageSource',
  'addStageParameterUnit',
  'updateStageParameterUnitValue',
  'updateStageParameterUnit', // TODO: this may be called by click rect
  'updateStageParameterCommon',
  'deleteStageParameterUnit',
  'resetToInitial',
  'resetToChange',
  'exchangeInitialAndChange',
  'resetUnit',
  'updateStageType',
  'addInstruction',
  'updateInstruction',
  'deleteInstruction',
  'checkInstruction',
  'autoGenerateInstruction',
  'autoGenerateAllInstruction',
  'deleteStageSource',
  'changeStageSourceType',
  'changeObjImage',
  'updatePassword',
  'updateProtectList',
  'updateProtect',
]

const context = require.context('./project', false, /\.js$/)
const modules = context.keys().map(key => context(key).default).reduce((pre, current, i) => {
  pre[current.name] = current
  return pre
}, {})

export default {
  name: 'project',
  state,
  getters,
  mutations,
  actions,
  modules,
  subscribe(mutation: { type: $Keys<typeof mutations>, payload: any }, state: { project: State }) {
    if (AUTO_SAVE_MUTATION.includes(mutation.type)) {
      console.log(mutation.type)
      autoSaveProject(state.project)
    }
  },
  watch: [],
}

mutations.newStage(state)
mutations.selectStage(state, state.stages[0])
