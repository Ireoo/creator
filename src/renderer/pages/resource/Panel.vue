<template>
  <resizable-panel control-position="top"
    title="Resource"
    class="resource">
    <div class="container">
      <i-resource-view v-if="projectExist"></i-resource-view>
      <div v-else>Please open/create project</div>
    </div>
  </resizable-panel>
</template>

<script>
  import { MountComponents } from 'lib/utils'
  import { mapGetters } from 'vuex'

  import ResizablePanel from 'components/ResizablePanel'
  import ResourceView from './ResourceView'

  export default {
    name: 'IResourcePanel',
    components: MountComponents(ResizablePanel, ResourceView),
    computed: {
      ...mapGetters(['projectExist']),
    },
  }
</script>

<style lang="stylus" scoped>
  .container
    height calc(100% - 38px)
  .resource
    background $grey300
</style>
