<template>
  <section></section>
</template>

<script>
  import ThreeD from 'lib/threed.js'
  import { mapState, mapGetters } from 'vuex'
  import path from 'path'
  import fs from 'fs-extra'
  import { pathToUrl, urlToPath, series1000 } from 'lib/helper'
  import { isThreeDImage, getFile } from 'lib/project'
  import { random } from 'lodash'
  import { Loading } from 'element-ui'
  let threed
  export default {
    name: 'IPreview3D',
    props: {
      layers: {
        type: Array,
      },
    },
    async mounted() {
      threed = new ThreeD()
      threed.showTool(false)
      threed.enableControl(false)
      this.$el.appendChild(threed.renderer.domElement)
      threed.renderer.domElement.id = Date.now()
      this.onLayersChange()
      window.onresize = this.resize
      setTimeout(this.resize, 0)
    },
    computed: {
      ...mapState({
        zoom: state => state.board.zoom,
        stages: state => state.project.stages,
        projectPath: state => state.project.projectPath,
      }),
      ...mapGetters(['threeDFile']),
    },
    watch: {
      zoom() {
        this.resize()
      },
      async layers() {
        this.onLayersChange()
      },
    },
    methods: {
      async onLayersChange() {
        await new Promise(resolve => this.$nextTick(resolve))
        const loading = Loading.service({
          lock: true,
          text: 'Loading',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)',
        })

        threed.scene.children.forEach(child => {
          if (child instanceof THREE.Group) threed.scene.remove(child)
        })
        for (let layer of this.layers) {
          await this.init(layer)
        }
        loading.close()
      },
      resize() {
        const { width, height } = this.$el.getBoundingClientRect()
        threed.renderer.domElement.setAttribute('width', width)
        threed.renderer.domElement.setAttribute('height', height)
        const aspect = width / height
        threed.camera.aspect = aspect
        threed.camera.updateProjectionMatrix()
        threed.renderer.setSize(width, height)
      },
      async init(layer) {
        if (!layer || layer.elementType === 'obj') return
        const $path = urlToPath(layer.src)
        const jsonPath = isThreeDImage($path)
        if (!jsonPath) return null

        const jsonFile = fs.readJsonSync(jsonPath)
        const threeDFileName = jsonFile.fileName
        const threeDFile = getFile(
          jsonPath.replace(path.basename(jsonPath), threeDFileName)
        )

        const { url, name, path: threeDFilePath } = threeDFile
        const cate = threeDFilePath
          .replace(/\//g, '\\') // 针对Mac
          .match(/\\images\\.*(?=\\)/)
          .toString()
          .replace(/\\images\\/, '')
        const baseurl = pathToUrl(`${this.projectPath}/images/${cate}/`)
        await threed.addDae(url, layer.id, baseurl)

        // Restore
        const stage = this.stages.find(stage => stage.id === jsonFile.stageId)
        const {
          ambientColor,
          cameraPosition,
          cameraRotationAngle,
          cameraRotationRate,
        } = stage.parameter3D

        const getMap = relativePath => {
          return relativePath
            ? pathToUrl(
              threeDFile.path.replace(
                path.basename(threeDFile.path),
                relativePath
              )
            )
            : null
        }
        const diffusionMap = getMap(jsonFile.diffusionMap)
        const normalMap = getMap(jsonFile.normalMap)

        await threed.updateScene(
          {
            lightColor: jsonFile.lightColor,
            lightPosition: jsonFile.lightPosition,
            position: jsonFile.position,
            rotation: jsonFile.rotation,
            scale: jsonFile.scale,
            diffusionMap,
            normalMap,
            ambientColor,
            cameraPosition,
            cameraRotationAngle,
          },
          layer.id
        )
        threed.play(true, layer.id)
        threed.rotate(jsonFile.rotationRate, layer.id)
        threed.rotateCamera(cameraRotationRate, layer.id)
      },
    },
  }
</script>

<style lang="stylus" scoped>
  section
    width inherit
    height inherit
    z-index 30
    position absolute
</style>
