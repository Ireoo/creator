<template>
  <div class="container">
    <div class="group-name">
      <span class="start-symbol"></span>
      <span>{{conditionGroup.name}}</span>
      <small style="opacity:0.5;">(Group)</small>
      <el-select style="width:100px;margin: 0 10px;" size="mini" :value="conditionGroup.logic"
        @input="updateconditionGroupLogic">
        <el-option :label="option" :value="i" v-for="(option,i) in  logics" :key="i"></el-option>
      </el-select>
      <if-scene-drop-menu :conditionGroup="conditionGroup" @expand="more=$event" />
    </div>
    <div class="condition-list" v-if="more">
      <template v-for="(conditionGroup,index) in condition.groups.filter(_conditionGroup=>_conditionGroup.parent===conditionGroup.id)">
        <if-scene-group :conditionGroup="conditionGroup" :key="`group-item-${index}`" @update="$emit('update',$event)" />
      </template>
      <template v-for="(conditionItem,index) in condition.conditions.filter(conditionItem=>conditionItem.parent===conditionGroup.id)">
        <if-scene-condition :conditionItem="conditionItem" :key="`condition-item-${index}`" @update="updateCondition(Object.assign({stage},$event))" />
      </template>
    </div>
  </div>
</template>

<script>
  import { mapState, mapMutations, mapGetters, mapActions } from 'vuex'
  import { path as get, clone } from 'ramda'
  import condition from './condition.vue'
  import dropMenu from './dropMenu.vue'
  import { MountComponents } from 'lib/utils'

  export default {
    name: 'if-scene-group',
    components: MountComponents(condition, dropMenu),
    props: {
      conditionGroup: {
        required: true,
        type: Object,
      },
    },
    data() {
      return {
        more: true,
      }
    },
    computed: {
      ...mapState({
        loops: get(['project', 'loops']),
        stages: get(['project', 'stages']),
        stage: get(['project', 'selectedStage']),
        condition: get(['project', 'selectedStage', 'condition']),
        logics: get(['static', 'condition', 'logics']),
        loopMethods: get(['static', 'condition', 'loopMethods']),
        compareMethods: get(['static', 'condition', 'compareMethods']),
        conditionTypes: get(['static', 'condition', 'conditionTypes']),
      }),
      ...mapGetters(['protectCheck', 'goodies']),
      regularLoops() {
        return this.loops.filter(loop => loop.type === 'loop')
      },
    },
    methods: {
      ...mapMutations(['addCondition', 'removeCondition', 'updateCondition']),
      ...mapActions(['addConditionGroup']),
      updateconditionGroupLogic(value) {
        const index = this.condition.groups.indexOf(this.conditionGroup)
        this.$emit('update', {
          key: `groups.${index}.logic`,
          value,
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .container
    font-size 16px
    line-height 32px
    margin-bottom 10px
    color $text200
    margin 10px 0
    .group-name
      font-size inherit
      color inherit
      display flex
      align-items center
      .start-symbol
        color $text100
    .condition-list
      padding-left 10px
      font-size 14px
      background white
</style>

