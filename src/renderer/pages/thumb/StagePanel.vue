<template>
  <resizable-panel controlPosition="right" tabindex="0" headerClass="header-class"
    @contextmenu.native="onMenu($event)" @keyup.native.ctrl.86="!protect && doStagePaste()">
    <span slot="title">{{thumbText('title')}}
      <i class="fa-icon-button fa fa-refresh" :title="thumbText('updateSnapShot')" @click="refreshThumbnails"></i>
    </span>
    <div class="stage-panel-container">
      <draggable :value="thumbnails" :options="{disabled:view!==BOARD_BOARD || protect}" @end="dragEnd($event)">
        <transition-group name="stage">
          <template v-for="(thumb,index) in thumbnails">
            <template v-if="thumb.listType==='stage'">
              <i-thumb-stage class="stage" :key="thumb.id" :index="stageIndex(thumb)"></i-thumb-stage>
            </template>
            <template v-else-if="thumb.groupInfo.isGroupHead">
              <el-collapse :key="index" :style="{'border-left':`5px solid ${thumb.groupInfo.group.color}`}"
                class="collapse">
                <el-collapse-item :name="thumb.groupInfo.title">
                  <template slot="title">
                    <editable-label :value="thumb.groupInfo.group.title" style="width:80%;"
                      @mousedown.native="_selectStage(getStagesByGroup(thumb.groupInfo.group)[0],$event)"
                      :formatter="value=>value.replace(/\n/g,'').trim()" @edited="value=>changeGroupTitle({groupTitle:value,groupId:thumb.groupInfo.groupIndex})"
                      placeholder="Edit group name"></editable-label>
                  </template>
                  <draggable :value="getStagesByGroup(thumb.groupInfo.group)" :options="{disabled:view!==BOARD_BOARD || protect}"
                    @end="dragEnd($event,getStagesByGroup(thumb.groupInfo.group))">
                    <transition-group name="stage">
                      <i-thumb-stage class="stage" v-for="stage in getStagesByGroup(thumb.groupInfo.group)"
                        :key="stage.id" :index="stageIndex(stage)"></i-thumb-stage>
                    </transition-group>
                  </draggable>
                </el-collapse-item>
              </el-collapse>
            </template>
          </template>
        </transition-group>
      </draggable>

    </div>
  </resizable-panel>
</template>

<script>
  import { MountComponents, delay } from 'lib/utils'
  import { mapState, mapMutations, mapGetters } from 'vuex'
  import {
    CB_FORMAT_STAGE,
    EV_LOADING_OPEN,
    EV_LOADING_CLOSE,
    BOARD_BOARD,
    EV_CANVAS_REFRESH,
    REFRESH_RESOURCE,
    EV_MAKE_DIFFERENT_3D_IMAGES,
    EV_MAKE_DIFFERENT_3D_IMAGE,
  } from 'type/constants'
  import { Stage } from 'type/stage'
  import { flatten, path as rPath, clone } from 'ramda'
  import { get } from 'lodash'

  import Draggable from 'vuedraggable'
  import ResizablePanel from 'components/ResizablePanel'
  import StageVue from './Stage.vue'
  import { StageGroup } from 'lib/menu-group'
  import {
    updateStageMetadataSource,
    isFromOtherProject,
    isThreeDImage,
    copyElementAsset,
    isRandomTrans,
  } from 'lib/project'
  import { urlToPath } from 'lib/helper'
  import { remote } from 'electron'
  import path, { basename } from 'path'

  import fs from 'fs-extra'
  import { Loading } from 'element-ui'

  const createFromDataURL = remote.nativeImage.createFromDataURL
  const _require = require.context('@/assets/color/', false, /\.png$/)
  const markerColors = _require.keys().map(color => {
    return { color: basename(color, '.png'), data: _require(color) }
  })

  export default {
    name: 'IThumbPanel',
    data: () => ({
      BOARD_BOARD,
    }),
    components: MountComponents(ResizablePanel, StageVue, Draggable),
    computed: {
      ...mapState({
        stages: rPath(['project', 'stages']),
        stageGroup: rPath(['project', 'stageGroup']),
        activatedStageGroup: rPath(['project', 'activatedStageGroup']),
        view: rPath(['board', 'view']),
        projectPath: rPath(['project', 'projectPath']),
        protect: rPath(['project', 'protect']),
      }),
      ...mapGetters([
        'ungroupedStages',
        'stageIndex',
        'getStagesByGroup',
        'thumbnails',
        'thumbnailsIndexToStagesIndex',
        'selectedStages',
        'selectedThumbnails',
        'isInGroup',
      ]),
      isConsecutive() {
        const selectedStageIds = this.selectedThumbnails.map(stage =>
          this.stageIndex(stage)
        )
        return selectedStageIds.every((stageId, index) => {
          const nextStageId = selectedStageIds[index + 1]
          if (!nextStageId) return true
          if (stageId + 1 === nextStageId) return true
        })
      },
    },
    events: {
      [EV_MAKE_DIFFERENT_3D_IMAGES](stage) {
        // Make 3D-Image different with previous
        ;['bg', 'fg', 'cus'].forEach(type => {
          const src = get(stage, `parameter.${type}.source.metadata.src`)
          if (!src) return
          const imagePath = urlToPath(src)
          this.$events.emit(EV_MAKE_DIFFERENT_3D_IMAGE, { stage, imagePath })
        })

        // refresh
        this.$events.emit(EV_CANVAS_REFRESH, stage)
        this.$events.emit(REFRESH_RESOURCE)
      },
      [EV_MAKE_DIFFERENT_3D_IMAGE]({ stage, imagePath }) {
        // copy the 3d-image
        if (!isThreeDImage(imagePath)) return
        const newImagePath = copyElementAsset(imagePath)
        const jsonPath = isThreeDImage(newImagePath)
        const jsonFile = fs.readJsonSync(jsonPath)
        // update .3d.json
        jsonFile.stageId = stage.id
        fs.writeJsonSync(jsonPath, jsonFile)

        // update the metadata
        const oldFileName = path.basename(imagePath)
        const newFileName = path.basename(newImagePath)
        const directory = imagePath
          .replace(this.projectPath + path.sep, '')
          .replace(path.sep + oldFileName, '')
        this.afterImageRename({
          oldFileName,
          newFileName,
          directory,
          stage,
        })
      },
    },
    methods: {
      ...mapMutations([
        'newStage',
        'newIfStage',
        'moveStage',
        'copyStage',
        'copyStageAsSame',
        'changeGroupTitle',
        'moveStageToGroup',
        'selectStage',
        'onGrouping',
        'ungroup',
        'selectStage',
        'selectMultiStage',
        'newStageGroup',
        'moveStagesToGroup',
        'changeGroupColor',
        'addStageToSFOP',
        'afterImageRename',
        'doStageCopy',
        'updateStageTransition',
      ]),
      _selectStage(stage, event) {
        if (!event.ctrlKey && !event.shiftKey) this.selectStage(stage)
        else this.selectMultiStage(stage, event)
      },
      dragEnd(e, stages) {
        const { newIndex, oldIndex } = e
        if (newIndex === oldIndex) return
        let newStageIndex, oldStageIndex

        if (stages) {
          newStageIndex = this.stageIndex(stages[newIndex])
          oldStageIndex = this.stageIndex(stages[oldIndex])
        } else {
          newStageIndex = this.thumbnailsIndexToStagesIndex(newIndex)
          oldStageIndex = this.thumbnailsIndexToStagesIndex(oldIndex)
          // drag form top to bottom
          if (newIndex > oldIndex) {
            const { max, min } = Math
            const groups = this.thumbnails
              .slice(min(oldIndex, newIndex), max(oldIndex, newIndex) + 1)
              .filter(thumb => thumb.listType === 'group')
            const allGroupChilds = flatten(
              groups.map(thumb => thumb.groupInfo.group.stageIds)
            )
            const increment = allGroupChilds.length - groups.length
            newStageIndex += increment
          }
        }
        const newStage = this.stages[newStageIndex]
        const oldStage = this.stages[oldStageIndex]
        if (this.thumbnails[oldIndex].listType === 'group') return
        this.moveStage({
          fromIndex: oldStageIndex,
          toIndex: newStageIndex,
        })
      },
      afterPaste(afterIndex) {
        if (
          typeof afterIndex === 'number' &&
          afterIndex + 1 < this.stages.length
        ) {
          this.moveStage({
            fromIndex: this.stages.length - 1,
            toIndex: afterIndex + 1,
          })
        }
        // paste stage from other project
        const index = afterIndex ? afterIndex + 1 : this.stages.length - 1
        const stage = this.stages[index]
        updateStageMetadataSource(stage, this.projectPath)
        if (isFromOtherProject(stage, this.projectPath)) {
          this.addStageToSFOP(stage.id)
        }
        this.$events.emit(EV_MAKE_DIFFERENT_3D_IMAGES, stage)
      },
      doStagePaste(afterIndex, asSame = false) {
        const clipboard = this.$electron.clipboard
        if (!clipboard.has(CB_FORMAT_STAGE)) return

        try {
          const stages = JSON.parse(clipboard.readBuffer(CB_FORMAT_STAGE))
          stages.forEach(s => {
            const stage = Stage.load(s)
            /**
             * TODO: check stage valid
             * because stage restore from clipboard maybe copy from other project
             * They contain some invalid path of image/video
             * If you don't change that or stop paste action, resource cannot shown correctly
             */
            asSame ? this.copyStageAsSame(stage) : this.copyStage(stage)
            this.afterPaste(afterIndex++)
          })
        } catch (e) {
          console.error(e)
          this.$message.error('cannot paste stage')
        }
      },
      doStagePasteAsSame(afterIndex) {
        this.doStagePaste(afterIndex, true)
      },
      doGroupCopy({ group }) {
        const clipboard = this.$electron.clipboard
        const stages = this.stages.filter(s => group.stageIds.includes(s.id))
        clipboard.writeBuffer(
          CB_FORMAT_STAGE,
          Buffer.from(JSON.stringify(stages))
        )
      },
      doGroupPaste(afterIndex) {
        if (!afterIndex) afterIndex = this.stages.length - 1
        this.doStagePasteAsSame(afterIndex)
        const stages = JSON.parse(
          this.$electron.clipboard.readBuffer(CB_FORMAT_STAGE)
        )
        const group = this.stageGroup.find(g => g.stageIds.includes(stages[0].id))
        let stageIndex = afterIndex
        const newStages = stages.map(() => this.stages[++stageIndex])
        const name = group.title
        const groupTitle =
          name + `(${this.stageGroup.filter(g => ~g.title.indexOf(name)).length})`
        this.newStageGroup({ groupTitle })
        this.moveStagesToGroup({ groupTitle, stages: newStages })
        newStages.forEach((stage, stageIndex) => {
          stage.transition.forEach((transitionItem, transIndex) => {
            const newTransitionItem = clone(transitionItem)
            const random = isRandomTrans(newTransitionItem.stageFile)
            if (!random) {
              newTransitionItem.stageFile = afterIndex + stageIndex + 2
            } else {
              //
            }
            this.updateStageTransition({
              stage,
              transIndex,
              transition: newTransitionItem,
            })
          })
        })
      },
      onMenu({ menu }) {
        // 等待stage.vue选中
        // await new Promise(resolve => setTimeout(resolve, 0))
        const stage = this.selectedStages[0]
        const afterIndex = this.stages.indexOf(stage) + 1
        const isInGroup = stage ? this.isInGroup(stage.id) : false
        const group = new StageGroup('new', [
          {
            label: 'New Stage',
            click: () => this.newStage(afterIndex),
            enabled: !isInGroup && !this.protect,
          },
          {
            label: 'New If Stage',
            click: () => this.newIfStage(afterIndex),
            enabled: !isInGroup && !this.protect,
          },
        ])
        menu.unshift(group)
        menu.copyPasteGroup.onPaste =
          this.$electron.clipboard.has(CB_FORMAT_STAGE) &&
          !this.protect &&
          (() => this.doStagePaste(menu.copyPasteGroup.pasteAfterStageIndex)) // pasteAfterStageIndex assign in stage.vue

        if (!isInGroup) {
          menu.copyPasteGroup.duplicateStage = () => {
            this.doStageCopy()
            this.doStagePaste(this.stageIndex(this.selectedStages[0]))
          }
        }

        menu.splice(menu.indexOf(menu.copyPasteGroup) + 1, 0, [
          {
            label: 'Paste as same',
            enabled:
              this.$electron.clipboard.has(CB_FORMAT_STAGE) && !this.protect,
            click: () =>
              this.doStagePaste(menu.copyPasteGroup.pasteAfterStageIndex, true),
          },
        ])

        this.onGroupMenu(...arguments)
      },
      onGroupMenu({ menu }) {
        const thumb = this.selectedThumbnails[0]
        const groupIndex = get(thumb, 'groupInfo.groupIndex')

        const enableGrouping =
          this.isConsecutive &&
          this.selectedThumbnails.length > 1 &&
          this.selectedThumbnails.every(t => t.listType === 'stage')

        let first
        if (enableGrouping) {
          first = {
            label: 'Grouping',
            click: () => this.onGrouping(),
            enabled: enableGrouping,
          }
        } else {
          first = {
            label: 'Ungroup',
            enabled: groupIndex !== undefined,
            click: () => this.ungroup(groupIndex),
          }
        }

        const groupMenu = new StageGroup('grouping', [
          first,
          {
            label: 'Copy Group',
            enabled: groupIndex !== undefined,
            click: () => this.doGroupCopy(thumb.groupInfo),
          },
          {
            label: 'Paste Group as same',
            enabled:
              this.$electron.clipboard.has(CB_FORMAT_STAGE) && !this.protect,
            click: () => {
              const groupLength = get(thumb, 'groupInfo.group.stageIds.length')
              const afterIndex = thumb
                ? this.stageIndex(thumb) + (groupLength ? groupLength - 1 : 0)
                : undefined
              this.doGroupPaste(afterIndex)
            },
          },
          {
            label: 'Marker color',
            enabled: groupIndex !== undefined,
            submenu: markerColors.map(({ data, color }, colorIndex) => {
              return {
                icon: createFromDataURL(data),
                click: () => {
                  this.changeGroupColor({
                    groupIndex: thumb.groupInfo.groupIndex,
                    color,
                  })
                  this.$forceUpdate()
                },
              }
            }),
          },
        ])
        menu.push(groupMenu)
        return menu
      },
      async refreshThumbnails() {
        this.$events.emit(EV_LOADING_OPEN, { text: 'Updating Snapshot' })
        for (let i in this.stages) {
          this.selectStage(this.stages[i])
          // Waiting for the thumbnail to be saved
          await delay(4000)
        }
        this.$events.emit(EV_LOADING_CLOSE)
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .stage-panel-container
    overflow-y scroll
    height inherit
    &::-webkit-scrollbar-button
      background $grey300
      height 15px
      width 15px
      border-radius 2px
  .stage
    padding 0 5px
  .stage-enter-active, .stage-leave-active
    transition 0.3s
  .stage-enter, .stage-leave-to
    transform translateX(-100%)
    opacity 0
  .stage-move
    transition 0.3s
  .collapse
    background $grey200
</style>