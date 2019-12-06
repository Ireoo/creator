<template>
  <section class="map-container"
    :class="{'hold-mode':mode==='hold'}"
    v-if="projectExist">
    <div ref="mapEl"
      class="map"
      v-movable="hold" />
    <el-button size="small"
      round
      class="save"
      @click="saveMapImage(projectPath,$el)">{{mapText('save')}}</el-button>
  </section>
</template>
<script>
  import 'jointjs/dist/joint.css'

  import { mapState, mapGetters, mapMutations } from 'vuex'
  import { saveMapImage } from 'lib/project'
  import mixin from './mixin.js'

  export default {
    name: 'iMap',
    mixins: [mixin],
    computed: {
      stages() {
        return this.$store.state.project.stages
      },
    },
    methods: {
      saveMapImage() {
        saveMapImage(this.projectPath, this.$refs.mapEl)
        this.$message.success('Image saved to ./map/project.png')
      },
    },
  }
</script>
<style lang="stylus" scoped>
  .map-container
    background #e8eaf6
    overflow hidden
    position relative
    .save
      position absolute
      right 20px
      top 20px
      background none
    .map
      box-shadow inset 1px 1px 5px rgba(0, 0, 0, 0.12), -1px -1px 5px rgba(0, 0, 0, 0.12)
</style>
<style>
  /* display line source of member of map */
  .marker-arrowhead-group-source {
    display: none;
  }
</style>