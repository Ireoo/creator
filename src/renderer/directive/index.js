import Vue from 'vue'

const context = require.context('.', false, /\.js$/)

context.keys().forEach(directives => {
  if (/index\.js$/.test(directives)) return
  directives = context(directives).default
  Object.entries(directives).forEach(([name, directive]) => {
    Vue.directive(name, directive)
  })
})
