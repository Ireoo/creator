// @flow
import av from 'leancloud-storage'

type State = {
  id: string,
  email: string,
  anonymous: boolean,
  username: string,
}

const state: State = {
  anonymous: true,
  id: '',
  email: '',
  username: '',
}

const mutations = {
  initUser(state: State, info?: { id: string, name: string, email: string, username: string }) {
    info = info || JSON.parse(localStorage.getItem('userinfo') || '{}')
    state.id = info ? info.id : ''
    state.email = info ? info.email : ''
    state.anonymous = !info.id
    state.username = info ? info.username : ''
    if (info) {
      localStorage.setItem('userinfo', JSON.stringify(info))
    }
  },
  logout(state: State) {
    localStorage.removeItem('userinfo')
    state.id = ''
    state.email = ''
    state.anonymous = true
    state.username = ''
  },
}

export default {
  name: 'user',
  state,
  mutations,
}
