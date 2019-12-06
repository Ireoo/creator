<template>
  <el-form :model="setting" ref="form">
    <el-form-item :label="settingText('language')" prop="language">
      <el-radio-group v-model="setting.language">
        <el-radio v-for="(item,index) in languages" :key="index" :label="item">{{item}}</el-radio>
      </el-radio-group>
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
    name: 'IDialogSetting',
    props: {
      options: Object,
    },
    computed: {
      ...mapState({ languages: state => state.static.setting.languages }),
      settingText() {
        return t => this.$t('setting.' + t)
      },
    },
    data() {
      return {
        setting: clone(this.$store.state.setting),
      }
    },
    methods: {
      onOK() {
        return new Promise((resolve, reject) => {
          this.$refs.form.validate(valid =>
            valid ? resolve(valid) : reject(valid)
          )
        }).then(() => {
          this.$store.commit('updateSetting', this.setting)
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
</style>
