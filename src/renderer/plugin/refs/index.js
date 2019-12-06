const allRefs = {}
const update = (key, vm) => allRefs[key] = vm
const plugin = {
  install(Vue) {
    Vue.directive('ref', {
      bind(el, { arg: key }) {
        update(key, el.__vue__)
      },
      update(el, { arg: key }) {
        update(key, el.__vue__)
      },
      inserted(el, { arg: key }) {
        update(key, el.__vue__)
      },
      componentUpdated(el, { arg: key }) {
        update(key, el.__vue__)
      },
    })
    Vue.mixin({
      computed: {
        vrefs() {
          return allRefs
        },
      },
    })
  },
}

export default plugin
