<template>
  <div
    class="board-container"
    :class="stage ? '' : '_empty'"
    :style="{ background: `url(${require('@/assets/transp_bg.png')})` }"
    @contextmenu="onMenu"
    tabindex="0"
    @keyup.ctrl.86="doLayerPaste"
    @keyup.ctrl.90="$store.commit('historyUndo', stage)"
    @keyup.ctrl.89="$store.commit('historyRedo', stage)"
    @mousewheel="mousewheel"
    @dragover="dragOver"
    @drop="drop"
  >
    <i-toolbar />
    <div class="change-prompt" v-if="status === 'change'">
      {{ boardText('inChangeModeOtherLayersCannotOperation') }}
    </div>
    <div
      class="board-content"
      ref="boardContent"
      v-movable="hold"
      :class="{ 'hold-mode': mode === 'hold' }"
      @click.self="$events.emit(EV_CANVAS_CLEAR_SELECT)"
    >
      <div class="canvas-wrapper" @click.self="$events.emit(EV_CANVAS_CLEAR_SELECT)">
        <div class="canvas-border">
          <i-image-canvas
            ref="canvas"
            v-if="!['if'].includes(stage.type)"
            :mode="mode"
            :stage="stage"
            class="board-canvas"
          ></i-image-canvas>
          <i-if-scene v-if="['if'].includes(stage.type)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from 'vuex'
import { MountComponents } from 'lib/utils'
import Layer from 'lib/layer'
import {
  EV_CANVAS_LAYER_ADD,
  CB_FORMAT_UNIT,
  EV_CANVAS_CHANGE_SELECT,
  EV_CANVAS_CLEAR_SELECT,
  EV_CANVAS_FIT,
  EV_CANVAS_CHANGE_ZOOM,
  EV_LOADING_OPEN,
  EV_MAKE_DIFFERENT_3D_IMAGE,
  RESOURCE_DELETE_FILE,
  EV_CANVAS_REFRESH
} from 'type/constants'
import { equals, clone, path as get } from 'ramda'
import { sum } from 'lodash'
import DragPayload from 'lib/drag-payload'
import path, { dirname, sep, join } from 'path'
import { getSourceRelativeSrc, pathToUrl, urlToPath } from 'lib/helper'
import IToolbar from './Toolbar'
import { isThreeDImage, fixFile, fixDae, getFile, isMpcImage } from 'lib/project'
import fs from 'fs-extra'

import Canvas from './Canvas.vue'
import IfScene from './IfScene.vue'

import { Loading } from 'element-ui'

export default {
  name: 'IBoard',
  data() {
    return { EV_CANVAS_CLEAR_SELECT }
  },
  components: MountComponents(Canvas, IToolbar, IfScene),
  computed: {
    ...mapState({
      zoom: get(['board', 'zoom']),
      stage: get(['project', 'selectedStage']),
      mode: get(['board', 'mode']),
      status: get(['board', 'status']),
      projectPath: get(['project', 'projectPath']),
      protect: get(['project', 'protect']),
      protectList: get(['project', 'protectList'])
    }),
    ...mapGetters(['protectCheck'])
  },
  events: {
    [EV_CANVAS_FIT]() {
      const dom = this.$el
      this.$store.commit('changeZoom', (dom.offsetWidth - 80) / 1920)
    },
    [EV_CANVAS_CHANGE_ZOOM](zoom) {
      this.changeZoom(zoom)
    }
  },
  methods: {
    ...mapMutations(['changeZoom', 'entry3DMode', 'updateStageParameterCommon', 'updateStageParameterUnitValue']),
    dragOver(e) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    drop(e) {
      console.log(e)
      const load = Loading.service({
        lock: true,
        text: 'Loading'
        // spinner: "el-icon-loading",
        // background: "rgba(255, 255, 255, 0.7)"
      })
      if (!this.protectCheck('addUnit')) return
      e.preventDefault()
      const payload = DragPayload.newFromDataTransfer(e.dataTransfer)
      if (payload && payload.is('element-resource')) {
        const file = payload.data
        this.importFile(file)
      }
      load.close()
    },
    async importFile(file) {
      if (file.type === 'image' || file.type === 'video') {
        // add resource or replace
        const type = file.parameter
        if (type !== 'bg' && type !== 'fg' && type !== 'cus') return
        const parameter = this.stage.parameter[type]
        const { source, units } = parameter
        const oldPath = getSourceRelativeSrc(source)
        const newPath = file.path.split(this.projectPath + sep)[1]
        file = await fixFile(file)

        let promise = Promise.resolve()
        if (oldPath !== newPath && units.length) {
          // required at last one unit and different resource path
          promise = promise.then(() => this.$confirm('Are you want to replace current images/video'), 'Warning', {
            type: 'warning'
          })
        }
        if (oldPath !== newPath || !units.length) {
          // required different resource path or no units
          // then add resource metadata
          promise = promise.then(async () => {
            const layer = await Layer.create(file.url)
            const newSource = clone(source)
            newSource.file = file.name
            newSource.directory = dirname(newPath)
            newSource.metadata = {
              width: layer.width,
              height: layer.height,
              src: layer.src,
              type: layer.type
            }
            const jsonFilePath = isThreeDImage(file.path)
            if (jsonFilePath) {
              newSource.metadata3D = fs.readJsonSync(jsonFilePath)
            } else {
              newSource.metadata3D = null
            }

            this.$store.commit('updateStageSource', {
              stage: this.stage,
              type,
              source: newSource
            })

            // 删除被替换掉的3d-image
            const oldImagePath = urlToPath(path.join(this.projectPath, oldPath))
            const oldJsonFilePath = isThreeDImage(oldImagePath)
            if (oldJsonFilePath) {
              this.$events.emit(RESOURCE_DELETE_FILE, {
                file: getFile(oldJsonFilePath),
                confirm: false
              })
              this.$events.emit(RESOURCE_DELETE_FILE, {
                file: getFile(oldImagePath),
                confirm: false
              })
            }
          })
        }

        if (oldPath === newPath || !units.length) {
          // required same path(already add resource metadata) or no units(don't have any unit, but with different path)
          promise.then(() =>
            this.$store.commit('addStageParameterUnit', {
              stage: this.stage,
              type
            })
          )
        }

        promise.then(async () => {
          const source = this.stage.parameter[type].source
          const jsonPath = isMpcImage(file.path)
          const jsonContent = fs.readJsonSync(jsonPath)

          // mpcIMAGE包含多个图片，所以添加多个unit
          if (units.length === 1) {
            for (const item of jsonContent) {
              const index = jsonContent.indexOf(item)
              if (index !== 0) await this.importFile(file)
              if (isMpcImage(file.path)) {
                const cropPoint = {
                  x: 0,
                  y: !index
                    ? 0
                    : sum(units.slice(0, index).map((unit, i) => source.metadata.height * jsonContent[i].height))
                }
                const cropArea = {
                  width: source.metadata.width * jsonContent[index].width,
                  height: source.metadata.height * jsonContent[index].height
                }
                ;['init', 'change'].forEach(status => {
                  const common = {
                    stage: this.stage,
                    type,
                    index,
                    status
                  }
                  this.updateStageParameterUnitValue({
                    ...common,
                    key: 'width',
                    value: cropArea.width
                  })
                  this.updateStageParameterUnitValue({
                    ...common,
                    key: 'height',
                    value: cropArea.height
                  })
                  this.updateStageParameterUnitValue({
                    ...common,
                    key: 'x0',
                    value: cropPoint.x
                  })
                  this.updateStageParameterUnitValue({
                    ...common,
                    key: 'y0',
                    value: cropPoint.y
                  })
                  this.$events.emit(EV_CANVAS_REFRESH, this.stage)
                })
              }
            }
          }
        })

        // gif\video时，play默认为true
        promise.then(() => {
          let play = /(gif|mp4)$/.test(newPath)
          if (newPath.endsWith('png') && isThreeDImage(file.path)) {
            play = true
          }
          this.updateStageParameterCommon({
            stage: this.stage,
            status: 'init',
            type,
            key: 'playVideo',
            value: play
          })
          this.updateStageParameterCommon({
            stage: this.stage,
            status: 'change',
            type,
            key: 'playVideo',
            value: play
          })
        })
      } else if (file.type === 'dae') {
        // fixDae(file.path)
        this.entry3DMode(file)
      } else if (['fbx', 'obj'].includes(file.type)) {
        this.entry3DMode(file)
      }
    },
    loadStage(stage) {
      Object.entries(stage.parameter).forEach(([type, parameter]) => {
        const metadata = parameter.source.metadata
        parameter.units.forEach((unit, index) => {
          const layer = new Layer(metadata)
          layer.id = type + index
          this.$events.emit(EV_CANVAS_LAYER_ADD, layer)
        })
      })
    },
    doLayerPaste() {
      const clipboard = this.$electron.clipboard
      if (!clipboard.has(CB_FORMAT_UNIT)) return
      try {
        /**
         * TODO: should offset layer when copy/paste in same stage
         */
        const { type, unit, source } = JSON.parse(clipboard.readBuffer(CB_FORMAT_UNIT))
        const curSource = this.stage.parameter[type].source
        const doPaste = () => {
          const metadata = this.stage.parameter[type].source.metadata
          // check resource size
          if (unit.init.x0 + unit.init.width > metadata.width) {
            unit.init.x0 = 0
            unit.init.width = metadata.width
          }
          if (unit.init.y0 + unit.init.height > metadata.height) {
            unit.init.y0 = 0
            unit.init.height = metadata.height
          }
          if (unit.change.x0 + unit.change.width > metadata.width) {
            unit.change.x0 = 0
            unit.change.width = metadata.width
          }
          if (unit.change.y0 + unit.change.height > metadata.height) {
            unit.change.y0 = 0
            unit.change.height = metadata.height
          }
          this.$store.commit('addStageParameterUnit', {
            stage: this.stage,
            type,
            unit
          })
          const imagePath = urlToPath(source.metadata.src)
          if (isThreeDImage(imagePath)) {
            // 同一Stage粘贴不处理
            if (equals(source, curSource)) return
            this.$events.emit(EV_MAKE_DIFFERENT_3D_IMAGE, {
              stage: this.stage,
              imagePath
            })
          }
        }
        this.$store.commit('updateStageSource', {
          stage: this.stage,
          type,
          source
        })
        doPaste()
      } catch (e) {
        console.error(e)
        this.$message.error('cannot paste parameter')
      }
    },
    onMenu({ menu }) {
      if (this.protectCheck('addUnit')) {
        menu.copyPasteGroup.onPaste = this.$electron.clipboard.has(CB_FORMAT_UNIT) && this.doLayerPaste
      }
    },
    hold(e) {
      if (this.mode !== 'hold') return
      const board = this.$refs.boardContent
      board.scrollLeft = -e.offsetX + e.startScrollLeft
      board.scrollTop = -e.offsetY + e.startScrollTop
    },
    mousewheel(e) {
      if (process.platform !== 'win32') {
        return
      }
      if (e.wheelDelta < 0) {
        this.$events.emit(EV_CANVAS_CHANGE_ZOOM, this.zoom - 0.1)
      } else {
        this.$events.emit(EV_CANVAS_CHANGE_ZOOM, this.zoom + 0.1)
      }
    }
  },
  mounted() {
    this.$events.emit(EV_CANVAS_FIT)
  }
}
</script>

<style lang="stylus" scoped>
.board-container
  width 100%
  height 100%
  position relative
  overflow hidden
  outline 0
  box-shadow inset 1px 1px 5px rgba(0, 0, 0, 0.12), -1px -1px 5px rgba(0, 0, 0, 0.12)
  &._empty:after
    content 'Board'
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    margin auto
    width 100px
    height 100px
    text-align center
    line-height @height
    color lightgray
    user-select none
    font-size 2em
.board-content
  width 100%
  height 100%
  position relative
  overflow auto
  display flex
.change-prompt
  position absolute
  top 0
  left 0
  right 0
  padding 5px
  text-align center
  background $primary-color-highlight
  color white
  z-index 200
.canvas-border
  paper()
  display inline-block
  clearfix()
.canvas-wrapper
  padding 40px
  display inline-block
  margin auto
.board-canvas
  float left
</style>
