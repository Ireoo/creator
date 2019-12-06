const context = require.context('./', true, /\.vue/)

const components = context.keys().map(key => context(key).default)

export default components
