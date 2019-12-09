<template>
  <div class="plank">
    <div class="plank-group" v-if="active === 'home'">
      <i-header-menu-button
        icon="plus-square"
        :disabled="showButton('stage')"
        :text="plankHomeText('stage')"
        @click="newStage()"
      ></i-header-menu-button>
      <i-header-menu-button
        icon="male"
        :disabled="showButton('person')"
        :text="plankHomeText('person')"
        @command="item => addImage(...item.arg)"
        :dropdownMenu="dropdownMenu.person"
        @click="addImage('obj')"
      >
      </i-header-menu-button>
      <i-header-menu-button
        icon="| iconfont icon-Functionsvgicon"
        text="Function"
        @command="item => addLoop(...item.arg)"
        :dropdownMenu="dropdownMenu.function"
      >
      </i-header-menu-button>
      <div class="group-separate"></div>
      <i-header-menu-button
        icon="clone"
        :disabled="showButton('board')"
        :text="plankHomeText('board')"
        @click="changeView('board')"
        @command="item => changeView(...item.arg)"
        :dropdownMenu="dropdownMenu.board"
      >
      </i-header-menu-button>
      <i-header-menu-button
        icon="sun-o"
        :text="plankHomeText('map')"
        :disabled="showButton('map')"
        @click="changeView('map')"
        @command="item => changeView(...item.arg)"
        :dropdownMenu="dropdownMenu.map"
      ></i-header-menu-button>
      <div class="group-separate"></div>
      <i-header-menu-button
        icon="mouse-pointer"
        :text="plankHomeText('select')"
        :disabled="showButton('select')"
        :highlight="mode === 'select'"
        @click="changeMode('select')"
        @command="clickSelectMenu"
        :dropdownMenu="dropdownMenu.select"
      ></i-header-menu-button>
      <i-header-menu-button
        icon="crop"
        :text="plankHomeText('crop')"
        :disabled="showButton('crop')"
        :highlight="mode === 'crop'"
        @click="changeMode('crop')"
      ></i-header-menu-button>
      <div class="group-separate"></div>

      <!-- <i-header-menu-button icon="search"
        text="21%"></i-header-menu-button> -->
      <i-header-menu-button
        icon="search-plus"
        :text="plankHomeText('zoomIn')"
        :disabled="showButton('zoomIn')"
        @click="$events.emit(EV_CANVAS_CHANGE_ZOOM, zoom + 0.5)"
      >
      </i-header-menu-button>
      <i-header-menu-button
        icon="search-minus"
        :text="plankHomeText('zoomOut')"
        :disabled="showButton('zoomOut')"
        @click="$events.emit(EV_CANVAS_CHANGE_ZOOM, zoom - 0.5)"
      >
      </i-header-menu-button>
      <i-header-menu-button
        icon="arrows-alt"
        :text="plankHomeText('fit')"
        :disabled="showButton('fitToScreen')"
        @click="$events.emit(EV_CANVAS_FIT)"
      >
      </i-header-menu-button>
      <i-header-menu-button
        icon="hand-rock-o"
        :text="plankHomeText('hold')"
        :disabled="showButton('hold')"
        :highlight="mode === 'hold'"
        @click="changeMode('hold')"
      >
      </i-header-menu-button>
      <div class="group-separate"></div>

      <i-header-menu-button
        icon="check-circle-o"
        :text="plankHomeText('check')"
        :disabled="showButton('check')"
        @click="doCheck"
      ></i-header-menu-button>
      <i-header-menu-button
        icon="folder-open-o"
        :text="plankHomeText('project')"
        @click="showProjectFolder"
        :disabled="!projectExist"
      ></i-header-menu-button>
      <!-- <i-header-menu-button icon="share-square-o"
        :text="plankHomeText('export')"
        @click="exportProject"
        :disabled="!projectExist"></i-header-menu-button> -->
      <i-header-menu-button
        icon="share-square-o"
        :disabled="showButton('export')"
        :text="plankHomeText('export')"
        @click="exportProject"
        @command="item => exports(...item.arg)"
        :dropdownMenu="dropdownMenu.exports"
      ></i-header-menu-button>
      <div class="group-separate"></div>

      <i-header-menu-button icon="cog" :text="plankHomeText('setting')" @click="settingDialog"> </i-header-menu-button>
      <i-header-menu-button
        icon="lock"
        v-if="!protect"
        :text="plankHomeText('protect')"
        :disabled="showButton('protect')"
        @click="protectDialog"
      ></i-header-menu-button>
      <i-header-menu-button
        icon="unlock-alt"
        v-else
        :text="plankHomeText('unprotect')"
        :disabled="showButton('unprotect')"
        @click="unprotect"
      ></i-header-menu-button>
      <!-- <i-header-menu-button icon="desktop"
        :text="plankHomeText('arRun')"
        @click="runAR"
        :disabled="!projectExist && backendScriptValid"></i-header-menu-button> -->
      <!-- <i-header-menu-button icon="play"
        :text="plankHomeText('play')"
        @click="playAR"
        :disabled="!projectExist && playScriptValid"></i-header-menu-button> -->
      <div class="group-separate"></div>

      <i-header-menu-button
        icon="reply"
        :text="plankHomeText('undo')"
        :disabled="!stage.history.undo"
        @click="historyUndo(stage)"
      ></i-header-menu-button>
      <i-header-menu-button
        icon="share"
        :text="plankHomeText('redo')"
        :disabled="!stage.history.redo"
        @click="historyRedo(stage)"
      ></i-header-menu-button>

      <div class="group-separate"></div>
      <i-header-menu-button
        icon="bug"
        :text="plankHomeText('debug')"
        @click="toggleDebug"
        :class="{ 'bug-active': debug.enabled }"
      ></i-header-menu-button>
      <i-header-menu-button
        icon="th-large"
        :text="plankHomeText('tool box')"
        @command="item => openTool(...item.arg)"
        :dropdownMenu="dropdownMenu.toolBox"
        trigger="click"
      >
      </i-header-menu-button>
      <div class="group-separate"></div>
      <i-header-menu-button
        icon="question"
        :text="plankHomeText('help')"
        @command="item => openHelp(...item.arg)"
        :dropdownMenu="dropdownMenu.help"
        trigger="click"
      >
      </i-header-menu-button>
    </div>

    <div class="plank-group" v-if="active === 'element'">
      <div class="group">
        <!--<div class="group-title">Element</div>-->
        <i-header-parameter-square type="bg" @right="addImage('bg')"></i-header-parameter-square>
        <i-header-parameter-square type="fg" @right="addImage('fg')"></i-header-parameter-square>
        <i-header-parameter-square type="cus" @right="addImage('cus')"></i-header-parameter-square>
        <i-header-parameter-square
          type="obj"
          leftIcon="address-book-o"
          rightIcon="user"
          :chooseable="false"
          @right="addImage('obj')"
          @left="addImage('obj', 'head')"
        >
        </i-header-parameter-square>
      </div>
      <div class="group-separate"></div>
      <div class="group">
        <!--<div class="group-title">Mode</div>-->
        <i-header-menu-button
          icon="mouse-pointer"
          text="Select"
          :mark="mode === 'select'"
          @click="changeMode('select')"
        ></i-header-menu-button>
        <i-header-menu-button
          icon="crop"
          text="Crop"
          :mark="mode === 'crop'"
          @click="changeMode('crop')"
        ></i-header-menu-button>
      </div>
      <div class="group-separate"></div>
      <i-header-menu-button icon="refresh" text="Change Select" @click="changeSelect"> </i-header-menu-button>
      <div class="group-separate"></div>
      <div class="group">
        <!--<div class="group-title">History</div>-->
        <i-header-menu-button
          icon="reply"
          text="Undo"
          :disabled="!stage.history.undo"
          @click="historyUndo(stage)"
        ></i-header-menu-button>
        <i-header-menu-button
          icon="share"
          text="Redo"
          :disabled="!stage.history.redo"
          @click="historyRedo(stage)"
        ></i-header-menu-button>
      </div>
    </div>

    <div class="plank-group" v-if="active === 'instruction'">
      <i-header-instruction-square
        :title="plankInstructionText('image')"
        type="image"
        @click="openAddInstruction('image')"
      ></i-header-instruction-square>
      <i-header-instruction-square
        :title="plankInstructionText('text')"
        type="text"
        @click="openAddInstruction('text')"
      ></i-header-instruction-square>
      <i-header-instruction-square
        :title="plankInstructionText('music')"
        type="music"
        @click="openAddInstruction('music')"
      ></i-header-instruction-square>
      <i-header-instruction-square
        :title="plankInstructionText('photo')"
        type="photo"
        @click="openAddInstruction('photo')"
      ></i-header-instruction-square>
      <i-header-instruction-square
        :title="plankInstructionText('video')"
        type="video"
        @click="openAddInstruction('video')"
      ></i-header-instruction-square>
      <i-header-instruction-square
        :title="plankInstructionText('command')"
        type="command"
        @click="openAddInstruction('command')"
      ></i-header-instruction-square>
      <i-header-instruction-square
        :title="plankInstructionText('goody')"
        type="goody"
        @click="openAddInstruction('goody')"
      ></i-header-instruction-square>
      <!-- <div class="group-separate"></div>
      <i-header-menu-button icon="caret-square-o-down" text="Generate" @click="generateInstruction"></i-header-menu-button>
      <i-header-menu-button icon="caret-square-o-down" text="Generate All" @click="generateAllInstruction"></i-header-menu-button> -->
    </div>
    <div class="introjs-hints-model" v-if="help">
      <div class="close" @click="openHelp('help')">Close Help</div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters, mapActions } from 'vuex'
import { path as rPath, clone } from 'ramda'
import path from 'path'
import { MountComponents } from 'lib/utils'
import {
  EV_DIALOG_OPEN,
  DIALOG_IMPORT_IMAGE,
  DIALOG_ERROR,
  DIALOG_INSTRUCTION_EDITOR,
  DIALOG_SETTING,
  EV_CANVAS_CHANGE_SELECT,
  EV_CANVAS_REFRESH,
  EV_CANVAS_FIT,
  EV_CANVAS_CHANGE_ZOOM,
  AC_SHOW_PROJECT_FOLDER,
  AC_PROJECT_EXPORT,
  AC_PROJECT_SAVE,
  AC_AR_RUN,
  AC_AR_PLAY,
  BOARD_BOARD,
  BOARD_PERSON,
  BOARD_HALF_PERSON,
  BOARD_TABLE,
  BOARD_PARAMETER,
  BOARD_PREVIEW,
  BOARD_MAP,
  BOARD_LMAP,
  BOARD_SELECT,
  BOARD_CHANGE_SELECT,
  BOARD_PERSON_CHANGE,
  BOARD_EXPORT,
  BOARD_EXPORT_TO_MANAGER,
  DIALOG_SELECT_IMAGES,
  DIALOG_EXPORT,
  DIALOG_PROTECT,
  DIALOG_RECORD_AUDIO,
  DIALOG_LOOP,
  DIALOG_COMBINE_MULTIPLE_PICTURES
} from 'type/constants'
import { defaultInstruction } from 'type/stage'
import { camelCase } from 'lodash'
import { spawn } from 'child_process'
import { DB, exportToDB, getProjectInfo } from 'lib/sqlite'
import fs from 'fs-extra'

import intro from 'intro.js'
import { remote } from 'electron'
import { createHDFormat, convertVideo, findFiles } from 'lib/project'

import Button from 'components/header/MenuButton.vue'
import ParameterSquare from 'components/header/ParameterSquare.vue'
import InstructionSquare from 'components/header/InstructionSquare.vue'
const AUTODRAW = 'autodraw'
const MICRO_PAINT = 'microPaint'
const RECORD_AUDIO = 'recordAudio'
const CREATOR_WEBSITE = 'creatorWebsite'
const I_DESIGNER = 'iDesigner'
const I_DOWNLOAD = 'iDownload'
const I_PIC = 'iPic'
const CREATE_HALF_HD_PROJECT = 'createHalfHDFormat'
const CNVERT_QHD_VIDEO = 'Convert qHD Video'
const CNVERT_NHD_VIDEO = 'Convert nHD Video'
const COMBINE_MULTIPLE_PICTURES = 'Combine multiple pictures'

export default {
  name: 'IHeaderPlank',
  data() {
    this.initDropdown()
    return {
      EV_CANVAS_FIT,
      EV_CANVAS_CHANGE_ZOOM,
      help: false
    }
  },
  components: MountComponents(Button, ParameterSquare, InstructionSquare),

  computed: {
    ...mapState({
      active: rPath(['header', 'active']),
      stage: rPath(['project', 'selectedStage']),
      mode: rPath(['board', 'mode']),
      view: rPath(['board', 'view']),
      zoom: rPath(['board', 'zoom']),
      language: rPath(['setting', 'language']),
      projectPath: rPath(['project', 'projectPath']),
      password: rPath(['project', 'password']),
      protect: rPath(['project', 'protect']),
      domain: rPath(['configuration', 'domain']),
      debug: rPath(['project', 'debug'])
    }),
    ...mapGetters(['projectExist', 'backendScriptValid', 'playScriptValid'])
  },
  watch: {
    language() {
      this.initDropdown()
    }
  },
  methods: {
    ...mapMutations([
      'newStage',
      'updateStageSource',
      'addStageParameterUnit',
      'updateStageParameterUnit',
      'changeMode',
      'changeView',
      'changeZoom',
      'historyRedo',
      'historyUndo',
      'addInstruction',
      'autoGenerateInstruction',
      'autoGenerateAllInstruction',
      'changeObjImage',
      'updateProtect',
      'toggleDebug'
    ]),
    ...mapActions(['comparePassword', 'openProject']),
    initDropdown() {
      const plankHomeText = t => this.$t('header.plank.home.' + camelCase(t))
      const dropdownMenu = {
        person: [
          {
            text: plankHomeText(BOARD_PERSON),
            icon: 'male',
            arg: ['obj'],
            disabled: false
          },
          {
            text: plankHomeText(BOARD_HALF_PERSON),
            icon: 'user',
            arg: ['obj', 'head']
          },
          {
            text: plankHomeText(BOARD_PERSON_CHANGE),
            icon: 'cog',
            arg: [BOARD_PERSON_CHANGE]
          }
        ],
        board: [
          {
            text: plankHomeText(BOARD_BOARD),
            icon: 'clone',
            arg: [BOARD_BOARD]
          },
          {
            text: plankHomeText(BOARD_TABLE),
            icon: 'table',
            arg: [BOARD_TABLE]
          },
          {
            text: plankHomeText(BOARD_PARAMETER),
            icon: 'table',
            divided: true,
            arg: [BOARD_PARAMETER]
          },
          {
            text: plankHomeText(BOARD_PREVIEW),
            icon: 'window-maximize',
            arg: [BOARD_PREVIEW]
          }
        ],
        map: [
          {
            text: plankHomeText(BOARD_MAP),
            icon: 'sun-o',
            arg: [BOARD_MAP]
          },
          {
            text: plankHomeText(BOARD_LMAP),
            icon: '',
            arg: [BOARD_LMAP]
          }
        ],
        select: [
          {
            text: plankHomeText(BOARD_SELECT),
            icon: 'mouse-pointer',
            arg: [BOARD_SELECT]
          },
          {
            text: plankHomeText(BOARD_CHANGE_SELECT),
            icon: 'refresh',
            arg: [BOARD_CHANGE_SELECT]
          }
        ],
        exports: [
          {
            text: plankHomeText(BOARD_EXPORT),
            icon: '',
            arg: [BOARD_EXPORT]
          },
          {
            text: plankHomeText(BOARD_EXPORT_TO_MANAGER),
            icon: '',
            arg: [BOARD_EXPORT_TO_MANAGER]
          }
        ],
        toolBox: [
          {
            text: plankHomeText(CREATOR_WEBSITE),
            icon: '',
            arg: [CREATOR_WEBSITE]
          },
          {
            text: plankHomeText(I_DESIGNER),
            icon: '',
            arg: [I_DESIGNER]
          },
          {
            text: plankHomeText(RECORD_AUDIO),
            icon: '',
            arg: [RECORD_AUDIO]
          },
          {
            text: plankHomeText(MICRO_PAINT),
            icon: '',
            arg: [MICRO_PAINT]
          },
          {
            text: plankHomeText(AUTODRAW),
            icon: '',
            arg: [AUTODRAW]
          },
          {
            text: plankHomeText(CREATE_HALF_HD_PROJECT),
            icon: '',
            arg: [CREATE_HALF_HD_PROJECT]
          },
          {
            text: plankHomeText(CNVERT_QHD_VIDEO),
            icon: '',
            arg: [CNVERT_QHD_VIDEO]
          },
          {
            text: plankHomeText(CNVERT_NHD_VIDEO),
            icon: '',
            arg: [CNVERT_NHD_VIDEO]
          },
          {
            text: plankHomeText(COMBINE_MULTIPLE_PICTURES),
            icon: '',
            arg: [COMBINE_MULTIPLE_PICTURES]
          },
          {
            text: plankHomeText(I_DOWNLOAD),
            icon: '',
            arg: [I_DOWNLOAD]
          },
          {
            text: plankHomeText(I_PIC),
            icon: '',
            arg: [I_PIC]
          }
        ],
        help: [
          {
            text: plankHomeText('help'),
            icon: '',
            arg: ['help']
          },
          {
            text: plankHomeText('question'),
            icon: '',
            arg: ['question']
          }
        ],
        function: [
          {
            text: plankHomeText('loop'),
            icon: 'repeat',
            arg: ['loop'],
            disabled: false
          },
          {
            text: plankHomeText('continue'),
            icon: 'angle-double-right',
            arg: ['continue']
          },
          {
            text: plankHomeText('break'),
            icon: 'sign-out',
            arg: ['break']
          }
        ]
      }
      this.dropdownMenu = dropdownMenu
    },
    showButton(buttonName) {
      const disabled = [
        'person',
        'select',
        'crop',
        'zoomIn',
        'zoomOut',
        'fitToScreen',
        'hold',
        'export'
        // 'protect',
        // 'unprotect'
      ]
      const map = ['person', 'stage', 'fitToScreen', 'crop']
      const projectExist = this.projectExist
      if ([this.view === BOARD_TABLE] && disabled.includes(buttonName) && !projectExist) {
        return true
      }
      if (this.view === BOARD_PARAMETER && disabled.includes(buttonName)) {
        return true
      }
      if (this.view === BOARD_PREVIEW && disabled.includes(buttonName)) {
        return true
      }
      if (this.view === BOARD_MAP && map.includes(buttonName)) return true
      return false
    },
    clickSelectMenu(item) {
      const select = this.dropdownMenu.select
      switch (item) {
        case select[0]:
          return this.changeMode(...item.arg)
        case select[1]:
          return this.changeSelect()
      }
    },
    generateInstruction() {
      let promise = Promise.resolve()
      if (this.stage.instruction.length) {
        promise = this.$confirm('Are you want to overwrite instruction you created for this stage?', 'Warning', {
          type: 'warning'
        })
      }
      promise.then(() => {
        this.autoGenerateInstruction(this.stage)
      })
    },
    generateAllInstruction() {
      this.$confirm('Are you want to overwrite all instruction for all stages?', 'Warning', {
        type: 'warning'
      }).then(() => {
        this.autoGenerateAllInstruction()
      })
    },
    ensureProjectExist() {
      if (this.projectExist) {
        return true
      }
      const title = this.instructionDialogText('error')
      const errMsg = this.instructionDialogText('pleaseSaveProjectFirst')
      this.$alert(errMsg, title, { type: 'error' }).then(() => {
        this.$events.emit(AC_PROJECT_SAVE)
      })
      return false
    },
    chooseImage(type) {
      // abandon
      if (!this.ensureProjectExist()) return
      const source = clone(this.stage.parameter[type].source)
      this.$events.emit(EV_DIALOG_OPEN, {
        type: DIALOG_IMPORT_IMAGE,
        data: source,
        title: this.$store.state.static.label.parameter[type],
        textOK: 'Import',
        confirmed: () => {
          this.updateStageSource({
            stage: this.stage,
            type,
            source
          })
          if (!this.stage.parameter[type].units.length) {
            this.addImage(type)
          }
        }
      })
    },
    addImage(type, option) {
      if (!this.ensureProjectExist()) return
      if (type === BOARD_PERSON_CHANGE) return this.changePersonImage()
      if (!this.stage.parameter[type].source.metadata) {
        return this.$alert('Please select image by Resource panel', 'Error', {
          type: 'error'
        })
      }
      this.addStageParameterUnit({
        stage: this.stage,
        type
      })
      if (type === 'obj' && option === 'head') {
        const index = this.stage.parameter.obj.units.length - 1
        const unit = clone(this.stage.parameter.obj.units[index])
        unit.init.width = unit.change.width = 500
        unit.init.height = unit.change.height = 500
        unit.init.x0 = unit.change.x0 = 710
        this.updateStageParameterUnit({
          stage: this.stage,
          type,
          index,
          status: 'init',
          value: unit.init
        })
        this.updateStageParameterUnit({
          stage: this.stage,
          type,
          index,
          status: 'change',
          value: unit.change
        })
        this.$events.emit(EV_CANVAS_REFRESH, this.stage)
      }
    },
    changePersonImage() {
      const userPath = this.$electron.remote.app.getPath('userData')
      this.$events.emit(EV_DIALOG_OPEN, {
        type: DIALOG_SELECT_IMAGES,
        title: 'change person image',
        data: {
          path: path.join(userPath, 'static/images/people/')
        },
        confirmed: res => {
          const objPath = 'images/obj'
          const dir = path.join(this.projectPath, objPath)
          const file = res.data.src
          fs.removeSync(dir)
          fs.ensureDirSync(dir)
          fs.copySync(path.join(__static, 'template/home/images/obj', file), path.join(this.projectPath, objPath, file))
          this.changeObjImage({ directory: objPath, file: file })
        }
      })
    },
    async openTool(type) {
      const { shell } = this.$electron
      const sysPath = process.env['windir']
      switch (type) {
        case AUTODRAW:
          return shell.openExternal('https://www.autodraw.com/')
        case MICRO_PAINT:
          return shell.openItem(sysPath + '\\system32\\mspaint.exe')
        case RECORD_AUDIO:
          return this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_RECORD_AUDIO,
            title: 'Record audio'
          })
        case CREATOR_WEBSITE:
          return shell.openExternal(`https://creator.integem.com/`)
        case I_DESIGNER:
          return shell.openExternal('https://idesigner.integem.com/')
        case CREATE_HALF_HD_PROJECT:
          this.$loading()
          await createHDFormat(path.join(this.projectPath, 'images'), 'qhd')
          await createHDFormat(path.join(this.projectPath, 'images'), 'nhd')
          this.$loading().close()
          return
        case CNVERT_QHD_VIDEO:
          this.$loading()
          await convertVideo(path.join(this.projectPath, 'images'), 'qhd')
          this.$loading().close()
          break
        case CNVERT_NHD_VIDEO:
          this.$loading()
          await convertVideo(path.join(this.projectPath, 'images'), 'nhd')
          this.$loading().close()
          break
        case COMBINE_MULTIPLE_PICTURES:
          return this.$events.emit(EV_DIALOG_OPEN, {
            type: DIALOG_COMBINE_MULTIPLE_PICTURES,
            title: 'Combine multiple pictures',
            width: '50%'
          })
          break
        case I_DOWNLOAD:
          let id = ''
          console.log(process.platform)
          switch (process.platform) {
            case 'darwin':
              id =
                process.env.NODE_ENV === 'production'
                  ? path.join(__dirname, '../../../../tools/iDownloader/mac-unpacked/iDownloader.app')
                  : path.join(process.cwd(), 'tools/iDownloader/mac-unpacked/iDownloader.app')
              break

            case 'win32':
              id = path.join(process.cwd(), 'tools/iDownloader/win-unpacked/iDownloader.exe')
              break

            case 'linux':
              id = path.join(process.cwd(), 'tools/iDownloader/linux-unpacked/idownloader').replace(/ /g, '\\ ')
              console.log(id, fs.existsSync(id))
              if (!fs.existsSync(id))
                id = path
                  .join(__dirname, '../../../../tools/iDownloader/linux-unpacked/idownloader')
                  .replace(/ /g, '\\ ')
              break
          }
          console.log(id)
          return shell.openItem(id)
          break
        case I_PIC:
          let ip = ''
          console.log(process.platform)
          switch (process.platform) {
            case 'darwin':
              ip =
                process.env.NODE_ENV === 'production'
                  ? path.join(__dirname, '../../../../tools/iPic/mac-unpacked/iPic.app')
                  : path.join(process.cwd(), 'tools/iPic/mac-unpacked/iPic.app')
              break

            case 'win32':
              ip = path.join(process.cwd(), 'tools/iPic/win-unpacked/iPic.exe')
              break

            case 'linux':
              ip = path.join(process.cwd(), 'tools/iPic/linux-unpacked/ipic').replace(/ /g, '\\ ')
              console.log(ip, fs.existsSync(ip))
              if (!fs.existsSync(ip))
                ip = path.join(__dirname, '../../../../tools/iPic/linux-unpacked/ipic').replace(/ /g, '\\ ')
              break
          }
          console.log(ip)
          return shell.openItem(ip)
          break
      }
    },
    changeSelect() {
      this.$events.emit(EV_CANVAS_CHANGE_SELECT)
    },
    exportProject() {
      this.$events.emit(AC_PROJECT_EXPORT)
    },
    exports(type) {
      if (!this.projectExist) return
      if (type === BOARD_EXPORT) this.exportProject()
      if (type === BOARD_EXPORT_TO_MANAGER) this.exportToManager()
    },
    exportToManager() {
      const existThumb = fs.readdirSync(path.join(this.projectPath, 'thumbnail')).length
      if (!existThumb) return this.exportProject()
      new Promise(resolve => {
        if (!DB) {
          this.$message.error('The Integem player does not exsit.')
          return resolve()
        }
        const data = {
          projectName: '',
          description: '',
          thumbnail: '',
          tag: ''
        }
        const defaultInfo = getProjectInfo(this.projectPath)
        if (defaultInfo) {
          data.projectName = defaultInfo.name
          data.description = defaultInfo.description
          data.thumbnail = defaultInfo.thumbnail
          data.tag = JSON.parse(defaultInfo.tag).toString()
        }
        this.$events.emit(EV_DIALOG_OPEN, {
          type: DIALOG_EXPORT,
          data,
          title: 'Export',
          confirmed: resolve
        })
      }).then(result => {
        if (result) {
          const { projectName, thumbnail, description, tag } = result.data
          exportToDB({
            projectName,
            thumbnail,
            description,
            tag,
            projectPath: this.projectPath
          })
          this.$message.success('Exported')
        }
      })
    },
    showProjectFolder() {
      this.$events.emit(AC_SHOW_PROJECT_FOLDER)
    },
    doCheck() {
      this.$events.emit(EV_DIALOG_OPEN, {
        type: DIALOG_ERROR,
        title: 'Error',
        textCancel: 'Close',
        textOK: 'Check'
      })
    },
    openAddInstruction(type) {
      if (!this.ensureProjectExist()) return
      const data = clone(defaultInstruction[type])
      const title = do {
        if (type === 'photo') 'Take ' + type
        else if (type === 'video') 'Record ' + type
        else 'Add ' + type
        if (type === 'photo') 'Take ' + type
        else if (type === 'video') 'Record ' + type
        else 'Add ' + type
      }
      this.$events.emit(EV_DIALOG_OPEN, {
        type: DIALOG_INSTRUCTION_EDITOR,
        title,
        textOk: 'Add',
        data,
        confirmed: ({ data }) => {
          this.addInstruction({
            stage: this.stage,
            instruct: data
          })
        }
      })
    },
    settingDialog() {
      this.$events.emit(EV_DIALOG_OPEN, {
        type: DIALOG_SETTING,
        title: 'setting'
      })
    },
    protectDialog() {
      const open = () =>
        this.$events.emit(EV_DIALOG_OPEN, {
          type: DIALOG_PROTECT,
          title: 'protect'
        })
      const option = { inputType: 'password' }
      if (!this.password) return open()
      this.$prompt('Input project password', 'Protect', option)
        .then(({ value }) => this.comparePassword(value))
        .then(equal => {
          if (!equal) return this.$message.error('Password invalid')
          open()
        })
    },
    unprotect() {
      const option = { inputType: 'password' }
      if (!this.password) return this.updateProtect(false)
      this.$prompt('Input project password', 'Protect', option)
        .then(({ value }) => this.comparePassword(value))
        .then(equal => {
          if (!equal) return this.$message.error('Password invalid')
          return this.updateProtect(false)
        })
    },
    openHelp(type) {
      if (type === 'question') {
        remote.shell.openExternal('https://integem.com/help')
        return
      }
      if (this.help) {
        this.help.hideHints()
        this.help = null
        return
      }
      this.help = intro()
      this.help.setOptions({
        hints: [
          {
            element: document.querySelector('.menu-file'),
            hint: `File
                                            <b>Create project</b> - <span>create a new project</span>
                                            <b>Open project</b> - <span>open existing project</span>
                                            <b>import project</b> - <span>import existing project</span>
                                            <b>Save</b> - <span>save the current project</span>
                                            <b>Save as</b> - <span>save the current project as another project</span>
                                            <b>Export</b> - <span>export existing project</span>
                                            <b>About</b> - <span>about iCreator's version</span>
                                            `
          },
          {
            element: document.querySelector('.menu-account'),
            hint: `Account
                                            <b>Upload</b> - <span>upload iCreator project</span>
                                            <b>My project</b> - <span>browse me existing project</span>
                                            <b>Logout</b> - <span>exit current account</span>
                                            `
          },
          {
            element: document.querySelector('.menu-home'),
            hint: `Home
                                            <b>Stage</b> - <span>add new stage</span>
                                            <b>Person</b> - <span>add full-body person, half person or change person avatart</span>
                                            <b>Board</b> - <span>exit current account</span>
                                            <b>Map</b> - <span>open stage map</span>
                                            <b>Select</b> - <span>select/change select</span>
                                            <b>Crop</b> - <span>crop image</span>
                                            <b>Zoom in</b> - <span>Camera zoom in</span>
                                            <b>Zoom out</b> - <span>camera zoom out</span>
                                            <b>Fit to screen</b> - <span>fit to existing screen</span>
                                            <b>Hold</b> - <span>an act or manner of grasping something</span>
                                            <b>Check</b> - <span>check the error of existing stages</span>
                                            <b>Protect</b> - <span>protect with password</span>
                                            <b>Export</b> - <span>export existing projects to iPlayer</span>
                                            <b>Undo</b> - <span>undo action</span>
                                            <b>Redo</b> - <span>Redo action</span>
                                            `
          },
          {
            element: document.querySelector('.menu-instruction'),
            hint: `Function
                                            <b>Action</b> - <span>Add action</span>
                                            <b>Text</b> - <span>Add text</span>
                                            <b>Audio</b> - <span>Add audio</span>
                                            <b>Phtograph</b> - <span>Take photo</span>
                                            <b>Record</b> - <span>Rcord video</span>
                                            <b>Command</b> - <span>Add command</span>
                                            `
          },
          {
            element: document.querySelector('.menu-view-images'),
            hint: `Open iamges folder`
          },
          {
            element: document.querySelector('.parameter-select'),
            hint: `Parameters
                                            <b>BG</b> - <span>Background</span>
                                            <b>FG</b> - <span>foreground</span>
                                            <b>CUS</b> - <span>Custom image</span>
                                            <b>OBJ</b> - <span>Object</span>
                                            `
          },
          {
            element: document.querySelector('.resource-container'),
            hint: `Resource
                                            <b>Element</b> - <span>Drag and drop BG,FG,CUS images into Element area</span>
                                            <b>Introduction</b> - <span>Drag and drop music into instruction area</span>
                                            `
          },
          {
            element: document.querySelector('.state-action'),
            hint: `Add Tction`
          },
          {
            element: document.querySelector('.state-transition-add'),
            hint: `Add Transition`
          }
        ]
      })
      this.help.showHints()
    },
    /** 打开loop功能弹出框 **/
    addLoop(type) {
      this.$events.emit(EV_DIALOG_OPEN, {
        type: DIALOG_LOOP,
        title: `Add ${type}`,
        data: {
          type
        }
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.plank
  height $header-plank-height
  background $main-header-background
  box-shadow inset 0 3px 20px $menu-color-highlight
  padding 0 10px
.plank-group
  display flex
  flex-direction row
  align-items center
  height 100%
  overflow auto
  > *
    flex-shrink 0
.group-separate
  width 1px
  height 30%
  // background #D3D4D5
  margin 0 5px
.group-title
  position absolute
  bottom 5px
  left 0
  right 0
  text-align center
  color #999999
  font-size 0.7em
  letter-spacing 0.5em
  font-weight bold
  cursor default
.header-menu-button-active
  color $primary-color-highlight
.introjs-hints-model
  content ''
  position fixed
  left 0
  top 0
  width 100vw
  background rgba(0, 0, 0, 0.5)
  height 100vh
  z-index 10
  .close
    position absolute
    width 100px
    height 50px
    line-height 50px
    font-weight bold
    border-radius 5px
    text-align center
    right 0
    left 0
    bottom 40px
    margin auto
    color rgba(200, 60, 60, 0.8)
    border 2px solid rgba(200, 60, 60, 0.8)
    cursor pointer
    background transparentify(white, 0.5)
    &:hover
      background transparentify(white, 0.3)
.bug-active
  background $red
</style>
