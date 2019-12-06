import { mapState } from 'vuex'
import { throttle } from 'lodash'

let $vm
const plugin = {
  install(Vue) {
    Vue.mixin({
      computed: {
        ...mapState({
          $protectList: state => state.project.protectList,
          $stage: state => state.project.selectedStage,
        }),
      },
    })
    Vue.directive('protect', {
      bind: plugin.hook,
      update: plugin.hook,
    })
  },
  hook(el, { value }, { context }) {
    $vm = context
    const updateProtectList = list => list.includes(value) ? disableEvent(el) : enableEvent(el)
    context.$watch('$protectList', updateProtectList, { deep: true, immediate: true })
  },
}
export default plugin

const events = ['click', 'mousedown', 'mouseup', 'contextmenu', 'drop', 'drag']

async function disableEvent(el) {
  // wait for DOM rendering to complete
  await new Promise(resolve => setTimeout(resolve, 0))
  events.forEach(type => el.addEventListener(type, listener, true))
}

function enableEvent(el) {
  events.forEach(type => el.removeEventListener(type, listener, true))
}

const error = throttle(() => $vm.$message.error('Undable to operate protected value.'), 1000, { trailing: false })
function listener(e) {
  if (!$vm.$stage.protect || !$vm.$store.state.project.protect) return
  error()
  e.stopPropagation()
  e.preventDefault()
  e.stopImmediatePropagation()
}
