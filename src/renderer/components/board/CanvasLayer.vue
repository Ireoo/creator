<template>
  <div class="layer-wrapper"
    :class="wrapperClass"
    :style="outerStyle | ratioBox(ratio)">
    <div class="element-wrapper">
      <img v-if="layer.type === 'image'"
        v-show="!threeDFile"
        v-gif="layer.src.endsWith('gif') && {autoplay}"
        :src="layer.src + `?${Date.now()}`"
        :style="innerStyle | ratioBox(ratio)"
        ref="element">
      <video v-else-if="layer.type === 'video'"
        ref="element"
        :src="layer.src"
        :style="innerStyle | ratioBox(ratio)"
        :loop="loop"
        :autoplay="autoplay"
        @play="play"
        @pause="pause"
        @timeupdate="playing"></video>
    </div>
  </div>
</template>

<script>
  import { pick } from 'ramda'
  import { MountComponents } from 'lib/utils'
  import { CROP, COLOR_RED, COLOR_BLUE } from 'type/constants'
  import { mapState } from 'vuex'
  import { get } from 'lodash'
  import Preview3D from 'pages/preview/Preview3D.vue'
  import { urlToPath } from 'lib/helper'
  import { isThreeDImage, getFile } from 'lib/project'
  import fs from 'fs-extra'
  import path from 'path'

  export default {
    name: 'ICanvasLayer',
    components: MountComponents(Preview3D),
    props: {
      mode: String,
      layer: {
        type: Object,
        required: true,
      },
      ratio: {
        type: Number,
        default: 1,
      },
    },
    computed: {
      ...mapState({
        view: state => state.board.view,
        stage: state => state.project.selectedStage,
      }),
      autoplay() {
        if (!this.stage) return false
        const init = get(this.stage, `parameter.${this.layer.elementType}.init`)
        if (this.view !== 'preview') return false
        return init && init.playVideo
      },
      loop() {
        if (!this.stage) return false
        const init = get(this.stage, `parameter.${this.layer.elementType}.init`)
        if (!init) return false
        if (this.view !== 'preview') return false

        return init && init.videoLoop
      },
      wrapperClass() {
        if (this.layer.parameter) {
          return {
            'keep-the-last-position': this.layer.parameter.init.keep,
            'keep-the-last-action': this.layer.parameter.change.keep,
          }
        }
      },
      outerStyle() {
        const layer = this.layer
        const transform = `rotateZ(${layer.rotate}deg) scale(${layer.scaleX}, ${
          layer.scaleY
        }) skew(${layer.skewH}deg, ${layer.skewV}deg)`
        const color = {
          background: this.colorChange.bg,
        }
        const common = {
          opacity: layer.opacity * (layer.transparent !== '0' ? 0.5 : 1),
          'z-index': layer.order,
        }

        if (this.mode === CROP) {
          return {
            ...pick(['left', 'top', 'width', 'height'], layer),
            transform,
            ...color,
            ...common,
          }
        } else {
          const borderWidth = do {
            if (layer.scaleX < 0.15 || layer.scaleY < 0.15) '4'
            else if (layer.scaleX < 0.3 || layer.scaleY < 0.3) '3'
            else if (layer.scaleX < 0.6 || layer.scaleY < 0.6) '2'
            else '1'
          }
          return {
            top: layer.top + layer.cTop,
            left: layer.left + layer.cLeft,
            width: layer.cWidth,
            height: layer.cHeight,
            // when layer is obj
            border:
              layer.elementType === 'obj'
                ? `${borderWidth}px solid lightgrey`
                : null,
            // when layer is locked
            // ...{
            //   border: do {
            //     const type = layer.paraType
            //     const keep = layer.parameter[type].keep
            //     if (keep && type === 'init') `1px solid ${COLOR_RED}`
            //     else if (keep && type === 'change') `1px solid ${COLOR_BLUE}`
            //     else null
            //   }
            // },
            transform,
            ...color,
            ...common,
          }
        }
      },
      innerStyle() {
        const layer = this.layer
        const color = {
          filter: this.colorChange.color,
        }
        if (this.mode === CROP) {
          return {
            top: 0,
            left: 0,
            width: layer.width,
            height: layer.height,
            ...color,
          }
        } else {
          return {
            top: -layer.cTop,
            left: -layer.cLeft,
            width: layer.width,
            height: layer.height,
            ...color,
          }
        }
      },
      colorChange() {
        return this.$store.state.static.parameter.colorChangeOptions.find(
          option => option.data === this.layer.color.toString()
        )
      },
      threeDFile() {
        if (this.view !== 'preview') return null
        if (this.layer.elementType === 'obj') return null
        const $path = urlToPath(this.layer.src)
        const jsonPath = isThreeDImage($path)
        if (!jsonPath) return null
        const json = fs.readJsonSync(jsonPath)
        const threeDFileName = json.fileName
        return getFile(jsonPath.replace(path.basename(jsonPath), threeDFileName))
      },
    },
    methods: {
      play() {
        this.$refs.element.play()
        this.layer.playing = true
        this.$emit('play')
      },
      pause() {
        this.$refs.element.pause()
        this.layer.playing = false
        this.$emit('pause')
      },
      playing() {
        this.layer.currentFrame =
          Math.round(this.layer.fps * this.$refs.element.currentTime) + 1
        this.$emit('playing', this.layer.currentFrame)
      },
      playToCurrent() {
        this.$refs.element.currentTime =
          (this.layer.currentFrame - 1) / this.layer.fps
      },
      stop() {
        this.pause()
        this.$refs.element.currentTime = 0
      },
      forward() {
        this.$refs.element.currentTime += 1 / (this.layer.fps || 24)
      },
      backward() {
        this.$refs.element.currentTime -= 1 / (this.layer.fps || 24)
      },
      toggleVolume() {
        this.layer.muted = this.$refs.element.muted = !this.$refs.element.muted
      },
      maxFrame() {
        return Math.round(this.$refs.element.duration * this.layer.fps) + 1
      },
    },
    async mounted() {
      if (this.layer.type === 'video') {
        this.playToCurrent()
      }
    },
    updated() {
      if (this.layer.type === 'video' && !this.layer.playing) {
        this.playToCurrent()
      }
    },
  }
</script>

<style lang="stylus" scoped>
  .layer-wrapper
    position absolute
    user-select none
    & > .element-wrapper
      overflow hidden
      width 100%
      height 100%
      position relative
      & > *
        position absolute
        board-transitioin()
  .keep
    position absolute
    width 102%
    height 102%
    left 0
    top 0
    content ''
    z-index 1
  .keep-the-last-position
    &:before
      @extend .keep
      border 1px solid $danger-color
      transform translate(-1%, -1%)
  .keep-the-last-action
    &:after
      @extend .keep
      border 1px solid $primary-color-highlight
      width 104%
      height 104%
      transform translate(-2%, -2%)
</style>
