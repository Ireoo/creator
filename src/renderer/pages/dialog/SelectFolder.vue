<template>
  <el-form>
    <el-form-item>
      <file-input v-model="folder" directory></file-input>
    </el-form-item>
  </el-form>
</template>

<script>
  import { clone } from 'ramda'
  import { mapState } from 'vuex'
  import path from 'path'

  export default {
    name: 'IDialogSelectFolder',
    props: {
      value: Object,
    },
    data() {
      return {
        folder: path.join(
          this.$electron.remote.app.getPath('documents'),
          Date.now().toString()
        ),
      }
    },
    methods: {
      async onOK() {
        this.value.onOk(this.folder)
      },
    },
  }
</script>

<style lang="stylus" scoped>
</style>
