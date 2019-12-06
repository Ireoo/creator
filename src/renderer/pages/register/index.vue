<template>
  <section class="container">
    <particles class="particles" />
    <mu-paper class="form-container">
      <div class="form">
        <h1>{{registerText('authorizationCode')}}</h1>
        <mu-text-field :hintText="registerText('inputAuthorizationCode')" v-model="code" focus
          fullWidth /><br />
      </div>
      <mu-raised-button :label="registerText('register')" class="register" :disabled="disable.register"
        @click="register" />
    </mu-paper>
    <el-select class="languages" @change="changeLanguage" size="mini" v-model="selectedLang"
      placeholder="Language">
      <el-option v-for="(lang,index) in languages" :key="index" :label="lang" :value="lang">
      </el-option>
    </el-select>
  </section>
</template>

<script>
  import particles from '@/components/register/Particles.vue'
  import { MountComponents } from 'lib/utils'
  import { register, clearStore } from 'lib/leancloud'
  import { mapState, mapMutations } from 'vuex'
  import { languages } from '@/i18n'

  export default {
    name: 'IRegister',
    components: MountComponents(particles),
    data() {
      return {
        code: '',
        disable: {
          register: false,
        },
        selectedLang: languages[0],
      }
    },
    computed: {
      ...mapState({ languages: state => state.static.setting.languages }),
    },
    mounted() {
      this.checkout()
    },
    methods: {
      ...mapMutations(['updateSetting']),
      register() {
        if (!this.code) return this.$message.error('the code is empty.')
        this.checkout(this.code)
      },
      checkout(code = '') {
        clearStore()
        this.disable.register = true
        register(code)
          .then(({ status, msg }) => {
            this.disable.register = false
            if (status !== 1) return this.$message.error(msg)
            this.$message.success(msg)
            this.$router.push('/')
          })
          .catch(console.error)
      },
      changeLanguage(language) {
        this.updateSetting({ language })
      },
    },
  }
</script>

<style scoped lang="stylus">
  .container
    width 100vw
    height 100vh
    .languages
      position absolute
      top 20px
      right 20px
      width 100px
    .form-container
      background $grey100
      position absolute
      width 50%
      height 250px
      left 0
      right 0
      bottom 0
      top -100px
      margin auto
      .form
        padding 10px
      .register
        position absolute
        bottom 0
        width 100%
        height 60px
        opacity 0.8
        bg-gradient-blue()
  h1
    opacity 0.8
</style>

<style >
  .particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>