<template>
  <div class="panel-3d">
    <div class="panel-header parameter-select">
      <span>3D mode</span>
      <el-button class="el-mini-btn-custom" type="danger" icon="el-icon-close" circle size="mini"
        @click="cancel"></el-button>
      <el-button class="el-mini-btn-custom" type="primary" icon="el-icon-check" circle size="mini"
        @click="done"></el-button>
    </div>
    <el-radio-group size="small" class="parameter-select" v-model="tab">
      <el-radio-button label="element">Element</el-radio-button>
      <el-radio-button label="stage">Stage</el-radio-button>
    </el-radio-group>
    <br>
    <div v-if="tab==='stage'" class="parameter-form">
      <div class="flex-between">
        <small class="label">Ambient color</small>
        <div class="flex-around">
          <el-input :step="0.01" :value="ambientColor" @input="updateParameter3D({key:'ambientColor',value:$event})"></el-input>
        </div>
        <div class="flex-around" style="justify-content: flex-start;">
          <el-color-picker size="mini" :value="ambientColor" @input="updateParameter3D({key:'ambientColor',value:$event})"></el-color-picker>
        </div>
        <div class="error-message" v-if="ambientColor.length!==7">Invalid color</div>
      </div>
      <br>
      <div class="flex-between">
        <small class="label">Color intensity</small>
        <mu-slider class="flex-around slider" :min="0" :max="1" :step="0.01" :value="ambientColorIntensity"
          @change="updateParameter3D({key:'ambientColorIntensity',value:$event})" />
        <el-input type="number" class="flex-around" size="mini" :step="0.01" :value="ambientColorIntensity"
          @input="updateParameter3D({key:'ambientColorIntensity',value:$event})"></el-input>
      </div>
      <br>
      <div class="flex-between">
        <small class="label">Camera position</small>
        <div class="flex-around">
          <small class="lower-label">x</small>
          <el-input :disabled="cameraRotationRate.play" :step="0.01" type="number" :value="cameraPosition.x"
            @input="updateParameter3D({key:'cameraPosition.x',value:+$event})" class="parameter-input-x3"
            size="mini"></el-input>
        </div>
        <div class="flex-around">
          <small class="lower-label">y</small>
          <el-input :disabled="cameraRotationRate.play" :step="0.01" type="number" :value="cameraPosition.y"
            @input="updateParameter3D({key:'cameraPosition.y',value:+$event})" class="parameter-input-x3"
            size="mini"></el-input>
        </div>
        <div class="flex-around">
          <small class="lower-label">z</small>
          <el-input :disabled="cameraRotationRate.play" :step="0.01" type="number" :value="cameraPosition.z"
            @input="updateParameter3D({key:'cameraPosition.z',value:+$event})" class="parameter-input-x3"
            size="mini"></el-input>
        </div>
      </div>
      <br>
      <div class="flex-between">
        <small class="label" title="Camera rotation angle">Camera rotation angle</small>
        <div class="flex-around">
          <small class="lower-label">x</small>
          <el-input :disabled="cameraRotationRate.play" :step="1" type="number" :value="cameraRotationAngle.x | radianToDegree"
            @input="updateParameter3D({key:'cameraRotationAngle.x',value:+$event / 180 * Math.PI})"
            class="parameter-input-x3" size="mini"></el-input>
        </div>
        <div class="flex-around">
          <small class="lower-label">y</small>
          <el-input :disabled="cameraRotationRate.play" :step="1" type="number" :value="cameraRotationAngle.y | radianToDegree"
            @input="updateParameter3D({key:'cameraRotationAngle.y',value:+$event / 180 * Math.PI})"
            class="parameter-input-x3" size="mini"></el-input>
        </div>
        <div class="flex-around">
          <small class="lower-label">z</small>
          <el-input :disabled="cameraRotationRate.play" :step="1" type="number" :value="cameraRotationAngle.z | radianToDegree"
            @input="updateParameter3D({key:'cameraRotationAngle.z',value:+$event / 180 * Math.PI})"
            class="parameter-input-x3" size="mini"></el-input>
        </div>
      </div>
      <br>
      <div class="flex-between">
        <small class="label" title="Camera rotation rate">Camera rotation rate</small>
        <div class="flex-around">
          <small class="lower-label">x</small>
          <el-input :step="0.01" type="number" :value="cameraRotationRate.x" @input="updateParameter3D({key:'cameraRotationRate.x',value:+$event})"
            class="parameter-input-x3" size="mini"></el-input>
        </div>
        <div class="flex-around">
          <small class="lower-label">y</small>
          <el-input :step="0.01" type="number" :value="cameraRotationRate.y" @input="updateParameter3D({key:'cameraRotationRate.y',value:+$event})"
            class="parameter-input-x3" size="mini"></el-input>
        </div>
        <div class="flex-around">
          <i class="icon-button fa fa-play" :class="{locked:cameraRotationRate.play}" @click="updateParameter3D({key:'cameraRotationRate.play',value:!cameraRotationRate.play})"></i>
        </div>
      </div>
      <br>
      <div class="flex-between">
        <small class="label">play speed</small>
        <mu-slider class="flex-around slider" :min="0" :max="10" :step="0.1" :value="playSpeed"
          @change="updateParameter3D({key:'playSpeed',value:$event})" />
        <el-input type="number" class="flex-around" size="mini" :step="0.1" :value="playSpeed"
          @input="updateParameter3D({key:'playSpeed',value:$event})"></el-input>
      </div>
      <br>
    </div>
    <div v-else-if="tab==='element'" class="parameter-form">

      <div class="flex-between para-row">
        <small class="label">Keep the last status</small>
        <el-switch :value="keep" @input="updateThreed({key:'keep',value:$event})"></el-switch>
      </div>
      <br>

      <section v-if="!keep">
        <div class="flex-between">
          <small class="label">Light color</small>
          <div class="flex-around">
            <el-input :step="0.01" :value="lightColor" @input="updateThreed({key:'lightColor',value:$event})"></el-input>
          </div>
          <div class="flex-around" style="justify-content: flex-start;">
            <el-color-picker size="mini" :value="lightColor" @input="updateThreed({key:'lightColor',value:$event})"></el-color-picker>
            <br>
          </div>
          <div class="error-message" v-if="lightColor.length!==7">Invalid color</div>
        </div>
        <br>
        <div class="flex-between">
          <small class="label">Color intensity</small>
          <mu-slider class="flex-around slider" :min="0" :max="1" :step="0.01" :value="colorIntensity"
            @change="updateThreed({key:'colorIntensity',value:$event})" />
          <el-input type="number" class="flex-around" size="mini" :step="0.01" :value="colorIntensity"
            @input="updateThreed({key:'colorIntensity',value:$event})"></el-input>
        </div>
        <br>
        <div class="flex-between">
          <small class="label">Light position</small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input :step="0.01" type="number" :value="lightPosition.x" @input="updateThreed({key:'lightPosition.x',value:+$event})"
              class="parameter-input-x3" size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input :step="0.01" type="number" :value="lightPosition.y" @input="updateThreed({key:'lightPosition.y',value:+$event})"
              class="parameter-input-x3" size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">z</small>
            <el-input :step="0.01" type="number" :value="lightPosition.z" @input="updateThreed({key:'lightPosition.z',value:+$event})"
              class="parameter-input-x3" size="mini"></el-input>
          </div>
        </div>
        <br>
        <div class="flex-between">
          <small class="label">Position</small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="position.x"
              @input="updateThreed({key:'position.x',value:+$event})" class="parameter-input-x3"
              size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="position.y"
              @input="updateThreed({key:'position.y',value:+$event})" class="parameter-input-x3"
              size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">z</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="position.z"
              @input="updateThreed({key:'position.z',value:+$event})" class="parameter-input-x3"
              size="mini"></el-input>
          </div>
        </div>
        <br>
        <div class="flex-between">
          <small class="label">Rotation</small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input :disabled="rotationRate.play" :step="1" type="number" :value="rotation.x | radianToDegree"
              @input="updateThreed({key:'rotation.x',value:+$event / 180 * Math.PI})" class="parameter-input-x3"
              size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input :disabled="rotationRate.play" :step="1" type="number" :value="rotation.y | radianToDegree"
              @input="updateThreed({key:'rotation.y',value:+$event/ 180 * Math.PI})" class="parameter-input-x3"
              size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">z</small>
            <el-input :disabled="rotationRate.play" :step="1" type="number" :value="rotation.z | radianToDegree"
              @input="updateThreed({key:'rotation.z',value:+$event/ 180 * Math.PI})" class="parameter-input-x3"
              size="mini"></el-input>
          </div>
        </div>
        <br>
        <div class="flex-between">
          <small class="label">Scale</small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="scale.x"
              @input="updateThreed({key:'scale.x',value:+$event})" class="parameter-input-x3" size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="scale.y"
              @input="updateThreed({key:'scale.y',value:+$event})" class="parameter-input-x3" size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">z</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="scale.z"
              @input="updateThreed({key:'scale.z',value:+$event})" class="parameter-input-x3" size="mini"></el-input>
          </div>
        </div>
        <br>
        <div class="flex-between">
          <small class="label">Rotation rate</small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="rotationRate.x"
              @input="updateThreed({key:'rotationRate.x',value:+$event})" class="parameter-input-initial"
              size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="rotationRate.y"
              @input="updateThreed({key:'rotationRate.y',value:+$event})" class="parameter-input-initial"
              size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">z</small>
            <el-input :disabled="rotationRate.play" :step="0.01" type="number" :value="rotationRate.z"
              @input="updateThreed({key:'rotationRate.z',value:+$event})" class="parameter-input-initial"
              size="mini"></el-input>
          </div>
          <div class="flex-around">
            <i class="icon-button fa fa-play" :class="{locked:rotationRate.play}" @click="updateThreed({key:'rotationRate.play',value:!rotationRate.play})"></i>
          </div>
        </div>
        <br>
        <div class="flex-between">
          <small class="label">Specular power</small>
          <mu-slider class="flex-around slider" :min="0" :max="100" :step="1" :value="specularPower"
            @change="updateThreed({key:'specularPower',value:$event})" />
          <el-input type="number" class="flex-around" size="mini" :step="0.01" :value="specularPower"
            @input="updateThreed({key:'specularPower',value:$event})"></el-input>
        </div>
        <br>
        <div class="flex-between" style="justify-content:flex-start;">
          <small class="label">Animation</small>
          <template v-if="animation.duration">
            <mu-slider class="flex-around slider" :min="0" :max="animation.duration" :step="0.1"
              :value="animation.index" @input="updateThreed({key:'animation.index',value:$event})" />
            <small class="flex-around animation-index">{{animation.index}}</small>
            <div class="flex-around">
              <i class="icon-button fa fa-play" :class="{locked:playAnimation}" @click="updateThreed({key:'playAnimation',value:!playAnimation})"></i>
            </div>
          </template>
          <template v-else>
            <i class="icon-button fa fa-play" :class="{locked:playAnimation}" @click="updateThreed({key:'playAnimation',value:!playAnimation})"></i>
          </template>
        </div>
        <div v-if="!csv.length" class="flex-between" style="justify-content:flex-start;">
          <small class="label">Range</small>
          <div class="flex-around">
            <small class="lower-label">start</small>
            <el-input :step="0.1" :min="0" :max="animation.duration" type="number" :value="animationRange[0]"
              @input="updateAnimationRange('start',+$event)" class="parameter-input-initial" size="mini"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">end</small>
            <el-input :step="0.1" :min="0" :max="animation.duration" type="number" :value="animationRange[1]"
              @input="updateAnimationRange('end',+$event)" class="parameter-input-initial" size="mini"></el-input>
          </div>
        </div>
        <br>
        <div v-if="csv.length" class="flex-between">
          <small class="label">Animation motion</small>
          <el-select size="mini" :value="animationMotion" @input="updateThreed({key:'animationMotion',value:$event})"
            class="flex-around" style="width:200px;">
            <el-option :value="row.Action" :label="row.Action" v-for="(row,$index) in csv" :key="$index" />
          </el-select>
        </div>
        <br>
        <div class="flex-between">
          <small class="label">Control avatar</small>
          <el-select size="mini" :value="controlAvatar" @input="updateThreed({key:'controlAvatar',value:$event})"
            class="flex-around" style="width:200px;">
            <el-option label="Not follow" :value="0" />
            <el-option label="Follow" :value="1" />
            <el-option label="3D wearable" :value="2" />
          </el-select>
        </div>
        <br>
      </section>
    </div>
  </div>
</template>

<script>
  import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'
  import path from 'path'
  import { get, cloneDeep, clamp } from 'lodash/fp'
  import { pick } from 'lodash'
  import {
    EV_LOADING_OPEN,
    EV_LOADING_CLOSE,
    REFRESH_RESOURCE,
  } from 'type/constants'
  import fs from 'fs-extra'
  import { getFile, isThreeDImage, findFiles } from 'lib/project'
  import { urlToPath } from 'lib/helper'
  import { compressImageToSize } from 'lib/utils'
  const ThreedState = k => get('threed.' + k)
  const ProjectState = k => get('project.' + k)
  export default {
    name: 'IParameterPanel3d',
    data() {
      return {
        imageFilter: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }],
        tab: 'element',
        parameter3DCache: {
          ambientColor: '',
          ambientColorIntensity: 0,
          cameraPosition: { x: 0, y: 0, z: 0 },
          cameraRotationAngle: { x: 0, y: 0, z: 0 },
          cameraRotationRate: { x: 0, y: 0, z: 0, play: false },
          playSpeed: 1,
        },
      }
    },
    computed: {
      ...mapState({
        zoom: state => state.board.zoom,
        projectPath: ProjectState('projectPath'),
        stage: ProjectState('selectedStage'),
        stages: ProjectState('stages'),
        keep: ThreedState('keep'),
        cover: ThreedState('cover'),
        ...mapGetters([
          'ambientColor',
          'ambientColorIntensity',
          'cameraPosition',
          'cameraRotationAngle',
          'cameraRotationRate',
          'playSpeed',
        ]),
        lightColor: ThreedState('lightColor'),
        colorIntensity: ThreedState('colorIntensity'),
        lightPosition: ThreedState('lightPosition'),
        position: ThreedState('position'),
        rotation: ThreedState('rotation'),
        scale: ThreedState('scale'),
        diffusionMap: ThreedState('diffusionMap'),
        normalMap: ThreedState('normalMap'),
        rotationRate: ThreedState('rotationRate'),
        playAnimation: ThreedState('playAnimation'),
        animation: ThreedState('animation'),
        specularPower: ThreedState('specularPower'),
        animationRange: ThreedState('animationRange'),
        controlAvatar: ThreedState('controlAvatar'),
        csv: ThreedState('csv'),
        animationMotion: ThreedState('animationMotion'),
      }),
      ...mapGetters(['threeDFile']),
      defaultImageDirectory() {
        return path.join(
          this.projectPath,
          'images',
          this.vrefs.resourceView.folderCate.toLowerCase()
        )
      },
    },
    mounted() {
      if (!this.threeDFile) return
      const stageId = this.$store.state.threed.stageId
      const stage = this.stages.find(stage => stage.id === stageId)
      this.parameter3DCache = cloneDeep(stage.parameter3D)
    },
    watch: {
      tab(tab) {
        this.vrefs.threed.enableControl(tab === 'stage')
        this.updateParameter3D({ key: 'cameraRotationRate.play', value: false })
        this.updateThreed({ key: 'rotationRate.play', value: false })
      },
      stage() {
        this.cancel()
      },
    },
    methods: {
      ...mapMutations([
        'exit3DMode',
        'updateThreed',
        'updateParameter3D',
        'updateMetadata3D',
      ]),
      ...mapActions(['load3DImage']),
      cancel() {
        Object.entries(this.parameter3DCache).forEach(([key, value]) => {
          this.updateParameter3D({ key, value })
        })
        this.exit3DMode()
      },
      async done() {
        this.updateParameter3D({ key: 'cameraRotationRate.play', value: false })
        this.updateThreed({ key: 'rotationRate.play', value: false })
        const stage = this.stages.find(
          stage => stage.id === this.$store.state.threed.stageId
        )
        const folderCate = this.threeDFile.parameter
        this.updateMetadata3D({
          stage: stage,
          stageId: stage.id,
          folderCate,
          ...pick(this, [
            'diffusionMap',
            'keep',
            'lightColor',
            'colorIntensity',
            'lightPosition',
            'normalMap',
            'position',
            'rotation',
            'scale',
            'rotationRate',
            'animation',
            'specularPower',
            'animationRange',
            'controlAvatar',
            'csv',
            'animationMotion',
          ]),
        })
        const imagePath = await this.export3DImage()
        if (!this.cover) {
          const file = getFile(imagePath)
          this.vrefs.board.importFile(file)
        }
        this.exit3DMode()
        this.updateImages()
      },
      async export3DImage() {
        const imageFolder = this.threeDFile.path.split(path.sep).reverse()[1]
        const fileName = this.threeDFile.name
        const data = {
          stageId: this.$store.state.threed.stageId,
          imageFolder,
          fileName,
          ...pick(this, [
            'keep',
            'lightColor',
            'colorIntensity',
            'lightPosition',
            'position',
            'rotation',
            'scale',
            'diffusionMap',
            'normalMap',
            'rotationRate',
            'animation',
            'specularPower',
            'animationRange',
            'controlAvatar',
            'csv',
            'animationMotion',
          ]),
        }
        const makePath = (p, suffix = 0, ext) => {
          const directory = path.dirname(p)
          const extname = ext || path.extname(p)
          const fileName = path.basename(p, extname)
          const newName = suffix
            ? fileName + suffix + extname
            : fileName + extname
          const newPath = path.join(directory, newName)
          if (fs.existsSync(newPath)) {
            return makePath(p, ++suffix, extname)
          } else {
            return newPath
          }
        }

        let jsonPath
        if (this.cover) {
          const directory = path.dirname(this.threeDFile.path)
          jsonPath = isThreeDImage(path.join(directory, this.cover))
        } else {
          const _jsonPath = this.threeDFile.path.replace(path.extname(this.threeDFile.path), '.3d.json')
          jsonPath = makePath(_jsonPath, undefined, '.3d.json')
        }
        console.log('wrtie json', jsonPath, data)
        fs.writeJsonSync(jsonPath, data)

        const originZoom = this.zoom
        this.$store.commit('changeZoom', 1)
        this.vrefs.threed.showTool(false)
        await new Promise(resolve => setTimeout(resolve, 100))
        const canvas = document.querySelector('#three')
        const imageData = canvas
          .toDataURL()
          .replace(/^data:image\/\w+;base64,/, '')
        this.$store.commit('changeZoom', originZoom)
        const imagePath = jsonPath.replace('.3d.json', '.png')
        fs.writeFileSync(imagePath, new Buffer(imageData, 'base64'))
        await compressImageToSize(imagePath, { width: 1920, height: 1080 })
        this.$events.emit(REFRESH_RESOURCE)
        this.vrefs.threed.showTool(true)
        return imagePath
      },
      async updateImages() {
        this.$events.emit(EV_LOADING_OPEN, { text: 'Updating images' })

        const bgFiles = await findFiles(
          path.join(this.projectPath, 'images', 'bg')
        )
        const fgFiles = await findFiles(
          path.join(this.projectPath, 'images', 'fg')
        )
        const cusFiles = await findFiles(
          path.join(this.projectPath, 'images', 'cus')
        )
        const files = [...bgFiles, ...fgFiles, ...cusFiles]
          .filter(file => /\.3d\.json$/.test(file.name))
          .filter(file => {
            const jsonFile = fs.readJsonSync(file.path)
            return jsonFile.stageId === this.stage.id
          })
        for (const { path: filePath, name } of files) {
          // waiting for ThreeD.vue to be destroyed
          await new Promise(resolve => setTimeout(resolve, 0))
          const imageFile = getFile(filePath.replace('.3d.json', '.png'))
          this.load3DImage(imageFile)
          const d = Date.now()
          await new Promise(resolve =>
            setInterval(_ => (this.vrefs.threed.loaded ? resolve() : 'wait'), 100)
          )
          console.log('texture loaded', Date.now() - d)
          // 不能直接调用this.export3Dimage，因为每一次循环this都是新组件，直接使用的话是调用的旧组件的作用域和数据。
          await this.vrefs.panel3D.export3DImage()
          this.exit3DMode()
        }

        this.$events.emit(EV_LOADING_CLOSE)
      },
      updateAnimationRange($key, value) {
        if ($key === 'start') value = clamp(0, this.animationRange[1])(value)
        else value = clamp(this.animationRange[0], 100)(value)
        const key = 'animationRange.' + ($key === 'start' ? '0' : '1')
        this.updateThreed({ key, value })
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .panel-header
    display flex
    align-items center
    justify-content space-between
    padding 10px
    background $grey100
    span
      flex 1
    .el-mini-btn-custom
      padding 4px
  .parameter-form
    & .slider
      margin 0 15px
  .animation-index
    min-width 30px
  .error-message
    position absolute
    left 0
    text-align center
    line-height 28px
    font-size 80%
    bottom -20px
    color $danger-color
</style>
