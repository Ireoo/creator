<template>
  <div class="instruction" :style="{background:`url(${require('@/assets/transp_bg.png')})`}"
    @mousewheel="mousewheel" v-if="stage">
    <div class="instruction-content">
      <div class="instruction-wrapper">
        <div class="instruction-container" v-if="stage" :style="{width: 1920, height: 1080} | ratioBox(ratio)">
          <img v-if="stage.snapshot" :src="stage.snapshot + '?' + Date.now()" :style="{width: 1920, height: 1080} | ratioBox(ratio)">
          <i-transition-list />
        </div>
      </div>
    </div>
    <i-instruction-list />
  </div>
</template>

<script>
  import { mapState, mapMutations } from 'vuex'
  import { MountComponents } from 'lib/utils'

  import InstructionList from './instructionList.vue'
  import TransitionList from './transitionList.vue'
  export default {
    name: 'IInstructionBoard',
    components: MountComponents(InstructionList, TransitionList),
    computed: {
      ...mapState({
        stage: state => state.project.selectedStage,
        instruction: state => state.project.instruction,
        ratio: state => state.board.zoom,
      }),
      globalInstruction() {
        return this.instruction.filter(
          instr =>
            instr.start.stage === this.stage.id ||
            instr.stop.find(stop => stop.stage === this.stage.id)
        )
      },
      mixedInstruction() {
        return [...this.globalInstruction, ...this.stage.instruction]
      },
    },
    methods: {
      ...mapMutations(['changeZoom']),
      mousewheel(e) {
        if (process.platform !== 'win32') {
          return
        }
        if (e.wheelDelta < 0) {
          this.changeZoom(this.ratio - 0.1)
        } else {
          this.changeZoom(this.ratio + 0.1)
        }
      },
    },
    mounted() {
      const width = this.$el.offsetWidth
      this.$store.commit('changeZoom', (width - 80) / 1920)
    },
  }
</script>

<style lang="stylus" scoped>
  .instruction
    position relative
    overflow hidden
    background $grey400
    box-shadow inset 1px 1px 5px rgba(0, 0, 0, 0.1), -1px -1px 5px rgba(0, 0, 0, 0.1)
  .instruction-content
    padding-bottom 70px
    overflow auto
    position relative
    height 100%
    display flex
  .instruction-wrapper
    margin auto
    display inline-block
    padding 40px
  .instruction-container
    position relative
    display inline-block
    background white
    paper()
</style>
