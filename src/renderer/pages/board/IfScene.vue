<template>
  <div class="if-scene-container">
    <div class="headline">Conditions</div>
    <el-form v-model="condition" ref="form" size="mini">
      <div>
        <el-form-item class="form-item">
          <el-button type="primary" plain @click="addCondition({stage})">
            + Add Condition
          </el-button>
          <el-button type="primary" plain @click="addConditionGroup">
            + Add Group
          </el-button>
        </el-form-item>
      </div>

      <template v-for="(conditionGroup,index) in topGroups">
        <if-scene-group :conditionGroup="conditionGroup" :key="`group-item-${index}`" @update="updateCondition(Object.assign({stage},$event))" />
      </template>
      <template v-for="(conditionItem, index) in topConditions">
        <if-scene-condition :conditionItem="conditionItem" :key="`condition-item-${index}`" @update="updateCondition(Object.assign({stage},$event))" />
      </template>
      <span class="start-symbol"></span>
      <el-form-item class="form-item then" label="Then" label-width="50px" prop="then">
        <el-select style="width:290px;" :value="condition.then" @input="updateCondition({stage,key:'then',value:$event})"
          placeholder="Then">
          <el-option :label="getStageName(stage,i,true)" :value="stage.id" v-for="(stage,i) in stages" :key="i"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="form-item else" label="Else" label-width="50px" prop="else">
        <el-select style="width:290px;" :value="condition.else" @input="updateCondition({stage,key:'else',value:$event})"
          placeholder="Else">
          <el-option :label="getStageName(stage,i,true)" :value="stage.id" v-for="(stage,i) in stages" :key="i"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div v-if="conditionText">
      {{conditionText(condition)}}
    </div>
  </div>
</template>

<script>
  import { mapState, mapMutations, mapGetters, mapActions } from 'vuex'
  import { path as get, clone } from 'ramda'
  import { EV_CANVAS_FIT } from 'type/constants'
  import { MountComponents } from 'lib/utils'
  import condition from '@/components/IfScene/condition.vue'
  import group from '@/components/IfScene/group.vue'
  import { ConditionItem, ConditionGroup } from 'type/stage'

  export default {
    name: 'IIfScene',
    components: MountComponents(condition, group),
    props: {
      width: {
        type: Number,
        default: 1920,
      },
      height: {
        type: Number,
        default: 1080,
      },
    },
    computed: {
      ...mapState({
        projectPath: get(['project', 'projectPath']),
        loops: get(['project', 'loops']),
        stages: get(['project', 'stages']),
        stage: get(['project', 'selectedStage']),
        condition: get(['project', 'selectedStage', 'condition']),
        logics: get(['static', 'condition', 'logics']),
        loopMethods: get(['static', 'condition', 'loopMethods']),
        goodyMethods: get(['static', 'condition', 'goodyMethods']),
        compareMethods: get(['static', 'condition', 'compareMethods']),
        conditionTypes: get(['static', 'condition', 'conditionTypes']),
      }),
      ...mapGetters(['protectCheck', 'goodies', 'conditionText', 'getStageName']),
      regularLoops() {
        return this.loops.filter(loop => loop.type === 'loop')
      },
      topGroups() {
        return this.condition.groups.filter(
          conditionGroup => !conditionGroup.parent
        )
      },
      topConditions() {
        return this.condition.conditions.filter(
          conditionItem => !conditionItem.parent
        )
      },
    },
    mounted() {
      this.$events.emit(EV_CANVAS_FIT)
    },
    methods: {
      ...mapMutations(['addCondition', 'removeCondition', 'updateCondition']),
      ...mapActions(['addConditionGroup']),
    },
  }
</script>

<style lang="stylus">
  .if-scene-container
    display inline-block
    position relative
    background lighten($grey100, 2)
    outline 0
    padding 20px 10px
    board-transitioin()
    min-width 1100px
    min-height 500px
    .headline
      opacity 0.8
      margin-bottom 40px
      font-weight bold
      font-size 20px
      text-align center
      color $primary-color-highlight
    .form-item
      display inline-block
      margin-bottom 20px
    .start-symbol
      opacity 0.5
      font-weight bold
      color $primary-color-highlight
      width 10px
      &:after
        line-height 30px
        content '┃'
    .then *
      color $green !important
      border-color $green !important
    .else *
      color $red !important
      border-color $red !important
    .condition-type
      text-transform capitalize
      margin-bottom 10px
      color grey
      i
        font-size 0.8em
</style>
