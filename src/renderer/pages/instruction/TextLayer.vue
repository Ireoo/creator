<template>
  <div class="text-container"
    :style="styleLayer | ratioBox(zoom)">
    <span v-for="(text,$index) in texts"
      :style="text.css"
      :class="`font-${text.font}`"
      :key="$index">{{text.txt}}</span>
  </div>
</template>

<script>
  import InstructionLayer from '@/mixin/instruction-layer'
  import { mapState } from 'vuex'

  export default {
    name: 'IInstructionBoardTextLayer',
    mixins: [InstructionLayer],
    data() {
      return {
        top: 50,
        left: 100 + 150,
        right: 100 + 200,
        bottom: 100,
      }
    },
    computed: {
      ...mapState({
        zoom: state => state.board.zoom,
      }),
      texts() {
        return this.$store.state.project.selectedStage.instruction.filter(
          instr => {
            return instr.type === 'text' && instr.position === this.position
          }
        )
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .text-container
    position absolute
    display flex
    flex-direction column
    font-size 1.75em
    color white
    padding 0 5px
    span
      background rgba(0, 0, 0, 0.2)
      line-height 150px
      font-size 2em
</style>
