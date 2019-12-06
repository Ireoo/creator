// @flow
import Store from 'electron-store'
type State = {
  stageLocation: string,
  backendScript: string,
  playScript: string,
  language: string,
  showGrid: boolean
}

const state: State = {
  stageLocation: '',
  backendScript: '',
  playScript: '',
  language: '',
  showGrid: false,
}

const store = new Store({
  defaults: state,
  name: 'setting',
})

const mutations = {
  updateSetting(state: State, newState: State) {
    Object.assign(state, newState)
  },
  toggleShowGrid(state: State) {
    state.showGrid = !state.showGrid
  },
}

const getters = {
  backendScriptValid(state: State) {
    return !!state.backendScript
  },
  playScriptValid(state: State) {
    return !!state.playScript
  },
}

const AUTO_SAVE_MUTATION = ['updateSetting', 'toggleShowGrid']

export default {
  name: 'setting',
  state,
  mutations,
  getters,
  subscribe(mutation: { type: $Keys<typeof mutations>, payload: any }, state: { setting: State }) {
    if (AUTO_SAVE_MUTATION.includes(mutation.type)) {
      store.set(state.setting)
    }
  },
}

// setup setting
Object.assign(state, store.store)
