<template>
  <div>
    <image-selector v-model="value.src"
      :path="value.path"
      :showSearch="false"
      :showInput="false"></image-selector>
  </div>
</template>

<script>
  import { mapState, mapActions } from 'vuex'

  export default {
    name: 'IDialogImages',
    props: {
      value: Object,
      options: Object,
    },
    methods: {
      async onOK() {},
    },
  }
</script>

<style lang="stylus" scoped>
</style>