// @flow
// some helper function for project
import Vue from 'vue'
import fs from 'fs-extra'
import R, { bind, join, equals, add, pick, clone, omit, groupBy, toUpper, last, flatten } from 'ramda'
import { chain, set, get, remove, sum, merge, isEqual } from 'lodash'
import { Stage, defaultInstruction, defaultParameterValue, ConditionGroup } from 'type/stage'
import os from 'os'
import path from 'path'
import url from 'url'
import {
  trimZero2,
  trimZero,
  writeFileWithEncode,
  imageSize,
  fileType,
  compressImageToSize,
  compressImage,
  fixImgExtName,
} from './utils'
import {
  getSourceRelativeSrc,
  getSourceSrc,
  urlToPath,
  pathToUrl,
} from './helper'
import PersonImage from '@/assets/people.png'
import InstructionStatic from '../static/instruction'
import Layer from 'lib/layer'
import { toJpeg } from 'lib/dom2image'
import type { Project, StageError, ProjectError, File } from 'type/project'
import type {
  StageParameterType,
  SourceType,
  StageParameterSingle,
  StageParameterUnit,
  UnitBase,
  ChangeTypeAdded,
  OBJUnit,
  ResourceMetadata,
  InstructionItemType,
  InstructionGlobalItemType,
} from 'type/stage'
import {
  CHG_CTR_FOLLOW_TWO_HANDS_ACTION,
  E_INVALID_PROJECT,
  RENAME_FILE,
  RENAME_FILE_COMPLETED,
  EV_LOADING_OPEN,
  REFRESH_RESOURCE,
  EV_LOADING_CLOSE,
  ILEGAL_NAME,
  RESOURCE_DELETE_FILE,
} from 'type/constants'
import { isSourceReference, getSourceType } from 'lib/helper'
import domToImage from 'dom-to-image'
import Color from 'color'
import { versionFormatter } from './version-manager'
import { Message } from 'element-ui'
import csv from 'csvtojson'
import { remote } from 'electron'
import { GifFrame, GifUtil, GifCodec } from 'gifwrap'
import ffmpeg from 'fluent-ffmpeg'
import jimp from 'jimp'

ffmpeg.setFfmpegPath(path.join(remote.app.getPath('userData'), 'static/ffmpeg/bin/ffmpeg.exe'))
ffmpeg.setFfprobePath(path.join(remote.app.getPath('userData'), 'static/ffmpeg/bin/ffprobe.exe'))

// $FlowFixMe
const CommonCSSString: string = require('raw-loader!stylus-loader!@/static/common-style.styl') // eslint-disable-line
const trimZero3 = value => trimZero(value, 3)
const joinSpace = join('')
const sameHolder = ['same', '']
const sameHolder3d = ['same3D', '']
const parameterPrefixMap: {
  [type: StageParameterType]: string,
} = {
  bg: 'BG',
  fg: 'FG',
  cus: 'Cus',
  obj: 'Obj',
}

const parameterUnitPrefixMap: {
  [type: StageParameterType]: string,
} = {
  bg: 'background',
  fg: 'foreground',
  cus: 'Customer',
  obj: '',
}

export function getStageName(stage: Stage, index: number): string {
  switch (stage.type) {
    case 'end':
      return 'stage0'
    case 'preEnd':
      return 'stage01'
    default:
      return 'stage' + (index + 1)
  }
}

function getStageSuffixName(stage: Stage) {
  switch (stage.type) {
    case 'if':
      return '.if'
    default:
      return '.stage'
  }
}

/** 取toStage的文件名，形如，stage1.stage, stage2.loopst, stage3.if, ... */
export function getStageFilename(toStage: Stage, fromStage?: Stage, project: Project) {
  const toIndex = project.stages.indexOf(toStage)
  const fromIndex = project.stages.indexOf(fromStage)

  if (!fromStage) {
    return getStageName(toStage, toIndex) + getStageSuffixName(toStage)
  }

  const regularLoops = project.loops.filter(loop => loop.type === 'loop')
  const continueLoops = project.loops.filter(loop => loop.type === 'continue')
  const breakLoops = project.loops.filter(loop => loop.type === 'break')
  // 进入Loop
  const enterLoop = regularLoops.find(loop => {
    return loop.start === toStage.id
  })
  // 离开loop
  const leaveLoop = regularLoops.slice().reverse().find(loop => {
    return loop.end === fromStage.id
  })
  // continue
  const continueLoop = continueLoops.slice().reverse().find(loop => {
    return loop.stage === fromStage.id
  })
  // break
  const breakLoop = breakLoops.slice().reverse().find(loop => {
    return loop.stage === fromStage.id
  })
  if (continueLoop) {
    return `${continueLoop.name}_${getStageName(fromStage, fromIndex)}.continue`
  } else if (breakLoop) {
    return `${breakLoop.name}_${getStageName(fromStage, fromIndex)}.break`
  } else if (leaveLoop) {
    return `${leaveLoop.name}.looped`
  } else if (enterLoop) {
    return `${enterLoop.name}.loopst`
  } else {
    return getStageName(toStage, toIndex) + getStageSuffixName(toStage)
  }
}

function compressArray(array: [string, any][]): string {
  return array.map(line => {
    if ([sameHolder, sameHolder3d].includes(line)) {
      return line[0]
    }
    return line.join('=')
  }).join(os.EOL)
}

export function getStageShaderChoice(stage: Stage): number {
  return parseInt(['obj', 'cus', 'fg', 'bg'].map(type => stage.isParameterEnabled(type) ? 1 : 0).join(''), 2)
}

export function getAllgodies(stages: Stage[]) {
  const goodies = []
  stages.forEach(stage => {
    stage.instruction.filter(instr => instr.type === 'goody').forEach(instr => {
      goodies.push(instr)
    })
  })
  return goodies
}

function formatParameterInStage(type: StageParameterType, source: SourceType, stagePrefix: string): [string, string][] {
  const output = []
  const prefix = parameterPrefixMap[type]
  if (type !== 'obj') {
    output.push([`${prefix}directory`, source.directory.toLowerCase() !== 'same' ? path.sep + source.directory : source.directory])
    if (isThreeDImage(urlToPath(source.metadata.src))) {
      const fileName = source.metadata3D.fileName
      output.push([`${prefix}ImageFileName`, source.file === 'same' ? source.file : fileName])
    } else {
      output.push([`${prefix}ImageFileName`, source.file.toLowerCase() === 'random' ? 'RANDOM' : source.file])
    }
  }

  const exist3D = type !== 'obj' && isThreeDImage(urlToPath(get(source, 'metadata.src')))
  if (exist3D) {
    output.push([`${prefix}TxtFile`, `${stagePrefix}.${type}3d`])
    output.push([`${prefix}TxtChange`, `${stagePrefix}.${type}c3d`])
  } else {
    output.push([`${prefix}TxtFile`, `${stagePrefix}.${type}`])
    output.push([`${prefix}TxtChange`, `${stagePrefix}.${type}c`])
  }
  return output
}

export function formatStage(project: Project, stage: Stage, stagePrefix: string): string {
  const output = []
  const push = bind(output.push, output)
  push(['curPeopleNo', stage.getCurPeopleNo()])
  push(['shaderChoice', getStageShaderChoice(stage)])

  // output action
  push(['stageAction', parseInt(joinSpace(stage.action.stageAction), 10)])
  if (stage.action.stageAction[0] === '1') {
    push(['actROI', stage.action.actROI])
    if (stage.action.actROI === '0') {
      push(['actTLx', stage.action.actTLx])
      push(['actTLy', stage.action.actTLy])
      push(['actBRx', stage.action.actBRx])
      push(['actBRy', stage.action.actBRy])
    }
  }
  if (stage.action.stageAction[0] === '2') {
    push(['angelSensible', stage.action.angelSensible])
  }

  if (['4', '5', '6', '7', '8'].includes(stage.action.stageAction[0])) {
    push(['MoveThr', stage.action.MoveThr])
  }
  // output parameter
  for (const type of ['bg', 'fg', 'cus', 'obj']) {
    if (!stage.isParameterEnabled(type)) continue
    const para = formatParameterInStage(type, stage.parameter[type].source, `${stagePrefix}`)
    push(...para)
  }
  if (output.find(field => /3d$/.test(field[1]))) {
    push(['3DEnvironment', `${stagePrefix}.env3d`])
  }

  // output transition
  push(['stageChoices', stage.transition.length])
  stage.transition.forEach(transition => {
    if (typeof transition.stageFile === 'number') {
      const toStage = project.stages[transition.stageFile]
      push(['stageFile', getStageFilename(toStage, stage, project)])
    } else {
      const type = project.stages[transition.stageFile.match(/[0-9]+/)].type
      let stageFile
      switch (type) {
        case 'normal':
          stageFile = transition.stageFile
          break
        case 'preEnd':
          stageFile = 'stage01.stage'
          break
        case 'end':
          stageFile = 'stage0.stage'
          break
      }
      push(['stageFile', stageFile])// random stage
      const stages = transition.stages.map(id => {
        const stageNum = project.stages.findIndex(s => s.id === id) + 1
        return 'stage' + stageNum
      })
      push(['stages', stages.join('.stage,') + '.stage'])
    }

    push(['NextStage', parseInt(joinSpace(transition.NextStage))])
    const ComNextStage = equals(transition.NextStage)
    if (ComNextStage(['1', '1'])) {
      push(['NextStageTime', transition.NextStageTime])
    } else if (ComNextStage(['1', '2'])) {
      push(['ROITimes', transition.ROITimes])
      push(['hitAction', transition.hitAction])
    } else if (ComNextStage(['1', '3'])) {
      push(['NextStageTime', transition.NextStageTime])
      push(['EndTimeChoice', transition.EndTimeChoice])
    }

    if (['2', '3'].includes(transition.NextStage[0])) {
      push(['ROI', transition.ROI])
      if (transition.ROI === '0') {
        push(['TLx', transition.TLx])
        push(['TLy', transition.TLy])
        push(['BRx', transition.BRx])
        push(['BRy', transition.BRy])
      }
    }

    if (['6', '7', '8', '9', '10'].includes(transition.NextStage[0])) {
      push(['MoveThr', transition.MoveThr])
    }

    if (transition.goodies && transition.goodies.length) {
      push(['GoodiesNum', transition.goodies.length])
      transition.goodies.forEach(goody => {
        const i = getAllgodies(project.stages).findIndex(g => g.name === goody.name) + 1
        const name = `Goody${i}`
        push(['GoodyName', name])
        push(['GoodyChangeMethod', goody.method])
        push(['GoodyChangeValue', goody.changeValue])
      })
    }
  })

  return compressArray(output)
}

export function formatIfStage(project: Project, stage: Stage, stagePrefix: string): string {
  stage = clone(stage)
  const { then: thenId, else: elseId, conditions, groups } = stage.condition
  const then = project.stages.find(s => s.id === thenId)
  const els = project.stages.find(s => s.id === elseId)
  const output = []
  const push = bind(output.push, output)
  push(['TagName', stagePrefix])
  push(['ThenStageName', getStageFilename(then, stage, project)])
  push(['ElseStageName', getStageFilename(els, stage, project)])

  // 输出conditions
  const exportConditions = (arr) => {
    push(['ConditionNum', arr.length])
    arr.forEach(conditionItem => {
      // Loop
      if (conditionItem.type === 1) {
        push(['ConditionType', 0])
        push(['LoopName', conditionItem.name])
        push(['LoopMethod', conditionItem.method])
      }
      // Goody
      if (conditionItem.type === 0) {
        push(['ConditionType', 1])
        const i = getAllgodies(project.stages).findIndex(g => g.name === conditionItem.name) + 1
        const name = `Goody${i}`
        push(['GoodyName', name])
        push(['GoodyMethod', conditionItem.method])
      }
      push(['Threshold', conditionItem.threshold])
      push(['CompareMethod', conditionItem.compare])
      push(['Logic', conditionItem.logic])
    })
  }
  // 输出groups
  const exportGroups = (arr) => {
    let groupIndex = 1
    arr.forEach(conditionGroup => {
      push(['GroupIndex', groupIndex++])
      push(['GroupLogic', conditionGroup.logic])
      // 输出子groups
      const childGroups = groups.filter(g => g.parent === conditionGroup.id)
      if (childGroups.length) {
        push(['GroupNum', childGroups.length])
        exportGroups(childGroups)
      }
      // 输出此group中的condition
      const childConditions = conditions.filter(item => item.parent === conditionGroup.id)
      if (childConditions.length) {
        exportConditions(childConditions)
      }
    })
  }
  // 输出顶层groups
  const topGroups = groups.filter(g => !g.parent)
  const topConditions = conditions.filter(item => !item.parent)
  // 最外层有group时，最外层condition做多个group处理
  // 最外层没有group时，最外层condition做一个group助理
  if (topGroups.length) {
    push(['GroupNum', topGroups.length + topConditions.length])
    topConditions.forEach(item => {
      const group = new ConditionGroup('wrapper')
      item.parent = group.id
      group.logic = item.logic
      group.children.push(item.id)
      // 输出顶层conditions
      topGroups.push(group)
    })
    exportGroups(topGroups)
  } else {
    // 输出顶层conditions
    push(['GroupNum', 1])
    const group = new ConditionGroup('wrapper')
    topConditions.forEach(item => {
      item.parent = group.id
      group.logic = topConditions[0].logic
      group.children.push(item.id)
    })
    exportGroups([group])
  }

  return compressArray(output)
}

export function formatParameter(type: StageParameterType, para: StageParameterSingle<any, any, any>, stage: Stage): [string, string] {
  let init = []
  let change = []
  const units = para.units

  function pushTwo(unit: StageParameterUnit<*, *>, label: string, key: string, formatterInit?: Function, formatterChange?: Function) {
    if (!formatterChange) formatterChange = formatterInit
    const defulatUnit = clone(defaultParameterValue[type])
    const initKeyValue = unit.init.hasOwnProperty(key) ? unit.init[key] : defulatUnit.init[key]
    const changeKeyValue = unit.change.hasOwnProperty(key) ? unit.change[key] : defulatUnit.change[key]
    const key2 = key + '2'
    const initKeyValue2 = unit.init.hasOwnProperty(key2) ? unit.init[key2] : defulatUnit.init[key2]
    const changeKeyValue2 = unit.change.hasOwnProperty(key2) ? unit.change[key2] : defulatUnit.change[key2]
    const getRange = (x, y) => {
      const min = Math.min(x, y)
      const minVal = formatterInit ? formatterInit(min) : min
      const max = Math.max(x, y)
      const maxVal = formatterInit ? formatterInit(max) : max
      const value = `r${minVal},${maxVal}`
      return value
    }

    if (isRandomPara(initKeyValue2)) {
      init.push([label, getRange(initKeyValue, initKeyValue2)])
    } else {
      init.push([label, formatterInit ? formatterInit(initKeyValue) : unit.init[key]])
    }

    if (isRandomPara(changeKeyValue2)) {
      change.push([label, getRange(changeKeyValue, changeKeyValue2)])
    } else {
      change.push([label, formatterChange ? formatterChange(changeKeyValue) : unit.change[key]])
    }
  }

  function pushInit(value: any, label: string, key: string, formatter?) {
    init.push([label, formatter ? formatter(value[key]) : value[key]])
  }

  function pushChange(value: any, label: string, key: string, formatter?) {
    change.push([label, formatter ? formatter(value[key]) : value[key]])
  }

  init.push([`GroupNo`, units.length])
  init.push(['clean', para.init.clean])

  if (para.init.hasOwnProperty('playVideo')) {
    init.push([`${parameterUnitPrefixMap[type]}No`, para.init.playVideo ? '1' : '0'])
  }
  if (para.change.hasOwnProperty('playVideo')) {
    change.push([`${parameterUnitPrefixMap[type]}No`, para.change.playVideo ? '1' : '0'])
  }
  if (para.init.hasOwnProperty('videoLoop')) {
    init.push([`LoopVideo`, para.init.videoLoop ? '1' : '0'])
  }

  para.units.forEach((unit, index) => {
    unit = (unit: StageParameterUnit<UnitBase, UnitBase & ChangeTypeAdded>)
    const initStart = init.push(['No', index + 1])
    const changeStart = change.push(['No', index + 1])
    const chgCtrNextIndex = change.push(['ChgCtr', unit.change.chgCtr])

    let twoHands = false
    if (unit.change.chgCtr === '1' || unit.change.chgCtr === '5') {
      change.push(['TimeCh', unit.change.timeCh])
      change.push(['StepOrEnd', unit.change.stepOrEnd])
    } else if (unit.change.chgCtr === '3') {
      change.push(['StickItem', unit.change.stickItem])
    }
    if (unit.change.chgCtr === CHG_CTR_FOLLOW_TWO_HANDS_ACTION) {
      twoHands = true
    }

    const toRdian = v => trimZero2(v / 180 * Math.PI)
    pushTwo(unit, 'x0', 'x0', trimZero, trimZero2)
    pushTwo(unit, 'y0', 'y0', trimZero, trimZero2)
    pushTwo(unit, 'width', 'width', trimZero, trimZero2)
    pushTwo(unit, 'height', 'height', trimZero, trimZero2)
    pushTwo(unit, 'initialx', 'x', trimZero, trimZero2)
    pushTwo(unit, 'initialy', 'y', trimZero, trimZero2)
    pushTwo(unit, 'initialscalex', 'scaleX', trimZero2)
    pushTwo(unit, 'initialscaley', 'scaleY', trimZero2)
    pushTwo(unit, 'initialalpha', 'opacity', trimZero2)
    pushTwo(unit, 'initialangle', 'angle', trimZero)
    pushTwo(unit, 'intialshearH', 'skewV', toRdian)
    pushTwo(unit, 'initialshearV', 'skewH', toRdian)
    if (twoHands) {
      change = change.slice(0, -12) // 删除掉上面pushTwo的内容

      for (const twoHandsType of ['up', 'down', 'rotation', 'antiRotation']) {
        const value = stage.getDeltaValue(type, index, twoHandsType)
        // $FlowFixMe
        change.push([twoHandsType.toUpperCase()])
        pushChange(value, 'x0', 'x0', trimZero2)
        pushChange(value, 'y0', 'y0', trimZero2)
        pushChange(value, 'width', 'width', trimZero2)
        pushChange(value, 'height', 'height', trimZero2)
        pushChange(value, 'initialx', 'x', trimZero2)
        pushChange(value, 'initialy', 'y', trimZero2)
        pushChange(value, 'initialscalex', 'scaleX', trimZero2)
        pushChange(value, 'initialscaley', 'scaleY', trimZero2)
        pushChange(value, 'initialalpha', 'opacity', trimZero2)
        pushChange(value, 'initialangle', 'angle', trimZero)
        pushChange(value, 'intialshearH', 'skewV', toRdian)
        pushChange(value, 'initialshearV', 'skewH', toRdian)
      }
    }
    init.push(['foreGDReplaceinfo', 10 * parseInt(unit.init.transparencyChange, 10) + parseInt(unit.init.colorChange, 10)])
    change.push(['foreGDReplaceinfo', 10 * parseInt(unit.change.transparencyChange, 10) + parseInt(unit.change.colorChange, 10)])
    if (type === 'cus') {
      pushTwo(unit, 'customerPosIni', 'customerPosIni')
    }
    if (type === 'obj') {
      // unit = (unit: StageParameterUnit<OBJUnit, *>)
      init.push(['Skinsmooth', +unit.init.skinSmooth])
      init.push(['ColorSatAdj', trimZero2(add(unit.init.brighterness, unit.init.saturation))])
      init.push(['handpower', +unit.init.handPower])
    }
    if (unit.change.chgCtr === '0') {
      change.splice(chgCtrNextIndex)
    }
    if (unit.init.keep) {
      init.splice(initStart)
      init.push(sameHolder)
    }
    if (unit.change.keep) {
      change.splice(changeStart)
      change.push(sameHolder)
    }
  })
  return [compressArray(init), compressArray(change)]
}

export async function format3D(para: StageParameterSingle<any, any, any>, projectPath: string): string {
  const d3 = []
  const metadata = para.source.metadata3D
  if (!metadata) return ''
  const keep3d = get(metadata, 'keep')
  if (keep3d) {
    d3.push(sameHolder3d)
  } else {
    d3.push(['ModelPosX', metadata.position.x])
    d3.push(['ModelPosY', metadata.position.y])
    d3.push(['ModelPosZ', metadata.position.z])
    d3.push(['ModelScaleX', metadata.scale.x])
    d3.push(['ModelScaleY', metadata.scale.y])
    d3.push(['ModelScaleZ', metadata.scale.z])
    d3.push(['ModelRotX', metadata.rotation.x])
    d3.push(['ModelRotY', metadata.rotation.y])
    d3.push(['ModelRotZ', metadata.rotation.z])
    const { r, g, b } = Color(metadata.lightColor).object()
    d3.push(['LightColorR', r * metadata.colorIntensity])
    d3.push(['LightColorG', g * metadata.colorIntensity])
    d3.push(['LightColorB', b * metadata.colorIntensity])
    d3.push(['LightColorA', 1])
    d3.push(['LightPosX', metadata.lightPosition.x])
    d3.push(['LightPosY', metadata.lightPosition.y])
    d3.push(['LightPosZ', metadata.lightPosition.z])
    d3.push(['LightRadius', 500])
    d3.push(['ModelRotRateX', get(metadata, 'rotationRate.x')])
    d3.push(['ModelRotRateY', get(metadata, 'rotationRate.y')])
    d3.push(['ModelRotRateZ', get(metadata, 'rotationRate.z')])
    if (get(metadata, 'animationMotion') && get(metadata, 'fileName')) {
      const dir = path.dirname(urlToPath(para.source.metadata.src))
      const csvPath = path.join(dir, path.basename(metadata.fileName, path.extname(metadata.fileName)) + '.csv')
      if (fs.existsSync(csvPath)) {
        const data = await csv().fromFile(csvPath)
        const row = data.find(row => row.Action === metadata.animationMotion)
        const start = parseFloat(row.StartFrame) / parseFloat(row.TotalFrameNo) * 100
        const stop = parseFloat(row.StopFrame) / parseFloat(row.TotalFrameNo) * 100
        d3.push(['End3DFrameNo', parseFloat(stop)])
        d3.push(['ModelSpecularPower', get(metadata, 'specularPower')])
        d3.push(['Start3DFrameNo', parseFloat(start)])
      }
    } else {
      d3.push(['End3DFrameNo', get(metadata, 'animationRange[1]')])
      d3.push(['ModelSpecularPower', get(metadata, 'specularPower')])
      d3.push(['Start3DFrameNo', get(metadata, 'animationRange[0]')])
    }
    d3.push(['controlAvatar', get(metadata, 'controlAvatar') || 0])
  }
  return compressArray(d3)
}

export function convertInstruction(instr: InstructionItemType | InstructionGlobalItemType, isStart?: boolean) {
  let temp
  switch (instr.type) {
    case 'text':
      return {
        ...omit(['position'], instr),
        class: '',
        id: instr.position.toLowerCase() + 'text',
      }
    case 'image':
      return {
        ...omit(['position'], instr),
        class: '',
        src: path.join('sysimg', instr.src),
        id: instr.position.toLowerCase() + 'img',
      }
    case 'photo':
      return {
        ...instr,
        takephoto: 'true',
      }
    case 'music':
      temp = {
        ...omit(['start', 'stop'], instr),
        src: path.join(instr.src),
        loop: String(instr.loop).toString(),
      }
      if (isStart) {
        return {
          ...temp,
          delay: instr.start.delay,
          status: 'continue',
        }
      } else {
        return {
          ...temp,
          delay: instr.stop.delay,
          status: 'remove',
        }
      }
    case 'video':
      temp = {
        ...omit(['start', 'stop'], instr),
      }
      if (isStart) {
        return {
          ...temp,
          delay: instr.start.delay,
          takevideo: 'true',
          stopvideo: 'false',
        }
      } else {
        return {
          ...temp,
          delay: instr.stop.delay,
          takevideo: 'false',
          stopvideo: 'true',
        }
      }
    case 'command':
      return {
        ...instr,
      }
    case 'goody':
      return {
        img: path.join('goodies', instr.img),
        ...instr,
      }
  }
  return instr
}

export function resolveOutputJsonSrc(src: string) {
  const reg = new RegExp('\\' + path.sep, 'g')
  return './' + path.posix.normalize(src.replace(reg, '/'))
}

export async function generateThemeJson(project: Project, projectPath: string) {
  const output = {}
  const { base } = path.parse(projectPath)
  await fs.ensureDir(path.join(projectPath, 'thumbnail'))
  let goodyIndex = 1
  for (let index = 0; index < project.stages.length; index++) {
    const stage = project.stages[index]
    const stageName = getStageName(stage, index)
    const thumbnail = 'thumbnail/stage' + (index + 1) + '.jpg'
    const goodies = {}
    const values = merge(output[stageName], {
      stage: [],
      description: stage.description,
      thumbnail: thumbnail,
      goodies,
    })
    // 全局指令
    project.instruction.forEach(instr => {
      if (instr.start.stage === stage.id) {
        values.stage.push(convertInstruction(instr, true))
      } else if (instr.stop.find(stop => stop.stage === stage.id)) {
        values.stage.push(convertInstruction(instr, false))
      }
    })

    const goodyInstruction = stage.instruction.filter(instr => instr.type === 'goody')
    goodyInstruction.forEach((instr) => {
      const key = `goodie${goodyIndex++}`

      let x = 0
      let y
      let i
      const size = 100
      switch (instr.position) {
        case 'topRight':
          i = goodyInstruction.filter(instr => instr.position === 'topRight').indexOf(instr)
          y = i * size // 高度防止重叠
          x = 1980 - size - 200 // 最右侧 - margin-right - 自身宽度
          y += 50
          break
        case 'bottomLeft':
          i = goodyInstruction.filter(instr => instr.position === 'bottomLeft').indexOf(instr)
          y = i * size // 高度防止重叠
          x = size
          y = 1080 - size - y
          break
        case 'bottomRight':
          i = goodyInstruction.filter(instr => instr.position === 'bottomRight').indexOf(instr)
          y = i * size //
          x = 1980 - size - 200
          y = 1080 - size - y
          break
      }

      values.goodies[key] = {
        name: instr.name || '',
        img: instr.image,
        gap: 10,
        scale: 1,
        initNum: instr.initNum,
        status: 'continue',
        x,
        y,
        css: {
          main: {},
          img: {},
          text: {
            'font-size': '24px',
            'color': 'white',
          },
        },

      }

      const endStage = project.stages.find(s => s.id === instr.endStage)
      if (endStage && endStage.type !== 'preEnd') {
        const stageName = getStageName(endStage, project.stages.indexOf(endStage))
        set(output, `${stageName}.goodies.${key}`, Object.assign({}, values.goodies[key], { status: 'remove' }))
      }
    })

    // stage指令
    stage.instruction
      .filter(instr => !['goody'].includes(instr.type))
      .forEach(instr => {
        values.stage.push(convertInstruction(instr))
      })

    values.stage.forEach(instr => {
      if (instr && instr.src) {
        instr.src = resolveOutputJsonSrc(instr.src)
      }
    })

    const group = groupBy(s => s.id, values.stage)
    Object.values(group).forEach((item: any) => {
      item.forEach((instr, index) => instr.id += index + 1)
    })

    // 删除以便顺序清晰
    const deleted = output[stageName] || {}
    delete output[stageName]

    output[stageName] = Object.assign(deleted, values)
  }
  return {
    [base]: output,
  }
}

export async function exportStage(project: Project, stage: Stage, projectPath: string, stageName: string) {
  try {
    if (stage.type === 'if') {
      const stageString = formatIfStage(project, stage, stageName)
      writeFileWithEncode(path.join(projectPath, `${stageName}.if`), stageString, 'Windows936')
    } else {
      const stageString = formatStage(project, stage, stageName)
      // write main stage file
      writeFileWithEncode(path.join(projectPath, `${stageName}.stage`), stageString, 'Windows936')
    }

    // await fs.writeFile(path.join(projectPath, `${stageName}.stage`), stageString)
    for (const type of ['bg', 'fg', 'cus', 'obj']) {
      if (!stage.isParameterEnabled(type)) continue
      // calc value
      const newParameter = clone(stage.parameter[type])
      newParameter.units.forEach((unit, index) => {
        switch (stage.getChangeMode(type, index)) {
          case 'delta':
            unit.change = stage.getDeltaValue(type, index)
            break
          case 'stick':
            unit.change = stage.getStickValue(type, index)
            break
        }
      })
      const [init, change] = formatParameter(type, newParameter, stage)
      fs.writeFileSync(path.join(projectPath, `${stageName}.${type}`), init)
      fs.writeFileSync(path.join(projectPath, `${stageName}.${type}c`), change)
      if (newParameter.source.metadata3D) {
        const data3d = init + os.EOL + await format3D(newParameter, projectPath)
        fs.writeFileSync(path.join(projectPath, `${stageName}.${type}3d`), data3d)
      }
      fs.writeFileSync(path.join(projectPath, `${stageName}.${type}c3d`), change)
    }
  } catch (err) {
    throw `Stage${project.stages.indexOf(stage) + 1}\n Detail: ${err}`
  }
}

export async function exportProject(project: Project, projectPath: string) {
  const $path = (...args) => path.join(projectPath, ...args)
  let maxPeople = 1
  let threeDMode = false

  // output stage/parameter
  for (const stage of project.stages) {
    const index = project.stages.indexOf(stage)
    maxPeople = Math.max(maxPeople, stage.getCurPeopleNo())
    await exportStage(project, stage, projectPath, getStageName(stage, index))
  }

  const regularLoops = project.loops.filter(({ type }) => type === 'loop')
  const continueLoops = project.loops.filter(({ type }) => type === 'continue')
  const breakLoops = project.loops.filter(({ type }) => type === 'break')

  // 输出loop入口文件
  for (const loop of regularLoops) {
    const startFileName = `${loop.name}.loopst`
    let start = `TagName=${loop.name}${os.EOL}`
    start += `EndCondition=${loop.loopNumber}${os.EOL}`
    const index = project.stages.findIndex(stage => {
      return stage.id === loop.start
    })
    const loops = regularLoops.slice().reverse().filter(l => l !== loop)
    // TODO: 两个Loop的start在同一个stage，end也在同一个stage，该怎么判断嵌套
    // loop包含另一个loop,且start在同一个stage，end不在同一个stage
    const toLoop = loops.find(l => {
      if (loop.startIndex === l.startIndex) return loop.count > l.count
      else return false
    })
    if (toLoop) {
      start += `NextStageName=${toLoop.name}.loopst`
    } else {
      const stage = project.stages[index]
      const suffix = getStageSuffixName(stage)
      start += `NextStageName=${getStageName(stage, index)}${suffix}${os.EOL}`
    }
    fs.writeFileSync(path.join(projectPath, startFileName), start)
  }

  // 输出looped文件和continue、break
  const reversedLoops = project.loops.slice().reverse()
  for (const loop of reversedLoops) {
    let text = `TagName=${loop.name}${os.EOL}`
    const stage = project.stages.find(stage => {
      if (loop.type === 'loop') {
        return stage.id === loop.end
      } else {
        return stage.id === loop.stage
      }
    })
    let toIndex
    if (stage.type === 'if') {
      toIndex = project.stages.findIndex(s => s.id === stage.condition.then)
    } else {
      toIndex = get(stage, 'transition.0.stageFile')
    }
    const toStage = project.stages[toIndex]
    if (!toStage) continue
    // TODO: 两个Loop的start在同一个stage，end也在同一个stage，该怎么判断嵌套
    // loop是否嵌套于另一个loop中,且end在同一个stage，start不在用同一个stage
    const slicedLoops = reversedLoops.filter((l, i) => l !== loop && i < reversedLoops.indexOf(loop))
    const toContinue = slicedLoops.find(l => l.stage === loop.stage && l.type === 'continue')
    const toBreak = slicedLoops.find(l => l.stage === loop.stage && l.type === 'break')
    const toLooped = reversedLoops.find(l => {
      if (loop.endIndex === l.endIndex && loop.count < l.count) return true
      return false
    })
    const toOtherLoop = reversedLoops.find(l => {
      if (l.start === toStage.id) return true
      return false
    })
    // remove(loops, item => [toContinue, toBreak, toLooped, toOtherLoop].includes(item))
    if (toContinue) {
      const stage = project.stages.find(stage => stage.id === toContinue.stage)
      const stageIndex = project.stages.indexOf(stage)
      text += `NextStageName=${toContinue.name}_${getStageName(stage, stageIndex)}.continue${os.EOL}`
    } else if (toBreak) {
      const stage = project.stages.find(stage => stage.id === toBreak.stage)
      const stageIndex = project.stages.indexOf(stage)
      text += `NextStageName=${toBreak.name}_${getStageName(stage, stageIndex)}.break${os.EOL}`
    } else if (toLooped) {
      text += `NextStageName=${toLooped.name}.looped${os.EOL}`
    } else if (toOtherLoop) {
      text += `NextStageName=${toOtherLoop.name}.loopst${os.EOL}`
    } else {
      const name = getStageFilename(toStage, undefined, project)
      text += `NextStageName=${name}${os.EOL}`
    }
    if (['continue', 'break'].includes(loop.type)) {
      text += `EndMethod=${loop.method}${os.EOL}`
      text += `EndCondition=${loop.condition}${os.EOL}`
    }
    let fileName
    if (loop.type === 'loop') {
      fileName = `${loop.name}.looped`
    } else if (loop.type === 'continue') {
      const stage = project.stages.find(stage => stage.id === loop.stage)
      const stageIndex = project.stages.indexOf(stage)
      fileName = `${loop.name}_${getStageName(stage, stageIndex)}.continue`
    } else if (loop.type === 'break') {
      const stage = project.stages.find(stage => stage.id === loop.stage)
      const stageIndex = project.stages.indexOf(stage)
      fileName = `${loop.name}_${getStageName(stage, stageIndex)}.break`
    }
    fs.writeFileSync(path.join(projectPath, fileName), text)
  }

  // output .env3d
  project.stages.filter(stage => {
    const exist = ['bg', 'cus', 'fg'].map(type => get(stage.parameter[type].source, 'metadata.src'))
      .filter(s => s)
      .map(urlToPath)
      .find(isThreeDImage)
    return !!exist
  }).forEach(stage => {
    threeDMode = true

    const index = project.stages.findIndex(s => s.id === stage.id)
    const { x, y, z } = stage.parameter3D.cameraPosition
    const { x: rotX, y: rotY, z: rotZ } = stage.parameter3D.cameraRotationAngle
    const { x: rateX, y: rateY } = stage.parameter3D.cameraRotationRate
    const { r, g, b } = Color(stage.parameter3D.ambientColor).object()
    const intensity = stage.parameter3D.ambientColorIntensity
    const playSpeed = stage.parameter3D.playSpeed
    fs.writeFileSync($path(`stage${index + 1}.env3d`), compressArray([
      ['CameraPosX', x],
      ['CameraPosY', y],
      ['CameraPosZ', z],
      ['CameraXRotAngle', rotX],
      ['CameraYRotAngle', rotY],
      ['CameraXRotRate', rateX],
      ['CameraYRotRate', rateY],
      ['AmbientColorR', r * intensity],
      ['AmbientColorG', g * intensity],
      ['AmbientColorB', b * intensity],
      ['AmbientColorA', 1],
      ['ClockRate', playSpeed],
    ]))
  })

  // output stageconfig
  const stageConfigData = [
    ['maxPeopleNo', maxPeople],
    ['currentFolder', projectPath],
    ['firstStage', 'stage1.stage'],
  ]
  if (threeDMode) stageConfigData.push(['RunMode', '3D'])
  const originFiles = (await findFiles(path.join(projectPath, 'images'), true))
    .filter(file => {
      if (['image', 'video'].includes(file.type) && file.path.toLowerCase().indexOf('texture') === -1 && !isThreeDImage(file.path)) {
        return true
      } else {
        return false
      }
    })
    .map(f => f.name)
  const nhdDir = path.join(projectPath, 'nhd_images')
  const qhdDir = path.join(projectPath, 'qhd_images')
  const nhdFiles = fs.existsSync(nhdDir) ? (await findFiles(nhdDir, true)).map(f => f.name) : null
  const qhdFiles = fs.existsSync(qhdDir) ? (await findFiles(qhdDir, true)).map(f => f.name) : null
  if (isEqual(originFiles, qhdFiles) && isEqual(originFiles, nhdFiles)) {
    stageConfigData.push(['HDRatio', '1,2,3'])
  } else if (isEqual(originFiles, qhdFiles)) {
    stageConfigData.push(['HDRatio', '1,2'])
  } else if (isEqual(originFiles, nhdFiles)) {
    stageConfigData.push(['HDRatio', '1,3'])
  } else {
    stageConfigData.push(['HDRatio', '1'])
  }
  writeFileWithEncode($path('stageconfig.txt'), compressArray(stageConfigData))

  // output goodyconfig
  const goodies = []
  project.stages.forEach(stage => {
    stage.instruction
      .filter(instr => instr.type === 'goody')
      .forEach(instr => {
        goodies.push(instr)
      })
  })
  const goodyConfig = [
    ['TotalGoodies', goodies.length],
    ...goodies.map(goody => (['GoodyIniNum', goody.initNum])),
  ]
  writeFileWithEncode($path('goodyconfig.txt'), compressArray(goodyConfig))

  const debugConfig = [
    ['Debug', project.debug.enabled ? 1 : 0],
    ['DebugConditionNum', project.debug.debugLoops.length],
  ]
  // 同类型的要在一起，且排序
  const debugLoops = []
  Object.values(groupBy(l => l.name, project.debug.debugLoops)).forEach(arr => {
    arr.sort((a, b) => a.loopNumber - b.loopNumber)
    debugLoops.push(...arr)
  })
  debugLoops.forEach(loop => {
    debugConfig.push(['DebugConditionType', 0])
    debugConfig.push(['DebugLoopName', loop.name])
    debugConfig.push(['DebugLoopNum', loop.loopNumber])
  })
  writeFileWithEncode($path('debugConfig.txt'), compressArray(debugConfig))

  // 输出loopconfig.txt
  const loops = project.loops.filter(loop => loop.type === 'loop')
  const loopConfig = [
    ['TotalLoopNum', loops.length],
  ]
  const topLoops = loops.filter(loop => {
    const { startIndex: start, endIndex: end } = loop
    // 不存在与其他loop中，则是顶层loop
    const inOtherLoop = loops.filter(l => l !== loop).find(l => {
      return start >= l.startIndex && end <= l.endIndex
    })
    return !inOtherLoop
  })
  const pushLoops = (arr, level) => {
    arr.forEach(loop => {
      const { startIndex: start, endIndex: end } = loop
      // 存在与此loop中的都是children
      const children = loops.filter(l => l !== loop).filter(l => {
        return l.startIndex > start && l.endIndex <= end
      })
      loopConfig.push(['LoopTag', loop.name])
      loopConfig.push(['LoopTotalCount', loop.loopNumber])
      loopConfig.push(['LoopLevel', level])
      pushLoops(children, level + 1)
    })
  }
  pushLoops(topLoops, 1)
  writeFileWithEncode($path('loopconfig.txt'), compressArray(loopConfig))

  // output output.json
  const outputJSON = await generateThemeJson(project, projectPath)
  fs.ensureDir($path('instruction'))
  await fs.writeJson($path('instruction', 'themes.json'), outputJSON)
  await fs.ensureDir($path('instruction', 'css'))
  await fs.writeFile($path('instruction', 'css', 'designer.css'), CommonCSSString)
}

export function getDeltaUnitBaseCommon(base: UnitBase, delta: UnitBase): Object {
  return {
    x0: delta.x0 - base.x0,
    y0: delta.y0 - base.y0,
    width: delta.width - base.width,
    height: delta.height - base.height,
    x: delta.x - base.x,
    y: delta.y - base.y,
    angle: delta.angle - base.angle,
    skewH: delta.skewH - base.skewH,
    skewV: delta.skewV - base.skewV,
  }
}

export function getStickItemType(stickItem: string): StageParameterType | '' {
  return ['', 'bg', 'fg', 'cus', 'obj'][+stickItem]
}

export const pickExchangableUnit = pick([
  'x', 'y',
  'x0', 'y0',
  'width', 'height',
  'scaleX', 'scaleY',
  'skewH', 'skewV',
  'opacity',
  'angle',
])

export const pickUnitBase = pick([
  'x', 'y',
  'x0', 'y0',
  'scaleX', 'scaleY',
  'skewH', 'skewV',
  'opacity',
  'angle',
  'transparencyChange',
  'colorChange',
])

/**
 *  * find project error, the follow error can be find in browser side
 * 1. `transition to` cannot set stage itself, unless stage has more than one transitions
 * 2. every stage expect entry stage must be connected with transition
 * 3. "stage1" does not allow "same", "continue" of some image property
 * 4. muse be have a stage with "command" instruction and "done" value
 * 5. the stage1 cannot choose keep the last position/action
 * 6. the stage1 cannot have any reference resource
 * @param {Stage[]} stages
 * @returns {Promise.<StageError[]>}
 */
export async function checkErrorForStages(stages: Stage[]): Promise<StageError[]> {
  const errors: StageError[] = []
  const usedStage = stages.map(() => false)
  usedStage[0] = true
  stages.forEach((stage, index) => {
    // error 1
    if (stage.transition.length === 1 && stage.transition.stageFile === index) {
      // error 1
      errors.push({
        stage: stage,
        type: 'transition',
        message: 'cannot set transition to self',
      })
    }
    if (stage.transition.length === 0 && !['if'].includes(stage.type)) {
      errors.push({
        stage: stage,
        type: 'transition',
        message: 'transition cannot be empty',
      })
    }

    stage.transition.forEach(trans => {
      if (typeof trans.stageFile === 'string' && isRandomTrans(trans.stageFile)) {
        trans.stages.forEach(stage => {
          const index = stages.findIndex(s => s.id === stage)
          usedStage[index] = true
        })
      } else usedStage[trans.stageFile] = true

      if (trans.stageFile === 0 && stage.type !== 'end') {
        errors.push({
          stage,
          type: 'transition',
          message: 'make sure only "end stage" has transition to "stage 1"',
        })
      }

      if (stage.transition.length === 1 && trans.stageFile === index) {
        errors.push({
          stage,
          type: 'transition',
          message: 'for any stage, if it has only one transition, this transition can not be the same stage.',
        })
      }

      if (trans.goodies && trans.goodies.length) {
        trans.goodies.forEach(goody => {
          const index = getAllgodies(stages).findIndex(g => g.name === goody.name)
          if (index === -1) {
            errors.push({
              stage,
              type: 'Goody',
              message: `Goody '${goody.name}' does not exist.`,
            })
          }
        })
      }
    })

    if (stage.type === 'if') {
      const thenIndex = stages.findIndex(s => stage.condition.then === s.id)
      const elseIndex = stages.findIndex(s => stage.condition.else === s.id)
      if (thenIndex !== -1) usedStage[thenIndex] = true
      if (elseIndex !== -1) usedStage[elseIndex] = true

      // Group if condition, if there is not condition element in a group, it should provide error during error check.
      stage.condition.groups.forEach(conditionGroup => {
        if (!conditionGroup.children.length) {
          errors.push({
            stage,
            type: 'Condition',
            message: `Group ${conditionGroup.name} can not be empty.`,
          })
        }
      })

      stage.condition.conditions.forEach(conditionItem => {
        // Goody
        if (conditionItem.type === 0) {
          const index = getAllgodies(stages).findIndex(g => g.name === conditionItem.name)
          if (index === -1) {
            errors.push({
              stage,
              type: 'Goody',
              message: `Goody '${conditionItem.name}' does not exist`,
            })
          }
        }
      })

      if (!stage.condition.then) {
        errors.push({
          stage,
          type: 'Condition',
          message: `Then can not be empty.`,
        })
      }

      if (!stage.condition.else) {
        errors.push({
          stage,
          type: 'Condition',
          message: `Else can not be empty.`,
        })
      }
    }

    if (stage.parameter3D) {
      if (!/^#[0-9a-f]{6}$/i.test(stage.parameter3D.ambientColor)) {
        errors.push({
          stage,
          type: 'Color',
          message: `[3D] The ambient color value is invalid`,
        })
      }
    }

    const types = ['bg', 'fg', 'cus', 'obj']
    types.forEach(type => {
      //
      const metadata3D = stage.parameter[type].source.metadata3D
      const lightColor = get(metadata3D, 'lightColor')
      if (type !== 'obj' && lightColor && !/^#[0-9a-f]{6}$/i.test(lightColor)) {
        errors.push({
          stage,
          type: 'Color',
          message: `[${type}] The light color value is invalid`,
        })
      }

      //
      stage.parameter[type].units.forEach(unit => {
        if (['2', '6'].includes(unit.change.chgCtr) && isEqual(stage.action.stageAction, ['0', '0'])) {
          errors.push({
            stage,
            type: 'Action',
            message: `nothing to follow with the general actions`,
          })
        }
        const stick = unit.change.chgCtr === '3' && unit.change.stickItem !== '0'
        const type = types[unit.change.stickItem - 1]
        const stickItem = stage.parameter[type]
        if (stick && stickItem.units.length === 0) {
          errors.push({
            stage,
            type: 'Action',
            message: `there is no ${type} image, but still stick object to ${types[unit.change.stickItem]}.`,
          })
        }
      })
    })
  })

  usedStage.forEach((used, index) => {
    const stage = stages[index]
    // error 2
    if (!used) {
      errors.push({
        stage,
        type: 'stage',
        message: `No stages transition to stage ${index + 1} .`,
      })
    }
  })

  if (stages[0]) {
    const stage = stages[0]
    const error5List = []
    const error6List = []
    for (const type of ['bg', 'fg', 'cus', 'obj']) {
      // error 5
      const units = stage.parameter[type].units
      units.forEach((unit, index) => {
        if (unit.init.keep) error5List.push(type.toUpperCase() + (index + 1))
        if (unit.change.keep) error5List.push(type.toUpperCase() + 'C' + (index + 1))
      })

      // error 6
      const source = stage.parameter[type].source
      if (isSourceReference(source)) {
        error6List.push(type)
      }
    }

    if (error5List.length) {
      errors.push({
        stage: stage,
        type: 'parameter',
        message: `${error5List.map(toUpper).join(',')} cannot use 'keep the last position/action' for first stage`,
      })
    }

    if (error6List.length) {
      errors.push({
        stage: stage,
        type: 'parameter',
        message: `${error6List.map(toUpper).join(',')} cannot have any reference images/videos`,
      })
    }
  }

  if (!stages.find(stage => stage.type === 'preEnd')) {
    errors.push({
      stage: stages[0],
      type: 'type',
      message: 'Must have pre-end and end in the project',
    })
  }

  return errors
}

export async function checkErrorForLoops({ stages, loops }: Project): Promise<StageError[]> {
  const errors: StageError[] = []

  stages.forEach((stage, stageIndex) => {
    // loop不能落于IfStage上
    if (stage.type === 'if') {
      loops.filter(loop => {
        ['loop', 'continue', 'break'].includes(stage)
        switch (loop.type) {
          case 'loop':
            return [loop.end].includes(stage.id)
          case 'continue':
          case 'break':
            return loop.stage === stage.id
        }
      })
        .forEach(loop => {
          errors.push({
            stage,
            type: `Loop ${loop.name}`,
            message: `Loop can not stay with IfStage`,
          })
        })
    }

    // 检查loop的transition逻辑
    stage.transition.forEach(transition => {
      checkLoopForStage(stage, stageIndex, transition)
    })
  })
  function checkLoopForStage(current, currentIndex, transition) {
    const to = isRandomTrans(transition.stageFile) ? null : transition.stageFile
    if (to === null) return
    // in-out
    // loopX中的stage不能transition到loopX外的stage，除了loopX中的最后一个stage
    const isInLoop = (i, loop) => {
      const startIndex = stages.findIndex(s => s.id === loop.start)
      const endIndex = stages.findIndex(s => s.id === loop.end)
      return i >= startIndex && i <= endIndex
    }
    loops.filter(loop => isInLoop(currentIndex, loop))
      .filter(loop => loop.type === 'loop')
      .forEach(loop => {
        const startIndex = stages.findIndex(s => s.id === loop.start)
        const endIndex = stages.findIndex(s => s.id === loop.end)
        // 除了loop中最后一个stage。
        if (loop.end === current.id) return
        // 不能transition到loop外,
        if (to < startIndex || to > endIndex) {
          errors.push({
            stage: current,
            type: `Loop in-out`,
            message: `Can not transition to [Stage ${to + 1}]`,
          })
        }
      })

    // out-in
    // loopX外的stage不能transition到loopX内的stage，除了loopX中的第一个stage
    // 判断current是否在任意loop中，如果是则跳过，不是则判断transitionTo
    const inLoop = loops
      .filter(loop => loop.type === 'loop')
      .find(loop => isInLoop(currentIndex, loop))
    if (!inLoop) {
      // 判断是否transition到loop内
      const toLoop = loops
        .filter(loop => loop.type === 'loop')
        .find(loop => {
          const startIndex = stages.findIndex(s => s.id === loop.start)
          const endIndex = stages.findIndex(s => s.id === loop.end)
          return to > startIndex && to <= endIndex
        })
      if (toLoop) {
        errors.push({
          stage: current,
          type: `Loop out-in`,
          message: `Can not transition to [Stage ${to + 1}]`,
        })
      }
    }
  }

  // 检查交叉loop
  loops
    .filter(loop => loop.type === 'loop')
    .forEach(loop => {
      const found = loops
        .filter(loop => loop.type === 'loop')
        .filter(l => l !== loop).find((l, i) => {
          if (loop.startIndex > l.startIndex && loop.startIndex <= l.endIndex && loop.endIndex > l.endIndex) {
            return true
          }
        })

      if (found && loop.endIndex > found.endIndex) {
        errors.push({
          stage: stages.find(s => s.id === found.start),
          type: `Loop ${found.name}`,
          message: `can not cross [${loop.name}]`,
        })
      }
    })

  // 检查continue、break
  // loop.stage必须在对应loop内部
  loops
    .filter(loop => ['continue', 'break'].includes(loop.type))
    .forEach(loop => {
      const index = stages.findIndex(stage => stage.id === loop.stage)
      const parentLoop = loops.filter(l => l !== loop).find(l => l.name === loop.name)
      if (index < parentLoop.startIndex || index > parentLoop.endIndex) {
        errors.push({
          stage: stages[index],
          type: `${loop.type} ${loop.name}`,
          message: `break/continue should within the ${parentLoop.name}`,
        })
      }
    })

  return errors
}

export async function checkErrorForProject(project: Project, projectPath: string): Promise<ProjectError[]> {
  const errors: ProjectError[] = []

  // 检查是否有未压缩的文件 (查看 createHDFormat 函数)
  if (project.hdRatio === 3) {
    const imageDir = path.join(projectPath, `images`)
    const files = await findFiles(imageDir, true)
    for (const file of files) {
      if (file.type !== 'image' || file.path.toLowerCase().indexOf('texture') !== -1 || isThreeDImage(file.path)) {
        continue
      }
      const qhdPath = file.path.replace(`${path.sep}images${path.sep}`, `${path.sep}qhd_images${path.sep}`)
      const nhdPath = file.path.replace(`${path.sep}images${path.sep}`, `${path.sep}nhd_images${path.sep}`)
      if (!fs.existsSync(qhdPath)) {
        errors.push({
          type: `Resource error`,
          message: `${file.name} is not converted to standard [qHD] format.`,
        })
      }
      if (!fs.existsSync(nhdPath)) {
        errors.push({
          type: `Resource error`,
          message: `${file.name} is not converted to standard [nHD] format.`,
        })
      }
    }
  }

  return errors
}

export function makeStageAsSame(stage: Stage) {
  for (const type of ['bg', 'fg', 'cus', 'obj']) {
    const source = stage.parameter[type].source
    if (!source.metadata) continue
    setStageSourceToSame(source)
  }
  if (!get(stage, 'parameter.obj.source.metadata.src')) {
    stage.parameter.obj.source.metadata.src = PersonImage
  }
}

export function openProject(projectPath: string): Promise<*> {
  const projectJsonFile = path.join(projectPath, 'project.json')
  return Promise.resolve().then(() => {
    return fs.pathExists(projectJsonFile)
  }).then(exist => {
    if (!exist) return Promise.reject(new Error(E_INVALID_PROJECT))
    return fs.readJson(projectJsonFile)
  }).then(project => {
    // create iCreatorProjectPath.txt file under C:\Users\USERNAME\AppData\Local\Temp\iCreatorProjectPath.txt.
    // In the file, it only shows the current open iCreator project path.
    // For Macbook, it creates this file under "Temp" folder.
    const iCreatorProjectPath = path.join(remote.app.getPath('temp'), 'iCreatorProjectPath.txt')
    fs.writeFileSync(iCreatorProjectPath, projectPath)
    console.log(iCreatorProjectPath)
    return fixProjectMetadata(project, projectPath)
  }).then(project => {
    versionFormatter(project, projectPath)
    return project
  })
}

export async function deleteUnnecessaryImages(project, projectPath) {
  // 删除不需要的3d图片
  let files = await findFiles(path.join(projectPath, 'images'), true)
  let _3dImages = files.filter(file => isThreeDImage(file.path))
  _3dImages = _3dImages.filter(file => {
    const jsonPath = isThreeDImage(file.path)
    const json = fs.readJsonSync(jsonPath)
    const stage = project.stages.find(stage => stage.id === json.stageId)
    // 不存在对应stage的，删掉
    if (!stage) return true
    // 没有stage使用的3d-images，删掉
    return ['bg', 'fg', 'cus'].every(type => {
      const url = get(stage, `parameter.${type}.source.metadata.src`)
      if (!url) return true
      return urlToPath(url) !== file.path
    })
  })
  for (const file of _3dImages) {
    Vue.prototype.$events.emit(RESOURCE_DELETE_FILE, {
      file: file,
      confirm: false,
    })
    Vue.prototype.$events.emit(RESOURCE_DELETE_FILE, {
      file: getFile(isThreeDImage(file.path)),
      confirm: false,
    })
  }

  return project
}

export async function fixProjectMetadata(project: Project, projectPath: string): Promise<*> {
  const layerMap = new Map()
  for (const stage of project.stages) {
    for (const type of ['bg', 'fg', 'cus', 'obj']) {
      const source = stage.parameter[type].source

      // obj
      if (!source.file) continue

      const metadata: ?ResourceMetadata = source.metadata
      if (!metadata) continue
      const src = metadata.src = getSourceSrc(projectPath, source)
      const sourcePath = urlToPath(src)
      const fileName = path.basename(sourcePath)
      if (!fs.existsSync(sourcePath)) {
        return Promise.reject(new Error(`${fileName} is not exist`))
      }

      let layer = layerMap.get(src)
      if (!layer) {
        layer = await Layer.create(metadata.src)
        layerMap.set(src, layer)
      }
      metadata.type = layer.type
      metadata.width = layer.width
      metadata.height = layer.height
    }

    // update snapshot
    const res = stage.snapshot.match(/\\thumbnail\\.*$/) || stage.snapshot.match(/\/thumbnail\/.*$/) // windows || mac
    if (res) stage.snapshot = 'file:\/\/\/' + path.join(projectPath, res.toString())
  }
  return project
}

export function generateInstruction(stage: Stage): InstructionItemType[] {
  const instructions = []
  if (InstructionStatic.actionImageMap.hasOwnProperty(stage.action.stageAction.join('-'))) {
    const fileName = InstructionStatic.actionImageMap[stage.action.stageAction.join('-')]
    const instr = clone(defaultInstruction.image)
    instr.src = 'images/' + fileName
    instructions.push(instr)
  }
  instructions.push(...stage.transition.filter(trans => {
    return InstructionStatic.transitionImageMap.hasOwnProperty(trans.NextStage.join('-'))
  }).map(trans => {
    const fileName = InstructionStatic.transitionImageMap[trans.NextStage.join('-')]
    const instr = clone(defaultInstruction.image)
    instr.src = 'images/' + fileName
    return instr
  }))
  return instructions
}

const isCommandDone = instr => instr.type === 'command' && instr.command === 'done'
const isCommandFinish = instr => instr.type === 'command' && instr.command === 'finish'

export function fixStageInstruction(stage: Stage) {
  if (stage.type === 'preEnd') {
    const instruction = stage.instruction.filter(instr => !isCommandFinish(instr))
    if (!instruction.find(isCommandDone)) {
      const command = clone(defaultInstruction.command)
      command.command = 'done'
      instruction.push(command)
    }
    stage.instruction = instruction
  } else if (stage.type === 'end') {
    const instruction = stage.instruction.filter(instr => !isCommandDone(instr))
    if (!instruction.find(isCommandFinish)) {
      const command = clone(defaultInstruction.command)
      command.command = 'finish'
      instruction.push(command)
    }
    stage.instruction = instruction
  } else {
    stage.instruction = stage.instruction.filter(instr => !isCommandDone(instr) && !isCommandFinish(instr))
  }
}

export function setStageSourceToSame(source: SourceType) {
  source.reference = getSourceRelativeSrc(source)
  source.directory = source.file = 'same'
}

export function setStageSourceToRandom(source: SourceType) {
  const filePath = getSourceRelativeSrc(source)
  source.reference = filePath
  source.directory = path.dirname(filePath)
  source.file = 'random'
}

export function setStageSourceToNormal(source: SourceType) {
  const filePath = getSourceRelativeSrc(source)
  source.directory = path.dirname(filePath)
  source.file = path.basename(filePath)
  source.reference = ''
}

export function changeSourceType(source: SourceType, sourceType: '' | 'random' | 'same') {
  if (getSourceType(source) !== sourceType) {
    if (sourceType === 'random') {
      setStageSourceToRandom(source)
    } else if (sourceType === 'same') {
      setStageSourceToSame(source)
    } else {
      setStageSourceToNormal(source)
    }
  }
}

export function getAllMetadata(project: Project): Array<ResourceMetadata> {
  return chain(project.stages)
    .map(s => s.parameter)
    .map(({ bg, cus, fg }) => [bg, cus, fg])
    .flatten()
    .map(e => e.source.metadata)
    .value()
}

export function checkChangedMedia(project: Project): Array<ResourceMetadata> {
  const allMetadata = getAllMetadata(project).filter(m => !!m)
  return allMetadata.filter(({ width, height, src, type }) => {
    if (type !== 'image') return false
    const imagePath = urlToPath(src)
    if (!fs.existsSync(imagePath)) return true
    const size = imageSize(imagePath)
    return size.width !== width || size.height !== height
  })
}

// check if the stage is from other project
export function isFromOtherProject(stage: Stage, projectPath: string): boolean {
  const allSource = ['bg', 'cus', 'fg'].map(type => stage.parameter[type].source).filter(s => !!s.metadata)
  return allSource.every(source => !~source.metadata.src.indexOf(projectPath))
}
// copy asset files after paste stage from other project
export function updateStageMetadataSource(stage: Stage, projectPath: string): void {
  const allSource = ['bg', 'cus', 'fg'].map(type => stage.parameter[type].source).filter(s => !!s.metadata)
  allSource.forEach(source => {
    const src = urlToPath(source.metadata.src)
    const destSrc = path.join(projectPath, getSourceRelativeSrc(source))
    if (src !== destSrc) { fs.copySync(src, destSrc) }
  })
}

export const removeFileProtocol = (path: string) => path.slice(path.indexOf(':\\') - 1)

export async function compressMedia(metadata: Array<ResourceMetadata>): Promise<*> {
  for (let i = 0; i < metadata.length; i++) {
    const { src, width, height } = metadata[i]
    await compressImageToSize(removeFileProtocol(src), { width, height })
  }
}

function base64toBuffer(img: string): string {
  const data = img.replace(/^data:image\/\w+;base64,/, '')
  return data
}

export async function saveMapImage(projectPath: string, el: HTMLElement): Promise<any> {
  await fs.ensureDir(path.join(projectPath, 'map'))
  domToImage.toPng(el, { filter: node => node.tagName !== 'image' }).then(dataUrl => {
    fs.writeFileSync(path.join(projectPath, 'map', 'project.png'), base64toBuffer(dataUrl), { encoding: 'base64' })
  }).catch(console.error)
}

/*
 * e.g. isRandomTrans(transition.stageFile)
*/
export const isRandomTrans = (s: string) => typeof s === 'string' ? !!s.match(/^r[0-9]+$/) && true : false
/**
 * e.g. isRandomPara(value.opacity)
 */
export const isRandomPara = (s: any) => typeof s === 'number'

export async function findFiles(dir: string, recursion: boolean) {
  if (!fs.existsSync(dir)) return []
  const fileList = (await fs.readdir(dir)).filter(file => file[0] !== '.')
  const files = []
  for (const item of fileList) {
    const stat = await fs.lstat(path.join(dir, item))
    if (stat.isDirectory() && recursion) {
      files.push(...(await findFiles(path.join(dir, item), recursion)))
    } else {
      const filePath = path.join(dir, item)
      const file = getFile(filePath)
      file.type = stat.isDirectory() ? 'dir' : fileType(item)
      if (fileType(item) === 'music') { file.icon = 'static/icon/resource/music.svg' }
      files.push(file)
    }
  }
  return files
}

export function findFilesSync(dir: string, recursion: boolean) {
  if (!fs.existsSync(dir)) return []
  const fileList = (fs.readdirSync(dir)).filter(file => file[0] !== '.')
  const files = []
  for (const item of fileList) {
    const stat = fs.lstatSync(path.join(dir, item))
    if (stat.isDirectory() && recursion) {
      files.push(...(findFilesSync(path.join(dir, item), recursion)))
    } else {
      const filePath = path.join(dir, item)
      const file = getFile(filePath)
      file.type = stat.isDirectory() ? 'dir' : fileType(item)
      if (fileType(item) === 'music') { file.icon = 'static/icon/resource/music.svg' }
      files.push(file)
    }
  }
  return files
}

export function getFile(p: string, prefix: string = ''): File {
  p = p.replace(/(\\|\/)/g, '\/')
  const name = path.basename(p)
  const match = p.match(/\/images\/(bg|fg|cus)(?=\/)/)
  const parameter = match ? match[0].replace(/\/images\//, '') : ''
  p = p.replace(/(\\|\/)/g, path.sep)
  return {
    name,
    path: p,
    relative: prefix ? path.join(prefix, name) : undefined,
    url:
      url.format({
        protocol: 'file',
        pathname: p,
      }),
    type: fileType(name),
    icon: '',
    parameter,
  }
}

export function isThreeDImage(imagePath: string) {
  const basename = path.basename(imagePath)
  const extname = path.extname(imagePath)
  if (extname !== '.png') return false
  const jsonFileName = path.basename(imagePath, extname) + '.3d.json'
  const jsonFilePath = imagePath.replace(basename, jsonFileName)
  if (!fs.pathExistsSync(jsonFilePath)) return false
  return jsonFilePath
}

export function isMpcImage(imagePath: string) {
  const basename = path.basename(imagePath)
  const extname = path.extname(imagePath)
  if (extname !== '.png') return false
  const jsonFileName = path.basename(imagePath, extname) + '.mpc.json'
  const jsonFilePath = imagePath.replace(basename, jsonFileName)
  if (!fs.pathExistsSync(jsonFilePath)) return false
  return jsonFilePath
}

export function copyElementAsset(filePath: string, suffix: number = 2) {
  const directory = path.dirname(filePath)
  const extname = path.extname(filePath)
  const name = path.basename(filePath, extname)

  const newFileName = name + suffix + extname
  const fileName = path.basename(filePath)
  const newPath = filePath.replace(fileName, newFileName)

  if (fs.existsSync(newPath)) {
    return copyElementAsset(filePath, ++suffix)
  }

  fs.copySync(filePath, newPath)
  const jsonPath = isThreeDImage(filePath)
  if (jsonPath) {
    const jsonName = path.basename(jsonPath, '.3d.json')
    const newJsonPath = path.join(
      directory,
      jsonName + suffix + '.3d.json'
    )
    fs.copySync(jsonPath, newJsonPath)
  }
  return newPath
}

export async function fixFile(file: File) {
  //
  const ilegal = ILEGAL_NAME.test(file.name)
  if (!ilegal) {
    const newPath = await new Promise(resolve => {
      Vue.prototype.$events.emit(RENAME_FILE, file.path)
      Vue.prototype.$events.on(RENAME_FILE_COMPLETED, ({ toPath }) =>
        resolve(toPath)
      )
    })
    file.name = path.basename(newPath)
    const distPath = path.join(path.dirname(file.path), file.name)
    file.path = distPath
    file.url = pathToUrl(file.path)
  }

  //
  if (file.type === 'image') {
    // 防止图片channel是greyscale
    if (!/gif$/.test(file.path)) {
      const image = await jimp.read(file.path)
      image.normalize()
      await image.writeAsync(file.path)
    }

    Vue.prototype.$events.emit(EV_LOADING_OPEN, { text: 'Compression' })
    await compressImage(file.path)
      .then(() => fixImgExtName(file.path))
      .then(() => {
        Vue.prototype.$events.emit(REFRESH_RESOURCE)
        Vue.prototype.$events.emit(EV_LOADING_CLOSE)
      })
      .catch(err => {
        Message.error(err)
        Vue.prototype.$events.emit(EV_LOADING_CLOSE)
      })
  }

  //
  file = getFile(file.path)
  if (path.extname(file.path) === '.jpeg' && file.path.indexOf('texture') === -1) {
    const newPath = file.path.replace('.jpeg', '.jpg')
    // fs.renameSync(file.path, newPath)
    file = getFile(newPath)
  }

  if (/gif$/.test(file.path)) {
    const gif = await GifUtil.read(file.path)
    const frames = gif.frames
    if (frames.length === 1) {
      const extname = path.extname(file.path)
      const newPath = file.path.replace(extname, '.jpg')
      const gif = await jimp.read(file.path)
      await gif.writeAsync(newPath)
      file = getFile(newPath)
    }
  }

  //
  return file
}

export function fixDae(filePath: string) {
  // format
  // <init_from>file:///Users/xiangliu/Desktop/Boy/Textures/Body.jpg</init_from>
  // to
  // <init_from>Textures/Body.jpg</init_from>
  const data = fs
    .readFileSync(filePath, 'utf8')
    .replace(/file:.*(?=(Textures|textures))/g, '')
  // `FBX COLLADA exporter`导出的dae中，animation标签嵌套了一个无id等属性的animation，造成动画无法加载，所以移除掉
  // .replace(/<animation>/g, '').replace(/<\/animation><\/animation>/g, '</animation>')
  fs.writeFileSync(filePath, data, 'utf8')
}

export function pathExist(filename: string, dirname: string) {
  const files = findFilesSync(dirname)
  const names = files.map(f => path.basename(f.path, path.extname(f.path)))
  const named = names.includes(
    path.basename(filename, path.extname(filename))
  )
  return named
}

export async function createHDFormat(dir: string, type: 'qhd' | 'nhd') {
  const desDir = path.join(dir, `../${type}_images`)
  const files = await findFiles(dir, true)
  for (const file of files) {
    if (file.type !== 'image' || file.path.toLowerCase().indexOf('texture') !== -1 || isThreeDImage(file.path)) {
      continue
    }
    const newPath = file.path.replace(dir, desDir)
    fs.copySync(file.path, newPath)
    const { width, height } = imageSize(newPath)
    let size
    if (type === 'qhd') {
      size = {
        width: width / 2,
        height: height / 2,
      }
    }
    if (type === 'nhd') {
      size = {
        width: width / 3,
        height: height / 3,
      }
    }
    try {
      await compressImageToSize(newPath, size)
      await compressImage(newPath)
    } catch (err) {
      console.log(err)
      return err
    }
  }
}

export async function convertVideo(dir: string, type: 'qhd' | 'nhd') {
  const desDir = path.join(dir, `../${type}_images`)
  const files = await findFiles(dir, true)
  for (const file of files) {
    if (file.type !== 'video') {
      continue
    }
    const newPath = file.path.replace(dir, desDir)
    fs.copySync(file.path, newPath)
    const dimension = await getVideoDimension(file.path)
    await new Promise((resolve, reject) => {
      console.log('convert video:', file.path, [ffmpeg])
      ffmpeg(file.path)
        .size(`${dimension.width / 2}x${dimension.height / 2}`)
        .save(newPath)
        .on('end', () => {
          console.log('end')
          resolve()
        })
        .on('err', err => {
          console.error(err)
          reject(err)
        })
    })
  }
}

export async function getVideoDimension(filePath: string) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err)
      const { width, height } = metadata.streams[0]
      resolve({ width, height })
    })
  })
}
