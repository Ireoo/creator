<template>
  <div class="stage" :class="[selected ? '_selected' : '',`stage-${stage.id}`]" @contextmenu="onMenu"
    tabindex="0" @keyup.self.delete="!protect && doDeleteStage()" @keyup.self.ctrl.67="doStageCopy">

    <!-- Start Loop start -->
    <div class="loop" :style="{background:startLoop.color}" v-for="(startLoop,i) in startLoops.filter(l=>l.type==='loop')"
      :key="`start-${i}`" @click="editLoop(startLoop)">
      <div class="name">{{startLoop.name}}</div>
      <div class="number in" :style="{color:startLoop.color}">{{startLoop.loopNumber}}</div>
    </div>
    <!--  Start Loop start END-->

    <div class="stage-header-line" :title="stage.description">
      <span class="stage-number">{{index + 1}}</span>
      <editable-label class="stage-description" v-protect="'editStageDescription'" :placeholder="thumbText('editDescription')"
        :value="stage.description" @edited="updateDescription"></editable-label>
    </div>

    <!-- Action -->
    <div v-if="!['if'].includes(stage.type)" class="state-bar state-action" v-protect="'action'">
      <div @click.capture="selectStage(stage)" @click="stage.type === 'normal' && editAction()">
        {{stage.type === 'normal' ? actionLabel : (stage.type.toUpperCase() + ' STAGE')}}</div>
    </div>
    <!-- Action END -->

    <div class="thumb-wrapper" @contextmenu="onStageMenu" @mousedown="$event.button!==0?undefined:
                  !$event.ctrlKey && !$event.shiftKey ? selectStage(stage) : selectMultiStage(stage,$event)">

      <!-- IF -->
      <div v-if="stage.type==='if'" class="stage-if">
        IF
      </div>
      <!-- IF END -->

      <div class="thumb-fix-size">
        <div class="thumb">
          <template v-if="stage.type==='if'">
            <el-row class="thumb-if">
              <el-col :span="12" class="then">
                <small>Then</small>
                <div>Stage {{stages.findIndex(s=>s.id===stage.condition.then)+1}}</div>
              </el-col>
              <el-col :span="12" class="else">
                <small>Else</small>
                <div>Stage {{stages.findIndex(s=>s.id===stage.condition.else)+1}}</div>
              </el-col>
            </el-row>
          </template>
          <template v-else>
            <img v-if="stage.snapshot" :src="stage.snapshot + '?' + Date.now()" class="thumb-img">
          </template>
        </div>
      </div>

    </div>

    <!--Transition -->
    <div v-if="!['if'].includes(stage.type)" class="event-wraper" v-protect="'transition'">
      <div class="state-bar state-transition" :class="{'bg-red':transitionRed}" v-for="(trans, index) in transition"
        :key="index" @click.capture="selectStage(stage)" @click="editTransition(index)"
        @contextmenu="onTransitionMenu($event, index)">
        <div class="state-transition-action">
          T{{index + 1}}: {{transitionLabel(trans)}}
        </div>
        <div class="state-transition-to"> {{`${thumbText('stage')} ${getTransitionTo(trans)}`}}</div>
      </div>
      <div class="state-bar state-transition-add" @click.capture="selectStage(stage)" @click="addTransition"
        v-if="transition.length < 4">
        <i class="fa fa-plus fa-fw"></i>
        {{thumbText('addTransition')}}
      </div>
    </div>
    <!--Transition END-->

    <i-instruction-list v-if="activeMenu==='instruction'" :current="stage" class="instruction-list-thumb" @click.native="selectStage(stage)"/>

    <!-- End Loop -->
    <div class="loop" :style="{background:loop.color}" v-for="(loop,i) in [...continueLoops,...breakLoops,...stopLoops]"
      :key="`stop-${i}`" @click="editLoop(loop)">
      <template v-if="loop.type==='continue'">
        <i class="fa fa-angle-double-right"></i>
      </template>
      <template v-else-if="loop.type==='break'">
        <i class="fa fa-sign-out"></i>
      </template>
      <div class="name">{{loop.name}} <span v-if="loop.type==='loop'">(end)</span></div>
    </div>
    <!-- End Loop END-->
    <div class="divider">
    </div>
  </div>
</template>

<script>
  import { mapMutations, mapState, mapGetters } from 'vuex'
  import { createFormObject, value2Label } from 'lib/form'
  import { Stage } from 'type/stage'
  import { clone, slice, head, last, path } from 'ramda'
  import { flatten, get } from 'lodash'
  import { DeleteConfirm } from 'lib/helper'
  import { Buffer } from 'buffer'
  import {
    DIALOG_ACTION,
    DIALOG_TRANSITION,
    DIALOG_NEW_STAGE_GROUP,
    EV_DIALOG_OPEN,
    CB_FORMAT_STAGE,
    DIALOG_STAGE_SETTING,
    MENU_NOT_GROUPED,
    BOARD_BOARD,
    MAP_UPDATE_STAGE,
    DIALOG_LOOP,
  } from 'type/constants'
  import { StageGroup } from 'lib/menu-group'
  import { MountComponents } from 'lib/utils'
  import InstructionList from '../instruction/instructionList.vue'

  export default {
    name: 'IThumbStage',
    components: MountComponents(InstructionList),
    props: {
      index: Number,
    },
    computed: {
      ...mapGetters([
        'projectExist',
        'stageIndex',
        'getStagesInRange',
        'selectedStages',
        'selectedThumbnails',
        'thumbnails',
        'isInGroup',
        'getTransitionTo',
        'transitionLabel',
        'getStageName',
      ]),
      ...mapState({
        stageGroup: path(['project', 'stageGroup']),
        view: path(['board', 'view']),
        lockAction: path(['project', 'lockAction']),
        protect: path(['project', 'protect']),
        stagesFromOtherProject: path(['project', 'stagesFromOtherProject']),
        activeMenu: path(['header', 'active']),
        stages: path(['project', 'stages']),
        loops: path(['project', 'loops']),
      }),
      startLoops() {
        return this.loops
          .filter(loop => loop.start === this.stage.id)
          .filter(loop => loop.type === 'loop')
      },
      stopLoops() {
        return this.loops
          .filter(loop => loop.end === this.stage.id)
          .filter(loop => loop.type === 'loop')
          .slice()
          .reverse()
      },
      continueLoops() {
        return this.loops
          .filter(loop => loop.type === 'continue')
          .filter(loop => loop.stage === this.stage.id)
      },
      breakLoops() {
        return this.loops
          .filter(loop => loop.type === 'break')
          .filter(loop => loop.stage === this.stage.id)
      },
      stage() {
        return this.$store.state.project.stages[this.index]
      },
      selected() {
        return this.stage.selected
      },
      actionLabel() {
        const label = this.value2Label(
          this.$store.state.static.form.action[0],
          this.stage.action.stageAction
        )
        return this.stageDialogText(label)
      },
      transition() {
        return this.stage.transition
      },
      transitionRed() {
        return this.stagesFromOtherProject.includes(this.stage.id)
      },
      stageOnMap() {
        const { id, description, snapshot, transition, action } = this.stage
        return { id, description, snapshot, transition, action }
      },
      inGroup() {
        return this.isInGroup(this.stage.id)
      },
    },
    watch: {
      stageOnMap: {
        deep: true,
        handler(stage, oldStage) {
          if (this.lockAction) return
          this.$events.emit(MAP_UPDATE_STAGE, stage)
        },
      },
    },
    methods: {
      ...mapMutations([
        'selectStage',
        'addStageTransition',
        'updateStageTransition',
        'deleteStage',
        'deleteStageTransition',
        'updateStageAction',
        'copyStage',
        'addStage',
        'updateStageDescription',
        'updateStageType',
        'newStageGroup',
        'moveStageToGroup',
        'moveStagesToGroup',
        'doStageCopy',
        'removeStageFromSFOP',
      ]),
      value2Label,
      updateDescription(desc) {
        this.updateStageDescription({ stage: this.stage, desc })
      },
      addTransition() {
        const transition = createFormObject(
          this.$store.state.static.form.transition
        )
        this.$events.emit(EV_DIALOG_OPEN, {
          type: DIALOG_TRANSITION,
          data: transition,
          title: 'Add Transition',
          stage: this.stage,
          image: this.stage.snapshot,
          width: '450px',
          confirmed: ({ data }) => {
            this.addStageTransition({
              stage: this.stage,
              transition: data,
            })
            if (this.stagesFromOtherProject.includes(this.stage.id)) { this.removeStageFromSFOP(this.stage.id) }
          },
        })
      },
      editTransition(index) {
        const transition = clone(this.stage.transition[index])
        const length = get(transition, 'stages.length')
        if (length > this.stages.length) transition.stages = []
        this.$events.emit(EV_DIALOG_OPEN, {
          type: DIALOG_TRANSITION,
          data: transition,
          title: 'Edit Transition',
          stage: this.stage,
          image: this.stage.snapshot,
          width: '450px',
          confirmed: ({ data }) => {
            this.updateStageTransition({
              stage: this.stage,
              transIndex: index,
              transition: data,
            })
            if (this.stagesFromOtherProject.includes(this.stage.id)) { this.removeStageFromSFOP(this.stage.id) }
          },
        })
      },
      editAction() {
        const action = clone(this.stage.action)
        this.$events.emit(EV_DIALOG_OPEN, {
          type: DIALOG_ACTION,
          data: action,
          title: 'Edit Action',
          image: this.stage.snapshot,
          confirmed: ({ data }) => {
            this.updateStageAction({
              stage: this.stage,
              action: data,
            })
          },
        })
      },
      selectMultiStage(stage, { ctrlKey, shiftKey }) {
        this.$store.commit('selectMultiStage', stage)
        if (shiftKey) {
          this.getStagesInRange.forEach(stage => {
            this.$store.commit('selectMultiStage', stage)
          })
        }
      },
      doDeleteStage() {
        if (this.inGroup) return
        this.$confirm(`Are you want to delete stage?`, 'Delete', {
          type: 'warning',
        })
          .then(() => {
            this.stages.filter(s => s.selected).forEach(this.deleteStages)
          })
          .catch(e => {
            // nothing
          })
      },
      deleteStages(stage) {
        const usedStages = this.stages.filter(s => {
          return !!s.transition.find(
            transition => transition.stageFile === this.stageIndex(stage)
          )
        })
        if (usedStages.length) {
          const used = usedStages.map(stage => this.getStageName(stage)).join(',')
          const text = `${used} is linked with ${this.getStageName(
            stage
          )}, Do you wan to unlink and delete these stages?`
          this.$confirm(text, 'Delete', {
            type: 'warning',
          }).then(() => {
            usedStages.forEach(usedStage => {
              usedStage.transition.forEach((t, i) => {
                if (t.stageFile === this.stageIndex(stage)) {
                  this.deleteStageTransition({
                    stage: usedStage,
                    transIndex: i,
                  })
                }
              })
            })
            this.deleteStage(stage)
          })
        } else {
          this.deleteStage(stage)
        }
      },
      clearTransition() {
        this.$confirm('Are you want to clear transition', 'Clear Transition', {
          type: 'warning',
        }).then(() => {
          this.selectedStages.forEach(stage => {
            stage.transition.forEach((t, i) => {
              this.deleteStageTransition({
                stage,
                transIndex: i,
              })
            })
          })
        })
      },
      onStageMenu({ menu, ctrlKey, shiftKey }) {
        if (this.view !== BOARD_BOARD) return
        if (!this.inGroup && !this.protect) { menu.deleteGroup.onDelete = this.doDeleteStage }
        menu.copyPasteGroup.onCopy = this.doStageCopy
        return menu
      },
      onTransitionMenu({ menu }, index) {
        if (this.protect) return
        menu.deleteGroup.onDelete = () => {
          this.$confirm(
            'Are you want to delete transition ' + index,
            'Delete Transition',
            {
              type: 'warning',
            }
          )
            .then(() => {
              this.deleteStageTransition({
                stage: this.stage,
                transIndex: index,
              })
            })
            .catch(e => {
              // nothing
            })
        }
        menu.deleteGroup.onClearTransition = this.clearTransition
      },
      onMenu({ menu }) {
        if (this.selectedStages.length === 1) this.selectStage(this.stage)

        menu.push({
          label: 'Type',
          enabled: !this.protect,
          submenu: [
            {
              type: 'radio',
              label: 'Normal Stage',
              checked: this.stage.type === 'normal',
              click: () =>
                this.updateStageType({ stage: this.stage, type: 'normal' }),
            },
            {
              type: 'radio',
              label: 'End Stage',
              checked: this.stage.type === 'end',
              click: () =>
                this.updateStageType({ stage: this.stage, type: 'end' }),
            },
            {
              type: 'radio',
              label: 'Pre-End Stage',
              checked: this.stage.type === 'preEnd',
              click: () =>
                this.updateStageType({ stage: this.stage, type: 'preEnd' }),
            },
          ],
        })

        menu.push({
          label: 'Setting',
          click: this.showSetting,
          enabled: !this.protect,
        })

        menu.copyPasteGroup.pasteAfterStageIndex = this.index
        return menu
      },
      showSetting() {
        this.$events.emit(EV_DIALOG_OPEN, {
          type: DIALOG_STAGE_SETTING,
          data: this.stage,
          title: 'Settings',
        })
      },
      editLoop(loop) {
        this.$events.emit(EV_DIALOG_OPEN, {
          type: DIALOG_LOOP,
          title: `Edit ${loop.type}`,
          data: {
            loop: loop,
            index: this.loops.indexOf(loop),
            type: loop.type,
          },
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
  $interval-side = 10px
  $transition-bg-color = $primary-color-light
  $action-bg-color = $primary-color-light
  $thumb-selected-bg-color = $primary-color-highlight
  .stage-header-line
    margin 2px $interval-side
    font-size 0.75em
    display flex
    flex-direction row
  .stage-number
    width 2em
    ._selected &
      color orangered
      font-weight bold
  .stage-description
    flex 1 1
    overflow hidden
    white-space nowrap
  .stage
    width 100%
    outline 0
    position relative
    & *
      user-select none
      cursor default
  .state-bar
    margin 0 $interval-side
    color white
    padding 3px 5px
    font-size 0.75em
    margin-bottom 2px
    transition 0.3s
    cursor pointer
  .state-action
    text-align right
    background $action-bg-color
    margin-bottom 0
    margin-left 50%
    &:hover
      background darken(@background, 20%)
  .state-transition
    background $transition-bg-color
    display flex
    &.bg-red
      background red
    &:hover
      background darken(@background, 30%)
  .state-transition-add
    text-align center
    cursor pointer
    color $primary-color-light
    &:hover
      color darken($primary-color-light, 40%)
  .state-transition-action
    flex-grow 1
  .state-transition-to
    flex-shrink 0
    &:before
      content '> '
  .thumb-fix-size
    width 100%
    padding-bottom 56.25%
    position relative
  .thumb-wrapper
    margin-left $interval-side
    margin-right $interval-side
    background white
    transition 0.1s
    border 1px solid transparentify(black, 0.1)
    ._selected &
      border 2px solid $red !important
    &:hover
      border 1px dashed transparentify($red, 0.8)
  .thumb
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    background white
  .thumb-img
    width 100%
    height 100%
    object-fit cover
    object-position top
  .instruction-list-thumb
    position absolute !important
    top 30px !important
    width 200% !important
    overflow auto !important
    transform scale(0.5) translate(-50%)
  .divider
    display flex
    height 30px
    justify-content center
    align-items center
    &:after
      content ''
      position absolute
      width 100%
      height 1px
      background $menu-color-highlight
    &:hover:after
      height 2px
      background transparentify($red, 0.2)
    &:active:after
      height 2px
      background $red
  .loop
    color white
    border-radius 3px
    display inline-block
    font-size 0.75em
    padding-left 10px
    padding-right 5px
    margin-left 10px
    cursor pointer
    position relative
    min-width 50px
    height 20px
    line-height 20px
    .fa
      font-size 1.4em
      margin-right 5px
    .name
      display inline-block
    .number
      display inline-block
      vertical-align middle
      border-radius 3px
      background rgba(255, 255, 255, 0.95)
      margin 2px
      width 15px
      height 15px
      line-height 15px
      text-align center
      float right
  .stage-if
    background #bbbab3
    color white
    text-align center
  .thumb-if
    height 100%
    .then, .else
      height inherit
      padding 5px 0
      color white
      text-align center
      display flex
      flex-direction column
      justify-content center
      align-items center
      font-size 1.2em
      small
        color transparentify(white, 0.75)
    .then
      background $green
    .else
      background $red
</style>
