此插件使用后，minxin所有带有v-ref指令的组件到vm.vrefs中，以便跨组件通信。
激活插件：Vue.use(require('./index.js))
假设为A组件添加指令：v-ref:a后，在所有组件中可以通过this.vrefs.a调用A组件的上下文。