// @flow
import { set } from 'lodash'

export const defaultDebugLoop = {
  name: '',
  loopNumber: 0,
}

type State = {
  debugLoops: Array<{
    name: string,
    loopNumber: number,
  }>,
  enabled: false,
}

export const state: State = {
  debugLoops: [],
  enabled: false,
}

const mutations = {
  toggleDebug(state: State) {
    state.enabled = !state.enabled
  },
  updateDebug(state: State, { key, value }: { [key: string]: string }) {
    set(state, key, value)
  },
}

const getters = {
}

export default {
  name: 'debug',
  state,
  mutations,
  getters,
}
