<template>
  <div class="preview">
    <ul class="transition transition-from">
      <div class="transition-current transition-back" :class="{'transition-back_disabled': historyEmpty}"
        :title="historyEmpty ? '(No Back)' : 'Back to' + stageLabel(topStageIndex)" @click="popHistory">
        <i class="fa fa-fw fa-arrow-left"></i>
        <span v-if="!historyEmpty">{{stageLabel(topStageIndex)}}</span>
      </div>
      <li class="transition-item" v-for="(fromTrans,index) in fromStageTransition" @click="pushHistory(fromTrans.index)"
        :key="index">
        <span class="transition-item__left">
          {{fromTrans.transition}}
        </span>
        <span class="transition-item__right">
          From {{stageLabel(fromTrans.index)}}
        </span>
      </li>
    </ul>
    <i-board-init-scene class="preview-scene" :stage="stage" style="background: white"></i-board-init-scene>
    <ul class="transition transition-to">
      <div class="transition-current" :title="'Current ' + stageLabel(stageIndex)">
        <i class="fa fa-fw fa-map-pin"></i> {{stageLabel(stageIndex)}}
      </div>
      <li class="transition-item" v-for="({stageFile,NextStage}, index) in transitions" @click="pushHistory(stageFile)"
        :key="index">
        <span class="transition-item__left">
          T{{index + 1}}: {{transitionLabel(NextStage)}}
        </span>
        <span class="transition-item__right">
          To {{stageLabel(stageFile)}}
        </span>
      </li>
      <li class="transition-item" v-if="toLoop" @click="pushHistory(stages.findIndex(({id})=>id===toLoop.start))">
        <span class="transition-item__left">
          <i class="iconfont icon-Functionsvgicon"></i>
        </span>
        <span class="transition-item__right">
          To Loop {{toLoop.name}}
        </span>
      </li>
    </ul>
    <i-transition-list class="transition-list" />
    <i-instruction-list class="instruction-list" />
    <div class="loop-list">
      <div class="loop" v-for="(loop,i) in inLoops" :key="i">
        Loop {{loop.name}}
      </div>
    </div>
    <audio ref="audio"></audio>
  </div>
</template>

<script>
  import { mapState, mapMutations } from 'vuex'
import { value2Label } from 'lib/form'
import { MountComponents } from 'lib/utils'
import Scene from 'pages/board/InitScene.vue'
import InstructionList from '../instruction/instructionList.vue'
import TransitionList from '../instruction/transitionList.vue'
import path from 'path'
import { inRange } from 'lodash'
import { equals } from 'ramda'
import { transitionMap } from '@/static/form'
import { isRandomTrans } from 'lib/project'
const { numberOfFrames } = transitionMap

  export default {
    name: 'IPreview',
    components: MountComponents(Scene, InstructionList, TransitionList),
    data() {
      return {
        stageIndex: 0,
        history: [],
        lastId: '',
      }
    },
    computed: {
      ...mapState({
        stages: state => state.project.stages,
        instruction: state => state.project.instruction,
        projectPath: state => state.project.projectPath,
        loops: state => state.project.loops,
      }),
      stage() {
        return this.stages[this.stageIndex]
      },
      topStageIndex() {
        return this.history[this.history.length - 1]
      },
      fromStageTransition() {
        return this.stages
          .filter(stage =>
            stage.transition.some(trans => trans.stageFile === this.stageIndex)
          )
          .map(stage => ({
            transition: stage.transition
              .filter(trans => trans.stageFile === this.stageIndex)
              .map(trans => {
                const label = value2Label(
                  this.$store.state.static.form.transition[2],
                  trans.NextStage
                )
                return this.stageDialogText(label)
              })
              .join(' / '),
            index: this.stages.indexOf(stage),
          }))
      },
      transitionLabel() {
        return NextStage => {
          const label = value2Label(
            this.$store.state.static.form.transition[2],
            NextStage
          )
          return this.stageDialogText(label)
        }
      },
      historyEmpty() {
        return !this.history.length
      },
      inRange() {
        const id = this.lastId
        if (!id) return false
        const instr = this.instruction
          .filter(ins => ins.type === 'music')
          .find(ins => ins.start.stage === id)
        if (!instr) return false
        const start = instr.start.stage
        const stop = instr.stop.stage
        const startIndex = this.stages.findIndex(s => s.id === start)
        const stopIndex = this.stages.findIndex(s => s.id === stop)
        const currentIndex = this.stages.findIndex(s => s.id === id)
        return inRange(currentIndex, startIndex, stopIndex)
      },
      transitions() {
        let transitions = []
        this.stage.transition.forEach(trans => {
          if (isRandomTrans(trans.stageFile)) {
            trans.stages.forEach(id => {
              transitions.push({
                ...trans,
                stageFile: this.stages.findIndex(stage => stage.id === id),
              })
            })
          } else {
            transitions.push(trans)
          }
        })
        return transitions
      },
      toLoop() {
        const loop = this.loops.find(loop => loop.end === this.stage.id)
        return loop
      },
      inLoops() {
        return this.loops.filter(loop => {
          if (loop.type !== 'loop') return
          return (
            loop.startIndex <= this.stageIndex && loop.endIndex >= this.stageIndex
          )
        })
      },
    },
    watch: {
      stageIndex(index) {
        this.selectStage(this.stages[index])
      },
      stage(stage) {
        this.checkMusic()
        this.checkTransition()
      },
    },
    methods: {
      ...mapMutations(['selectStage']),
      value2Label,
      pushHistory(index) {
        this.history.push(this.stageIndex)
        this.stageIndex = index
      },
      popHistory() {
        if (!this.history.length) return
        this.stageIndex = this.history.pop()
      },
      stageLabel(index, stage) {
        if (!stage) stage = this.stages[index]
        const common = `Stage ${index + 1}`
        if (!stage) return common
        switch (stage.type) {
          case 'end':
            return `${common}(End)`
          case 'preEnd':
            return `${common}(Pre End)`
        }
        return common
      },
      checkMusic() {
        const stage = this.stage
        const id = stage.id
        this.lastId = id
        const instr = this.instruction
          .filter(ins => ins.type === 'music')
          .find(ins => ins.start.stage === id)
        const audio = this.$refs.audio
        if (!instr) return audio.load()
        if (!inRange) return audio.load()
        audio.src = path.join(this.projectPath, 'instruction', instr.src)
        audio.play()
      },
      async checkTransition() {
        if (this.toLoop) return
        const transitions = this.transitions
        if (transitions.length > 1 || !transitions.length) return
        const { NextStage, NextStageTime, stageFile } = transitions[0]
        if (equals(NextStage, numberOfFrames)) {
          const second = NextStageTime / 30
          await new Promise(resolve => setTimeout(resolve, second * 1000))
          this.pushHistory(stageFile)
        }
      },
    },
    mounted() {
      const { width, height } = this.$el.getBoundingClientRect()
      this.$store.commit(
        'changeZoom',
        Math.min(width / 1920, (height - 100) / 1080)
      )
      this.checkMusic()
    },
  }
</script>

<style lang="stylus" scoped>
  .preview
    position relative
    width 100%
    overflow hidden
    user-select none
    display flex
    justify-content center
    align-items center
    background radial-gradient(ellipse at center, #29323c 0%, #485563 100%)
  .preview-scene
    overflow hidden
    position relative
    flex-shrink 0
    flex-grow 0
  .transition
    list-style none
    margin 0
    padding 0
    display flex
    flex-direction row
    position absolute
    width 100%
    background $main-header-background
    color $text100
    z-index 100
    > *
      border-right 1px solid white
      &:last-child
        border-right none
  .transition-from
    top 0
  .transition-to
    bottom 0
  .transition-current
    padding 10px
    flex-grow 0
    flex-shrink 0
    background $primary-color-light
  .transition-back
    cursor pointer
    &:hover
      background darken($primary-color-light, 30)
  .transition-back_disabled
    cursor not-allowed
  .transition-item
    padding 10px
    flex-grow 1
    cursor pointer
    transition 0.3s
    &:hover
      background $menu-color-highlight
  .transition-item__left
    float left
  .transition-item__right
    float right
  .instruction-list
    bottom 50px !important
  .instruction-list, .transition-list
    pointer-events none
    opacity 0.7
    z-index 200
    left 200px
  .transition-list
    position absolute
    top 0
    width 50%
  .loop-list
    position absolute
    left 50px
    top 70px
    color white
</style>
