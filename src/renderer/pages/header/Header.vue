<template>
  <div class="header">
    <i-header-menu></i-header-menu>
    <i-header-plank></i-header-plank>
  </div>
</template>

<script>
  import Menu from './Menu.vue'
  import Plank from './Plank.vue'
  import { MountComponents } from 'lib/utils'

  export default {
    name: 'IHeader',
    components: MountComponents(Menu, Plank),
  }
</script>

<style lang="stylus" scoped>
  // .header
  //   border-bottom 1px solid #cccccc
</style>
