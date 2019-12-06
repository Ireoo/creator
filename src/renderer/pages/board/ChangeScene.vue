<template>
  <div>
    <template v-if="baseLayer && deltaLayer">
      <i-canvas-layer v-for="layer in layers" :layer="layer" :mode="mode" :ratio="ratio" :key="layer.id"
        style="opacity: 0.5"></i-canvas-layer>
      <i-canvas-layer class="base-layer" ref="baseLayer" :layer="baseLayer" :mode="mode" :ratio="ratio"
        @click.native="$emit('update:select', baseLayer)" @contextmenu.native="$emit('layer-menu-click', baseLayer, $event)"></i-canvas-layer>
      <i-canvas-layer class="delta-layer" ref="deltaLayer" :layer="deltaLayer" :mode="mode" :ratio="ratio"
        @click.native="$emit('update:select', deltaLayer)" @contextmenu.native="$emit('layer-menu-click', deltaLayer, $event)"></i-canvas-layer>
      <svg :style="{width: 1920, height: 1080} | ratioBox(ratio)" viewBox="0 0 1920 1080" class="line">
        <line :x1="baseLayer.centerOffsetX()" :y1="baseLayer.centerOffsetY()" :x2="deltaLayer.centerOffsetX()"
          :y2="deltaLayer.centerOffsetY()" stroke="white" stroke-dasharray="10" stroke-width="4"></line>
        <line :x1="baseLayer.centerOffsetX()" :y1="baseLayer.centerOffsetY()" :x2="deltaLayer.centerOffsetX()"
          :y2="deltaLayer.centerOffsetY()" stroke="#333" stroke-dasharray="10" stroke-width="2"></line>

        <template v-if="deltaLayer.left2 && deltaLayer.top2">
          <line :x1="baseLayer.centerOffsetX()" :y1="baseLayer.centerOffsetY()" :x2="deltaLayer.centerOffsetX2()"
            :y2="deltaLayer.centerOffsetY2()" stroke="white" stroke-dasharray="10" stroke-width="4"></line>
          <line :x1="baseLayer.centerOffsetX()" :y1="baseLayer.centerOffsetY()" :x2="deltaLayer.centerOffsetX2()"
            :y2="deltaLayer.centerOffsetY2()" stroke="#333" stroke-dasharray="10" stroke-width="2"></line>
        </template>

        <rect :x="baseLayer.centerOffsetX() - 8" :y="baseLayer.centerOffsetY() - 8" width="16"
          height="16" stroke="#eee" fill="red" stroke-width="3"></rect>
        <path fill="green" stroke="#eee" stroke-width="3" :d="trianglePath"></path>
      </svg>
    </template>
    <div v-else>
      Layer error
    </div>
  </div>
</template>

<script>
  import { MountComponents, rotatePoint } from 'lib/utils'
  import { getStickItemType } from 'lib/project'
  import CanvasLayer from 'components/board/CanvasLayer.vue'
  import SceneMixin from '@/mixin/canvas-scene'
  import { EV_CANVAS_REFRESH, DEFAULT_ORDER, CUSTOMER_POS } from 'type/constants'
  import Layer from 'lib/layer'

  const sqrt3 = Math.sqrt(3)
  const triangleEdge = 20
  const shortEdge = (triangleEdge * sqrt3) / 6
  const longEdge = (triangleEdge * sqrt3) / 3
  const halfEdge = triangleEdge / 2

  export default {
    name: 'IBoardChangeScene',
    components: MountComponents(CanvasLayer),
    mixins: [SceneMixin],
    data() {
      return {
        baseLayer: null,
        deltaLayer: null,
        layers: [],
      }
    },
    events: {
      [EV_CANVAS_REFRESH](stage) {
        if (stage === this.stage) {
          this.updateLayer()
        }
      },
    },
    computed: {
      parameter() {
        return this.stage.parameter[this.paraType]
      },
      unit() {
        return this.parameter.units[this.paraIndex]
      },
      baseType() {
        if (this.unit.change.chgCtr === '3') {
          const type = getStickItemType(this.unit.change.stickItem)
          if (type && this.stage.parameter[type].units[this.paraIndex]) {
            return type
          }
        }
        return this.paraType
      },
      deltaType() {
        return this.paraType
      },
      trianglePath() {
        // only for delta layer
        const x = this.deltaLayer.centerOffsetX()
        const y = this.deltaLayer.centerOffsetY()
        const fx = this.baseLayer.centerOffsetX()
        const fy = this.baseLayer.centerOffsetY()
        const angle = Math.atan2(fy - y, fx - x)
        const point1 = rotatePoint([x + shortEdge, y - halfEdge], [x, y], angle)
        const point2 = rotatePoint([x + shortEdge, y + halfEdge], [x, y], angle)
        const point3 = rotatePoint([x - longEdge, y], [x, y], angle)
        return `M${point1.join(' ')} L${point2.join(' ')} L${point3.join(' ')} Z`
      },
    },
    watch: {
      unit: {
        deep: true,
        handler(nv, ov) {
          this.baseLayer = this.deltaLayer = null
          this.layers = []
          this.loadLayer()
        },
      },
    },
    methods: {
      getDom(layer) {
        if (this.$refs.baseLayer.layer.id === layer.id) {
          return this.$refs.baseLayer
        } else if (this.$refs.deltaLayer.layer.id === layer.id) {
          return this.$refs.deltaLayer
        }
      },
      getLayer(id) {
        return this.layers.find(layer => layer.id === id)
      },
      changeSelect(layer) {
        this.$emit(
          'update:select',
          do {
            if (layer === this.baseLayer) this.baseLayer
            else if (layer === this.deltaLayer) this.deltaLayer
            else if (this.select === this.baseLayer) this.deltaLayer
            else if (this.select === this.deltaLayer) this.baseLayer
            else this.baseLayer
          }
        )
      },
      loadLayer() {
        if (!this.unit) return
        this.updateLayer()
        this.loadOtherLayers()
        this.$emit('update:select', null)
      },
      updateLayer() {
        const base = new Layer(
          this.stage.parameter[this.baseType].source.metadata
        )
        const delta = new Layer(
          this.stage.parameter[this.deltaType].source.metadata
        )
        base.loadFrom(
          this.stage.parameter[this.baseType].units[this.paraIndex],
          'init'
        )
        delta.loadFrom(
          this.stage.parameter[this.deltaType].units[this.paraIndex],
          'change'
        )
        base.id = Layer.formatID({
          type: this.baseType,
          index: this.paraIndex,
          status: 'init',
        })
        delta.id = Layer.formatID({
          type: this.deltaType,
          index: this.paraIndex,
          status: 'change',
        })
        base.order = delta.order = 30
        if (this.baseLayer === this.select) {
          this.$emit('update:select', base)
        } else if (this.deltaLayer === this.select) {
          this.$emit('update:select', delta)
        }
        this.baseLayer = base
        this.deltaLayer = delta
      },
      loadOtherLayers() {
        if (!this.stage) return
        Object.entries(this.stage.parameter).forEach(([type, parameter]) => {
          const metadata = parameter.source.metadata
          if (!metadata) return
          parameter.units.forEach((unit, index) => {
            if (unit === this.unit) return
            const id = Layer.formatID({ type, index, status: 'init' })
            let layer = new Layer(metadata)
            layer.id = id
            layer.loadFrom(unit, 'init')
            layer.order = DEFAULT_ORDER[type]
            this.layers.push(layer)
          })
        })

        this.stage.parameter.cus.units.forEach((unit, index) => {
          const layer = this.getLayer(
            Layer.formatID({
              type: 'cus',
              index,
            })
          )
          if (layer) {
            layer.order = CUSTOMER_POS[unit.init.customerPosIni]
          }
        })
      },
    },
    created() {
      this.loadLayer()
    },
  }
</script>

<style lang="stylus" scoped>
  .line
    position absolute
    top 0
    left 0
    z-index 50
    pointer-events none
</style>
