<template>
  <section>
    <el-form>
      <el-form-item label="Save to">
        <el-select v-model="saveTo" placeholder="Save to">
          <el-option v-for="item in ['bg','fg','cus']" :key="item" :label="item" :value="item">
          </el-option>
        </el-select>
      </el-form-item>
      <el-checkbox-group v-model="selected">
        <el-checkbox v-for="(item,i) in list" :key="i" :label="`${item.name}`" border style="margin-bottom:10px;margin-left:10px;height:80px;text-align:center;">
          <div>
            <img :src="item.url" height="30px">
          </div>
          <div>
            {{`${item.name}`}}
          </div>
        </el-checkbox>
      </el-checkbox-group>
    </el-form>
  </section>
</template>

<script>
  import { get } from 'lodash'
  import { mapState } from 'vuex'
  import fs from 'fs-extra'
  import { findFiles } from 'lib/project'
  import path from 'path'
  import { imageSize } from 'lib/utils'
  import { REFRESH_RESOURCE } from 'type/constants'
  export default {
    name: 'IDialogCombineMultiplePictures',
    data() {
      return {
        list: [],
        selected: [],
        saveTo: 'bg',
      }
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
      }),
    },
    watch: {
      saveTo: {
        immediate: true,
        async handler() {
          if (!this.projectPath) return
          this.list = (await findFiles(
            path.join(this.projectPath, 'images', this.saveTo),
            true
          )).filter(item => item.type === 'image')
          this.selected = []
        },
      },
    },
    methods: {
      async onOK() {
        if (!this.selected.length) return
        const canvas = document.createElement('canvas')
        canvas.width = 1920
        canvas.height = 0
        const arr = []
        const selected = this.selected.map(relativePath => {
          const index = this.list.findIndex(
            item => `${item.name}` === relativePath
          )
          return this.list[index]
        })
        for (const file of selected) {
          const image = new Image()
          await new Promise(resolve => {
            image.onload = resolve
            image.src = file.url
          })
          const size = {
            width: image.width,
            height: image.height,
          }
          canvas.height += size.height
          arr.push({
            image,
            size,
            url: file.url,
            name: file.name,
          })
        }
        const jsonContent = []
        const context = canvas.getContext('2d')
        for (const item of arr) {
          const index = arr.indexOf(item)
          const y = arr.slice(0, index).reduce((pre, current, i) => {
            return pre + current.size.height
          }, 0)
          context.drawImage(item.image, 0, y)

          jsonContent.push({
            name: item.name,
            // 由于拼合图片过大，被拖入画布时会被程序压缩改变尺寸，所以尺寸值全部使用百分比表示
            width: item.size.width / canvas.width,
            height: item.size.height / canvas.height,
            top: y / canvas.height,
          })
        }
        const pngPath = path.join(
          this.projectPath,
          'images',
          this.saveTo,
          `out_${Date.now()
            .toString()
            .slice(-5)}.png`
        )
        const jsonPath = pngPath.replace('.png', '.mpc.json')
        fs.writeFileSync(
          pngPath,
          canvas
            .toDataURL('image/png;base64')
            .replace(/^data:image\/png;base64,/, ''),
          'base64'
        )
        fs.writeFileSync(jsonPath, JSON.stringify(jsonContent))
        this.$events.emit(REFRESH_RESOURCE)
      },
    },
  }
</script>
