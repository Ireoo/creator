<template>
  <section class="dialog-record">
    <div class="button-container">
      <template v-if="!recording && !countdown">
        <i class="fa fa-microphone circle-button big"
          @click="startCountdown"></i>
        <br>
        <small v-if="!audioData">Start record</small>
      </template>
      <i v-else-if="!countdown"
        class="fa fa-stop-circle-o circle-button big active recording"
        @click="stopRecord"></i>
      <span v-if="countdown"
        class="countdown">{{countdown}}</span>
    </div>
    <div :style="{visibility:recording?'initial':'hidden'}"
      class="audiowave"
      ref="audiowave"></div>
    <aplayer v-if="currentAudio"
      :music="currentAudio"
      @click.native="clickPlayer" />
  </section>
</template>

<script>
  import { clone } from 'ramda'
  import { get } from 'lodash'
  import { mapState } from 'vuex'
  import Audiowave from 'lib/audiowave'
  import fs from 'fs-extra'
  import { remote } from 'electron'
  import path from 'path'
  import Aplayer from 'vue-aplayer'
  import {
    REFRESH_RESOURCE,
    RENAME_FILE,
    RENAME_FILE_COMPLETED,
  } from 'type/constants'
  export default {
    name: 'IDialogRecordAudio',
    components: { Aplayer },
    data() {
      return {
        recording: false,
        audioData: null,
        recorder: null,
        currentAudio: null,
        countdown: 0,
      }
    },
    mounted() {
      new Audiowave({
        container: this.$refs.audiowave,
        style: 'ios9',
        width: this.$el.width / 2,
        height: 100,
        speed: 0.25,
        amplitude: 0.2,
        autostart: true,
        color: 'black',
      })
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        this.recorder = new MediaRecorder(stream)
      })
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
      }),
    },
    methods: {
      startCountdown() {
        let count = 3
        this.countdown = count--
        const interval = setInterval(async() => {
          if (!count) {
            clearInterval(interval)
            this.record()
          }
          this.countdown = count--
          await new Promise(resolve => setTimeout(resolve, 0))
        }, 1000)
      },
      record() {
        new Promise(resolve => {
          this.recorder.ondataavailable = e => {
            const blob = new Blob([e.data])
            const fr = new FileReader()
            fr.onload = () => resolve(new Buffer(fr.result))
            fr.readAsArrayBuffer(blob)
          }
          this.recorder.start()
          this.currentAudio = null
          this.recording = true
          console.log('Start record')
        })
          .then(buffer => {
            const root = remote.app.getPath('userData')
            const fileName =
              new Date()
                .toISOString()
                .match(/.*\./)
                .toString()
                .replace(/:|-/g, '') + 'wav'
            fs.ensureDirSync(path.join(root, 'temp'))
            console.log('Stop record', 'save audio to', root, '/temp/', fileName)
            const filePath = path.join(root, 'temp', fileName)
            fs.writeFileSync(filePath, buffer)
            this.currentAudio = {
              title: fileName,
              src: filePath,
              artist: ' ',
              pic: 'static/icon/resource/poster.png',
            }
          })
          .catch(console.error)
      },
      async stopRecord() {
        this.recording = false
        this.recorder.stop()
      },
      async onOK() {
        if (this.currentAudio && this.projectPath) {
          const { src, title } = this.currentAudio
          const newPath = path.join(this.projectPath, 'instruction', 'music', title)
          fs.copySync(
            src,
            newPath
          )
          this.rename(newPath)
          this.$events.emit(REFRESH_RESOURCE)
        }
      },
      clickPlayer(e) {
        const className = get(e, 'target.className')
        if (className && ~className.indexOf('aplayer-title')) this.rename(this.currentAudio.src)
      },
      rename(src) {
        this.$events.emit(RENAME_FILE, src)
      },
    },
    events: {
      [RENAME_FILE_COMPLETED]({ fromPath, toPath }) {
        if (fromPath === this.currentAudio.src) {
          this.currentAudio.src = toPath
          this.currentAudio.title = path.basename(toPath)
        }
      },
    },
    beforeDestroy() {
      const inactive = this.recorder.state === 'inactive'
      if (this.recorder && !inactive) this.recorder.stop()
    },
  }
</script>

<style lang="stylus" scoped>
  .button-container
    min-height 100px
    text-align center
  .circle-button.recording
    color $primary-color-highlight
  .audiowave
    opacity 0.3
    z-index 0
  .countdown
    height inherit
    line-height 2em
    font-size 2em
</style>
