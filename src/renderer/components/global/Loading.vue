<template>
  <section v-if="show">
    <mu-circular-progress :size="40" class="loading"/>
  </section>
</template>
<script>
  export default {
    name: 'Loading',
    data() {
      return {
        show: false,
      }
    },
    methods: {
      open() {
        this.show = true
      },
      close() {
        this.close = false
      },
    },
  }
</script>
<style lang="stylus" scoped>
section 
  position fixed
  left 0
  right 0
  top 0
  bottom 0
.loading
  position absolute
  left 0
  right 0
  top 0
  bottom 0
  margin auto
</style>
