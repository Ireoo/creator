// @flow
type ActiveType = 'home' | 'element' | 'instruction'

type State = {
  active: ActiveType,
}

const state: State = {
  active: 'home',
}

const mutations = {
  changeActive(state: State, active: ActiveType) {
    state.active = active
  },
}

export default {
  name: 'header',
  state,
  mutations,
}
