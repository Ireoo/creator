import { isFunction } from 'lib/utils'

export default {
  movable: {
    bind(el, binding, vnode, oldVnode) {
      const mousedown = e => {
        const startX = e.pageX
        const startY = e.pageY
        const handler = isFunction(binding.value) ? binding.value : (moveData) => { }
        let moved = false
        const startScrollLeft = el.scrollLeft
        const startScrollTop = el.scrollTop
        const store = new Map()

        function doHandler(status, e) {
          handler({
            status,
            startX,
            startY,
            x: e.pageX,
            y: e.pageY,
            offsetX: e.pageX - startX,
            offsetY: e.pageY - startY,
            startScrollLeft,
            startScrollTop,
            store,
          })
        }

        const mouseMove = e => {
          if (!moved) {
            doHandler('start', e)
          }
          moved = true
          doHandler('moving', e)
        }

        const mouseUp = e => {
          window.removeEventListener('mousemove', mouseMove, true)
          window.removeEventListener('mouseup', mouseUp, true)
          if (moved) {
            doHandler('end', e)
          }
        }

        window.addEventListener('mousemove', mouseMove, true)
        window.addEventListener('mouseup', mouseUp, true)
      }
      el.addEventListener('mousedown', mousedown)
      el._i_move_mousedown = mousedown
    },
    unbind(el, binding, vnode, oldVnode) {
      const mousedown = el._i_move_mousedown
      if (isFunction(mousedown)) {
        el.removeEventListener('mousedown', mousedown)
      }
    },
  },
}
