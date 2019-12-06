<template>
  <div class="panel-2d">
    <el-radio-group size="small"
      class="parameter-select"
      v-model="currentParameter">
      <el-radio-button v-for="para in $store.state.static.parameter.parametersWithoutChange"
        :label="para"
        :key="para">
        {{parameterText(para)}}
        <sup class="parameter-reference-label"
          v-if="isReference(para)">S</sup>
        <sup class="parameter-random-label"
          v-if="isRandom(para)">R</sup>
      </el-radio-button>
    </el-radio-group>
    <el-radio-group size="small"
      class="parameter-select"
      v-model="parameterStatus">
      <el-radio-button label="init">{{parameterText('initial')}}</el-radio-button>
      <el-radio-button label="change">{{parameterText('change')}}</el-radio-button>
    </el-radio-group>
    <ul class="parameter-list">
      <li class="parameter-list-item"
        :class="{current:currentValueIndex==i}"
        v-for="(unit,i) in current.units"
        @click="changeIndex(i)"
        :key="+i">
        {{currentParameter.toUpperCase() + (isChangeParameter ? 'C' : '') + (i+1)}}
        <editable-label :value="unit[parameterStatus].description || ''"
          v-protect="'editUnitDescription'"
          class="parameter-description"
          :formatter="(value)=>value.replace('\n','').trim()"
          @edited="value=>inputValue('description',value)"
          :placeholder="parameterText('editDescription')"></editable-label>
        <span v-protect="'deleteUnit'">
          <i class="icon-delete fa fa-trash"
            @click="editUnits(i,'remove')"></i>
        </span>
      </li>
      <li class="parameter-list-item add-obj"
        v-protect="'addUnit'">
        <div class="icon-box"
          @click="editUnits(null,'add')">
          <i class="fa fa-plus"></i>
        </div>
      </li>
    </ul>

    <div class="parameter-empty"
      v-if="!current || current.units.length === 0">
      <p>{{parameterText('emptyParameter')}}</p>
      <p class="parameter-need-resource"
        v-if="!canAddUnit">
        {{parameterText('emptyParameterTip')}}
      </p>
    </div>
    <div v-else>
      <el-tabs v-if="twoHandsEnabled"
        :value="curValue.twoHandsType || 'up'"
        @tab-click="({name})=>inputValue('twoHandsType',name)">
        <el-tab-pane label="Up"
          name="up"></el-tab-pane>
        <el-tab-pane label="Down"
          name="down"></el-tab-pane>
        <!--On request , label="Rotation" is changed to "Clock"  -->
        <el-tab-pane label="Clock"
          name="rotation"></el-tab-pane>
        <!--On request , label="Anti Rotation" is changed to "counter Clock"  -->
        <el-tab-pane label="Counter Clock"
          name="antiRotation"></el-tab-pane>
      </el-tabs>
      <keep-alive>
        <i-parameter-form :value="curValue"
          class="parameter-form"
          :current="current"
          :common="curCommon"
          :inputValue="inputValue"
          :inputNumber="inputNumber"
          :inputCommon="inputCommon"
          :is-bg="isBG"
          :is-fg="isFG"
          :is-cus="isCUS"
          :is-obj="isOBJ"
          :change-mode="changeMode"
          :is-change="isChangeParameter"
          :can-stick-with="canStickWith"></i-parameter-form>
      </keep-alive>
    </div>
  </div>
</template>

<script>
  import { MountComponents } from 'lib/utils'
  import { clamp } from 'ramda'
  import { mapState, mapMutations, mapGetters } from 'vuex'
  import {
    EV_CANVAS_REFRESH,
    EV_CANVAS_CHANGE_SELECT,
    CHG_CTR_FOLLOW_TWO_HANDS_ACTION,
  } from 'type/constants'
  import { getDeltaUnitBaseCommon, getStickItemType } from 'lib/project'
  import { Debounce, isSourceReference, isSourceRandom } from 'lib/helper'

  import ResizablePanel from 'components/ResizablePanel.vue'
  import InitForm from './Form.vue'
  import ResourceView from 'pages/resource/ResourceView.vue'

  const deltaWithAddValue = [
    'x0',
    'y0',
    'x',
    'y',
    'width',
    'height',
    'angle',
    'skewH',
    'skewV',
  ]
  const deltaWithMulitValue = ['scaleX', 'scaleY']

  export default {
    name: 'IParameterPanel2d',
    components: MountComponents(ResizablePanel, InitForm, ResourceView),
    data() {
      return { CHG_CTR_FOLLOW_TWO_HANDS_ACTION }
    },
    computed: {
      ...mapGetters(['projectExist']),
      ...mapState({
        stage: state => state.project.selectedStage,
        resourcePanelHeight: state => state.preference.panelSize.top,
      }),
      currentParameter: {
        get() {
          return this.$store.state.board.type
        },
        set(type) {
          if (type !== this.$store.state.board.type) this.syncCurrentToLayer()
          this.$store.commit('changeType', type)
        },
      },
      currentValueIndex: {
        get() {
          return this.$store.state.board.index.toString()
        },
        set(...arg) {
          this.changeIndex(...arg)
        },
      },
      parameterStatus: {
        get() {
          return this.$store.state.board.status
        },
        set(status) {
          this.$store.commit('changeStatus', status)
        },
      },
      isChangeParameter() {
        return this.parameterStatus === 'change'
      },
      changeMode() {
        if (!this.isChangeParameter) return ''
        return this.stage.getChangeMode(
          this.currentParameter,
          this.currentValueIndex
        )
      },
      isBG() {
        return this.currentParameter === 'bg'
      },
      isFG() {
        return this.currentParameter === 'fg'
      },
      isCUS() {
        return this.currentParameter === 'cus'
      },
      isOBJ() {
        return this.currentParameter === 'obj'
      },
      isSame() {
        return isSourceReference(this.current.source)
      },
      twoHandsEnabled() {
        return this.curValue.chgCtr === '6'
      },
      current() {
        return this.stage && this.stage.parameter[this.currentParameter]
      },
      curValue() {
        if (!this.current) {
          return null
        } else if (this.parameterStatus === 'init') {
          return this.current.units[this.currentValueIndex].init
        } else if (this.changeMode === 'delta') {
          // create a new object
          return this.stage.getDeltaValue(
            this.currentParameter,
            this.currentValueIndex
          )
        } else {
          // stick
          return this.stage.getStickValue(
            this.currentParameter,
            this.currentValueIndex
          )
        }
      },
      curCommon() {
        return this.current && this.current[this.parameterStatus]
      },
      canAddUnit() {
        return !!(
          this.stage &&
          this.stage.parameter[this.currentParameter].source.metadata
        )
      },
    },
    watch: {
      currentParameter(value) {
        if (!this.current) return
        this.currentValueIndex =
          clamp(
            0,
            Math.max(0, this.current.units.length - 1),
            +this.currentValueIndex
          ) + ''
        this.parameterStatus = 'init'
      },
      stage(newStage, oldStage) {
        if (newStage !== oldStage) {
          this.parameterStatus = 'init'
        }
      },
    },
    methods: {
      ...mapMutations([
        'updateStatus',
        'updateType',
        'updateIndex',
        'addStageParameterUnit',
        'updateStageParameterUnitValue',
        'updateStageParameterCommon',
        'deleteStageParameterUnit',
        'deleteStageSource',
      ]),
      isReference(type) {
        return isSourceReference(this.stage.parameter[type].source)
      },
      isRandom(type) {
        return isSourceRandom(this.stage.parameter[type].source)
      },
      canStickWith(type) {
        if (type === this.currentParameter) {
          return false
        }
        return !!this.stage.parameter[type].units[this.currentValueIndex]
      },
      @Debounce(100)
      syncCurrentToLayer() {
        this.$events.emit(EV_CANVAS_CHANGE_SELECT, {
          type: this.currentParameter,
          index: this.currentValueIndex,
        })
      },
      editUnits(index, action) {
        if (action === 'add') {
          this.addStageParameterUnit({
            stage: this.stage,
            type: this.currentParameter,
          })
        }
        if (action === 'remove') {
          index = parseInt(index, 10)
          this.$confirm(
            `Delete ${this.currentParameter}${index + 1} unit`,
            'Delete',
            {
              type: 'warning',
            }
          ).then(() => {
            this.deleteStageParameterUnit({
              stage: this.stage,
              type: this.currentParameter,
              index,
            })
          })
        }
      },
      clampInputValue(label, value, min, max) {
        const raw = value
        value = clamp(min, max, value)
        if (value !== raw) {
          this.$alert(
            `${label} must be between ${min} and ${max}`,
            'Input Error',
            { type: 'warning' }
          )
        }
        return value
      },
      inputValue(key, value) {
        let rawValue = this.stage.parameter[this.currentParameter].units[
          this.currentValueIndex
        ][this.parameterStatus]
        if (this.changeMode === 'delta') {
          if (
            deltaWithAddValue.includes(key) ||
            deltaWithMulitValue.includes(key)
          ) {
            value += this.current.units[this.currentValueIndex].init[key]
          }
        } else if (this.changeMode === 'stick') {
          const change = this.current.units[this.currentValueIndex].change
          const type = getStickItemType(change.stickItem)
          if (type && this.canStickWith(type)) {
            const init = this.stage.parameter[type].units[this.currentValueIndex]
              .init
            if (deltaWithAddValue.includes(key)) {
              value += init[key]
            } else if (deltaWithMulitValue.includes(key)) {
              value *= init[key]
            }
          }
        }
        switch (key) {
          case 'width':
            value = this.clampInputValue(
              'Width',
              value,
              this.isSame ? -(1920 - rawValue.x0) : 0,
              1920 - rawValue.x0
            )
            break
          case 'height':
            value = this.clampInputValue(
              'Height',
              value,
              this.isSame ? -(1080 - rawValue.y0) : 0,
              1080 - rawValue.y0
            )
            break
          case 'x0':
            value = this.clampInputValue(
              'X',
              value,
              -(1920 - rawValue.width) / 2,
              (1920 - rawValue.width) / 2
            )
            break
          case 'y0':
            value = this.clampInputValue(
              'Y',
              value,
              -(1080 - rawValue.height) / 2,
              (1080 - rawValue.height) / 2
            )
            break
          case 'opacity':
            value = this.clampInputValue(
              'Opacity',
              value,
              this.isSame ? -1 : 0,
              this.isSame ? 2 : 1
            )
            break
        }
        this.updateStageParameterUnitValue({
          stage: this.stage,
          type: this.currentParameter,
          status: this.parameterStatus,
          index: this.currentValueIndex,
          key,
          value,
        })
        this.$events.emit(EV_CANVAS_REFRESH, this.stage)
      },
      inputNumber(key, value) {
        if (value === '-') {
          return this.inputValue(value)
        }
        this.inputValue(key, +value)
      },
      inputCommon(key, value) {
        this.updateStageParameterCommon({
          stage: this.stage,
          type: this.currentParameter,
          status: this.parameterStatus,
          key,
          value,
        })
      },
      changeIndex(index) {
        if (index.toString() !== this.$store.state.board.index.toString()) { this.syncCurrentToLayer() }
        this.$store.commit('changeIndex', parseInt(index, 10))
      },
    },
  }
</script>
<style lang="stylus" scoped>
  $parameter-list-height = 25px
  .parameter-list
    margin 0
    padding 0
    display flex
    flex-wrap wrap
    color $text200
    .parameter-list-item
      cursor pointer
      background lighten($grey200, 2)
      margin 0
      position relative
      width 100%
      list-style-type none
      border-bottom 1px solid $grey400
      line-height $parameter-list-height
      padding-left 20px
      &:hover
        color $primary-color-highlight
      &:last-child
        border none
      .icon-delete
        position absolute
        right $padding-size
        line-height inherit
        color $text400
        &:hover
          color $text200
    .parameter-list-item.current
      &:before
        position absolute
        left 10px
        color $text400
        line-height $parameter-list-height
        height 100%
        content '●'
    .parameter-list-item.add-obj
      padding-right $padding-size
      text-align right
      background none
      padding 0
      cursor none
      pointer-events none
      &:hover
        color $text200
      .icon-box
        color $text400
        cursor pointer
        pointer-events initial
        display inline-block
        background lighten($grey200, 2)
        text-align center
        width $parameter-list-height + 5px
        height $parameter-list-height
        &:hover
          color $primary-color-highlight
  .input, .checkbox
    border-radius 3px
    overflow hidden
    margin-bottom 5px
    > label
      float left
      line-height 20px
      padding 0 0 0 $padding-size
  .input
    border 1px solid #BBB
    label
      width 70%
      border-right 1px solid #BBB
    input, select
      outline none
      border none
      line-height 20px
      height 20px
      width 30%
      text-align center
  .checkbox
    vertical-align middle
    > label
      width 70%
      vertical-align middle
    > div
      text-align center
  .parameter-empty
    text-align center
    min-height 50%
    color $text400
  .parameter-need-resource
    color lightcoral
    font-size 0.75em
    padding $padding-size
  .parameter-reference-label, .parameter-random-label
    font-weight bold
  .parameter-reference-label
    color red
  .parameter-random-label
    color deepskyblue
  .parameter-description
    font-size 0.75rem
</style>