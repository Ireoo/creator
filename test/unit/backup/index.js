import Vue from 'vue'
import Vuex from 'vuex'
import elementUI from 'element-ui'
import VueLever from 'vue-lever'
import VueEvents from 'vue-events'
import locale from 'element-ui/lib/locale/lang/en'

Vue.config.devtools = false
Vue.config.productionTip = false
Vue.use(Vuex)
Vue.use(elementUI, {locale})
Vue.use(VueLever)
Vue.use(VueEvents)

// require all test files (files that ends with .spec.js)
const testsContext = require.context('./specs', true, /\.spec$/)
testsContext.keys().forEach(testsContext)

// require all src files except main.js for coverage.
// you can also change this to match only the subset of files that
// you want coverage for.
const srcContext = require.context('../../src/renderer', true, /^\.\/(?!main(\.js)?$|style)/)
srcContext.keys().forEach(srcContext)
