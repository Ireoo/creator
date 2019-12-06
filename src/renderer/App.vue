<template>
  <div id="app"
    tabindex="0"
    @keyup.ctrl.83="doSave"
    @mousemove="event => this.$events.emit('mousemove', event)"
    @mouseup="event => this.$events.emit('mouseup', event)"
    v-loading.body="$store.state.project.lockAction"
    @contextmenu="onMenu"
    @contextmenu.capture="onMenuCapture">
    <router-view></router-view>
    <i-ui-event></i-ui-event>
  </div>
</template>

<script>
  import { RootMenuGroup } from 'lib/menu-group'
  import { AC_PROJECT_SAVE } from 'type/constants'
  import UIEvent from 'pages/UIEvents.vue'
  import { MountComponents } from 'lib/utils'
  import { mapState } from 'vuex'
  import { flatten } from 'lodash'

  export default {
    components: MountComponents(UIEvent),
    methods: {
      onMenuCapture(e) {
        RootMenuGroup.init(e)
      },
      onMenu(e) {
        setTimeout(() => {
          const menuGroup = e.menu
          if (!menuGroup) return
          const { Menu } = this.$electron.remote
          const formatter = menuItem =>
            (menuItem.label = this.contextMenuText(menuItem.label))
          const menu = Menu.buildFromTemplate(menuGroup.build({ formatter }))
          menu.popup()
        }, 200)
      },
      doSave() {
        this.$events.emit(AC_PROJECT_SAVE)
      },
    },
    computed: {
      ...mapState({
        language: state => state.setting.language,
      }),
    },
    watch: {
      language(val) {
        this.$i18n.locale = val
      },
    },
  }
</script>

<style lang="stylus">
  @import url('~@/assets/iconfont/iconfont.css')
  // global css
  #app
    outline 0
  *
    box-sizing border-box
    user-select none
  *::-webkit-scrollbar
    width 8px
    height 8px
  *::-webkit-scrollbar-thumb
    background darken($grey100, 30)
    border-radius 5px
  input
    user-select initial
  body, html, #app
    font-family Microsoft YaHei, -apply-system, PingFang SC, Helvetica Neue, Helvetica, Arial, sans-serif
    height 100%
    width 100%
    overflow hidden
    font-size 14px
    font-weight 400
    -webkit-tap-highlight-color rgba(0, 0, 0, 0)
    background-color #fff
  label
    font-size 12px
</style>
