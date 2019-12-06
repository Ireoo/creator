// @flow
import { clamp } from 'ramda'
import type { Stage, StageParameterType } from 'type/stage'

type ViewType = 'board' | 'table' | 'parameter' | 'preview' | 'map'

type State = {
  zoom: number,
  zoomMax: number,
  zoomMin: number,
  lockAspectRatio: boolean,
  mode: 'select' | 'crop',
  status: 'init' | 'change',
  type: StageParameterType,
  index: number,
  view: ViewType,
  tip: string
}

const state: State = {
  zoom: 1,
  zoomMax: 2,
  zoomMin: 0.1,
  lockAspectRatio: true,
  mode: 'select',
  status: 'init',
  type: 'bg',
  index: 0,
  view: 'board',
  tip: '',
}

const mutations = {
  changeZoom(state: State, zoom: number) {
    state.zoom = clamp(state.zoomMin, state.zoomMax, zoom)
  },
  updateLockAspectRatio(state: State, lock: boolean = false) {
    state.lockAspectRatio = lock
  },
  generateLayer(state: State, stage: Stage) {

  },
  changeMode(state: State, mode: 'select' | 'crop') {
    state.mode = mode
  },
  changeStatus(state: State, status: 'init' | 'change') {
    state.status = status
  },
  changeType(state: State, type: StageParameterType) {
    state.type = type
  },
  changeIndex(state: State, index: number) {
    state.index = index
  },
  changeView(state: State, view: ViewType) {
    state.view = view
  },
  updateTip(state: State, tip: string) {
    state.tip = tip
  },
}

export default {
  name: 'board',
  state,
  mutations,
}
