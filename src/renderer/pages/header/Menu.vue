<template>
  <div class="menu">
    <el-dropdown trigger="click" class="menu-item-dropdown menu-file" @command="handleCommand">
      <span class="menu-item" title="File">{{ menuText('file') }}</span>
      <el-dropdown-menu slot="dropdown" style="margin-top:0;">
        <el-dropdown-item command="create">{{ menuText('fileMenu.create') }}</el-dropdown-item>
        <el-dropdown-item command="createWithTemplate">{{ menuText('fileMenu.createWithTemplate') }}</el-dropdown-item>
        <el-dropdown-item command="open">{{ menuText('fileMenu.open') }}</el-dropdown-item>
        <el-dropdown-item command="import">{{ menuText('fileMenu.importProject') }}</el-dropdown-item>
        <el-dropdown-item command="save" divided>{{ menuText('fileMenu.save') }}</el-dropdown-item>
        <el-dropdown-item command="saveAs" :disabled="!projectExist">{{
          menuText('fileMenu.saveAs')
        }}</el-dropdown-item>
        <el-dropdown-item command="export" :disabled="!projectExist">{{
          menuText('fileMenu.export')
        }}</el-dropdown-item>
        <el-dropdown-item command="about">{{ menuText('fileMenu.about') }}</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-dropdown trigger="click" class="menu-item-dropdown menu-account" @command="handleCommand">
      <span class="menu-item">{{ menuText('account') }}</span>
      <el-dropdown-menu slot="dropdown" style="margin-top:0;">
        <el-dropdown-item v-if="!user.anonymous" command="login" disabled>{{ user.username }}</el-dropdown-item>
        <el-dropdown-item v-if="user.anonymous" command="login">{{ menuText('accountMenu.login') }}</el-dropdown-item>
        <el-dropdown-item v-if="!user.anonymous" command="upload">{{
          menuText('accountMenu.upload')
        }}</el-dropdown-item>
        <!--        <el-dropdown-item v-if="!user.anonymous" command="myClassProject">My Class Project</el-dropdown-item>-->
        <el-dropdown-item v-if="!user.anonymous" command="myClassProject">{{
          menuText('accountMenu.myClassProject')
        }}</el-dropdown-item>
        <el-dropdown-item v-if="!user.anonymous" command="myProject">{{
          menuText('accountMenu.myProject')
        }}</el-dropdown-item>
        <el-dropdown-item v-if="!user.anonymous" command="downloadProject">{{
          menuText('accountMenu.downloadProject')
        }}</el-dropdown-item>
        <el-dropdown-item command="configuration">{{ menuText('accountMenu.configuration') }}</el-dropdown-item>
        <el-dropdown-item v-if="!user.anonymous" command="logout">{{
          menuText('accountMenu.logout')
        }}</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <span class="menu-item menu-home" :class="activeClass('home')" @click="changeActive('home')">{{
      menuText('home')
    }}</span>
    <span class="menu-item menu-instruction" :class="activeClass('instruction')" @click="changeActive('instruction')">{{
      menuText('instruction')
    }}</span>
    <span class="menu-item menu-debug" v-if="debug.enabled" @click="openDebugDialog"> {{ menuText('debug') }}</span>
    <span class="menu-item _right menu-view-images" @click="viewImage">{{ menuText('viewImages') }}</span>
    <span class="menu-item menu-message _right" v-if="message">{{ message }}...</span>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters, mapActions } from 'vuex'
import { Debounce, urlToPath } from 'lib/helper'
import {
  AC_PROJECT_CREATE,
  AC_PROJECT_SAVE,
  AC_PROJECT_SAVE_AS,
  AC_SHOW_PROJECT_IMAGE_FOLDER,
  AC_PROJECT_OPEN,
  AC_PROJECT_IMPORT,
  AC_PROJECT_EXPORT,
  EV_AUTO_SAVE,
  EV_DIALOG_OPEN,
  DIALOG_LOGIN,
  DIALOG_MY_PROJECT,
  DIALOG_UPLOAD,
  DIALOG_ACCOUNT_CONFIGURATION,
  DIALOG_DEBUG,
  AC_PROJECT_EXPORTED,
  DIALOG_TEMPLATES,
  DIALOG_SELECT_FOLDER
} from 'type/constants'
import fs from 'fs-extra'
import path from 'path'
import av from '@/lib/leancloud'
import { remote } from 'electron'
import { findFiles } from 'lib/project'

export default {
  name: 'IHeaderMenu',
  data() {
    return {
      message: ''
    }
  },
  computed: {
    ...mapState({
      active: state => state.header.active,
      selectedStage: state => state.project.selectedStage,
      projectPath: state => state.project.projectPath,
      stages: state => state.project.stages,
      version: state => state.static.info.appVersion,
      user: state => state.user,
      debug: state => state.project.debug
    }),
    ...mapGetters(['projectExist'])
  },
  watch: {
    selectedStage(value) {
      if (!value && this.active === 'element') {
        this.changeActive('home')
      }
    }
  },
  events: {
    [EV_AUTO_SAVE](err) {
      if (err) {
        this.setMessage('Saved Error')
        console.error(err)
      } else {
        this.setMessage('Saved')
      }
    }
  },
  methods: {
    ...mapMutations(['changeActive', 'logout', 'updateDebug']),
    ...mapActions(['openProject']),
    activeClass(name) {
      return this.active === name ? '_active' : ''
    },
    async handleCommand(command) {
      switch (command) {
        case 'create':
          this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_SELECT_FOLDER,
            title: 'Create folder',
            width: '50%',
            data: {
              onOk: projectPath => {
                this.$events.emit(AC_PROJECT_CREATE, projectPath)
              }
            }
          })
          break
        case 'open':
          this.$events.emit(AC_PROJECT_OPEN)
          break
        case 'import':
          this.$events.emit(AC_PROJECT_IMPORT)
          break
        case 'saveAs':
          this.$events.emit(AC_PROJECT_SAVE_AS)
          break
        case 'save':
          this.$events.emit(AC_PROJECT_SAVE)
          break
        case 'login':
          this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_LOGIN,
            title: 'Login',
            textOK: 'login'
          })
          break
        case 'logout':
          this.logout()
          this.$message.success('Logout successful')
          break
        case 'upload':
          if (!this.projectPath) return
          if (!fs.existsSync(path.join(this.projectPath, 'stage1.stage'))) {
            // this.$message.error('Before upload, Please export the project.')
            // return
            this.$events.emit(AC_PROJECT_EXPORT)
            await new Promise(resolve => {
              this.$events.on(AC_PROJECT_EXPORTED, resolve)
            })
          }
          this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_UPLOAD,
            title: 'Upload',
            textOK: 'Submit',
            width: '50%'
          })
          // this.upload()
          break
        case 'myProject':
          this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_MY_PROJECT,
            title: 'My Project',
            textOK: null,
            data: { userId: this.user.id }
          })
          break
        case 'myClassProject':
          this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_MY_PROJECT,
            title: 'My class project',
            textOK: null,
            data: { userId: this.user.id, class: true }
          })
          break
        case 'configuration':
          this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_ACCOUNT_CONFIGURATION,
            title: 'Configuration'
          })
          break
        case 'export':
          this.$events.emit(AC_PROJECT_EXPORT)
          break
        case 'about':
          this.$alert(`Version: ${this.version}`, 'About')
          break
        case 'help':
          this.openHelp()
          break
        case 'downloadProject':
          this.$prompt(undefined, 'Download project', {
            inputPlaceholder: 'URL'
          }).then(({ value: url }) => {
            this.$events.emit(EV_DIALOG_OPEN, {
              type: DIALOG_MY_PROJECT,
              title: 'Download Projects',
              textOK: null,
              data: { url }
            })
          })
          break
        case 'createWithTemplate':
          // this.$events.emit(EV_DIALOG_OPEN, {
          //   type: DIALOG_TEMPLATES,
          //   title: 'Templates',
          //   textOK: null
          // })
          this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_SELECT_FOLDER,
            title: 'Create folder',
            width: '50%',
            data: {
              onOk: async projectPath => {
                fs.ensureDirSync(projectPath)
                const root = remote.app.getPath('userData')
                const projectsPath = path.join(root, 'static/projects')
                const files = (await findFiles(projectsPath)).filter(file => file.type === 'dir')
                // 用模板覆盖新建的项目
                fs.copySync(files[0].path, projectPath)
                this.openProject(projectPath)
              }
            }
          })

          break
      }
    },
    openDebugDialog() {
      this.$events.emit(EV_DIALOG_OPEN, {
        type: DIALOG_DEBUG,
        title: 'Add debug loop'
      })
    },
    viewImage() {
      this.$events.emit(AC_SHOW_PROJECT_IMAGE_FOLDER)
    },
    setMessage(message) {
      this.message = message
      setTimeout(() => {
        this.clearMessage()
      }, 1000)
    },
    @Debounce(3000)
    clearMessage() {
      this.message = ''
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~nib/lib/nib/clearfix'
.menu
  background white
  color $text100
  clearfix()
.menu-item
  float left
  padding 10px 20px
  cursor default
  user-select none
  line-height 16px
  &:hover
    background lighten($primary-color-highlight, 95%)
  &._active
    background $menu-color-highlight
    color $text100
  &._right
    float right
.menu-message
  color #999999
  font-size 0.75em
  &:hover
    background transparent
.menu-item-dropdown
  float left
  color inherit
</style>
