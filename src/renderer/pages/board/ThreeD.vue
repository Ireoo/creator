<template>
  <div class="threed-container" @mousewheel.stop.prevent="scaleCurrent" @contextmenu="contextmenu">

  </div>
</template>

<script>
  import { mapState, mapMutations, mapGetters } from 'vuex'
import { EV_CANVAS_CLEAR_SELECT } from 'type/constants'
import path from 'path'
import fs from 'fs-extra'
import { get } from 'lodash/fp'
import { pathToUrl, Debounce } from 'lib/helper.js'
import ThreeD from 'lib/threed.js'
import { round, cloneDeep, isEqual } from 'lodash'
import { Throttle } from 'lodash-decorators'
import csv from 'csvtojson'
const ThreedState = k => get('threed.' + k)
const ProjectState = k => get('project.' + k)

  let threed
  export default {
    name: 'IThreeD',
    data() {
      return {
        loaded: false,
      }
    },
    computed: {
      ...mapState({
        projectPath: ProjectState('projectPath'),
        stages: ProjectState('stages'),
        cover: ThreedState('cover'),
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
        control: ThreedState('control'),
        animation: ThreedState('animation'),
        specularPower: ThreedState('specularPower'),
        zoom: state => state.board.zoom,
      }),
      ...mapGetters([
        'ambientColor',
        'ambientColorIntensity',
        'cameraPosition',
        'cameraRotationAngle',
        'cameraRotationRate',
        'playSpeed',
        'threeDFile',
      ]),
    },
    mounted() {
      threed = new ThreeD()
      threed.renderer.domElement.id = 'three'
      this.$el.appendChild(threed.renderer.domElement)
      this.init()
    },
    destroyed() {
      if (threed.current.userData.mixer) {
        threed.current.userData.mixer.removeEventListener(
          'animate',
          this.onAnimate
        )
      }
    },
    beforeDestroy() {
      threed.destroy()
    },
    watch: {
      zoom: {
        deep: true,
        handler() {
          this.resize()
        },
      },
      control(type) {
        threed.transformControl.setMode(type)
      },
      ambientColor: {
        handler(color) {
          if (color) threed.ambientLight.color = new THREE.Color(color)
        },
      },
      colorIntensity(intensity) {
        threed.light.intensity = intensity
      },
      ambientColorIntensity(intensity) {
        threed.ambientLight.intensity = intensity
      },
      cameraPosition: {
        deep: true,
        handler(position) {
          if (!position) return
          const { x, y, z } = position
          threed.camera.position.set(x, y, z)
        },
      },
      cameraRotationAngle: {
        deep: true,
        handler(rotation) {
          if (!rotation) return
          const { x, y, z } = rotation
          threed.camera.rotation.set(x, y, z)
        },
      },
      'cameraRotationRate.play'(play) {
        if (play) threed.rotateCamera(this.cameraRotationRate)
        else threed.stopRotateCamera()
      },
      'rotationRate.play'(play) {
        if (play) threed.rotate(this.rotationRate)
        else threed.stopRotate()
      },
      lightColor: {
        handler(color) {
          if (!color) return
          threed.light.color = new THREE.Color(color)
          threed.sphereMaterial.color = threed.light.color
        },
      },
      lightPosition: {
        deep: true,
        handler(value) {
          if (!value) return
          const { x, y, z } = value
          threed.light.position.set(x, y, z)
        },
      },
      position: {
        deep: true,
        handler(value) {
          if (!value) return
          const { x, y, z } = value
          const current = threed.current
          if (current) current.position.set(x, y, z)
        },
      },
      rotation: {
        deep: true,
        handler(value) {
          if (!value) return
          const { x, y, z } = value
          const current = threed.current
          if (current) {
            const skins = threed.getAllSkin()
            if (skins.length) {
              const skin = skins[0]
              const euler = new THREE.Euler()
              euler.set(0, 0, 0)
              euler.setFromRotationMatrix(skin.bindMatrix)
              current.rotation.set(x + euler.x, y + euler.y, z + euler.z)
            } else {
              current.rotation.set(x, y, z)
            }
          }
        },
      },
      scale: {
        deep: true,
        handler(value) {
          if (!value) return
          const { x, y, z } = value
          const current = threed.current
          if (current) {
            const skins = threed.getAllSkin()
            if (skins.length) {
              const skin = skins[0]
              const vector = new THREE.Vector3(1, 1, 1)
              vector.applyMatrix3(
                new THREE.Matrix3().setFromMatrix4(skin.bindMatrix)
              )
              Object.keys(vector).forEach(
                key => (vector[key] = Math.abs(vector[key]))
              )
              current.scale.set(x * vector.x, y * vector.y, z * vector.z)
            } else {
              current.scale.set(x, y, z)
            }
          }
        },
      },
      async diffusionMap(relativePath) {
        if (!relativePath) return
        const url = pathToUrl(
          this.threeDFile.path.replace(
            path.basename(this.threeDFile.path),
            relativePath
          )
        )
        threed.loadDiffusionMap(url)
      },
      async normalMap(relativePath) {
        if (!relativePath) return
        const url = pathToUrl(
          this.threeDFile.path.replace(
            path.basename(this.threeDFile.path),
            relativePath
          )
        )
        threed.loadNormalMap(url)
      },
      playAnimation(play) {
        threed.play(play)
        // threed.current.userData.action.timeScale = this.playSpeed
      },
      'animation.index'(index) {
        if (this.playAnimation) return
        const x = 100 / threed.object3d.animations[0].duration
        threed.activeFrame(index / x)
      },
      specularPower(value) {
        const mesh = threed.current.children.find(
          child => child instanceof THREE.SkinnedMesh
        )
        if (!mesh) return
        mesh.material.shininess = value
      },
      playSpeed(value) {
        threed.setPlaySpeed(value)
      },
    },
    methods: {
      ...mapMutations(['updateThreed', 'updateParameter3D']),
      resize() {
        const { width, height } = this.$el.getBoundingClientRect()
        threed.renderer.domElement.setAttribute('width', width)
        threed.renderer.domElement.setAttribute('height', height)
        const aspect = width / height
        threed.camera.aspect = aspect
        threed.camera.updateProjectionMatrix()
        threed.renderer.setSize(width, height)
      },
      contextmenu(e) {
        e.stopPropagation()
      },
      async init() {
        const threeDFile = this.threeDFile
        this.loaded = false
        if (!threeDFile) return
        window.onresize = this.resize
        setTimeout(this.resize, 0)
        this.$loading()

        threed.cameraControl.addEventListener(
          'change',
          this.onCameraControlChange
        )
        threed.transformControl.setMode(this.control)
        threed.light.intensity = this.colorIntensity
        threed.ambientLight.intensity = this.ambientColorIntensity

        const { url, name, path: threeDFilePath, type } = threeDFile
        this.$events.emit(EV_CANVAS_CLEAR_SELECT)
        const cate = threeDFilePath
          .replace(/\//g, '\\') // 针对Mac
          .match(/\\images\\.*(?=\\)/)
          .toString()
          .replace(/\\images\\/, '')
        const baseurl = pathToUrl(`${this.projectPath}/images/${cate}/`)
        let current
        if (type === 'dae') {
          current = await threed.addDae(url, null, baseurl)
        }
        if (type === 'fbx') {
          current = await threed.addFbx(url, null, baseurl)
        }
        if (type === 'obj') {
          current = await threed.addObj(url, null, baseurl)
        }
        current.addEventListener('change', this.onCurrentChange)

        // Add control
        threed.transformControl.attach(current)
        threed.lightTransformControl.attach(threed.light)
        threed.transformControl.addEventListener(
          'change',
          this.transformControlChange
        )
        threed.lightTransformControl.addEventListener(
          'change',
          this.lightTransformControlChange
        )
        threed.setPlaySpeed(this.playSpeed)

        // Restore
        const threeDFileName = path.basename(threeDFilePath)
        const imaegFileName = this.cover || path.basename(threeDFilePath)
        const extname = path.extname(imaegFileName)
        const jsonFileName = path.basename(imaegFileName, extname) + '.3d.json'
        const jsonPath = threeDFilePath.replace(threeDFileName, jsonFileName)
        const getMap = relativePath => {
          return relativePath
            ? pathToUrl(
              this.threeDFile.path.replace(
                path.basename(this.threeDFile.path),
                relativePath
              )
            )
            : null
        }
        let options = {
          lightColor: this.lightColor,
          lightPosition: this.lightPosition,
          position: this.position,
          rotation: this.rotation,
          scale: this.scale,
          ambientColor: this.ambientColor,
          cameraPosition: this.cameraPosition,
          cameraRotationAngle: this.cameraRotationAngle,
        }
        if (fs.existsSync(jsonPath)) {
          const jsonFile = fs.readJsonSync(jsonPath)
          const stage = this.stages.find(stage => stage.id === jsonFile.stageId)
          const {
            ambientColor,
            cameraPosition,
            cameraRotationAngle,
          } = stage.parameter3D
          const diffusionMap = getMap(jsonFile.diffusionMap)
          const normalMap = getMap(jsonFile.normalMap)
          Object.assign(options, {
            diffusionMap,
            normalMap,
            ambientColor,
            cameraPosition,
            cameraRotationAngle,
          })
        } else {
          const diffusionMap = getMap(this.diffusionMap)
          const normalMap = getMap(this.normalMap)
          Object.assign(options, {
            diffusionMap,
            normalMap,
          })
        }
        this.updateCsv(threeDFilePath)
        await threed.updateScene(options)
        this.loaded = true
        this.$loading().close()
        if (threed.current.userData.mixer) {
          threed.current.userData.mixer.addEventListener(
            'animate',
            this.onAnimate
          )
        }
      },
      async updateCsv(threeDFilePath) {
        const csvPath = path.join(
          path.dirname(threeDFilePath),
          path.basename(threeDFilePath, path.extname(threeDFilePath)) + '.csv'
        )
        if (fs.existsSync(csvPath)) {
          const data = await csv().fromFile(csvPath)
          this.updateThreed({ key: 'csv', value: data })
        } else {
          this.updateThreed({ key: 'csv', value: [] })
        }
      },
      onAnimate() {
        const x = 100 / threed.object3d.animations[0].duration
        const value =
          (threed.current.userData.mixer.time %
            threed.object3d.animations[0].duration) *
          x
        this.updateThreed({
          key: 'animation.index',
          value: +value.toFixed(1),
        })
      },
      showTool(visible) {
        threed.showTool(visible)
      },
      enableControl(enable) {
        threed.enableControl(enable)
      },
      rotateCurrent(e) {
        if (threed.transformControl.enabled === false) return
        if (e.status === 'start') {
          return (this.rotateCurrent.last = e)
        } else {
          const deltaX = -(this.rotateCurrent.last.offsetX - e.offsetX) / 10
          const deltaY = -(this.rotateCurrent.last.offsetY - e.offsetY) / 10
          const current = threed.current
          const { x, y, z } = current.rotation
          current.rotation.set(x + deltaY, y + deltaX, z)
          current.dispatchEvent({
            type: 'change',
            changed: {
              rotation: {
                x: round(current.rotation.x, 2),
                y: round(current.rotation.y, 2),
                z: round(current.rotation.z, 2),
              },
            },
          })

          this.rotateCurrent.last = e
        }
      },
      scaleCurrent(e) {
        if (threed.transformControl.enabled === false) return
        const current = threed.current
        const { x, y, z } = current.scale
        const offset = e.wheelDelta > 0 ? 0.01 : -0.01
        current.scale.set(x + offset, y + offset, z + offset)
        current.dispatchEvent({
          type: 'change',
          changed: {
            scale: {
              x: round(current.scale.x, 2),
              y: round(current.scale.y, 2),
              z: round(current.scale.z, 2),
            },
          },
        })
      },
      transformControlChange(e) {
        const current = threed.current
        const getVector = vector => {
          return {
            x: round(current[vector].x, 2),
            y: round(current[vector].y, 2),
            z: round(current[vector].z, 2),
          }
        }
        const position = getVector('position')
        const rotation = getVector('rotation')
        const scale = getVector('scale')
        if (
          isEqual(position, this.position) &&
          isEqual(rotation, this.rotation) &&
          isEqual(scale, this.scale)
        ) {
          return
        }

        current.dispatchEvent({
          type: 'change',
          changed: {
            position,
            rotation,
            scale,
          },
        })
      },
      lightTransformControlChange(e) {
        const current = threed.current
        const lightPosition = {
          x: round(threed.light.position.x, 2),
          y: round(threed.light.position.y, 2),
          z: round(threed.light.position.z, 2),
        }
        if (isEqual(lightPosition, this.lightPosition)) return
        current.dispatchEvent({
          type: 'change',
          changed: {
            lightPosition,
          },
        })
      },
      onCurrentChange(e) {
        for (const key of Object.keys(e.changed)) {
          let value = e.changed[key]
          const skins = threed.getAllSkin()
          if (key === 'scale') {
            if (skins.length) {
              const skin = skins[0]
              const vector = new THREE.Vector3(1, 1, 1)
              vector.applyMatrix3(
                new THREE.Matrix3().setFromMatrix4(skin.bindMatrix)
              )
              Object.keys(vector).forEach(
                key => (vector[key] = Math.abs(vector[key]))
              )
              ;['x', 'y', 'z'].forEach(key => {
                this.updateThreed({
                  key: `scale.${key}`,
                  value: value[key] / vector[key],
                })
              })
            } else {
              ;['x', 'y', 'z'].forEach(key => {
                this.updateThreed({
                  key: `scale.${key}`,
                  value: value[key],
                })
              })
            }
            return
          }
          if (key === 'rotation') {
            if (skins.length) {
              const skin = skins[0]
              const euler = new THREE.Euler()
              euler.set(0, 0, 0)
              euler.setFromRotationMatrix(skin.bindMatrix)
              ;['x', 'y', 'z'].forEach(key => {
                this.updateThreed({
                  key: `rotation.${key}`,
                  value: value[key] - euler[key],
                })
              })
            } else {
              ;['x', 'y', 'z'].forEach(key => {
                this.updateThreed({
                  key: `rotation.${key}`,
                  value: value[key],
                })
              })
            }
            continue
          }
          this.updateThreed({ key, value })
        }
      },
      @Debounce(100)
      onCameraControlChange(e) {
        const { position, rotation } = e.target.object
        const axis = ['x', 'y', 'z']
        axis.forEach(a => {
          this.updateParameter3D({
            key: `cameraPosition.${a}`,
            value: round(position[a], 2),
          })
        })
        axis.forEach(a => {
          this.updateParameter3D({
            key: `cameraRotationAngle.${a}`,
            value: round(rotation[a], 2),
          })
        })
      },
    },
  }
</script>

<style scoped lang="stylus">
  .threed-container
    position absolute
    top 0
    left 0
    width 100%
    height 100%
    z-index 200
</style>