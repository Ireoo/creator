<template>
  <div class="goody-layer" :style="styleLayer | ratioBox($store.state.board.zoom)">
    <div class="row" v-for="(instruction,$index) in instructions" :key="$index">
      <template v-if="instruction.initNum >= 5">
        <img :src="imagePath(instruction.image) + '?' + Date.now()" width="150px" height="150px"
          class="img-layer__img">
        <span>x{{instruction.initNum}}</span>
      </template>
      <template v-else>
        <img :src="imagePath(instruction.image) + '?' + Date.now()" width="150px" height="150px"
          class="img-layer__img" v-for="i in instruction.initNum" :key="i">
      </template>
    </div>
  </div>
</template>

<script>
  import InstructionLayer from '@/mixin/instruction-layer'
  import { mapState } from 'vuex'
  import path from 'path'
  import url from 'url'

  export default {
    name: 'IInstructionBoardGoodyLayer',
    mixins: [InstructionLayer],
    data() {
      return {
        top: 50,
        left: 100,
        right: 100,
        bottom: 50,
      }
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
      }),
      instructions() {
        return this.$store.state.project.selectedStage.instruction.filter(
          instr => {
            return instr.type === 'goody' && instr.position === this.position
          }
        )
      },
    },
    methods: {
      imagePath(src) {
        return url.format({
          protocol: 'file',
          pathname: path.join(this.projectPath, 'instruction/goodies', src),
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .goody-layer
    position absolute
    display flex
    flex-direction column
  .row
    display flex
    align-items center
    justify-content start
    .img-layer__img
      max-height 50px
      max-width 50px
      padding 5px
    .img-layer__center-img
      max-width 1920px
      max-height 1080px
    span
      font-size 24px
      font-weight bold
      color white
      margin-left 5px
      text-shadow -1px -1px 1px rgba(0, 0, 0, 0.8), 1px 1px 1px rgba(0, 0, 0, 0.8)
</style>
