<template>
  <div class="image-selector">
    <div v-if="showInput">
      <el-input :value="value" readonly icon="refresh" />
    </div>
    <div v-if="showSearch">
      <el-input v-model="searchValue" :placeholder="instructionDialogText('search')" />
    </div>
    <div class="image-container" v-loading="levers.refresh">
      <div class="error" v-if="!files">{{error}}</div>
      <div class="image-controls" v-if="showRefresh">
        <i class="fa fa-fw fa-refresh image-control" @click="refresh"></i>
      </div>
      <ul class="image-list" v-if="files">
        <li class="image-list-item" v-for="(file,index) in files.filter(file=>file.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1)"
          :class="{'image-list-item_selected': file === value}" :title="file" @click="selectImage(file)"
          :key="index">
          <img class="item-image" :src="getImageUrl(file)">
          <div class="item-text">{{getFileName(file)}}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
  import { Lever } from 'vue-lever'
  import fs from 'fs-extra'
  import { fileType } from 'lib/utils'
  import path from 'path'
  import url from 'url'

  async function findFiles(dir, recursion, prefix = '') {
    const allFiles = (await fs.readdir(dir)).filter(file => file[0] !== '.')
    const files = []
    if (recursion) {
      for (const subDir of allFiles) {
        const stat = await fs.lstat(path.join(dir, subDir))
        if (!stat.isDirectory()) {
          files.push(subDir)
          continue
        }
        files.push(
          ...(await findFiles(path.join(dir, subDir), recursion, subDir))
        )
      }
    }
    return files
      .filter(file => fileType(file) === 'image')
      .map(file => path.join(prefix, file))
  }

  export default {
    name: 'ImageSelector',
    props: {
      value: {
        type: String,
      },
      showInput: {
        type: Boolean,
        default: true,
      },
      showSearch: {
        type: Boolean,
        default: true,
      },
      showRefresh: {
        type: Boolean,
        default: false,
      },
      path: {
        type: String,
        required: true,
      },
      recursion: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        files: null,
        error: '',
        searchValue: '',
      }
    },
    methods: {
      @Lever('refresh')
      async refresh() {
        if (!(await fs.pathExists(this.path))) {
          this.files = null
          this.error = 'Cannot Found Path: ' + this.path
          return
        }
        this.files = await findFiles(this.path, this.recursion)
      },
      getImageUrl(file) {
        return url.format({
          protocol: 'file',
          pathname: path.join(this.path, file),
        })
      },
      selectImage(file) {
        this.$emit('input', file)
      },
      getFileName(file) {
        return path.parse(file).name
      },
    },
    mounted() {
      this.refresh()
    },
  }
</script>


<style lang="stylus" scoped>
  .image-container
    margin-top 5px
    border 1px solid #cccccc
    border-radius 5px
    overflow hidden
  .image-controls
    padding 0 10px
  .image-control
    cursor pointer
  .image-list
    reset-ul()
    display flex
    flex-wrap wrap
    overflow auto
    max-height 200px
    min-height 100px
    justify-content space-between
    box-shadow 0 1px 5px 0 rgba(0, 0, 0, 0.6)
  .image-list-item
    width 60px
    overflow hidden
    margin 5px
    flex-grow 0
    flex-shrink 0
    cursor pointer
    border 1px solid #cccccc
    border-radius 5px
    line-height normal
    &:hover
      background #f0f0f0
  .image-list-item_selected
    border-color $primary-color-highlight
    &:hover
      background #e0e0e0
    .item-image
      background #e0e0e0
  .item-image
    width 100%
    background #eeeeee
  .item-text
    font-size 0.75em
    text-align center
    padding 5px
</style>