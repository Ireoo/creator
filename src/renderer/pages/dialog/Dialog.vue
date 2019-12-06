<template>
  <el-dialog :visible.sync="dialog" :title="title" :width="width" top="116px" :close-on-click-modal="false"
    custom-class="dialog">
    <div tabindex="0" @keypress.enter.stop.prevent="ok()" style="outline: 0" class="component">
      <component :is="'i-dialog-' + type" v-if="dialog" v-model="data" ref="content" :options="options"
        @close="close"></component>
    </div>
    <span slot="footer">
      <el-button type="danger" @click="close">{{dialogText(textCancel)}}</el-button>
      <el-button type="primary" @click="ok()" :loading="levers.loading" v-if="textOK" ref="ok">{{dialogText(textOK)}}</el-button>
    </span>
  </el-dialog>
</template>

<script>
  import { MountComponents, isFunction } from 'lib/utils'
  import { EV_DIALOG_OPEN } from 'type/constants'
  import { Lever } from 'vue-lever'

  import Transition from './Transition.vue'
  import Action from './Action.vue'
  import ImportParameterImage from './ImportParameterImage.vue'
  import Error from './Error.vue'
  import StageSetting from './StageSetting.vue'
  import InstructionEditor from './InstructionEditor.vue'
  import Setting from './Setting'
  import Images from './Images'
  import Export from './Export'
  import Protect from './Protect'
  import RecordAudio from './RecordAudio'
  import Login from './Login'
  import MyProject from './MyProject'
  import Upload from './Upload'
  import Function from './Function'
  import Configuration from './Configuration'
  import Debug from './Debug'
  import CombineMultiplePictures from './CombineMultiplePictures'
  import SelectFolder from './SelectFolder'
  import { inRange, debounce } from 'lodash'

  export default {
    name: 'IDialog',
    components: MountComponents(
      Transition,
      Action,
      ImportParameterImage,
      Error,
      StageSetting,
      InstructionEditor,
      Setting,
      Images,
      Export,
      Protect,
      RecordAudio,
      Login,
      MyProject,
      Upload,
      Function,
      Configuration,
      Debug,
      CombineMultiplePictures,
      SelectFolder
    ),
    data() {
      return {
        width: null,
        dialog: false,
        title: 'Action',
        textOK: 'Ok',
        textCancel: 'Cancel',
        data: null,
        options: null,
      }
    },
    watch: {
      dialog(open) {
        if (!open) {
          // dialog closed
          if (isFunction(this.closed)) {
            this.closed({
              data: this.data,
              type: this.type,
              clickOK: !!this.clickOK,
            })
          }
        } else {
          // dialog show
          this.$nextTick(() => {
            this.$refs.content &&
              this.$refs.content.onShow &&
              this.$refs.content.onShow()
            this.$refs.ok && this.$refs.ok.$el && this.$refs.ok.$el.focus()
            this.enableDrag()
          })
        }
      },
    },
    events: {
      [EV_DIALOG_OPEN](event) {
        // this.levers.loading = false
        this.dialog = true
        this.width = event.width || '30%'
        this.type = event.type
        this.data = event.data
        this.title = this.instructionDialogText(event.title)
        this.clickOK = false
        this.textOK = event.textOK || 'Ok'
        if (event.textOK === null) this.textOK = null
        this.textCancel = event.textCancel || 'Cancel'
        this.options = event
        this.closed = event.closed
        this.confirmed = event.confirmed
      },
    },
    methods: {
      @Lever('loading')
      ok() {
        const content = this.$refs.content
        if (isFunction(content.onOK)) {
          // must be promise
          return content
            .onOK()
            .then(result => {
              this.clickOK = true
              this.dialog = false
              if (isFunction(this.confirmed)) {
                this.confirmed({
                  data: this.data,
                  type: this.type,
                })
              }
              return result
            })
            .catch(err => {
              console.log(err)
              this.$message({ message: err })
            })
        }
      },
      close() {
        this.dialog = false
      },
      async enableDrag() {
        await new Promise(this.$nextTick)
        const dialog = document.querySelector('.dialog')
        if (dialog.classList.contains('dragable')) return
        dialog.classList.add('dragable')
        const header = document.querySelector('.dialog>.el-dialog__header')

        const {
          width: dialogWidth,
          height: dialogHeight,
        } = dialog.getBoundingClientRect()
        dialog.style.left =
          document.documentElement.clientWidth / 2 - dialogWidth / 2 + 'px'
        dialog.style.top =
          document.documentElement.clientHeight / 2 - dialogHeight / 2 + 'px'

        let moving = false
        const mousedown = document.addEventListener('mouseup', e => {
          moving = false
        })
        this.$watch('dialog', () => {
          moving = false
        })
        header.addEventListener('mousedown', e => (moving = true))
        const mousemove = e => {
          if (!moving) return
          const left = +dialog.style.left.replace('px', '')
          const top = +dialog.style.top.replace('px', '')
          const { movementX, movementY } = e
          const newLeft = left + movementX
          const newTop = top + movementY
          if (
            !inRange(
              newLeft,
              0,
              document.documentElement.clientWidth - dialogWidth
            )
          ) { return }
          if (
            !inRange(
              newTop,
              0,
              document.documentElement.clientHeight - dialogHeight
            )
          ) { return }
          dialog.style.left = `${newLeft}px`
          dialog.style.top = `${newTop}px`
        }
        document.addEventListener('mousemove', mousemove)
      },
    },
  }
</script>
<style lang="stylus">
  .dialog
    radius()
    .component
      max-height 60vh
      overflow auto
      padding-right 10px
    &.dragable
      margin initial !important
      .el-dialog__header
        cursor move
</style>
