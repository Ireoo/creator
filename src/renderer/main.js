import Vue from 'vue'
import { remote } from 'electron'

import App from './App.vue'
import router from './router'
import store from './store'
import './filter'
import './directive'
import I18n from './i18n'

import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'
import 'element-ui/lib/theme-chalk/index.css'

import VueLever from 'vue-lever'
import VueEvents from 'vue-events'

import axios from 'axios'

import MuseUI from 'muse-ui'
import 'muse-ui/dist/muse-ui.css'
import 'muse-ui/dist/theme-light.css' // using light theme

import protect from '@/plugin/protect'
import giffer from '@/plugin/giffer'
import refs from '@/plugin/refs'

// global component
import GlobalComponent from 'components/global'

import 'lib/init-install.js'

const i18n = I18n(Vue)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = true

Vue.prototype.$axios = axios

Vue.use(VueLever)
Vue.use(VueEvents)
Vue.use(ElementUI, { locale })
Vue.use(MuseUI)

Vue.use(protect)
Vue.use(giffer)
Vue.use(refs)

GlobalComponent.forEach(component => Vue.component(component.name, component))
Vue.component(GlobalComponent)

/* eslint-disable no-new */
const app = new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: h => h(App),
})

console.log('mounted', app)

document.addEventListener('dragover', e => {
  e.preventDefault()
  return false
}, false)

document.addEventListener('drop', e => {
  e.preventDefault()
  return false
}, false)

remote.globalShortcut.register('CommandOrControl+Shift+K', () => {
  remote.BrowserWindow.getFocusedWindow().webContents.openDevTools()
})

window.addEventListener('beforeunload', () => {
  remote.globalShortcut.unregisterAll()
})
