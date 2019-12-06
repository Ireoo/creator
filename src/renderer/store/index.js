import Vue from 'vue'
import Vuex from 'vuex'
import modules from './modules'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules,
  strict: process.env.NODE_ENV !== 'production',
})

export default store

for (let module of Object.values(modules)) {
  if (module.subscribe) {
    store.subscribe(module.subscribe)
  }
  if (module.watch) {
    module.watch.forEach(({ getter, cb, option }) => store.watch(getter, cb, option))
  }
}
