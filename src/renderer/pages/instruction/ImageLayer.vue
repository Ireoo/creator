<template>
  <div style="position: absolute; display: flex; flex-direction: column"
    :style="styleLayer | ratioBox($store.state.board.zoom)">
    <img :src="imagePath(image.src) + '?' + Date.now()"
      v-for="(image,$index) in images"
      :key="$index"
      width="150px"
      height="150px"
      :class="image.type === 'center' ? 'img-layer__center-img' : 'img-layer__img'">
  </div>
</template>

<script>
  import InstructionLayer from '@/mixin/instruction-layer'
  import { mapState } from 'vuex'
  import path from 'path'
  import url from 'url'

  export default {
    name: 'IInstructionBoardImageLayer',
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
      images() {
        return this.$store.state.project.selectedStage.instruction.filter(
          instr => {
            return instr.type === 'image' && instr.position === this.position
          }
        )
      },
    },
    methods: {
      imagePath(src) {
        return url.format({
          protocol: 'file',
          pathname: path.join(this.projectPath, 'instruction/sysimg', src),
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .img-layer__img
    max-height 150px
    max-width 150px
    padding 5px
    background rgba(0, 0, 0, 0.2)
  .img-layer__center-img
    max-width 1920px
    max-height 1080px
</style>
