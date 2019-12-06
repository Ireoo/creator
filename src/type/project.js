// @flow
import type { Stage, InstructionGlobalItemType, StageGroup } from './stage'

export class Project {
  counter: number = 0
  stages: Stage[] = []
  protocol: number = 1
  instruction: InstructionGlobalItemType[] = []
  stageGroup: StageGroup
  activatedStageGroup: number
  appVersion: string
  protectList: string[]
  protect: boolean
  password: string
  genID() {
    return `stage_${this.counter++}`
  }
}

export type ProjectError = {
  type: string,
  message: string,
}

export type StageError = {
  stage: Stage,
} & ProjectError

export type ErrorType = ProjectError | StageError

export type File = {
  name: string,
  path: string,
  url: string,
  type: string,
  relative: ?string,
  parameter: ?string,
  icon: ?string
}
