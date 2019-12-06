<template>
  <div class="scence"
    :style="{width: 1920, height: 1080} | ratioBox(ratio)">
    <i-canvas-layer v-for="(layer, $index) in layers"
      v-show="showLayer(layer)"
      ref="layer"
      :layer="layer"
      :mode="mode"
      :ratio="ratio"
      :key="$index"
      @click.native="$emit('update:select', layer)"
      @contextmenu.native="$emit('layer-menu-click', layer, $event)"></i-canvas-layer>
    <i-three-d v-ref:threed
      v-if="threeDFile" />
    <i-preview-3-d v-if="view==='preview'"
      :layers="layers" />
  </div>
</template>

<script>
  import Layer from 'lib/layer'
  import { MountComponents } from 'lib/utils'
  import CanvasLayer from 'components/board/CanvasLayer.vue'
  import SceneMixin from '@/mixin/canvas-scene'
  import ThreeD from './ThreeD.vue'
  import { mapState, mapGetters } from 'vuex'
  import path from 'path'
  import { urlToPath } from 'lib/helper'
  import { isThreeDImage } from 'lib/project'
  import fs from 'fs-extra'
  import Preview3D from 'pages/preview/Preview3D.vue'

  import {
    EV_CANVAS_REFRESH,
    CUSTOMER_POS,
    DEFAULT_ORDER,
    EV_CANVAS_DEEP_REFRESH,
  } from 'type/constants'

  export default {
    name: 'IBoardInitScene',
    components: MountComponents(CanvasLayer, ThreeD, Preview3D),
    mixins: [SceneMixin],
    data() {
      return {
        layers: [],
      }
    },
    events: {
      [EV_CANVAS_REFRESH](stage) {
        if (stage !== this.stage) return
        this.updateLayer()
      },
      [EV_CANVAS_DEEP_REFRESH](stage) {
        if (stage !== this.stage) return
        this.layers.splice(0)
        this.updateLayer()
      },
    },
    watch: {
      stage(newStage, oldStage) {
        if (newStage !== oldStage && newStage) {
          this.loadLayer()
        }
      },
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
        view: state => state.board.view,
      }),
      ...mapGetters(['threeDFile']),
      selectIndex() {
        return this.layers.indexOf(this.select)
      },
      showLayer() {
        return layer => {
          if (layer.elementType === 'obj') return true
          if (!this.threeDFile) return true
          const imagePath = urlToPath(layer.src)
          const jsonPath = isThreeDImage(imagePath)
          if (!jsonPath) return true
          const json = fs.readJsonSync(jsonPath)
          const threeDFilePath = imagePath.replace(
            path.basename(imagePath),
            json.fileName
          )
          return threeDFilePath !== this.threeDFile.path
        }
      },
    },
    methods: {
      loadLayer() {
        this.$emit('update:select', null)
        this.layers = []
        this.updateLayer()
      },
      getLayer(id) {
        return this.layers.find(layer => layer.id === id)
      },
      getDom(lay) {
        return this.$refs.layer.find(layer => layer.layer === lay)
      },
      changeSelect(layer) {
        if (layer && this.layers.indexOf(layer) !== -1) {
          this.$emit('update:select', layer)
        } else if (this.layers.length) {
          this.$emit(
            'update:select',
            this.layers[(this.selectIndex + 1) % this.layers.length]
          )
        } else {
          this.$emit('update:select', null)
        }
      },
      updateLayer() {
        if (!this.stage) return
        const usedMap = new Map()
        Object.entries(this.stage.parameter).forEach(([type, parameter]) => {
          const metadata = parameter.source.metadata
          if (!metadata) return
          parameter.units.forEach((unit, index) => {
            const id = Layer.formatID({ type, index, status: 'init' })
            let layer = this.getLayer(id)
            if (layer) {
              layer.loadFrom(unit, 'init')
              layer.src = metadata.src // update src after renaming a file
            } else {
              layer = new Layer(metadata)
              layer.id = id
              layer.elementType = type
              layer.loadFrom(unit, 'init')
              layer.order = DEFAULT_ORDER[type]
              this.layers.push(layer)
            }
            // TODO: handle metadata change
            usedMap.set(layer, true)
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

        this.layers = this.layers.filter(layer => !!usedMap.get(layer))
        if (this.select) {
          if (!usedMap.get(this.select)) {
            this.$emit('update:select')
          }
        }

        // TODO: handle do snapshot
      },
    },
    created() {
      this.loadLayer()
    },
  }
</script>

<style lang="stylus" scoped>
</style>
