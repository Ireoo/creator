<template>
  <el-form labelPosition="top" :rules="rules" :model="value" ref="form">

    <!-- Add Action-->
    <template v-if="isImage">
      <div v-for="(trans,$index) in stage.transition" :key="$index">
        Transition{{$index+1}}: {{transitionLabel(trans)}}
      </div>
      <br>
      <el-form-item prop="src">
        <image-selector v-model="value.src" :path="actionImagePath" :showSearch="true" :showInput="false"></image-selector>
      </el-form-item>
      <el-form-item prop="delay">
        <label>{{instructionDialogText('delay')}}</label>
        <el-input v-model="value.delay" type="number" size="mini" class="delay"></el-input>
      </el-form-item>
    </template>

    <!-- Add Text-->
    <template v-if="isText">
      <el-form-item prop="txt" v-if="isText">
        <el-input v-model="value.txt" :placeholder="instructionDialogText('addText')"></el-input>
      </el-form-item>
      <el-row>
        <el-col :span="14">
          <el-form-item>
            <label>{{instructionDialogText('font')}}</label>
            <el-select size="small" v-model="value.font" :class="`font-${value.font}`" style="width:100px;">
              <el-option v-for="(font,$index) in fonts" :class="`font-${font}`" :key="$index"
                :value="font" :label="font" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="10">
          <el-form-item prop="delay">
            <label>{{instructionDialogText('delay')}}</label>
            <el-input :v-model="value.delay" type="number" size="mini" class="delay"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <!-- Add Music/Video-->
    <template v-if="isMusic || isVideo">
      <el-form-item prop="src" v-if="isMusic">
        <i-resource-explorer ref="musicExplorer" class="music-explorer" :path="musicFolderPath"
          :defaultFile="value.src?{path:value.src}:null" :filter="fileFilter" @enter-folder="folder => dirs.push(folder)"
          @click.native="selectMusic"></i-resource-explorer>
      </el-form-item>

      <el-row v-if="isMusic">
        <el-col :span="12">
          <el-form-item>
            <label>{{instructionDialogText('loop')}}</label>
            <el-switch v-model="value.loop"></el-switch>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item>
            <label>{{instructionDialogText('volume')}}</label>
            <el-slider v-model="value.volume" class="music-slider" :min="0" :max="1" :step="0.01"></el-slider>
            <el-input style="width:60px;" v-model.number="value.volume" size="mini" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item v-if="isVideo">
        <label>{{instructionDialogText('maximumTimeLength')}}</label>
        <el-input class="delay" v-model.number="value.maximumTime" size="mini" type="number" />
      </el-form-item>

      <el-row>
        <el-col :span="14">
          <el-form-item prop="start.stage">
            <label>{{instructionDialogText('startStage')}}</label>
            <i-stage-id-selector size="mini" v-model="value.start.stage"></i-stage-id-selector>
          </el-form-item>
        </el-col>
        <el-col :span="10">
          <el-form-item>
            <label>{{instructionDialogText('delay')}}</label>
            <el-input class="delay" v-model.number="value.start.delay" size="mini" type="number"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row class="stop-stage" v-for="(item,index) in value.stop" :key="index">
        <el-col :span="14">
          <el-form-item prop="stop.stage">
            <label>{{instructionDialogText('stopStage')}}</label>
            <i-stage-id-selector size="mini" v-model="item.stage" :options="stages.filter(stage=>stage.id!=value.start.stage)" />
          </el-form-item>
        </el-col>
        <el-col :span="10">
          <el-form-item>
            <label>{{instructionDialogText('delay')}}</label>
            <el-input class="delay" v-model.number="item.delay" size="mini" type="number" />
          </el-form-item>
          <el-button class="add-stop-stage-button" @click="index?value.stop.splice(index,1):addStopStage(index)"
            type="primary" :icon="index?'el-icon-minus':'el-icon-plus'" size="mini"></el-button>
        </el-col>
      </el-row>
    </template>

    <!-- Take Photo-->
    <template v-if="isPhoto">
      <el-form-item>
        <label>{{instructionDialogText('delay')}}</label>
        <el-input class="delay" v-model.number="value.delay" size="mini" type="number" />
      </el-form-item>
    </template>

    <!-- Add Command-->
    <template v-if="isCommand">
      <el-row>
        <el-col :span="14">
          <el-form-item prop="command">
            <label>{{instructionDialogText('command')}}</label>
            <el-input style="width:100px;" size="mini" v-model="value.command"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="10">
          <el-form-item>
            <label>{{instructionDialogText('delay')}}</label>
            <el-input class="delay" v-model.number="value.delay" size="mini" type="number"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <!-- Add goody -->
    <template v-if="isGoody">
      <el-form-item prop="name">
        <label>Goody Name</label>
        <el-input v-model="value.name"></el-input>
      </el-form-item>
      <el-form-item prop="image">
        <image-selector v-model="value.image" :path="goodyPath" :showSearch="false" :showInput="false"
          @input="initGoodyName"></image-selector>
      </el-form-item>
      <el-form-item prop="location" size="mini">
        <label>Show location</label>
        <el-select style="width:100px;" v-model="value.position" placeholder="Location">
          <el-option :label="position" :value="position" v-for="(position,i) in ['topRight','bottomLeft','bottomRight']"
            :key="i"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="delay" size="mini">
        <label>Initial Number of goodies</label>
        <el-input class="delay" v-model.number="value.initNum" type="number"></el-input>
      </el-form-item>
      <el-form-item prop="endStage" size="mini">
        <label>End Stage</label>
        <el-select style="width:100px;" v-model="value.endStage" placeholder="End Stage">
          <el-option :label="getStageName(stage,i,true)" :value="stage.id" v-for="(stage,i) in stages"
            :key="i"></el-option>
        </el-select>
      </el-form-item>
    </template>

  </el-form>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import path from 'path'
  import { MountComponents } from 'lib/utils'
  import { pick, last, clone, omit } from 'ramda'
  import { DIALOG_INSTRUCTION_EDITOR } from 'type/constants'

  import StageIDSelector from './instruction/StageIDSelector.vue'
  import Position from './instruction/Position.vue'

  import ResourceExplorer from '../resource/ResourceExplorer.vue'

  import uuid from 'uuid/v1'

  const requiredString = {
    type: 'string',
    required: true,
  }
  const rules = {
    src: requiredString,
    txt: requiredString,
    'start.stage': requiredString,
    'stop.0.stage': requiredString,
    command: requiredString,
  }
  export default {
    name: 'IDialogInstructionEditor',
    components: MountComponents(StageIDSelector, Position, ResourceExplorer),
    props: {
      value: Object,
      options: Object,
    },
    data() {
      return {
        dirs: [],
        rules: {},
      }
    },
    watch: {
      'value.start.stage'(stageId) {
        this.value.stop.forEach(item => (item.stage = null))
      },
      'value.endStage': {
        immediate: true,
        handler(stageId) {
          // Goody instruction
          // 默认endStage为preEndStage
          if (stageId === null) {
            const stage = this.stages.find(s => s.type === 'preEnd')
            if (stage) this.value.endStage = stage.id
          }
        },
      },
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
        fonts: state => state.static.instruction.fonts,
        stage: state => state.project.selectedStage,
        stages: state => state.project.stages,
      }),
      ...mapGetters(['transitionLabel', 'goodies', 'getStageName']),
      musicFolderPath() {
        return path.join(this.projectPath, 'instruction/music', ...this.dirs)
      },
      actionImagePath() {
        return path.join(this.projectPath, 'instruction/sysimg')
      },
      goodyPath() {
        return path.join(this.projectPath, 'instruction/goodies')
      },
      type() {
        return this.value.type
      },
      isText() {
        return this.type === 'text'
      },
      isImage() {
        return this.type === 'image'
      },
      isPhoto() {
        return this.type === 'photo'
      },
      isMusic() {
        return this.type === 'music'
      },
      isVideo() {
        return this.type === 'video'
      },
      isCommand() {
        return this.type === 'command'
      },
      isGoody() {
        return this.type === 'goody'
      },
      isEdit() {
        const edit = this.options.title.toLowerCase().indexOf('edit') !== -1
        return edit
      },
    },
    created() {
      if (this.isGoody && !this.isEdit) {
        Object.assign(this.value, {
          id: uuid(),
          startStage: this.stage.id,
        })
      }
    },
    methods: {
      omit,
      update(key, value) {
        if (typeof value === 'undefined') {
          const value = key
          return this.$emit('input', value)
        }
        this.$emit(`input`, Object.assign({}, { ...this.value, [key]: value }))
      },
      selectMusic() {
        const highlight = this.$refs.musicExplorer.highlight
        // in order to be compatible with the file input
        if (highlight && highlight.type !== 'dir') {
          const src = path.join(highlight.type, ...this.dirs, highlight.name)
          this.update('src', src)
        }
      },
      fileFilter(file) {
        return !!(file.type === 'dir' || file.type === 'music')
      },
      addStopStage() {
        const stop = clone(this.value.stop)
        const item = clone(last(this.value.stop))
        stop.push(item)
        this.update('stop', stop)
      },
      initGoodyName(value) {
        this.value.name = path.basename(value, path.extname(value))
      },
      onOK() {
        if (this.isGoody) {
          const name = this.value.name
          const count = this.goodies.filter(goody => goody.name === name).length
          if (this.isEdit && count >= 2) {
            return Promise.reject('The name already exist')
          }
          if (!this.isEdit && count >= 1) {
            return Promise.reject('The name already exist')
          }
        }
        return this.validate()
      },
      validate() {
        return new Promise((resolve, reject) => {
          const { src, start, stop } = this.value

          if (this.isImage && !src) {
            reject('Please select a image')
          }

          if (this.isMusic && [src, start.stage, stop[0].stage].includes('')) {
            reject('Please select Music/Stage')
          }

          if (this.isVideo && [start.stage, stop.stage].includes('')) {
            reject('Please select Stage')
          }

          resolve()
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .music-explorer
    max-height 20vh
    overflow auto
    border 1px solid $grey400
    radius()
  .color-picker
    vertical-align middle
  .music-slider
    display inline-block
    width 30%
    vertical-align middle
  .delay
    width 70px
  .add-stop-stage-button
    position absolute
    right 0
    top 0
    left 0
    margin auto
    width 50px
    height 40px
    background none
    color black
    border none
    font-weight 800
</style>

<style>
  /* override */
  .music-explorer .file-text {
    white-space: nowrap;
    text-overflow: clip;
    overflow: hidden;
    padding: 0 2px !important;
  }
</style>