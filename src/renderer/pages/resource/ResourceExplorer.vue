<template>
  <div class="resource-explorer">
    <div class="resource-error" v-if="!files">
      <div class="resource-error-title">Some Error Occurred</div>
      <div class="resource-error-reason">{{error}}</div>
    </div>
    <ul class="resource-list" v-else>
      <template v-if="isInSubFolder">
        <!-- return parent folder. fileAction(file:file={name:string,path:stirng,type:string...}) -->
        <li class="resource-file file-return" @click="fileAction({name:'..',type:DIR_TYPE})">
          <img class="file-preview file-folder" src="static/icon/resource/return.svg" alt="">
          <span class="file-text">..(return)</span>
        </li>
      </template>
      <li class="resource-file" draggable="true" :key="index" v-for="(file,index) in files" :class="{'resource-file_highlight': isHighlight(file)}"
        @click="highlight = file" @dblclick="fileAction(file)" @contextmenu="e => fileMenu(e, file)"
        @dragstart="dragStart($event, file)">
        <template>
          <img v-if="file.type === DIR_TYPE" class="file-preview file-folder" src="static/icon/resource/folder.svg"
            alt="">
          <img v-else-if="file.type === MUSIC_TYPE" class="file-preview file-music" @mouseenter="file.icon=AUDIO_IMAGE_PLAY"
            @mouseleave="file.icon=AUDIO_IMAGE_DEFAULT;$refs.audio.load()" @click="playAudio(file)"
            :src="file.icon">
          <img v-else-if="file.type === IMAGE_TYPE" class="file-preview file-image" :src="file.url + '?' + Date.now()">
          <video v-else-if="file.type === VIDEO_TYPE" class="file-preview file-video" :src="file.url"></video>
          <img v-else-if="THREED_TYPE.includes(file.type)" class="file-preview file-threed" :src="csvIcon(file)"
            @contextmenu.capture="menu3d($event,file)">
          <img v-else class="file-preview file-image" src="static/icon/resource/unknow.svg">
        </template>
        <span class="file-text">{{file.name}}</span>
      </li>
      <div v-if="!files.length" class="drop-files-here">
        <i class="fa fa-download"></i>
        <p>{{resourceText('dropFileHere')}}</p>
      </div>
    </ul>
    <audio ref="audio" style="display:none;"></audio>
  </div>
</template>

<script>
  import fs from 'fs-extra'
  import path from 'path'
  import { fileType, isFunction } from 'lib/utils'
  import { Lever } from 'vue-lever'
  import url from 'url'
  import { FileHandleGroup, StageGroup } from 'lib/menu-group'
import { clone, flatten } from 'ramda'
import { remove } from 'lodash'

import {
  CB_FORMAT_FILE,
  RENAME_FILE,
  RENAME_FILE_COMPLETED,
  EV_CANVAS_REFRESH,
  ILEGAL_NAME,
  RESOURCE_DELETE_FILE,
  REFRESH_RESOURCE,
} from 'type/constants'
import { findFiles, isThreeDImage, getFile, isMpcImage } from 'lib/project'

  import { openFileSelectDialog } from 'lib/electron'

  import { mapState, mapGetters, mapMutations } from 'vuex'

  const DIR_TYPE = 'dir'
  const IMAGE_TYPE = 'image'
  const VIDEO_TYPE = 'video'
  const MUSIC_TYPE = 'music'
  const THREED_TYPE = ['dae', 'fbx', 'obj']
  const FILE_TYPE = ''

  const AUDIO_IMAGE_PLAY = 'static/icon/resource/play_t.svg'
  const AUDIO_IMAGE_STOP = 'static/icon/resource/stop.svg'
  const AUDIO_IMAGE_DEFAULT = 'static/icon/resource/music.svg'

  function filterFiles(files, filter) {
    if (isFunction(filter)) {
      return files.filter(filter)
    } else if (typeof filter === 'string') {
      return files.filter(file => file.type === filter)
    } else return files
  }

  export default {
    name: 'IResourceExplorer',
    props: {
      path: {
        type: String,
        required: true,
      },
      // default highlight file,expect a Object like this.highlight. {path:String,...}
      defaultFile: {
        type: Object,
      },
      recursion: {
        type: Boolean,
        default: false,
      },
      filter: [Function, String],
      drag: Function,
      allowAction: {
        type: Boolean,
        default: true,
      },
      autoRefresh: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        files: [],
        highlight: null,
        error: '',
        DIR_TYPE,
        IMAGE_TYPE,
        VIDEO_TYPE,
        MUSIC_TYPE,
        THREED_TYPE,
        FILE_TYPE,
        AUDIO_IMAGE_PLAY,
        AUDIO_IMAGE_STOP,
        AUDIO_IMAGE_DEFAULT,
        musicImage: AUDIO_IMAGE_DEFAULT,
      }
    },
    watch: {
      path() {
        this.refresh()
      },
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
        protect: state => state.project.protect,
        selectedStage: state => state.project.selectedStage,
        stages: state => state.project.stages,
      }),
      isInSubFolder() {
        const depth =
          this.path.split(path.sep).length -
          this.projectPath.split(path.sep).length -
          2
        return !!depth
      },
      csvIcon() {
        return file => {
          const dir = path.dirname(file.path)
          const basename = path.basename(file.path, path.extname(file.path))
          const csvFilename = basename + '.csv'
          const csvPath = path.join(dir, csvFilename)
          if (fs.existsSync(csvPath)) return 'static/icon/resource/3d_csv.svg??'
          return 'static/icon/resource/3d.svg'
        }
      },
    },
    created() {
      this.autoRefresh && this.refresh()
    },
    methods: {
      ...mapMutations(['afterImageRename']),
      menu3d({ menu }, file) {
        const group = new StageGroup('import', [
          {
            label: 'import CSV File',
            click: () => this.importCsvFile(file),
          },
        ])
        menu.unshift(group)
      },
      async importCsvFile(daeFile) {
        const filePath = await openFileSelectDialog({})
        if (!filePath.toLowerCase().endsWith('.csv')) {
          return
        }
        const file = getFile(filePath)
        let distPath = path.join(
          this.path,
          path.basename(daeFile.name, path.extname(daeFile.name)) + '.csv'
        )
        fs.copySync(file.path, distPath)
        console.log(file)
      },
      @Lever('refresh')
      async refresh() {
        try {
          const files = await findFiles(this.path, this.recursion)
          remove(
            files,
            file =>
              file.type === DIR_TYPE &&
              !ILEGAL_NAME.test(path.basename(file.path))
          )
          this.files = filterFiles(files, this.filter)
        } catch (e) {
          this.error = e.message
          this.files = null
        }
        this.highlight = null
      },
      isHighlight(file) {
        const currentFile = this.highlight || this.defaultFile
        if (!currentFile) return false
        return ~file.path.indexOf(currentFile.path.replace(/(\\|\/)/, path.sep))
      },
      fileAction(file) {
        switch (file.type) {
          case DIR_TYPE:
            this.$emit('path-update', path.join(this.path, file.name))
            this.$emit('enter-folder', file.name)
            break
        }
      },
      fileMenu({ menu }, file) {
        if (this.protect) return
        menu.deleteGroup.onDelete = () => this.deleteFile(file)
        menu.copyPasteGroup.onCopy = () => {
          this.$electron.clipboard.writeBuffer(
            CB_FORMAT_FILE,
            Buffer.from(JSON.stringify(file))
          )
        }

        const group = new FileHandleGroup({
          onRename: this.allowAction ? () => this.renameFile(file) : null,
        })
        menu.push(group)
      },
      renameFile(file) {
        this.$events.emit(RENAME_FILE, file.path)
      },
      deleteFile(file, confirm = true) {
        console.log('delete', file)
        const relativePath = file.path.replace(this.projectPath + path.sep, '')
        const directory = path.dirname(relativePath)
        const name = file.name
        const allSource = flatten(
          this.stages.map(stage =>
            ['bg', 'fg', 'cus']
              .filter(type => stage.parameter[type].units.length)
              .map(type => stage.parameter[type].source)
          )
        )
        const used = allSource.find(
          s => s.directory === directory && s.file == name
        )
        if (used) {
          return this.$message.error('Cannot delete the file.')
        }

        const message = 'Delete file ' + file.name
        const doDelete = async() => {
          // 删除所有用了这个3D文件的图片和json
          if (THREED_TYPE.includes(file.type)) {
            let files = await findFiles(path.dirname(file.path))
            files = files.filter(item => {
              if (item.type !== 'image') return false
              const jsonFilePath = isThreeDImage(item.path)
              if (!jsonFilePath) return false
              const json = fs.readJsonSync(jsonFilePath)
              // 所有3d.json引用了file.name（3d）的json文件都被删除
              if (json.fileName === file.name) return true
            })
            for (const pngFile of files) {
              fs.removeSync(pngFile.path)
              fs.removeSync(jsonFilePath)
            }
          }

          // 删除关联的json
          const mpcJsonPath = isMpcImage(file.path)
          if (mpcJsonPath) {
            fs.removeSync(mpcJsonPath)
          }

          // 删除file
          fs.removeSync(file.path)

          this.$events.emit(REFRESH_RESOURCE)
        }
        if (confirm) {
          this.$confirm(message, 'Delete File').then(doDelete)
        } else {
          doDelete()
        }
      },
      dragStart(e, file) {
        if (isFunction(this.drag)) this.drag(e, file)
      },
      playAudio(file) {
        if (file.icon === AUDIO_IMAGE_PLAY) {
          file.icon = AUDIO_IMAGE_STOP
          this.$refs.audio.src = file.path
          this.$refs.audio.play()
          this.$refs.audio.onended = () => (file.icon = AUDIO_IMAGE_PLAY)
        } else if (file.icon === AUDIO_IMAGE_STOP) {
          this.$refs.audio.load()
          file.icon = AUDIO_IMAGE_PLAY
        }
      },
    },
    events: {
      [RENAME_FILE_COMPLETED]({ fromPath, toPath }) {
        const oldFileName = path.basename(fromPath)
        const newFileName = path.basename(toPath)
        const directory = fromPath
          .replace(this.projectPath + path.sep, '')
          .replace(path.sep + oldFileName, '')
        this.afterImageRename({ oldFileName, newFileName, directory })
        this.refresh()
        this.$events.emit(EV_CANVAS_REFRESH, this.selectedStage)
      },
      [RESOURCE_DELETE_FILE]({ file, confirm }) {
        this.deleteFile(file, confirm)
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .resource-explorer
    full-size()
    overflow hidden
    position relative
  .resource-error
    full-size()
    display flex
    flex-direction column
    justify-content center
    align-items center
    text-align center
  .resource-error-title
    font-size 2em
    color #999
  .resource-error-reason
    font-size 0.75em
    color orangered
    margin-top 20px
  .resource-list
    reset-ul()
    full-size()
    display flex
    overflow auto
    flex-wrap wrap
    &:empty
      &:before
        content 'Empty'
        font-size 2em
        color #999
        margin auto
  .resource-file
    fix-flex()
    width 100px
    border-radius 5px
    padding 5px
    margin 5px
    text-align center
    cursor pointer
    max-height 100px
    overflow hidden
  .file-preview
    height 50px
    vertical-align middle
  .file-text
    display inline-block
    text-align center
    font-size 0.75em
    border-radius 10px
    padding 2px 10px
    word-wrap break-word
    width 100%
    vertical-align middle
  .resource-file_highlight
    background $grey200
    color $primary-color-highlight
  .file-image
    background #eee
  .file-return
    color $text300
    &:hover
      color $text100
  .drop-files-here
    position absolute
    left 0
    right 0
    top 0
    bottom 0
    display flex
    align-items center
    justify-content center
    flex-direction column
    color $text300
    pointer-events none
    i
      font-size 200%
      padding 20px
      border-radius 10px
      border 1px dashed
</style>