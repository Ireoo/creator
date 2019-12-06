const plugin = {
  install(Vue) {
    Vue.directive('gif', {
      bind: plugin.update,
      componentUpdated: plugin.update,
      updated: plugin.update,
    })
  },
  async update(el, { value }, { context }) {
    el.__proto__.$play = _ => { }
    if (!value) return
    const originSrc = el.getAttribute('data-origin-src')
    if (!isGifImage(el)) return
    if (!el.complete) await new Promise(resolve => el.onload = resolve)
    const autoplay = value.autoplay
    freezeGif(el)
    el.__proto__.$play = plugin.play.bind(el)
    el.__proto__.$stop = plugin.stop.bind(el)
    if (!autoplay) return
    else el.$play()
  },
  play() {
    const originSrc = this.getAttribute('data-origin-src') + '?' + Date.now()
    this.setAttribute('src', originSrc)
  },
  stop() {
    freezeGif(this)
  },
}

export default plugin

function isGifImage(el) {
  return /.gif$/.test(el.getAttribute('data-origin-src') || el.src)
}

function freezeGif(el) {
  var canvas = document.createElement('canvas')
  var w = canvas.width = el.width * 10
  var h = canvas.height = el.height * 10
  const src = el.src
  if (isGifImage(el) && !el.getAttribute('data-origin-src')) { el.setAttribute('data-origin-src', src) }
  canvas.getContext('2d').drawImage(el, 0, 0, w, h)
  el.src = canvas.toDataURL('image/gif')
}
