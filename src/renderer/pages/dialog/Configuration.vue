<template>
  <el-form :model="configuration" ref="form">
    <el-form-item :label="configurationText('domain')" prop="domain">
      <el-input v-model="configuration.domain" type="text" placeholder="URL"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
  import { clone } from 'ramda'
  import { mapState } from 'vuex'

  const requiredField = {
    type: 'string',
    required: false,
  }

  export default {
    name: 'IDialogAccountConfiguration',
    props: {
      options: Object,
    },
    data() {
      return {
        configuration: clone(this.$store.state.configuration),
      }
    },
    methods: {
      onOK() {
        return new Promise((resolve, reject) => {
          this.$refs.form.validate(valid =>
            valid ? resolve(valid) : reject(valid)
          )
        }).then(() => {
          this.$store.commit('updateConfiguration', this.configuration)
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
</style>
