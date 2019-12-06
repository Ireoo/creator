import { delay } from 'lib/utils'
import * as THREE from 'three'

import fs from 'fs-extra'
import path from 'path'
import { get } from 'lodash/fp'
import { flattenDeep } from 'lodash'
import { urlToPath } from 'lib/helper'
import { Message, MessageBox } from 'element-ui'

window.THREE = THREE
require('three/examples/js/controls/OrbitControls.js')
require('three/examples/js/controls/TransformControls.js')
require('three/examples/js/controls/DragControls.js')
require('three/examples/js/loaders/ColladaLoader.js')
const inflate = require('three/examples/js/libs/inflate.min.js')
Object.assign(window, inflate)
require('three/examples/js/loaders/FBXLoader.js')
require('three/examples/js/loaders/DDSLoader.js')
require('three/examples/js/loaders/MTLLoader.js')
require('three/examples/js/loaders/OBJLoader.js')

export default class ThreeD {
  scene
  camera
  renderer
  ambientLight
  light
  sphereMaterial
  clock
  gridHelper
  cameraControl
  transformControl
  lightTransformControl
  object3d
  playing
  requestaAnimationId
  get uid() {
    return Date.now()
  }
  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(50)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    })
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1)
    this.light = new THREE.PointLight(0xffffff, 1)
    const sphere = new THREE.SphereGeometry(2, 16, 8)
    this.sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this.light.add(new THREE.Mesh(sphere, this.sphereMaterial))
    this.clock = new THREE.Clock()
    this.gridHelper = new THREE.GridHelper(30, 20)
    this.gridHelper.material.opacity = 0.8
    this.cameraControl = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.transformControl = new THREE.TransformControls(
      this.camera,
      this.renderer.domElement
    )
    this.scene.add(this.transformControl)
    this.lightTransformControl = new THREE.TransformControls(
      this.camera,
      this.renderer.domElement
    )
    this.scene.add(this.lightTransformControl)

    this.scene.add(this.gridHelper)
    this.scene.add(this.ambientLight)
    this.scene.add(this.light)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.gammaInput = true
    this.renderer.gammaOutput = true
    this.renderer.shadowMap.enabled = true
    this.renderer.setClearColor(0x000000, 0)

    this.lightTransformControl.enabled = true
    this.transformControl.enabled = true
    this.cameraControl.enabled = false

    const render = () => {
      this.requestaAnimationId = requestAnimationFrame(render)
      this.transformControl.update()
      this.lightTransformControl.update()
      // this.cameraControl.update()
      this.renderer.render(this.scene, this.camera)
      const delta = this.clock.getDelta()
      this.scene.children.forEach(child => {
        const mixer = child.userData.mixer
        if (!mixer) return
        mixer.update(delta)
        if (this.playing) { mixer.dispatchEvent({ type: 'animate' }) }
      })
    }
    render()
  }
  destroy() {
    cancelAnimationFrame(this.requestaAnimationId)
  }
  get current() {
    return this.scene.getObjectByName('current')
  }
  async addDae(url, name, baseurl) {
    name = name || 'current'
    const loader = new THREE.ColladaLoader()
    if (baseurl) loader.setPath(baseurl)
    loader.options.convertUpAxis = true
    const object3d = await new Promise(resolve => loader.load(url, resolve))
    this.object3d = object3d
    let obj = this.scene.getObjectByName(name)
    if (obj) this.scene.remove(obj)
    obj = object3d.scene
    obj.name = name
    this.scene.add(obj)
    if (object3d.animations.length) {
      obj.userData.mixer = new THREE.AnimationMixer(obj)
      const animationClip = get('animations.0')(this.object3d)
      obj.userData.action = obj.userData.mixer.clipAction(animationClip)
    }
    await this.loadDiffusionMap(name)
    this.checkImages(object3d.library.images, baseurl)
    return obj
  }
  async addFbx(url, name) {
    name = name || 'current'
    const loader = new THREE.FBXLoader()
    const object3d = await new Promise(resolve => loader.load(url.replace(/\\/g, '/'), resolve, undefined, console.error))
    console.log(object3d)
    this.object3d = object3d
    let obj = this.scene.getObjectByName(name)
    if (obj) this.scene.remove(obj)
    obj = object3d
    obj.name = name
    this.scene.add(obj)
    if (obj.animations.length) {
      obj.userData.mixer = new THREE.AnimationMixer(obj)
      const animationClip = get('animations.0')(obj)
      obj.userData.action = obj.userData.mixer.clipAction(animationClip)
    }
    await this.loadDiffusionMap(name)
    return obj
  }
  async addObj(url, name) {
    name = name || 'current'
    url = url.replace(/\\/g, '/')
    const mtlURL = url.replace('.obj', '.mtl')
    const mtlName = path.basename(mtlURL)
    const objName = path.basename(url)
    let loader = new THREE.MTLLoader()
    loader.setPath(path.dirname(url) + '/')
    const materials = await new Promise(resolve => loader.load(mtlName, resolve, undefined, console.error))
    materials.preload()
    loader = new THREE.OBJLoader()
    loader.setMaterials(materials)
    loader.setPath(path.dirname(url) + '/')
    const object3d = await new Promise(resolve => loader.load(objName, resolve, undefined, console.error))
    this.object3d = object3d
    let obj = this.scene.getObjectByName(name)
    if (obj) this.scene.remove(obj)
    obj = object3d
    obj.name = name
    this.scene.add(obj)
    return obj
  }
  async updateScene({
    lightColor,
    lightPosition,
    position,
    rotation,
    scale,
    diffusionMap,
    normalMap,
    ambientColor,
    cameraPosition,
    cameraRotationAngle,
    rotationRate,
    cameraRotationRate,
  }, name = 'current') {
    const obj = this.scene.getObjectByName(name)
    this.ambientLight.color = new THREE.Color(ambientColor)
    this.camera.position.set(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    )
    this.camera.rotation.set(
      cameraRotationAngle.x,
      cameraRotationAngle.y,
      cameraRotationAngle.z
    )
    this.light.color = new THREE.Color(lightColor)
    this.sphereMaterial.color = this.light.color
    this.light.position.set(
      lightPosition.x,
      lightPosition.y,
      lightPosition.z
    )
    obj.position.set(position.x, position.y, position.z)
    obj.rotation.set(rotation.x, rotation.y, rotation.z)
    const skins = this.getAllSkin(obj)
    if (skins.length) {
      const skin = skins[0]
      const vector = new THREE.Vector3(1, 1, 1)
      vector.applyMatrix3((new THREE.Matrix3()).setFromMatrix4(skin.bindMatrix))
      Object.keys(vector).forEach((key) => vector[key] = Math.abs(vector[key]))
      obj.scale.set(scale.x * vector.x, scale.y * vector.y, scale.z * vector.z)

      const euler = new THREE.Euler()
      euler.set(0, 0, 0)
      euler.setFromRotationMatrix(skin.bindMatrix)
      obj.rotation.set(rotation.x + euler.x, rotation.y + euler.y, rotation.z + euler.z)
    } else {
      obj.scale.set(scale.x, scale.y, scale.z)
      obj.rotation.set(rotation.x, rotation.y, rotation.z)
    }
  }
  checkImages(obj, baseurl) {
    const noneExistent = Object.keys(obj).map(key => {
      const relativePath = obj[key].build
      const imagePath = path.join(urlToPath(baseurl), relativePath)
      return imagePath
    }).filter(imagePath => {
      return !fs.existsSync(imagePath)
    })
    if (noneExistent.length > 0) {
      Message.warning({
        message: `File not found: ${noneExistent.join('\n\n')}`,
        duration: 0,
        showClose: true,
      })
    }
  }
  // Maya导出的dae看不到材质，只好重新加载
  async loadDiffusionMap(name = 'current') {
    // 等待colladLoader把image加载完成，以便下面获取图片地址
    await new Promise(resolve => setTimeout(resolve, 100))
    const obj = this.scene.getObjectByName(name)
    const skins = this.getAllSkin(obj)

    for (const skinMesh of skins) {
      const timeout = 5000
      let count = 0
      while (!get('material.map.image.src')(skinMesh) && count < timeout) {
        count += 100
        await delay(100)
      }
      const url = get('material.map.image.src')(skinMesh)
      const textureLoader = new THREE.TextureLoader()
      const texture = textureLoader.load(url)
      const newMaterial = new THREE.MeshLambertMaterial({ map: texture })
      if (get('object3d.animations[0].tracks.length')(this)) {
        skinMesh.material.map = texture
      } else {
        skinMesh.material = newMaterial
      }
    }
  }
  play(play = true, name = 'current') {
    const obj = this.scene.getObjectByName(name)
    const animationClip = get('animations.0')(this.object3d)
    const mixer = obj.userData.mixer
    if (!mixer) return
    const action = mixer.clipAction(animationClip)
    action.timeScale = obj.userData.timeScale || 1
    if (animationClip && play) {
      // this.clock.start()
      action.stop()
      action.startAt(0).play()
      action.paused = false
      this.playing = true
    } else {
      action.paused = true
      // action.stop()
      // this.clock.stop()
      this.playing = false
    }
  }
  showTool(visible) {
    this.gridHelper.visible = visible
    this.light.children[0].visible = visible
    this.transformControl.visible = visible
    this.lightTransformControl.visible = visible
  }
  enableControl(enable) {
    this.cameraControl.enabled = enable
    this.transformControl.enabled = !enable
  }

  rotate(rotationRate, name = 'current') {
    const obj = this.scene.getObjectByName(name)
    obj.userData.originRot = {
      x: obj.rotation.x,
      y: obj.rotation.y,
      z: obj.rotation.z,
    }
    obj.userData.interval = setInterval(() => {
      obj.rotation.x += rotationRate.x * Math.PI / 180
      obj.rotation.y += rotationRate.y * Math.PI / 180
      obj.rotation.z += rotationRate.z * Math.PI / 180
    }, 0)
  }
  stopRotate(name = 'current') {
    const obj = this.scene.getObjectByName(name)
    if (obj.userData.interval) clearInterval(obj.userData.interval)
    if (obj.userData.originRot) {
      obj.rotation.x = obj.userData.originRot.x
      obj.rotation.y = obj.userData.originRot.y
    }
  }
  rotateCamera(rotationRate, name = 'current') {
    const obj = this.scene.getObjectByName(name)
    obj.userData.originRot = {
      x: this.camera.rotation.x,
      y: this.camera.rotation.y,
      z: this.camera.rotation.z,
    }
    obj.userData.interval = setInterval(() => {
      this.camera.rotation.x += rotationRate.x * Math.PI / 180
      this.camera.rotation.y += rotationRate.y * Math.PI / 180
    }, 0)
  }
  stopRotateCamera(name = 'current') {
    const obj = this.scene.getObjectByName(name)
    if (obj.userData.interval) clearInterval(obj.userData.interval)
    if (obj.userData.originRot) {
      this.camera.rotation.x = obj.userData.originRot.x
      this.camera.rotation.y = obj.userData.originRot.y
    }
  }
  activeFrame(index) {
    const current = this.scene.getObjectByName('current')
    const mixer = current.userData.mixer
    if (!get('userData.mixer')(current)) return
    const action = current.userData.action
    action.time = index
    action.timeScale = 0.00001
    // action.enabled = false
    action.play()
  }
  setPlaySpeed(value, name = 'current') {
    const obj = this.scene.getObjectByName(name)
    if (!get('userData.mixer')(obj)) return
    obj.userData.action.timeScale = value
    obj.userData.timeScale = value
  }
  //
  getAllSkin(obj?: any) {
    if (!obj) obj = this.current
    const getChildren = obj => {
      const arr = flattenDeep(obj.children.map(child => {
        if (child.children.length) return getChildren(child)
        else return child
      }))
      arr.unshift(obj)
      return arr
    }
    return getChildren(obj).filter(child => child instanceof THREE.SkinnedMesh)
  }
}
