<template>
  <div class="transition-list">
    <template v-for="(position,i) in ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']">
      <i-instruction-board-text-layer :position="position" :key="`text-${i}`"></i-instruction-board-text-layer>
      <i-instruction-board-image-layer :position="position" :key="`iamge-${i}`"></i-instruction-board-image-layer>
      <i-instruction-board-goody-layer :position="position" :key="`goody-${i}`"></i-instruction-board-goody-layer>
    </template>
  </div>
</template>

<script>
  import TextLayer from './TextLayer.vue'
  import ImageLayer from './ImageLayer.vue'
  import GoodyLayer from './GoodyLayer.vue'
  import { MountComponents } from 'lib/utils'
  export default {
    name: 'ITransitionList',
    components: MountComponents(TextLayer, ImageLayer, GoodyLayer),
  }
</script>