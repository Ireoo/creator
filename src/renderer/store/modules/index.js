const files = require.context('./', false, /\.js$/)
const modules = {}

files.keys().forEach(key => {
  if (key.endsWith('index.js')) return
  const module = files(key).default
  if (module.name) {
    modules[module.name] = module
  } else {
    modules[key.replace(/(\.\/|\.js)/g, '')] = module
  }
})

export default modules
