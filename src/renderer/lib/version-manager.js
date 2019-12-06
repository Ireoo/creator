// @flow
import compareVersions from 'compare-versions'
import type { Project } from 'type/project'
import fs from 'fs-extra'
import path from 'path'
import { createShoutcutFile } from './utils'

export function versionFormatter(project: Project, projectPath: string): void {
  const oldVersion = project.appVersion || ''
  // version < 1.0.2
  if (!oldVersion) {
    formatVersionPrevious1_0_2(project)
  }
  const lessThan = v => compareVersions(oldVersion || '0.0.1', v) === -1
  // version <1.0.9
  if (lessThan('1.0.9')) {
    formatVersionPrevious1_0_9(project, projectPath)
  }
  if (lessThan('1.0.11')) {
    formatVersionPrevious1_0_11(project)
  }
  if (lessThan('1.1.1')) {
    formatVersionPrevious1_1_1(project, projectPath)
  }
  if (lessThan('1.2.0')) {
    formatVersionPrevious1_2_0(project)
  }
  if (lessThan('1.2.2')) {
    formatVersionPrevious1_2_2(project)
  }
  if (lessThan('1.2.49')) {
    formatVersionPrevious1_2_49(project)
  }
  if (lessThan('1.2.115')) {
    formatVersionPrevious1_2_115(project)
  }
  if (lessThan('1.2.236')) {
    formatVersionPrevious1_2_236(project, projectPath)
  }
}

export function formatVersionPrevious1_0_2(project: Project): void {
  project.instruction.forEach(instr => {
    if (!(instr.stop instanceof Array)) {
      instr.stop = [instr.stop]
    }
  })
}

export function formatVersionPrevious1_0_9(project: Project, projectPath: string): void {
  // add new inctruction image
  for (const type of ['two-hands', 'body-move', 'hand-touch', 'one-hand', 'other']) {
    fs.ensureDirSync(path.join(projectPath, 'instruction', 'sysimg', type))
    fs.copySync(path.join(__static, 'template', 'instruction', 'images', type), path.join(projectPath, 'instruction', 'sysimg', type), {
      overwrite: false,
    })
  }
}

export function formatVersionPrevious1_0_11(project: Project): void {
  // change group structure,[1d7c6b1] ` StageGroupItem.stageIds: stringnumber[]  ` => ` StageGroupItem.stageIds: string[]
  const { stages, stageGroup } = project
  if (stageGroup) {
    stageGroup.forEach(group => group.stageIds.map((id, i) => group.stageIds[i] = stages[id].id))
  }
}

export function formatVersionPrevious1_1_1(project: Project, projectPath: string): void {
  createShoutcutFile(projectPath)
}

export function formatVersionPrevious1_2_0(project: Project) {
  formatVersionPrevious1_0_2(project)
}

export function formatVersionPrevious1_2_2(project: Project) {
  project.stages.forEach(stage => {
    if (!stage.parameter3D) return
    if (!stage.parameter3D.ambientColorIntensity) {
      stage.parameter3D.ambientColorIntensity = 1
    }
    const allSource = ['bg', 'cus', 'fg'].map(type => stage.parameter[type].source).filter(s => !!s.metadata)
    allSource.forEach(source => {
      if (!source.metadata3D) return
      if (!source.metadata3D.colorIntensity) {
        source.metadata3D.colorIntensity = 1
      }
    })
  })
}

export function formatVersionPrevious1_2_49(project: Project) {
  project.stages.forEach(stage => {
    if (!stage.parameter3D) return
    if (!stage.parameter3D.playSpeed) {
      stage.parameter3D.playSpeed = 1
    }
  })
}

export function formatVersionPrevious1_2_115(project: Project) {
  project.stages.forEach(stage => {
    if (!stage.parameter3D) return
    if (!stage.parameter3D.wearable3D) {
      stage.parameter3D.wearable3D = 0
    }
  })
}

export function formatVersionPrevious1_2_236(project: Project, projectPath: string) {
  project.stages.forEach(stage => {
    stage.instruction.forEach(instruction => {
      const { type, src } = instruction
      if (type === 'image' && src.match(/^sysimg\\/)) {
        instruction.src = instruction.src.replace('sysimg\\', '')
      }
    })
  })
  // 复制Goody图片
  const goodiesPath = path.join(projectPath, 'instruction/goodies')
  fs.ensureDirSync(goodiesPath)
  fs.copySync(path.join(__static, 'template', 'instruction/images/goodies'), goodiesPath, {
    overwrite: false,
  })
}
