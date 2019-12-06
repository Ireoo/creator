import Vue from 'vue'

const context = require.context('.', false, /\.js$/)

context.keys().forEach(filter => {
  if (/index\.js$/.test(filter)) return
  filter = context(filter).default
  Object.entries(filter).forEach(([name, filter]) => {
    Vue.filter(name, filter)
  })
})
