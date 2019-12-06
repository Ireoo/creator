// @flow
import Store from 'electron-store'

type panelSize={
  top: number,
  left: number,
  right: number
}

type State = {
  panelSize: panelSize,
}

const defaultSize = 200
const state: State = {
  panelSize: {
    top: defaultSize,
    left: defaultSize,
    right: defaultSize,
  },
}

const store = new Store({
  defaults: state,
  name: 'preference',
})

const mutations = {
  updatePreference(state: State, newState: State) {
    Object.assign(state, newState)
    store.set(state)
  },
  updatePanelSize(state: State, panelSize: panelSize) {
    Object.assign(state.panelSize, panelSize)
    store.set(state)
  },
}

const getters = {
  panelSize(state: State) {
    return state.panelSize
  },
}

export default {
  name: 'preference',
  state,
  mutations,
  getters,
}

// setup preference
Object.assign(state, store.store)
