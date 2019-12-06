<template>
  <div class="canvas-container grid" :style="{width: width, height: height} | ratioBox(ratio)"
    tabindex="0" @keyup.self.ctrl.67="doLayerCopy(current)" @keyup.self.delete="doLayerDelete(current)"
    @keyup.self.up="moveLayerOnce($event, 'up')" @keyup.self.down="moveLayerOnce($event, 'down')"
    @keyup.self.left="moveLayerOnce($event, 'left')" @keyup.self.right="moveLayerOnce($event, 'right')">
    <i-board-init-scene ref="scene" v-if="parameterStatus === 'init'" :select.sync="current" :stage="stage"
      @layer-menu-click="(layer, $event) => onLayerMenu($event, 'layer', layer)"></i-board-init-scene>
    <i-board-change-scene ref="scene" v-if="parameterStatus === 'change'" :select.sync="current"
      :stage="stage" @layer-menu-click="(layer, $event) => onLayerMenu($event, 'layer', layer)"></i-board-change-scene>

    <div class="cut-box" v-if="isCrop && current" :style="currentCropBox | ratioBox(ratio)"
      @contextmenu="onLayerMenu($event, 'select')">
      <div class="mask" data-placement="top" style="top: 0; left: 0; right: 0;" :style="maskTopBox | ratioBox(ratio)"></div>
      <div class="mask" data-placement="bottom" style="bottom: 0; left: 0; right: 0;" :style="maskBottomBox | ratioBox(ratio)"></div>
      <div class="mask" data-placement="left" style="left: 0" :style="maskLeftBox | ratioBox(ratio)"></div>
      <div class="mask" data-placement="right" style="right: 0" :style="maskRightBox | ratioBox(ratio)"></div>
      <div class="designator" :style="designatorBox | ratioBox(ratio)">
        <div class="move" data-action="move" @mousedown="e => cutMousedown(e, 'move')"></div>
        <span class="vertical" data-action="top" style="top: 0; border-top-style: solid" @mousedown="e => cutMousedown(e, 'top')"></span>
        <span class="vertical" data-action="bottom" style="bottom: 0; border-bottom-style: solid"
          @mousedown="e => cutMousedown(e, 'bottom')"></span>
        <span class="horizontal" data-action="right" style="right: 0; border-right-style: solid"
          @mousedown="e => cutMousedown(e, 'right')"></span>
        <span class="horizontal" data-action="left" style="left: 0; border-left-style: solid"
          @mousedown="e => cutMousedown(e, 'left')"></span>
        <span data-action="top-left" style="cursor: nwse-resize; border-top-style: solid; top:0; border-left-style: solid; left:0"
          @mousedown="e => cutMousedown(e, 'top-left')"></span>
        <span data-action="top-right" style="cursor: nesw-resize; border-top-style: solid; top:0; border-right-style: solid; right:0"
          @mousedown="e => cutMousedown(e, 'top-right')"></span>
        <span data-action="bottom-left" style="cursor: nesw-resize; border-bottom-style: solid; bottom:0; border-left-style: solid; left:0"
          @mousedown="e => cutMousedown(e, 'bottom-left')"></span>
        <span data-action="bottom-right" style="cursor: nwse-resize; border-bottom-style: solid; bottom:0; border-right-style: solid; right:0"
          @mousedown="e => cutMousedown(e, 'bottom-right')"></span>
      </div>
    </div>

    <div class="control-box" v-if="current && isSelect" @dblclick="entry3DMode" :style="currentSelectBox | ratioBox(ratio)"
      @contextmenu="onLayerMenu($event, 'select')">
      <div class="move" data-action="move" @mousedown="e => controlMousedown(e, 'move')"></div>
      <span class="rotate" data-action="rotate" @mousedown="e => controlMousedown(e, 'rotate')"></span>
      <!-- scale control -->
      <span class="scale-vertical" data-action="scale/top" style="top: -2px;width:10px" @mousedown="e => controlMousedown(e, 'scale/top')"></span>
      <span class="scale-vertical" data-action="scale/bottom" style="bottom: -2px;width:10px"
        @mousedown="e => controlMousedown(e, 'scale/bottom')"></span>
      <span class="scale-horizontal" data-action="scale/left" style="left: -2px;height:10px"
        @mousedown="e => controlMousedown(e, 'scale/left')"></span>
      <span class="scale-horizontal" data-action="scale/right" style="right: -2px;height:10px"
        @mousedown="e => controlMousedown(e, 'scale/right')"></span>
      <!-- skew control -->
      <span class="skew-vertical" data-action="skew/top" style="top: -15px" @mousedown="e => controlMousedown(e, 'skew/top')"></span>
      <span class="skew-vertical" data-action="skew/bottom" style="bottom: -15px" @mousedown="e => controlMousedown(e, 'skew/bottom')"></span>
      <span class="skew-horizontal" data-action="skew/left" style="left: -15px" @mousedown="e => controlMousedown(e, 'skew/left')"></span>
      <span class="skew-horizontal" data-action="skew/right" style="right: -15px" @mousedown="e => controlMousedown(e, 'skew/right')"></span>
      <!-- corner scale control  -->
      <span data-action="scale/top-left" style="cursor: nwse-resize; top: -5px; left: -5px"
        @mousedown="e => controlMousedown(e, 'scale/top-left')"></span>
      <span data-action="scale/top-right" style="cursor: nesw-resize; top: -5px; right: -5px"
        @mousedown="e => controlMousedown(e, 'scale/top-right')"></span>
      <span data-action="scale/bottom-left" style="cursor: nesw-resize; bottom: -5px; left: -5px"
        @mousedown="e => controlMousedown(e, 'scale/bottom-left')"></span>
      <span data-action="scale/bottom-right" style="cursor: nwse-resize; bottom: -5px; right: -5px"
        @mousedown="e => controlMousedown(e, 'scale/bottom-right')"></span>
      <div class="video" v-if="current.type === 'video'">
        <i class="fa fa-step-backward fa-fw" @click="videoControl('backward')"></i>
        <i class="fa fa-fw" :class="current.playing ? 'fa-pause' : 'fa-play'" @click="videoControl('control')"></i>
        <i class="fa fa-step-forward fa-fw" @click="videoControl('forward')"></i>
        <i class="fa fa-stop fa-fw" @click="videoControl('stop')"></i>
        <i class="fa fa-fw" :class="current.muted ? 'fa-volume-off' : 'fa-volume-up'" @click="videoControl('volume')"></i>
        <input type="number" pattern="[0-9]+" v-model="current.fps" :disabled="current.playing">
        <input type="number" min="1" pattern="[0-9]+" :max="currentLayer().maxFrame()" v-model="current.currentFrame"
          @change="currentLayer().playToCurrent()" :disabled="current.playing">
      </div>
    </div>
    <template v-if="parameterStatus === 'change' && centerPositionRandomBox.active">
      <div class="random-box__center-position" :style="centerPositionRandomBox | ratioBox(ratio)">
        Random position In this area
      </div>
      <div class="movable" :style="{left:current.centerOffsetX2(),top:current.centerOffsetY2()} | ratioBox(ratio)"
        @mousedown.capture="e=>Object.assign(e,{controlType:'random'})" @mousedown="e => controlMousedown(e, 'move')">
        <i class="fa fa-arrows" aria-hidden="true"></i>
      </div>
    </template>

    <div v-show="showGrid" class="grid-bg"></div>
  </div>
</template>

<script>
  import InitScene from './InitScene.vue'
  import ChangeScene from './ChangeScene.vue'
  import { pick, clone, clamp, path as get } from 'ramda'
  import path from 'path'
  import fs from 'fs-extra'
  import {
    tan,
    atan2,
    moveAngle,
    elementOffset,
    MountComponents,
  } from 'lib/utils'
  import {
    Debounce,
    isSourceReference,
    isSourceRandom,
    getSourceType,
    urlToPath,
    points2rectangle,
  } from 'lib/helper'
  import { mapState, mapMutations, mapGetters, mapActions } from 'vuex'
  import Layer from 'lib/layer'
  import dom2image from 'lib/dom2image'
  import { Buffer } from 'buffer'
  import {
    EV_CANVAS_CHANGE_SELECT,
    EV_CANVAS_CLEAR_SELECT,
    EV_CANVAS_REFRESH,
    EV_CANVAS_DEEP_REFRESH,
    SELECT,
    CROP,
    CB_FORMAT_UNIT,
    CANVAS_SNAPSHOT_SCALE,
    REFRESH_RESOURCE,
    EV_ENTRY_3D_MODE,
    RESOURCE_DELETE_FILE,
  } from 'type/constants'
  import {
    getFile,
    isThreeDImage,
    copyElementAsset,
    isRandomPara,
  } from 'lib/project'

  const DIRECTION = ['top', 'left', 'right', 'bottom']

  function unRatioDOMProperty(dom, property, ratio) {
    // because some property maybe auto, so property must be ends with 'px' to make sure is a length unit
    if (dom.style && dom.style[property] && dom.style[property].endsWith('px')) {
      dom.style[property] = parseFloat(dom.style[property]) / ratio + 'px'
    }
  }

  export default {
    name: 'IImageCanvas',
    components: MountComponents(InitScene, ChangeScene),
    props: {
      width: {
        type: Number,
        default: 1920,
      },
      height: {
        type: Number,
        default: 1080,
      },
      mode: {
        type: String,
        default: 'select',
      },
      stage: {
        type: Object,
        required: true,
      },
    },
    data() {
      return {
        layers: [],
        currentStore: null,
        directions: DIRECTION,
        mouseDoing: false,
        mouseData: {},
        isClick: false,
      }
    },
    watch: {
      'current.fps'() {
        this.updateVideoInfo()
      },
      'current.currentFrame'() {
        this.updateVideoInfo()
      },
      'current.playing'() {
        this.doSnapshot()
      },
      'stage.id'() {
        this.doSnapshot()
      },
    },
    events: {
      [EV_CANVAS_CHANGE_SELECT](option) {
        let layer
        if (option) {
          layer = this.$refs.scene.getLayer(Layer.formatID(option))
        }
        this.changeSelect(layer)
      },
      [EV_CANVAS_REFRESH](stage) {
        if (stage === this.stage) {
          this.doSnapshot()
        }
      },
      [EV_CANVAS_DEEP_REFRESH](stage) {
        if (stage === this.stage) {
          this.doSnapshot()
        }
      },
      [EV_CANVAS_CLEAR_SELECT]() {
        this.current = null
      },
      [EV_ENTRY_3D_MODE]() {
        this.entry3DMode()
      },
    },
    computed: {
      ...mapState({
        ratio: get(['board', 'zoom']),
        lockAspectRatio: get(['board', 'lockAspectRatio']),
        parameterStatus: get(['board', 'status']),
        protect: get(['project', 'protect']),
        showGrid: get(['setting', 'showGrid']),
        projectPath: get(['project', 'projectPath']),
      }),
      ...mapGetters(['protectCheck']),
      current: {
        get() {
          return this.currentStore
        },
        set(layer) {
          if (
            this.parameterStatus === 'init' &&
            this.currentStore !== layer &&
            layer
          ) {
            // only emit event when in init
            const { type, index } = Layer.parseID(layer.id)
            this.$store.commit('changeType', type)
            this.$store.commit('changeIndex', index)
          }
          this.currentStore = layer
        },
      },
      currentSelect() {
        return this.layers.indexOf(this.current)
      },
      currentSelectBox() {
        const current = this.current
        if (!current) return {}
        const offsetH =
          ((Math.abs(tan(current.skewH) * current.cHeight) + current.cWidth) *
            current.scaleX -
            current.cWidth) /
            2 || 0
        const offsetV =
          ((Math.abs(tan(current.skewV) * current.cWidth) + current.cHeight) *
            current.scaleY -
            current.cHeight) /
            2 || 0
        const width = current.cWidth + offsetH * 2
        const height = current.cHeight + offsetV * 2
        return {
          top: -offsetV + current.cTop + current.top + (height < 0 ? height : 0),
          left: -offsetH + current.cLeft + current.left + (width < 0 ? width : 0),
          width: Math.abs(width),
          height: Math.abs(height),
          transform: `rotateZ(${current.rotate}deg)`,
        }
      },
      currentCropBox() {
        const current = this.current
        if (!current) return {}
        return {
          ...pick(['left', 'top', 'width', 'height'], current),
          transform: `rotateZ(${current.rotate}deg) scale(${current.scaleX}, ${
            current.scaleY
          }) skew(${current.skewH}deg, ${current.skewV}deg)`,
        }
      },
      centerPositionRandomBox() {
        if (!this.current || this.current.paraType === 'init') { return { active: false } }
        const { type, index } = Layer.parseID(this.current.id)
        const change = this.stage.parameter[type].units[index].change
        const active = isRandomPara(change['x2']) && isRandomPara(change['y2'])
        let {
          left: x1,
          top: y1,
          width,
          height,
          left2: x2,
          top2: y2,
        } = this.current
        const rect = points2rectangle(
          { x: x1 + width / 2, y: y1 + height / 2 },
          { x: x2 + width / 2, y: y2 + height / 2 }
        )
        const box = {
          active,
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }
        return box
      },
      designatorBox() {
        const current = this.current
        if (!current) return {}
        return {
          left: current.cLeft,
          top: current.cTop,
          width: current.cWidth,
          height: current.cHeight,
        }
      },
      maskTopBox() {
        const box = this.designatorBox
        return {
          height: box.top,
        }
      },
      maskLeftBox() {
        const box = this.designatorBox
        return {
          width: box.left,
          top: box.top,
          bottom: this.current.height - box.top - box.height,
        }
      },
      maskRightBox() {
        const box = this.designatorBox
        return {
          top: box.top,
          bottom: this.current.height - box.top - box.height,
          width: this.current.width - box.left - box.width,
        }
      },
      maskBottomBox() {
        const box = this.designatorBox
        return {
          height: this.current.height - box.top - box.height,
        }
      },
      isCrop() {
        return this.mode === CROP
      },
      isSelect() {
        return this.mode === SELECT
      },
    },
    methods: {
      ...mapMutations([
        'updateStageParameterUnit',
        'updateSnapshot',
        'updateStageParameterUnitValue',
        'resetToInitial',
        'resetToChange',
        'resetUnit',
        'exchangeInitialAndChange',
        'deleteStageParameterUnit',
        'deleteStageSource',
        'afterImageRename',
      ]),
      ...mapActions(['load3DImage']),
      doLayerCopy(layer) {
        if (!layer) return layer
        const { type, index } = Layer.parseID(layer.id)
        const data = {
          type,
          unit: this.stage.parameter[type].units[index],
          source: this.stage.parameter[type].source,
        }
        this.$electron.clipboard.writeBuffer(
          CB_FORMAT_UNIT,
          Buffer.from(JSON.stringify(data))
        )
        return layer
      },
      doLayerDelete(layer) {
        if (!this.protectCheck('deleteUnit')) return
        if (!layer) return
        const { type, index } = Layer.parseID(layer.id)
        this.$confirm(`Delete ${type.toUpperCase()}${index + 1} unit`, 'Delete', {
          type: 'warning',
        })
          .then(() => {
            this.deleteStageParameterUnit({
              stage: this.stage,
              type,
              index,
            })

            // delete 3d-image
            const imagePath = urlToPath(layer.src)
            const jsonPath = isThreeDImage(imagePath)
            if (jsonPath) {
              this.$events.emit(RESOURCE_DELETE_FILE, {
                file: getFile(imagePath),
                confirm: false,
              })
              this.$events.emit(RESOURCE_DELETE_FILE, {
                file: getFile(jsonPath),
                confirm: false,
              })
            }
          })
          .catch(e => {
            // nothing
          })
      },
      onLayerMenu({ menu }, type, ...args) {
        const layer =
          type === 'select' ? this.current : type === 'layer' ? args[0] : null

        const doCopy = () => this.doLayerCopy(layer)

        if (this.protectCheck('deleteUnit')) {
          menu.copyPasteGroup.onCut =
            layer &&
            (() => {
              doCopy()
              this.$store.commit('deleteStageParameterUnit', {
                stage: this.stage,
                ...Layer.parseID(layer.id),
              })
            })
          menu.deleteGroup.onDelete = layer && (() => this.doLayerDelete(layer))
        }

        menu.copyPasteGroup.onCopy = layer && doCopy

        const resetGroup = [
          {
            label: 'Reset',
            click:
              layer &&
              (() => {
                this.resetUnit({
                  stage: this.stage,
                  ...Layer.parseID(layer.id),
                })
                this.$events.emit(EV_CANVAS_REFRESH, this.stage)
              }),
          },
        ]

        if (layer) {
          const { type, index, status } = Layer.parseID(layer.id)
          const source = this.stage.parameter[type].source
          const stageIndex = this.$store.state.project.stages.indexOf(this.stage)
          if (status === 'change') {
            resetGroup.push({
              label: 'Reset to Initial Value',
              click: () => {
                this.resetToInitial({
                  stage: this.stage,
                  type,
                  index,
                })
                this.$events.emit(EV_CANVAS_REFRESH, this.stage)
              },
            })
          } else if (status === 'init') {
            resetGroup.push({
              label: 'Reset to Changed Value',
              click: () => {
                this.resetToChange({
                  stage: this.stage,
                  type,
                  index,
                })
                this.$events.emit(EV_CANVAS_REFRESH, this.stage)
              },
            })
          }
          resetGroup.push({
            label: 'Exchange Initial and Changed Value',
            click: () => {
              this.exchangeInitialAndChange({
                stage: this.stage,
                type,
                index,
              })
              this.$events.emit(EV_CANVAS_REFRESH, this.stage)
            },
          })

          menu.push([
            {
              label: 'Normal',
              type: 'radio',
              checked: !getSourceType(source),
              enabled: type !== 'obj',
              click: () => {
                this.$store.commit('changeStageSourceType', {
                  stage: this.stage,
                  type,
                  sourceType: '',
                })
              },
            },
            {
              label: 'Same as previous stage',
              type: 'radio',
              checked: isSourceReference(source),
              enabled: type !== 'obj' && stageIndex > 0,
              click: () => {
                if (stageIndex === 0) {
                  return this.$message.error('Cannot set to reference in Stage1')
                }
                this.$store.commit('changeStageSourceType', {
                  stage: this.stage,
                  type,
                  sourceType: 'same',
                })
              },
            },
            {
              label: 'Represent a random image in the folder',
              type: 'radio',
              checked: isSourceRandom(source),
              enabled: type !== 'obj',
              click: () => {
                this.$store.commit('changeStageSourceType', {
                  stage: this.stage,
                  type: type,
                  sourceType: 'random',
                })
              },
            },
          ])
        }
        if (!this.protect) menu.push(resetGroup)
        menu.push({
          label: layer ? 'Action on the layer' : '(no target)',
          enabled: false,
        })
      },
      getLayer(id) {
        return this.layers.find(layer => layer.id === id)
      },
      currentLayer() {
        return this.$refs.scene.getDom(this.current)
      },
      changeSelect(layer) {
        this.$refs.scene.changeSelect(layer)
      },
      updateCurrent() {
        console.log('udpateCurrent')
        if (!this.current) return
        const id = this.current.id
        const { type, index, status } = Layer.parseID(id)
        const oldUnit = this.stage.parameter[type].units[index][status]
        const unit = clone(oldUnit)
        this.current.saveTo(unit)
        this.updateStageParameterUnit({
          stage: this.stage,
          type,
          index,
          status,
          value: unit,
        })
        this.doSnapshot()
        this.$events.emit(EV_CANVAS_REFRESH, this.stage)
      },
      updateVideoInfo() {
        if (this.current && this.current.type === 'video') {
          const { type, index, status } = Layer.parseID(this.current.id)
          const common = {
            stage: this.stage,
            type,
            index,
            status,
          }
          this.updateStageParameterUnitValue({
            ...common,
            key: 'fps',
            value: this.current.fps,
          })
          this.updateStageParameterUnitValue({
            ...common,
            key: 'frame',
            value: this.current.currentFrame,
          })
        }
      },
      @Debounce(1000)
      doSnapshot() {
        if (!this.projectPath) return
        const dom = this.$refs.scene.$el
        const stage = this.stage
        const snapshot = path.join(
          this.projectPath,
          'thumbnail',
          stage.id + '.jpg'
        )
        if (!dom || !stage || this.parameterStatus === 'change') return
        dom2image
          .toJpeg(dom, {
            filter: node =>
              !(
                node.getAttribute &&
                ['control-box', 'cut-box', 'line'].includes(
                  node.getAttribute('class')
                )
              ),
            afterClone: node => {
              if (!node.style) return
              if (node.style.transformOrigin) { node.style.transformOrigin = 'initial' } // maybe dom2image bugs
              for (const prop of [
                'width',
                'height',
                'top',
                'left',
                'bottom',
                'right',
              ]) {
                unRatioDOMProperty(node, prop, this.ratio / CANVAS_SNAPSHOT_SCALE)
              }
            },
            style: {
              overflow: 'hidden',
            },
            width: 1920 * CANVAS_SNAPSHOT_SCALE,
            height: 1080 * CANVAS_SNAPSHOT_SCALE,
          })
          .then(dataUrl => {
            fs.ensureDirSync(path.join(this.projectPath, 'thumbnail'))
            fs.writeFileSync(
              snapshot,
              dataUrl.replace('data:image/jpeg;base64,', ''),
              'base64'
            )
          })
          .then(_ => {
            const url = 'file:///' + snapshot
            this.updateSnapshot({
              stage: stage,
              snapshot: url,
            })
          })
          .catch(console.error)
      },
      videoControl(type) {
        const current = this.current
        if (current.type !== 'video') return
        const video = this.currentLayer()
        switch (type) {
          case 'backward':
            video.backward()
            break
          case 'control':
            if (current.playing) {
              video.pause()
            } else {
              video.play()
            }
            break
          case 'forward':
            video.forward()
            break
          case 'stop':
            video.stop()
            break
          case 'volume':
            video.toggleVolume()
            break
        }
      },
      moveLayerOnce(e, direction) {
        if (!this.current) return
        const offset = e.shiftKey ? 10 : 1
        const layer = this.current
        if (this.mode === 'select') {
          switch (direction) {
            case 'up':
              layer.top -= offset
              break
            case 'left':
              layer.left -= offset
              break
            case 'right':
              layer.left += offset
              break
            case 'down':
              layer.top += offset
              break
          }
        } else if (this.mode === 'crop') {
          switch (direction) {
            case 'up':
              layer.cTop -= offset
              break
            case 'down':
              layer.cTop += offset
              break
            case 'left':
              layer.cLeft -= offset
              break
            case 'right':
              layer.cLeft += offset
              break
          }
          layer.cTop = clamp(0, layer.height - layer.cHeight, layer.cTop)
          layer.cLeft = clamp(0, layer.width - layer.cWidth, layer.cLeft)
        }
        this.updateCurrent()
      },
      controlMousedown(e, actions) {
        if (this.mouseDoing && !this.isSelect) return
        if (!this.currentLayer()) return
        this.mouseDoing = true
        this.mouseData = {
          actions,
          x: e.clientX,
          y: e.clientY,
          centerX:
            elementOffset(this.currentLayer().$el).left +
            this.currentLayer().$el.getBoundingClientRect().width / 2,
          centerY:
            elementOffset(this.currentLayer().$el).top +
            this.currentLayer().$el.getBoundingClientRect().height / 2,
          halfHeight: (this.current.cHeight / 2) * this.ratio,
          halfWidth: (this.current.cWidth / 2) * this.ratio,
          raw: clone(this.current),
          controlType: e.controlType,
        }
        this.isClick = true
        this.$events.on('mousemove', this.controlMousemove)
        this.$events.on('mouseup', this.controlMouseup)
      },
      controlMousemove(e) {
        if (!this.protectCheck('centerPosition')) return
        if (this.mouseDoing && !this.isSelect) return
        this.isClick = false
        const {
          actions,
          x,
          y,
          centerX,
          centerY,
          halfWidth,
          halfHeight,
          raw,
          controlType,
        } = this.mouseData
        const action = actions.split('/')
        const offsetX = e.clientX - x
        const offsetY = e.clientY - y
        const offsetCenterX = e.clientX - centerX
        const offsetCenterY = e.clientY - centerY
        const current = this.current
        const ratio = this.ratio
        switch (action[0]) {
          case 'rotate':
            current.rotate = atan2(offsetCenterY, offsetCenterX) + 90
            break
          case 'move':
            const topKey = controlType === 'random' ? 'top2' : 'top'
            const leftKey = controlType === 'random' ? 'left2' : 'left'
            if (e.shiftKey) {
              current[topKey] = raw[topKey]
              current[leftKey] = raw[leftKey]
              if (Math.abs(offsetX) > Math.abs(offsetY)) {
                current[leftKey] += offsetX / ratio
              } else {
                current[topKey] += offsetY / ratio
              }
            } else {
              current[topKey] = raw[topKey] + offsetY / ratio
              current[leftKey] = raw[leftKey] + offsetX / ratio
            }
            break
          case 'scale':
            let scaleX = raw.scaleX
            let scaleY = raw.scaleY
            for (const direction of action[1].split('-')) {
              switch (direction) {
                case 'top':
                  scaleY = (halfHeight * scaleY - offsetY) / halfHeight
                  break
                case 'left':
                  scaleX = (halfWidth * scaleX - offsetX) / halfWidth
                  break
                case 'right':
                  scaleX = (halfWidth * scaleX + offsetX) / halfWidth
                  break
                case 'bottom':
                  scaleY = (halfHeight * scaleY + offsetY) / halfHeight
                  break
              }
            }
            if (e.shiftKey || this.lockAspectRatio) { scaleY = (scaleX / raw.scaleX) * raw.scaleY }
            Object.assign(current, { scaleX, scaleY })
            break
          case 'skew':
            switch (action[1]) {
              case 'top':
                Object.assign(current, {
                  skewH: moveAngle(raw.skewH, -offsetCenterY, -offsetX),
                })
                break
              case 'left':
                Object.assign(current, {
                  skewV: moveAngle(raw.skewV, offsetCenterX, offsetY),
                })
                break
              case 'right':
                Object.assign(current, {
                  skewV: moveAngle(raw.skewV, -offsetCenterX, -offsetY),
                })
                break
              case 'bottom':
                Object.assign(current, {
                  skewH: moveAngle(raw.skewH, offsetCenterY, offsetX),
                })
                break
            }
            break
        }
      },
      controlMouseup(e) {
        this.mouseDoing = false
        this.updateCurrent()
        this.isClick = true
        this.$events.off('mousemove', this.controlMousemove)
        this.$events.off('mouseup', this.controlMouseup)
      },
      cutMousedown(e, actions) {
        if (this.mouseDoing) return
        this.mouseDoing = true
        this.mouseData = {
          actions,
          x: e.clientX,
          y: e.clientY,
          centerX:
            elementOffset(this.currentLayer().$el).left +
            this.currentLayer().$el.getBoundingClientRect().width / 2,
          centerY:
            elementOffset(this.currentLayer().$el).top +
            this.currentLayer().$el.getBoundingClientRect().height / 2,
          halfHeight: (this.current.cHeight / 2) * this.ratio,
          halfWidth: (this.current.cWidth / 2) * this.ratio,
          left: this.current.cLeft * this.ratio,
          top: this.current.cTop * this.ratio,
          height: this.current.cHeight * this.ratio,
          width: this.current.cWidth * this.ratio,
          elementWidth: this.current.width * this.ratio,
          elementHeight: this.current.height * this.ratio,
          raw: clone(this.current),
        }
        this.isClick = true
        this.$events.on('mousemove', this.cutMousemove)
        this.$events.on('mouseup', this.cutMouseup)
      },
      cutMousemove(e) {
        if (!this.protectCheck('cropArea') || !this.protectCheck('cropPoint')) { return }
        if (!this.mouseDoing) return
        this.isClick = false
        const {
          actions,
          x,
          y,
          left,
          top,
          height,
          width,
          elementWidth,
          elementHeight,
        } = this.mouseData
        const offsetX = e.clientX - x
        const offsetY = e.clientY - y
        const ratio = this.ratio
        const current = this.current
        if (actions === 'move') {
          if (e.shiftKey) {
            current.cLeft = left
            current.cTop = top
            if (Math.abs(offsetX) > Math.abs(offsetY)) {
              current.cLeft += offsetX
            } else {
              current.cTop += offsetY
            }
          } else {
            current.cLeft = offsetX + left
            current.cTop = offsetY + top
          }
          current.cLeft = clamp(0, elementWidth - width, current.cLeft) / ratio
          current.cTop = clamp(0, elementHeight - height, current.cTop) / ratio
        } else {
          const action = actions.split('-')
          for (const act of action) {
            switch (act) {
              case 'top':
                const newTop = clamp(0, height + top)(offsetY + top)
                Object.assign(current, {
                  cTop: newTop / ratio,
                  cHeight: (height - (newTop - top)) / ratio,
                })
                break
              case 'left':
                const newLeft = clamp(0, left + width)(offsetX + left)
                Object.assign(current, {
                  cLeft: newLeft / ratio,
                  cWidth: (width - (newLeft - left)) / ratio,
                })
                break
              case 'right':
                const newWidth = clamp(2, elementWidth - left)(offsetX + width)
                Object.assign(current, {
                  cWidth: newWidth / ratio,
                })
                break
              case 'bottom':
                const newHeight = clamp(2, elementHeight - top)(offsetY + height)
                Object.assign(current, {
                  cHeight: newHeight / ratio,
                })
                break
            }
          }
        }
      },
      cutMouseup(e) {
        this.mouseDoing = false
        this.updateCurrent()
        this.isClick = true
        this.$events.off('mousemove', this.cutMousemove)
        this.$events.off('mouseup', this.cutMouseup)
      },
      entry3DMode() {
        const file = getFile(urlToPath(this.current.src))
        this.load3DImage(file)
      },
    },
  }
</script>

<style lang="stylus" scoped>
  control-box-rotate-height = 30px
  control-box-designator-size = 10px
  cut-box-designator-size = 10px
  cut-box-designator-thick = 3px
  .canvas-container
    display inline-block
    position relative
    background lighten($grey100, 2)
    outline 0
    board-transitioin()
  .control-box, .cut-box
    position absolute
    top 0
    left 0
    width 192px
    height 108px
    z-index 199
    span, div
      position absolute
      margin auto
  .control-box
    border 1px solid #999999
    div
      &.move
        position absolute
        cursor move
        top 0
        left 0
        right 0
        bottom 0
      &.video
        position absolute
        left 0
        right 0
        bottom -3em
        text-align center
        white-space nowrap
        color #666666
        user-select none
        i
          cursor pointer
          font-size 1.5em
        input
          width 40px
          font-size 12px
          line-height 1.5em
          text-align center
          vertical-align bottom
    span
      width control-box-designator-size
      height control-box-designator-size
      border-radius (control-box-designator-size / 2)
      border 2px solid #999999
      background white
      &.rotate
        left 0
        right 0
        top -(control-box-rotate-height)
        cursor crosshair
        &:before
          content ''
          display inline-block
          position absolute
          width 2px
          height (control-box-rotate-height - control-box-designator-size)
          margin auto
          left 0
          right 0
          top 100%
          background #999999
      &.skew-vertical, &.scale-vertical
        left 0
        right 0
        width 16px
        cursor ew-resize
      &.skew-horizontal, &.scale-horizontal
        top 0
        bottom 0
        height 16px
      &.scale-horizontal, &.scale-vertical
        width 0
        height 0
        border 1px solid black
      &.scale-horizontal
        cursor ew-resize
      &.scale-vertical
        cursor ns-resize
      &.skew-horizontal
        cursor ns-resize
      &.skew-vertical
        cursor ew-resize
  .cut-box
    z-index 200
    .designator
      div
        &.move
          position absolute
          top 0
          left 0
          right 0
          bottom 0
          cursor move
      span
        border-width cut-box-designator-thick
        width cut-box-designator-size
        height cut-box-designator-size
        border-color black
        cursor move
        &.vertical
          left 0
          right 0
          cursor ns-resize
        &.horizontal
          top 0
          bottom 0
          cursor ew-resize
    .mask
      background rgba(0, 0, 0, 0.6)
  .grid-bg
    position absolute
    width 100%
    height 100%
    content ''
    left 0px
    top 0px
    background url('~@/assets/grid_bg.png')
    background-size 2%
    pointer-events none
    z-index 200
  .random-box__center-position
    position absolute
    background transparentify(red, 0.2)
    pointer-events none
    display flex
    justify-content center
    align-items center
    color white
  .movable
    position absolute
    z-index 200
</style>
