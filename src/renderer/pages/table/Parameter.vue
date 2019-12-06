<template>
  <div class="table-parameter">
    <ul class="parameter-type">
      <li class="parameter-type__item"
        :class="{'parameter-type__item_selected': paraType === para}"
        v-for="(para,index) in ['bg', 'bgc', 'fg', 'fgc', 'cus', 'cusc', 'obj', 'objc']"
        :key="index"
        @click="paraType = para">{{tableText(para)}}</li>
    </ul>
    <el-table :data="units"
      border
      :row-style="{'text-align': 'center'}"
      height="100%"
      :key="paraType">
      <el-table-column :label="tableText('stage')"
        prop="stage"
        width="100px"
        align="center"></el-table-column>
      <el-table-column :label="tableText('unit')"
        align="center">
        <template slot-scope="{row}">
          {{paraType.toUpperCase() + (row.index + 1)}}
        </template>
      </el-table-column>
      <el-table-column :label="tableText('keepPosition')"
        width="150px"
        align="center">
        <template slot-scope="{row: {keep}}">{{keep | labelify('keepPosition')}}</template>
      </el-table-column>

      <el-table-column :label="tableText('customerPosition')"
        width="200px"
        align="center"
        v-if="type === 'cus'">
        <template slot-scope="{row: {customerPosIni}}">{{customerPosIni | labelify('customerPosIni')}}</template>
      </el-table-column>

      <el-table-column :label="tableText('object')"
        align="center"
        v-if="type === 'obj'">
        <el-table-column :label="tableText('skinSmooth')"
          width="150px"
          align="center">
          <template slot-scope="{row: {skinSmooth}}">{{skinSmooth | labelify('bool')}}</template>
        </el-table-column>
        <el-table-column :label="tableText('handPower')"
          width="150px"
          align="center">
          <template slot-scope="{row: {handPower}}">{{handPower | labelify('bool')}}</template>
        </el-table-column>
        <el-table-column :label="tableText('brightness')"
          width="100px"
          align="center"
          prop="brighterness"></el-table-column>
        <el-table-column :label="tableText('saturation')"
          width="100px"
          align="center"
          prop="saturation"
          :formatter="propTrimZero2"></el-table-column>
      </el-table-column>

      <el-table-column :label="tableText('change')"
        align="center"
        width="200px"
        v-if="status === 'change'">
        <template slot-scope="{row}">
          <div>{{row.chgCtr | labelify('changeControl')}}</div>
          <div v-if="row.chgCtr === '1' || row.chgCtr === '5'">TimeCh: {{row.timeCh}}</div>
          <div v-if="row.chgCtr === '1' || row.chgCtr === '5'">StepOrEnd: {{row.stepOrEnd | labelify('stepOrEnd')}}</div>
          <div v-if="row.chgCtr === '3'">StickItem: {{row.stickItem | labelify('stickItem')}}</div>
        </template>
      </el-table-column>

      <el-table-column :label="tableText('layerPosition')"
        align="center">
        <el-table-column :label="tableText('position')"
          align="center">
          <el-table-column label="X"
            width="80px"
            align="center"
            prop="x0"
            :formatter="propTrimZero"></el-table-column>
          <el-table-column label="Y"
            width="80px"
            align="center"
            prop="y0"
            :formatter="propTrimZero"></el-table-column>
        </el-table-column>

        <el-table-column :label="tableText('width')"
          width="80px"
          align="center"
          prop="width"
          :formatter="propTrimZero"></el-table-column>
        <el-table-column :label="tableText('height')"
          width="80px"
          align="center"
          prop="height"
          :formatter="propTrimZero"></el-table-column>

        <el-table-column :label="tableText('center')"
          align="center">
          <el-table-column label="X"
            width="80px"
            align="center"
            prop="x"
            :formatter="propTrimZero"></el-table-column>
          <el-table-column label="Y"
            width="80px"
            align="center"
            prop="y"
            :formatter="propTrimZero"></el-table-column>
        </el-table-column>

        <el-table-column :label="tableText('scale')"
          align="center">
          <el-table-column label="X"
            width="80px"
            align="center"
            prop="scaleX"
            :formatter="propTrimZero2"></el-table-column>
          <el-table-column label="Y"
            width="80px"
            align="center"
            prop="scaleY"
            :formatter="propTrimZero2"></el-table-column>
        </el-table-column>

        <el-table-column :label="tableText('opacity')"
          width="80px"
          align="center"
          prop="opacity"
          :formatter="propTrimZero2"></el-table-column>
        <el-table-column :label="tableText('rotation')"
          width="80px"
          align="center"
          prop="angle"
          :formatter="propTrimZero"></el-table-column>
        <el-table-column :label="tableText('skewH')"
          width="80px"
          align="center"
          prop="skewH"
          :formatter="propTrimZero"></el-table-column>
        <el-table-column :label="tableText('skewV')"
          width="80px"
          align="center"
          prop="skewV"
          :formatter="propTrimZero"></el-table-column>

        <el-table-column :label="tableText('transparency')"
          width="150px"
          align="center">
          <template slot-scope="{row: {transparencyChange}}">{{transparencyChange | labelify('transparencyChange')}}</template>
        </el-table-column>
        <el-table-column :label="tableText('color')"
          width="150px"
          align="center">
          <template slot-scope="{row: {colorChange}}">{{colorChange | labelify('colorChange')}}</template>
        </el-table-column>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
  import { mapState, mapMutations } from 'vuex'
  import { flatten } from 'ramda'
  import { MountComponents, trimZero } from 'lib/utils'

  import Delta from './ParameterDelta.vue'

  export default {
    name: 'ITableParameter',
    components: MountComponents(Delta),
    data() {
      return {
        paraType: 'bg',
      }
    },
    computed: {
      ...mapState({
        stages: state => state.project.stages,
      }),
      type() {
        return this.paraType.endsWith('c')
          ? this.paraType.slice(0, this.paraType.length - 1)
          : this.paraType
      },
      status() {
        return this.paraType.endsWith('c') ? 'change' : 'init'
      },
      units() {
        return flatten(
          this.stages.map((stage, stageIndex) => {
            return stage.parameter[this.type].units.map((unit, index) => {
              const common = {
                index,
                stage: 'Stage' + (stageIndex + 1),
              }
              switch (stage.getChangeMode(this.type, index)) {
                case 'delta':
                  return {
                    ...common,
                    ...stage.getDeltaValue(this.type, index),
                  }
                case 'stick':
                  return {
                    ...common,
                    ...stage.getStickValue(this.type, index),
                  }
                case '':
                  return {
                    ...common,
                    ...unit[this.status],
                  }
              }
            })
          })
        )
      },
    },
    methods: {
      ...mapMutations(['changeType']),
      propTrimZero(row, column, value) {
        return trimZero(value, 0)
      },
      propTrimZero2(row, column, value) {
        return trimZero(value, 2)
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .table-parameter
    overflow hidden
    height 100%
    width 100%
    position relative
    padding-left 40px
  .parameter-type
    list-style none
    padding 0
    margin 0
    position absolute
    left 0
    top 0
    width 40px
    line-height @width
    height 100%
    z-index 10
    display flex
    flex-direction column
  .parameter-type__item
    margin 0
    padding 0
    writing-mode vertical-lr
    flex-grow 1
    text-align center
    position relative
    transition 0.3s
    background white
    border-bottom 1px solid #cccccc
    cursor pointer
    &:last-child
      border-bottom none
    &:hover
      background $primary-color-light
  .parameter-type__item_selected
    background $primary-color
    color white
    &:after
      content ''
      padding 0
      position absolute
      box-sizing border-box
      width 6px
      height @width
      top 0
      right 0
      bottom 0
      margin auto
      border @width solid transparent
      border-right-color white
</style>
