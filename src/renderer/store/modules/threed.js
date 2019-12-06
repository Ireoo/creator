// @flow
import { set, get, isNil, cloneDeep, pick } from 'lodash'
import type { ActionContext } from 'vuex'
// import path from 'path'
import { getFile, isThreeDImage } from 'lib/project'
import type { File } from 'type/project'
import fs from 'fs-extra'
import History from 'lib/History'
const history = new History()

export type Vector3 = {
  x?: number,
  y?: number,
  z?: number
}

type State = {
  stageId: ?string,
  dae: ?File,
  fbx: ?File,
  keep: boolean,
  lightColor: ?string,
  colorIntensity: number,
  lightPosition: Vector3,
  position: Vector3,
  rotation: Vector3,
  scale: Vector3,
  diffusionMap: ?string,
  normalMap: ?string,
  cover: ?string,
  rotationRate: Vector3 & { play: false },
  playAnimation: boolean,
  control: 'translate' | 'rotate' | 'scale',
  animation: {
    index: number,
    duration: number
  },
  specularPower: number,
  animationRange: number[],
  controlAvatar: number,
  csv: Array<{
    Action: string,
    StartFrame: string,
    StopFrame: string,
    TotalFrameNo: string
  }>,
  animationMotion: string
}

const initState: State = {
  stageId: '',
  dae: null,
  fbx: null,
  obj: null,
  keep: false,
  lightColor: '#00AAFF',
  lightPosition: { x: 20, y: 25, z: -20 },
  colorIntensity: 1,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  diffusionMap: '',
  normalMap: '',
  cover: null,
  rotationRate: { x: 0, y: 0, z: 0, play: false },
  playAnimation: false,
  control: 'translate',
  animation: {
    index: 100,
    duration: 100,
  },
  specularPower: 10,
  animationRange: [1, 100],
  controlAvatar: 0,
  csv: [],
  animationMotion: '',
}

const state: State = cloneDeep(initState)

const getters = {
  parameter3D(state: State, getter: any, rootState: any) {
    let stage = rootState.project.stages.find(s => s.id === state.stageId)
    if (!stage) stage = rootState.project.selectedStage
    return get(stage, 'parameter3D') || {}
  },
  ambientColor(state: State, getter: any) {
    return getter.parameter3D.ambientColor
  },
  ambientColorIntensity(state: State, getter: any) {
    return getter.parameter3D.ambientColorIntensity
  },
  cameraPosition(state: State, getter: any) {
    return getter.parameter3D.cameraPosition
  },
  cameraRotationAngle(state: State, getter: any) {
    return getter.parameter3D.cameraRotationAngle
  },
  cameraRotationRate(state: State, getter: any) {
    return getter.parameter3D.cameraRotationRate
  },
  playSpeed(state: State, getter: any) {
    return getter.parameter3D.playSpeed
  },
  threeDFile(state: State, getter: any) {
    return state.dae || state.fbx || state.obj
  },
}

const mutations = {
  entry3DMode(state: State, file: File) {
    state.stageId = this.state.project.selectedStage.id
    if (file.type === 'dae') {
      state.dae = file
    }
    if (file.type === 'fbx') {
      state.fbx = file
    }
    if (file.type === 'obj') {
      state.obj = file
    }
  },
  exit3DMode() {
    this.commit('updateThreed', cloneDeep(initState))
  },
  updateThreed(state: State, options: { [key: string]: any }) {
    const { key, value } = options
    if (typeof value === 'number' && isNaN(value)) return
    if (!isNil(key) && !isNil(value)) {
      set(state, key, value)
    } else {
      Object.keys(options).forEach(key => {
        state[key] = options[key]
      })
    }
    if (['position', 'rotation', 'scale'].find(t => Object.keys(options).find(k => k.indexOf(t)))) {
      history.push(state)
    }
  },
  toggleThreeDControl(state: State) {
    switch (state.control) {
      case 'translate':
        state.control = 'scale'
        break
      case 'rotate':
        state.control = 'translate'
        break
      case 'scale':
        state.control = 'rotate'
        break
    }
  },
  undo3D(state: State) {
    const newState = history.undo().current
    if (newState) Object.assign(state, newState)
  },
  redo3D(state: State) {
    const newState = history.redo().current
    if (newState) Object.assign(state, newState)
  },
}

const actions = {
  load3DImage({ state, commit, dispatch }: ActionContext<State, *>, image: File): boolean {
    const jsonPath = isThreeDImage(image.path)
    if (!jsonPath) return false
    const jsonFile = fs.readJsonSync(jsonPath)
    const file = getFile(image.path.replace(image.name, jsonFile.fileName))

    commit('entry3DMode', file)
    commit('updateThreed', {
      cover: image.name,
      ...pick(jsonFile, [
        'stageId',
        'keep',
        'lightColor',
        'colorIntensity',
        'lightPosition',
        'position',
        'rotation',
        'scale',
        'diffusionMap',
        'normalMap',
        'rotationRate',
        'animation',
        'specularPower',
        'animationRange',
        'controlAvatar',
        'csv',
        'animationMotion',
      ]),
    })
    return true
  },
}

export default {
  name: 'threed',
  state,
  getters,
  mutations,
  actions,
}
