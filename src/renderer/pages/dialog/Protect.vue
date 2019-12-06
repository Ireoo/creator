<template>
  <el-form>
    <el-form-item :label="protectText('password')">
      <el-input class="input-password"
        @blur="onPasswordChange"
        :value="password"
        size="mini"
        type="password" />
    </el-form-item>
    <el-form-item :label="protectText('protectList')">
      <el-checkbox-group class="checkbox-container"
        @change="update"
        v-model="selectedList">
        <el-checkbox class="checkbox"
          :label="item"
          v-for="(item,index) in allProtect"
          :key="index">{{protectText(item)}}</el-checkbox>
      </el-checkbox-group>
    </el-form-item>
  </el-form>
</template>

<script>
  import { clone } from 'ramda'
  import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
  import { protectList } from '@/static/protect'

  const requiredField = {
    type: 'string',
    required: false,
  }
  const ProjectState = key => state => state.project[key]
  export default {
    name: 'IDialogProtect',
    data() {
      return {
        allProtect: protectList,
        selectedList: [],
      }
    },
    props: {
      options: Object,
    },
    computed: {
      ...mapState({
        selectdStage: ProjectState('selectedStage'),
        list: ProjectState('protectList'),
        password: ProjectState('password'),
      }),
    },
    created() {
      this.updateSelectedList()
    },
    methods: {
      ...mapMutations(['updatePassword', 'updateProtect', 'updateProtectList']),
      ...mapActions(['comparePassword']),
      onPasswordChange(e) {
        const t = this.protectText
        const password = e.target.value
        if (password === '') return this.updatePassword('')
        this.comparePassword(password)
          .then(same => {
            if (!same) {
              return this.$prompt(t('Input password again'), t('Confirmation'), {
                inputType: 'password',
              }).catch(err => {
                e.target.value = ''
                return false
              })
            } else return false
          })
          .then(({ value }) => {
            if (value) return value === password
          })
          .then(same => {
            if (same) {
              this.$message.success(t('Password is set'))
              this.updatePassword(password)
            } else {
              this.$message.error(t('Different passwords'))
              e.target.value = ''
            }
          })
      },
      updateSelectedList() {
        this.selectedList = this.list
      },
      update() {
        this.updateProtectList(this.selectedList)
      },
      async onOK() {
        this.updateProtect(true)
      },
    },
  }
</script>
<style lang="stylus" scoped>
  .input-password
    input-width-x2()
  .checkbox-container
    max-height 200px
    overflow auto
  .checkbox
    display block
    margin-left 0px
</style>
