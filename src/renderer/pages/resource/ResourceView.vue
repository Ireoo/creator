<template>
  <div class="resource-container">
    <el-radio-group size="small" class="parameter-select resorce-select" v-model="currentCate"
      @change="changeType($event.toLowerCase())">
      <el-radio-button v-for="(cate,i) in category" :label="cate" :key="i">
        {{resourceText(cate)}}
      </el-radio-button>
    </el-radio-group>
    <el-radio-group size="small" class="parameter-select resorce-select" v-model="folderCate">
      <el-radio-button :key="index" v-for="(fd,index) in folders" :label="fd.label" @click.native="chooseFolder(fd)">{{resourceText(fd.label)}}</el-radio-button>
    </el-radio-group>
    <div class="resource-body">
      <div class="resource-right">
        <small class="resource-path">
          {{explorerPath.split(projectPath)[1]}}
        </small>
        <i-resource-explorer ref="explorer" class="resource-explorer" :path="explorerPath"
          @enter-folder="folder => dirs.push(folder)" :filter="fileFilter" :drag="dragStart"
          :allow-action="folder.name !== 'sysimg'" :auto-refresh="false" @dragover.native="dragOver"
          @drop.native="drop" @contextmenu.native="onMenu"></i-resource-explorer>
      </div>
    </div>
  </div>
</template>

<script>
  import { MountComponents, fileType, compressImage } from 'lib/utils'
  import { mapState, mapGetters } from 'vuex'
  import path from 'path'
  import DragPayload from 'lib/drag-payload'
  import fs from 'fs-extra'
  import { writeFileSync } from 'fs'
  import {
    getFile,
    isThreeDImage,
    copyElementAsset,
    fixFile,
    fixDae,
    findFiles,
    pathExist,
  } from 'lib/project'

  import {
    CB_FORMAT_FILE,
    EV_LOADING_OPEN,
    EV_LOADING_CLOSE,
    MEDIA_MAX_WIDTH,
    MEDIA_MAX_HEIGHT,
    REFRESH_RESOURCE,
    ILEGAL_NAME,
  } from 'type/constants'

  import ResourceStatic from '@/static/resource'
  import ResourceExplorer from './ResourceExplorer.vue'
  import { settings } from 'cluster'
  import Jimp from 'jimp'

  export default {
    name: 'IResourceView',
    components: MountComponents(ResourceExplorer),
    data() {
      const folder = ResourceStatic.buildInFolders.element[0]
      const category = ResourceStatic.category
      return {
        type: 'element',
        folder: folder,
        path: '',
        dirs: [],
        fileFilter(file) {
          if (isThreeDImage(file.path)) return false
          if (['csv', 'json'].includes(file.type)) return false
          return !!file.type
        },
        category,
        currentCate: category[0],
        folderCate: folder.label,
      }
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
      }),
      ...mapGetters(['projectExist']),
      isElement() {
        return this.type === 'element'
      },
      isInstruction() {
        return this.type === 'instruction'
      },
      folders() {
        return ResourceStatic.buildInFolders[this.type]
      },
      explorerPath() {
        if (this.isElement) {
          return path.join(
            this.projectPath,
            'images',
            this.folder.name,
            ...this.dirs
          )
        } else {
          return path.join(
            this.projectPath,
            'instruction',
            this.folder.name,
            ...this.dirs
          )
        }
      },
    },
    watch: {
      projectPath() {
        if (this.projectExist) this.initFolder()
      },
    },
    methods: {
      changeType(type) {
        if (this.type === type) return
        this.type = type
        this.folder = this.folders[0]
        this.dirs = []
      },
      chooseFolder(folder) {
        if (this.folder === folder) return
        this.folder = folder
        this.dirs = []
      },
      // drag file from resource to board
      dragStart(e, file) {
        const data = e.dataTransfer
        const payload = new DragPayload('element-resource')
        payload.data = {
          ...file,
          parameter: this.folder.name,
        }
        payload.setToDataTransfer(data)
      },
      async initFolder() {
        for (const folder of ResourceStatic.buildInFolders.element) {
          await fs.ensureDir(path.join(this.projectPath, 'images', folder.name))
        }

        for (const folder of ResourceStatic.buildInFolders.instruction) {
          await fs.ensureDir(
            path.join(this.projectPath, 'instruction', folder.name)
          )
        }

        await this.$refs.explorer.refresh()
      },
      async importFile(file) {
        console.log(file)
        // file is dom object
        const type = file.type
        if (
          !type ||
          (this.folder.type === 'music' && type !== 'music') ||
          (this.folder.type === 'image' &&
            !['image', 'video', 'dae', 'fbx', 'obj', 'mtl'].includes(type))
        ) {
          return `unsupport type`
        }

        if (file.path.toLowerCase().indexOf('local\\temp\\') !== -1) {
          return `Image files are inside a zip file. Please unzip the file first.`
        }

        // 文件名检测、压缩之类的活儿
        file = await fixFile(file)

        // dae会生成同名png，先检查是否已存在同名png，存在则提示
        const pngPath = path.join(
          path.dirname(file.path),
          path.basename(file.path, path.extname(file.path)) + '.png'
        )

        if (fs.existsSync(pngPath) && isThreeDImage(pngPath)) {
          const { value } = await this.$prompt(
            'Please input new file name',
            'Rename',
            {
              inputValue: file.name,
              inputPattern: ILEGAL_NAME,
              inputErrorMessage: `The name ${file.name} has been used`,
              inputValidator: newName => {
                if (pathExist(newName, this.explorerPath)) {
                  return `Same 2D-image filename has already existed for this 3D file. Please change 3D filename.`
                }
                const ext = path.extname(file.name)
                if (!newName.endsWith(ext)) {
                  return `Cannot change "${ext}" extension`
                }
              },
            }
          )
          file.name = value
        }
        let distPath = path.join(this.explorerPath, file.name)

        if (fs.pathExistsSync(distPath)) {
          return `has been existed`
        }

        if (type === 'video') {
          const video = document.createElement('video')
          video.setAttribute('src', file.path)
          video.style.display = 'none'
          document.body.appendChild(video)
          return await new Promise(resolve => {
            setTimeout(() => {
              const { videoWidth, videoHeight } = video
              if (
                videoWidth > MEDIA_MAX_WIDTH ||
                videoHeight > MEDIA_MAX_HEIGHT
              ) {
                resolve('over size limit')
              } else {
                fs.copySync(file.path, distPath)
                resolve(true)
              }
              video.parentElement.removeChild(video)
            }, 1000)
          })
        }
        if (type === 'dae') {
          fixDae(file.path)
        }

        console.log(file, distPath)
        fs.copySync(file.path, distPath)

        return true
      },
      // drag file from local disk to resource
      dragOver(e) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      },
      async drop(e) {
        e.preventDefault()
        const files = e.dataTransfer.files
        const failedFiles = []
        const successFiles = []
        for (const file of files) {
          const result = await this.importFile(getFile(file.path))
          if (result !== true) {
            failedFiles.push(`${file.name} ${result}`)
          } else {
            successFiles.push(`${file.name}`)
          }
        }

        if (!failedFiles.length && successFiles.length) {
          this.$message.success(
            `${successFiles.length} file${
              successFiles.length > 1 ? 's' : ''
            } imported`
          )
        } else if (failedFiles.length) {
          this.$alert(`Failed import: ${failedFiles.join(', ')}`, 'Error', {
            type: 'error',
          })
        }

        this.$refs.explorer.refresh()
      },
      onMenu({ menu }) {
        const hasImage = this.$electron.clipboard
          .availableFormats()
          .join()
          .includes('image')
        if (hasImage) {
          menu.copyPasteGroup.onPaste = this.pasteImageFromClipboard
        } else {
          menu.copyPasteGroup.onPaste =
            this.$electron.clipboard.has(CB_FORMAT_FILE) && this.pasteFile
        }
      },
      pasteImageFromClipboard() {
        const data = this.$electron.clipboard.readImage()
        const image = data.toPng()
        writeFileSync(this.explorerPath, image)
        compressImage(distPath).then(this.$refs.explorer.refresh)
      },
      async pasteFile() {
        try {
          const file = JSON.parse(
            this.$electron.clipboard.readBuffer(CB_FORMAT_FILE)
          )
          copyElementAsset(file.path)
          this.$refs.explorer.refresh()
        } catch (e) {
          this.$message.error('Paste Error')
        }
      },
    },
    events: {
      [REFRESH_RESOURCE]() {
        this.initFolder()
      },
    },
    mounted() {
      this.initFolder()
    },
  }
</script>

<style lang="stylus" scoped>
  @import '~nib/lib/nib/clearfix.styl'
  $main-color = #A2ABBE
  .resource-container
    width 100%
    background $main-board-background
    overflow hidden
    height inherit
    .resorce-select
      display flex
  .resource-menu
    reset-ul()
    width 100%
    background white
    fix-flex()
    clearfix()
  .resource-body
    flex-grow 1
    display flex
    flex-direction row
    height calc(100% - 60px)
  .resource-right
    flex-grow 1
    display flex
    flex-direction column
  .resource-path
    fix-flex()
    padding 5px 10px
    background darken($grey100, 2)
  .resource-explorer
    flex-grow 1
    flex-shrink 1
</style>
