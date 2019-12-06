<template>
  <section class="map-container" v-if="projectExist">
    <div class="stage-list">
      <div class="stage-list-item" v-for="(stage,i) in relativeStages" :key="i">
        <span class="stage-number">STAGE {{stages.indexOf(stage)+1}}</span>
        <div>
          <div class="row" @click="toStage(stage)" @mouseenter="onHover(loop,stage)" :style="{
          background:loop.color}"
            :class="{
            hover:hover===loop.name?1:undefined
          }" v-for="(loop,i) in relativeLoops(stage)"
            :key="`loop-${i}`">
            <template v-if="loop.type==='loop'">
              <i class="el-icon-warning" v-if="warning(loop,stage)" :title="warning(loop,stage)"></i>
            </template>
            <template v-else-if="loop.type==='continue'">
              <i class="fa fa-angle-double-right"></i>
            </template>
            <template v-else-if="loop.type==='break'">
              <i class="fa fa-sign-out"></i>
            </template>
            <span style="margin-left:10px;">{{loop.name}}</span>
            <span v-if="loop.end===stage.id">(end)</span>
          </div>

          <template v-if="stage.type==='if'">
            <div class="row-if" @click="toStage(stage)">
              <div style="margin:5px;">
                <i class="fa-icon-button fa fa-plus-square-o" @click="expand(stage)"></i>
                <span>If</span>
                <span class="black--text lighten-2">{{stage.description}}</span>
                <span class="green--text">Then: Stage
                  {{stages.findIndex(s=>s.id===stage.condition.then)+1}}</span>
                <span class="red--text">Else: Stage
                  {{stages.findIndex(s=>s.id===stage.condition.else)+1}}</span>
              </div>
              <div class="condition-list" v-if="expandedIfStage===stage.id">
                {{conditionText(stage.condition)}}
              </div>
            </div>
          </template>

        </div>

      </div>
      <div class="line"></div>
    </div>
  </section>
</template>

<script>
  import { path } from 'ramda'
  import { mapState, mapGetters, mapMutations } from 'vuex'
  import { scrollTo } from '@/lib/utils.js'
  import { isSourceReference } from '@/lib/helper.js'

  export default {
    name: 'iLMap',
    data() {
      return {
        /**  loop name */
        hover: '',
        /** Stage ID */
        expandedIfStage: '',
      }
    },
    computed: {
      ...mapState({
        mode: path(['board', 'mode']),
        loops: path(['project', 'loops']),
        stages: path(['project', 'stages']),
        logics: path(['static', 'condition', 'logics']),
        loopMethods: path(['static', 'condition', 'loopMethods']),
        compareMethods: path(['static', 'condition', 'compareMethods']),
      }),
      ...mapGetters(['projectExist', 'conditionText', 'getStageName']),
      relativeStages() {
        return this.$store.state.project.stages.filter(stage => {
          if (stage.type === 'if') return true
          return this.loops.find(loop => {
            if (loop.type === 'loop') {
              return loop.start === stage.id || loop.end === stage.id
            } else if (['continue', 'break'].includes(loop.type)) {
              return loop.stage === stage.id
            }
          })
        })
      },
      relativeLoops() {
        return stage => {
          return this.loops.filter(loop => {
            if (loop.type === 'loop') {
              return loop.start === stage.id || loop.end === stage.id
            } else if (['continue', 'break'].includes(loop.type)) {
              return loop.stage === stage.id
            }
          })
        }
      },
      warning() {
        return (loop, stage) => {
          if (loop.start !== stage.id) return false
          let error = ''

          ;[('bg', 'cus', 'fg', 'obj')].forEach(key => {
            // keep the last status
            const keep = stage.parameter[key].units.find(unit => unit.init.keep)
            if (keep) {
              error += `please check logic of ${key}, since it keep last status. \n`
            }
          })

          const keys = ['bg', 'cus', 'fg', 'obj']
            .filter(key => {
              const source = stage.parameter[key].source
              return isSourceReference(source)
            })
            .map(key => key.toUpperCase())

          if (keys.length) {
            error += `Please check logic of ${keys.join(
              '/'
            )}, since it is the same as previous stage in the start of loop. \n`
          }
          return error
        }
      },
    },
    methods: {
      toStage(stage) {
        scrollTo(
          document.querySelector(`.stage-${stage.id}`),
          0,
          document.querySelector('.stage-panel-container')
        )
      },
      onHover(loop, stage) {
        this.hover = loop.name
      },
      expand(stage) {
        if (this.expandedIfStage) {
          this.expandedIfStage = ''
        } else {
          this.expandedIfStage = stage.id
        }
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .map-container
    border-left 1px solid lightgray
    padding 40px 40px
    overflow hidden
    position relative
    width 100%
    display flex
    justify-content center
    .stage-list
      position relative
      .line
        height 100%
        border-right 1px dashed $primary-color-highlight
        position absolute
        top 0
        left 20px
      .stage-list-item
        .stage-number
          background white
          z-index 2
          margin-right 20px
          min-width 75px
    .stage-list-item, .loop-list-item
      min-height 40px
      display flex
      align-items flex-start
      margin-bottom 10px
      vertical-align middle
      color $primary-color-highlight
    .row
      background lightgray
      min-width 50px
      border-radius 3px
      padding 0 10px
      color white
      cursor pointer
      margin-right 10px
      margin-bottom 10px
      opacity 0.8
      transition all 0.1s
      display inline-block
      align-items baseline
      &.hover
        opacity 1
        transform scale(1.02)
      .el-icon-warning
        margin-right 5px
    .row-if
      color $primary-color-highlight
      border 1px solid $primary-color-highlight
      min-width 200px
      border-radius 5px
      overflow hidden
    .condition-list
      padding 5px
      padding-left 10px
      border-top 1px solid $primary-color-highlight
</style>
