<template>
  <div class="stage-position-selector">
    <div class="image-fix-box">
      <div class="image-container">
        <div class="image-wrapper">
          <div class="image-group" :style="{width: 1920, height: 1080} | ratioBox(zoom)">
            <i-canvas-layer :layer="layer" v-if="layer" :ratio="zoom"></i-canvas-layer>
            <div class="image-mask-dots" :style="maskBox | ratioBox(zoom)">
              <div class="mask" v-movable="maskMove"></div>
              <span class="mask-dot mask-dot_start" v-movable="dotStartMove"></span>
              <span class="mask-dot-text mask-dot-text_start" v-movable="dotStartMove">TL</span>
              <span class="mask-dot mask-dot_end" v-movable="dotEndMove"></span>
              <span class="mask-dot-text mask-dot-text_end" v-movable="dotEndMove">BR</span>
            </div>
            <svg class="image-mask" viewBox="0 0 1920 1080" :style="{width: 1920, height: 1080} | ratioBox(zoom)">
              <defs>
                <mask id="stage-position-selector-mask">
                  <rect width="1920" height="1080" x="0" y="0" fill="white"></rect>
                  <rect :width="Math.abs(endX - startX)" :height="Math.abs(endY - startY)" :x="Math.min(startX, endX)"
                    :y="Math.min(startY, endY)"></rect>
                </mask>
              </defs>
              <rect width="1920" height="1080" x="0" y="0" mask="url(#stage-position-selector-mask)"
                fill="rgba(0, 0, 0, 0.6)"></rect>
            </svg>
          </div>
        </div>
      </div>
    </div>
    <zoom-slider v-model="zoom"></zoom-slider>
  </div>
</template>

<script>
  import Layer from 'lib/layer'
  import { MountComponents } from 'lib/utils'
  import CanvasLayer from '../board/CanvasLayer.vue'
  import { clamp } from 'ramda'

  function createLayer(src) {
    const image = new Image()
    image.src = src
    const layer = new Layer(image)
    layer.width = layer.cWidth = 1920
    layer.height = layer.cHeight = 1080
    layer.top = layer.left = 0
    return layer
  }

  const verticalScreenClamp = clamp(0, 1080)
  const horizontalScreenClamp = clamp(0, 1920)

  export default {
    name: 'IStagePositionSelector',
    components: MountComponents(CanvasLayer),
    props: {
      startX: {
        type: Number,
        required: true,
      },
      startY: {
        type: Number,
        required: true,
      },
      endX: {
        type: Number,
        required: true,
      },
      endY: {
        type: Number,
        required: true,
      },
      src: String,
    },
    data() {
      return {
        zoom: 1,
        layer: createLayer(this.src),
      }
    },
    watch: {
      startX() {
        this.limitRange('startX', 0, this.endX)
      },
      startY() {
        this.limitRange('startY', 0, this.endY)
      },
      endX() {
        this.limitRange('endX', this.startX, 1920)
      },
      endY() {
        this.limitRange('endY', this.startY, 1080)
      },
    },
    computed: {
      maskBox() {
        return {
          top: Math.min(this.startY, this.endY),
          left: Math.min(this.startX, this.endX),
          width: Math.abs(this.startX - this.endX),
          height: Math.abs(this.startY - this.endY),
        }
      },
    },
    methods: {
      dotStartMove(data) {
        this.dotMove('start', data)
      },
      dotEndMove(data) {
        this.dotMove('end', data)
      },
      dotMove(type, { status, store, offsetX, offsetY }) {
        if (status === 'start') {
          store.set('x', this[type + 'X'])
          store.set('y', this[type + 'Y'])
        } else {
          const x = store.get('x')
          const y = store.get('y')
          const px = x + offsetX / this.zoom
          const py = y + offsetY / this.zoom
          this.$emit(`update:${type}X`, parseInt(px))
          this.$emit(`update:${type}Y`, parseInt(py))
        }
      },
      maskMove({ status, store, offsetX, offsetY }) {
        if (status === 'start') {
          store.set('startX', this.startX)
          store.set('startY', this.startY)
          store.set('endX', this.endX)
          store.set('endY', this.endY)
        } else {
          const startX = store.get('startX')
          const startY = store.get('startY')
          const endX = store.get('endX')
          const endY = store.get('endY')
          const pOffsetX = offsetX / this.zoom
          const pOffsetY = offsetY / this.zoom
          this.$emit(
            'update:startX',
            horizontalScreenClamp(parseInt(startX + pOffsetX))
          )
          this.$emit(
            'update:startY',
            verticalScreenClamp(parseInt(startY + pOffsetY))
          )
          this.$emit(
            'update:endX',
            horizontalScreenClamp(parseInt(endX + pOffsetX))
          )
          this.$emit(
            'update:endY',
            verticalScreenClamp(parseInt(endY + pOffsetY))
          )
        }
      },
      limitRange(prop, min, max) {
        if (this[prop] < min) {
          this.$emit('update:' + prop, min)
        } else if (this[prop] > max) {
          this.$emit('update:' + prop, max)
        }
      },
    },
    mounted() {
      this.zoom = (this.$el.getBoundingClientRect().width - 40) / 1920
    },
  }
</script>

<style lang="stylus" scoped>
  $dot-size = 10px
  $dot-text-size = 24px
  $dot-arrow-size = 12px
  .image-fix-box
    width 100%
    padding-bottom 56.25%
    position relative
  .image-container
    display flex
    position absolute
    top 0
    left 0
    bottom 0
    right 0
    overflow auto
  .image-wrapper
    margin auto
    display inline-block
    padding 20px
  .image-group
    position relative
    display inline-block
    box-shadow 0 0 1px 2px #999999
  .image-mask-dots
    position absolute
    z-index 50
  .image-mask
    position absolute
    top 0
    left 0
    z-index 49
  .mask
    position absolute
    top 5px
    left @top
    right @top
    bottom @top
    cursor move
  .mask-dot, .mask-dot-text
    position absolute
    cursor move
  .mask-dot
    width $dot-size
    height $dot-size
    border-radius 50%
    border 1px solid white
  .mask-dot-text
    font-size ($dot-text-size / 2)
    text-align center
    padding 5px 5px
    border-radius 5px
    color white
    &:after
      box-sizing border-box
      content ''
      position absolute
      border ($dot-arrow-size / 2) solid transparent
      width $dot-arrow-size
      height $dot-arrow-size
      margin auto
  .mask-dot_start
    background red
    top -($dot-size / 2)
    left -($dot-size / 2)
  .mask-dot_end
    background green
    bottom -($dot-size / 2)
    right -($dot-size / 2)
  .mask-dot-text_start
    background red
    top -($dot-text-size / 2)
    left -($dot-text-size + $dot-arrow-size + 2px)
    &:after
      right -($dot-arrow-size)
      top 0
      bottom 0
      border-left-color @background
  .mask-dot-text_end
    background green
    bottom -($dot-text-size / 2)
    right -($dot-text-size + $dot-arrow-size + 2px)
    &:after
      left -($dot-arrow-size)
      top 0
      bottom 0
      border-right-color @background
</style>