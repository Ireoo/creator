// @flow
import Store from 'electron-store'
type State = {
  domain: string
}

const state: State = {
  domain: 'https://player.integem.com',
}

const store = new Store({
  defaults: state,
  name: 'domain',
})

const mutations = {
  updateConfiguration(state: State, newState: State) {
    Object.assign(state, newState)
  },
}

const AUTO_SAVE_MUTATION = ['updateConfiguration']

export default {
  name: 'configuration',
  state,
  mutations,
  subscribe(mutation: { type: $Keys<typeof mutations>, payload: any }, state: { setting: State }) {
    if (AUTO_SAVE_MUTATION.includes(mutation.type)) {
      store.set(state.configuration)
    }
  },
}
// setup setting
Object.assign(state, store.store)
