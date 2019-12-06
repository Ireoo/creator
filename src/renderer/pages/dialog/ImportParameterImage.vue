<template>
  <el-form labelPosition="top">
    <el-form-item label="Directory">
      <!--TODO: should show error if folder place error-->
      <file-input v-model="value.directory" directory :file="false" :relative="projectPath">
        <el-button slot="prepend" @click="value.directory = 'same'">
          <i class="fa fa-exchange"></i>
        </el-button>
      </file-input>
      Only can select folder under in you project path
    </el-form-item>
    <el-form-item label="Name">
      <el-select @visible-change="fetchFiles" filterable allowCreate v-model="value.file" style="width: 100%" :loading="levers.files">
        <el-option value="same" label="same"></el-option>
        <el-option v-for="file in files" :value="file" :label="file" :key="file"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="Import Reference" v-if="needReference">
      <file-input v-model="value.reference" :relative="projectPath"></file-input>
      Only can select folder under in you project path
    </el-form-item>
    <el-form-item label="Preview">
      <div class="preview-canvas" v-loading="levers.preview">
        <i-canvas-layer :layer="layer" v-if="layer" mode="select" :ratio="previewZoom"></i-canvas-layer>
        <span class="preview-canvas-empty" v-else>
          Please click refresh button
          <br>
          or
          <br>
          Select a valid resource(image/video)
        </span>
      </div>
      <div class="preview-control">
        <el-button type="text" @click="doPreview()" :disabled="levers.preview">
          <i class="fa fa-fw fa-refresh" :class="{'fa-spin': levers.preview}"></i>
        </el-button>
        <zoom-slider
            :value="previewZoom"
            @input="value => previewZoom = value"
            :min="0.05"
            :step="0.05"
            :max="1"
        ></zoom-slider>
      </div>
    </el-form-item>
  </el-form>
</template>

<script>
  import path from 'path'
  import {Lever} from 'vue-lever'
  import Layer from 'lib/layer'
  import {MountComponents, calcZoom} from 'lib/utils'
  import {Debounce, getSourceSrc} from 'lib/helper'
  import {mapState} from 'vuex'
  import fs from 'fs-extra'

  import CanvasLayer from 'components/board/CanvasLayer.vue'

  export default {
    name: 'IDialogImportParameterImage',
    components: MountComponents(CanvasLayer),
    props: {
      value: Object,
    },
    data() {
      return {
        layer: null,
        previewZoom: 1,
        files: [],
      }
    },
    watch: {
      value: {
        deep: true,
        handler(value) {
          this.doPreview()
        },
      },
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
      }),
      needReference() {
        // TODO: sensitive check
        return this.value.directory === 'same' || this.value.file === 'same'
      },
      resource() {
        return getSourceSrc(this.projectPath, this.value)
      },
    },
    methods: {
      onOK() {
        return new Promise((resolve, reject) => {
          if (!this.layer) {
            this.$alert('Please select valid resource', 'Error', {
              type: 'error',
            })
            return reject(new Error('invalid resource'))
          }
          if (this.layer.width > 1920 || this.layer.height > 1080) {
            return reject(this.$alert('The resource must be smaller than 1920x1080', {type: 'error'}))
          }
          this.value.metadata = {
            width: this.layer.width,
            height: this.layer.height,
            src: this.layer.src,
            type: this.layer.type,
          }
          resolve()
        })
      },
      onShow() {
        this.doPreview()
      },
      @Debounce(1000)
      @Lever('preview')
      doPreview() {
        return Layer.create(this.resource).then(layer => {
          this.layer = layer
          this.layer.top = 0
          this.layer.left = 0
          const dom = this.$el.querySelector('.preview-canvas')
          this.previewZoom = calcZoom(this.layer.width, dom.clientWidth, 0.05, 0.05)
        }).catch(err => {
          console.warn('cannot load resource', err)
          this.layer = null
        })
      },
      async fetchFiles(open) {
        if (!open || this.levers.files) return
        this.$lever.t('files')
        if (this.value.directory === 'same') {
          this.files = []
          this.$lever.f('files')
          return
        }
        const files = await fs.readdir(path.join(this.projectPath, this.value.directory))
        this.files = files.filter(file => /\.(png|jpg|jpeg|bmp|mp4|gif)$/i.test(file))
        this.$lever.f('files')
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .preview-canvas
    width 100%
    padding-bottom 56.25%
    position relative
    box-shadow 0 0 1px 1px #cccccc
    overflow auto

  .preview-canvas-empty
    position absolute
    width 100%
    line-height 30px
    height @line-height * 3
    font-size @line-height - 10px
    text-align center
    color #cccccc
    top 0
    left 0
    right 0
    bottom 0
    margin auto

  .preview-control
    display flex
</style>
