<template>
  <div class="view-tool-bar">
    <div class="tool-item">
      <i class="iconfont icon-iosgridviewoutline circle-button" :class="{active:grid}" @click="toggleShowGrid"
        title="Grid"></i>
    </div>
    <template v-if="threeDFile">
      <div class="tool-item" style="color:#f9a825;">
        <i v-if="control==='translate'" class="fa fa-arrows circle-button" @click="toggleThreeDControl"></i>
        <i v-else-if="control==='scale'" class="fa fa-search-plus circle-button" @click="toggleThreeDControl"></i>
        <i v-else-if="control ==='rotate'" class="fa fa-refresh circle-button" @click="toggleThreeDControl"></i>
      </div>
      <div class="tool-item" title="Redo">
        <i class="fa fa-share circle-button" @click="redo3D"></i>
      </div>
      <div class="tool-item" title="Undo">
        <i class="fa fa-reply circle-button" @click="undo3D"></i>
      </div>
    </template>
  </div>
</template>

<script>
  import { mapMutations, mapState, mapGetters } from 'vuex'
  export default {
    name: 'IToolbar',
    computed: {
      ...mapState({
        grid: state => state.setting.showGrid,
        control: state => state.threed.control,
      }),
      ...mapGetters(['threeDFile']),
    },
    methods: {
      ...mapMutations([
        'toggleShowGrid',
        'toggleThreeDControl',
        'undo3D',
        'redo3D',
      ]),
    },
  }
</script>

<style scoped lang="stylus">
  .view-tool-bar
    position absolute
    right 0
    top 0
    height 40px
    width 100%
    padding 5px 20px
    display flex
    z-index 2
    flex-direction row-reverse
    color $text300
</style>