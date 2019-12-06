<template>
  <el-form labelPosition="top">
    <el-form-item label="Description">
      <el-input v-model="description"
        size="small"
        class="input"
        placeholder="Stage Description"></el-input>
    </el-form-item>
    <el-form-item label="Protect">
      <el-switch v-model="protect"
        class="input"></el-switch>
    </el-form-item>
  </el-form>
</template>

<script>
  import { mapMutations } from 'vuex'

  export default {
    name: 'IDialogStageSetting',
    props: {
      value: Object,
    },
    data() {
      return {
        description: this.value.description,
        protect: this.value.protect,
      }
    },
    methods: {
      ...mapMutations(['updateStageSetting']),
      onOK() {
        this.updateStageSetting({
          stage: this.value,
          desc: this.description,
          protect: this.protect,
        })
        return Promise.resolve()
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .input
    input-width-x2()
</style>
