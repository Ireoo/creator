<template>
  <resizable-panel v-show="!['if'].includes(stage.type)" controlPosition="left" :maxSize="450" :minSize="290">
    <div class="container" v-if="!stage">
      Please Select a Stage
    </div>
    <div class="container" :style="{height:`calc(100% - ${bottomHeight}px)`}" v-else>

      <i-parameter-panel-2d v-if="!threeDFile" />
      <i-parameter-panel-3d v-if="threeDFile" v-ref:panel3D />

      <resizable-panel control-position="top" v-if="projectExist" @update="bottomHeight = $event"
        :minSize="35" panelClass="resource">
        <i-resource-view v-if="projectExist" v-ref:resourceView></i-resource-view>
      </resizable-panel>
    </div>
  </resizable-panel>
</template>

<script>
  import { MountComponents } from 'lib/utils'
  import { mapState, mapMutations, mapGetters } from 'vuex'

  import ResizablePanel from 'components/ResizablePanel.vue'
  import ResourceView from 'pages/resource/ResourceView.vue'
  import Panel2d from './Panel2d.vue'
  import Panel3d from './Panel3d.vue'
  import { get } from 'lodash'
  export default {
    name: 'IParameterPanel',
    components: MountComponents(ResizablePanel, ResourceView, Panel2d, Panel3d),
    computed: {
      ...mapGetters(['projectExist', 'threeDFile']),
      ...mapState({
        stage: state => state.project.selectedStage,
      }),
    },
    data() {
      return {
        bottomHeight: 0,
      }
    },
  }
</script>
<style lang="stylus" scoped>
  $parameter-list-height = 25px
  .container::-webkit-scrollbar
    // display none
  .container
    height inherit
    overflow auto
    .resource
      position absolute
      bottom 0
      background $main-board-background
</style>