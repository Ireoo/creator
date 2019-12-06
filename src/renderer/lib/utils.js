// @flow
import { remote, child_process } from 'electron'
import R, { toLower, prop, pick, last } from 'ramda'
import { execFile } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'
import sizeOf from 'image-size'
import resizeImg from 'resize-img'
import iconv from 'iconv-lite'
import gifsicle from 'gifsicle'
import { MEDIA_MAX_WIDTH, MEDIA_MAX_HEIGHT } from 'type/constants'
import imageType from 'image-type'
import Jimp from 'jimp'

import type { Component } from 'vue'

export const isArray = R.is(Array)
export const isFunction = R.is(Function)
export const isNumber = R.is(Number)
export const isBindable = R.both(isFunction, R.hasOwnProperty('prototype'))

/**
 * a helper function to compose components to a component object
 * every component must be have a name property, must be have
 * @param {Component[]} components
 * @param {Component.name} components.name
 * @returns {Object<Component>}
 */
export function MountComponents(...components: Array<Component>) {
  return components.reduce((components, component) => {
    components[component.name] = component
    return components
  }, {})
}

/**
 * object[prop] maybe function or other type
 * if function, return function result after run
 * if other type, return directly
 * @param {Object} object
 * @param {String} prop
 * @param {any[]} args
 * @return {any}
 */
export function getFunctionalData(object: any, prop: string, ...args: any) {
  return doFunctionalData(object[prop])
}

/**
 * value maybe function or other type
 * if function, return function result after run
 * if other type, return directly
 * @param {any|Function} value
 * @param {any[]} args
 * @return {any}
 */
export function doFunctionalData(value: any, ...args: any) {
  return isFunction(value) ? value(...args) : value
}

export function isChangeParameter(parameter: string) {
  return parameter.endsWith('c')
}

export function tan(deg: number): number {
  return Math.tan(deg / (180 / Math.PI))
}

export function atan(val: number): number {
  return Math.atan(val) * (180 / Math.PI)
}

export function atan2(y: number, x: number) {
  return Math.atan2(y, x) * (180 / Math.PI)
}

export function moveAngle(initAngle: number, initEdge: number, offsetEdge: number): number {
  return atan(offsetEdge / initEdge + tan(initAngle))
}

export function rotatePoint(point: [number, number], base: [number, number], angle: number): [number, number] {
  // angle unit is radian
  const [x, y] = point
  const [rx, ry] = base
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    (x - rx) * cos - (y - ry) * sin + rx,
    (x - rx) * sin + (y - ry) * cos + ry,
  ]
}

export function elementOffset(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const win = element.ownerDocument.defaultView
  return {
    top: rect.top + win.pageYOffset,
    left: rect.left + win.pageXOffset,
  }
}

export function newImageDOM(src: string, cb?: Function): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement('img')
    image.src = src
    image.onload = function() {
      resolve(image)
      cb && cb(null, image)
    }
    image.onerror = function(e) {
      reject(e)
      cb && cb(e)
    }
  })
}

export function newVideoDOM(src: string, cb?: Function): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = src
    video.addEventListener('canplay', e => {
      resolve(video)
      cb && cb(null, video)
    })
    video.onerror = function(e) {
      reject(e)
      cb && cb(e)
    }
  })
}

export function fileType(url: string): 'video' | 'image' | 'music' | 'dae' | '' {
  url = toLower(url)
  if (/\.(mp4)$/.test(url)) return 'video'
  if (/\.(jpg|jpeg|png|bmp|gif)$/.test(url)) return 'image'
  if (/\.(mp3|m4a|wav)$/.test(url)) return 'music'
  return path.extname(url).replace('.', '')
}

export async function fixImgExtName(p: string) {
  const extName = path.extname(p).replace('.', '')
  const buffer = fs.readFileSync(p)
  const checkExtName = imageType(buffer).ext
  if (extName === checkExtName) return true
  const newPath = p.replace(path.extname(p), `.${checkExtName}`)
  fs.renameSync(p, newPath)
}

export function calcZoom(raw: number, limit: number, base: number, step: number): number {
  const zoom = limit / raw
  const times = (zoom - base) / step
  return base + step * times
}

export function trimZero(num: string | number, fixed: number = 0): string {
  return (+(+num).toFixed(fixed)).toString()
}

export function trimZero2(num: string | number) {
  return trimZero(num, 2)
}

export function imageSize(path: string): { width: number, height: number, type: string } {
  return sizeOf(path)
}

export function resizeImage(path: string, options: any): Promise<any> {
  const buf = fs.readFileSync(path)
  return resizeImg(buf, options)
}

// 压缩到32倍数尺寸
export async function compressImage(path: string) {
  const image = imageSize(path)
  const { width, height, type } = image
  const maxSize = {
    width: MEDIA_MAX_WIDTH,
    height: MEDIA_MAX_HEIGHT,
  }
  let option = {}
  if (width > maxSize.width || height > maxSize.height) {
    const key = width / maxSize.width > height / maxSize.height ? 'width' : 'height'
    const ratio = getZoomRatio(image[key], image[key] - maxSize[key])
    option.height = height * ratio
    option.width = width * ratio
  } else {
    if (width % 32 === 0) return
    option = pick(['width', 'height'], image)
  }
  option = sizeMulti32(option)
  await compressImageToSize(path, option)
}

export async function compressImageToSize(path: string, option: { width: number, height: number }): Promise<any> {
  const { type } = imageSize(path)
  if (type === 'gif') {
    await compressGif(path, option)
    return
  }

  await Jimp.read(path)
    .then(image => {
      return image
        .resize(option.width, option.height) // resize
        .writeAsync(path) // save
    })
}

export function compressGif(path: string, option: { width: number, height: number }): Promise<*> {
  return new Promise(resolve => {
    execFile(gifsicle, ['--resize', `${option.width}x${option.height}`, '--colors', `256`, '-o', path, path], resolve)
  })
}

export function sizeMulti32(size: { width: number, height: number }): { width: number, height: number } {
  const surplus = size.width % 32
  if (surplus !== 0) {
    const ratio = getZoomRatio(size.width, surplus)
    size.height = size.height * ratio
    size.width -= surplus
  }
  return size
}

export function getZoomRatio(num: number, difference: number): number {
  return (num - difference) / num
}

export function limitRange(number: number, min: number, max: number) {
  if (number > max) return max
  if (number < min) return min
  return number
}

export function writeFileWithEncode(path: string, streamString: string, encode: string = 'Windows936'): void {
  const stream = iconv.encode(streamString, 'Windows936')
  const writerStream = fs.createWriteStream(path)
  writerStream.write(stream)
  writerStream.end()
}

/**
 * remove specific child from the array,return the deleted array.
 * @param {*} child
 */
export function removeChild(arr: Array<any>, child: any): Array<any> {
  const index = arr.findIndex(e => e === child)
  if (!~index) return []
  return arr.splice(index, 1)
}

export function delay(s: number): Promise<*> {
  return new Promise(resolve => setTimeout(resolve, s))
}

export function createShoutcutFile(projectPath: string): void {
  // create quick start file
  const shotcutFileName = 'project.ic'
  return fs.writeFileSync(path.join(projectPath, shotcutFileName), '')
}

export function scrollTo(element, speed = 0, container) {
  const elRect = element.getBoundingClientRect()
  if (container) {
    const cRect = container.getBoundingClientRect()
    const top = container.scrollTop + elRect.top - cRect.top
    container.scrollTo(0, top)
  } else {
    const top = window.pageYOffset + elRect.top
    window.scrollTo(0, top)
  }
}
