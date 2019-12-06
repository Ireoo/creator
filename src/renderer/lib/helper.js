// @flow
import url from 'url'
import path from 'path'
import { flatten } from 'ramda'
import { debounce } from 'lodash'
import type { SourceType } from 'type/stage'

type Decorator = (target: Object, key: string, desc: Object) => Object
type BoundDecorator = {
  (target: Object, key: string, desc: Object): Object,
  bind(value: string): BoundDecorator,
}

function ConfirmDecorator(target, key, descriptor, message, ...confirmArgs) {
  const func = descriptor.value
  descriptor.value = function(...args) {
    if (typeof message === 'function') {
      message = message.apply(this, args)
    }
    return this.$confirm(message, ...confirmArgs).then(() => {
      console.log(func.apply)
      return func.apply(this, args)
    }).catch(e => {
      // cancel
    })
  }
  return descriptor
}

function BindDecorator(decorator: Function, ...args: any[]): BoundDecorator {
  const bindInfo = {
    bound: false,
    bindValue: null,
  }

  const decoratorWrapper: Object = (target, key, descriptor) => {
    descriptor = decorator(target, key, descriptor, ...args)
    if (bindInfo.bound) {
      descriptor.value = descriptor.value.bind(bindInfo.bindValue)
    }
    return descriptor
  }

  decoratorWrapper.bind = (value) => {
    bindInfo.bound = true
    bindInfo.bindValue = value
    return decoratorWrapper
  }

  return decoratorWrapper
}

export function Confirm(message: string, ...confirmArgs: any[]): Decorator {
  return BindDecorator(ConfirmDecorator, message, ...confirmArgs)
}

export function DeleteConfirm(message: string | (...args: any) => string) {
  return BindDecorator(ConfirmDecorator, message, 'Delete', {
    type: 'warning',
  })
}

export function ValidateForm(...refs: string[]): Decorator {
  return (target, key, descriptor) => {
    const func = descriptor.value
    descriptor.value = function(...args) {
      return Promise.all(flatten(refs.map(ref => this.$refs[ref])).map(form => {
        if (form.validate) {
          return new Promise((resolve, reject) => form.validate(resolve))
        }
        return Promise.resolve(true)
      })).then(results => results.reduce((pre, cur) => pre && cur, true))
        .then(valid => {
          return func.call(this, valid, ...args)
        })
    }
    return descriptor
  }
}

export function Debounce(time: number): Decorator {
  return (target, key, descriptor) => {
    const func = descriptor.value
    descriptor.value = debounce(function(...args) {
      return func.apply(this, args)
    }, time)
    return descriptor
  }
}

export function getSourceType(source: SourceType): string {
  if (source.directory.toLowerCase() === 'same' || source.file.toLowerCase() === 'same') return 'same'
  if (source.file.toLowerCase() === 'random') return 'random'
  return ''
}

export function isSourceReference(source: SourceType): boolean {
  return getSourceType(source) === 'same'
}

export function isSourceRandom(source: SourceType): boolean {
  return getSourceType(source) === 'random'
}

export function getSourceRelativeSrc(source: SourceType): string {
  if (!getSourceType(source)) {
    return path.join(source.directory, source.file)
  }
  return source.reference
}

export function getSourceSrc(projectPath: string, source: SourceType): string {
  // return url.format({
  //   protocol: 'file',
  //   pathname: path.join(projectPath, getSourceRelativeSrc(source)),
  // })
  return 'file:///' + path.join(projectPath, getSourceRelativeSrc(source))
}

export function urlToPath(url: string): string {
  // replace: file:///xx/aaa.png?1529118405245 -> file:///xx/aaa.png
  // url = url.replace(/\?.*$/, '')
  url = url.replace(/\\/g, '\/').replace('file:\/\/\/', '')
  // match: windows || mac || linux
  let $path: any =
    url.match(/[a-zA-Z]:\/[a-zA-Z].*/) ||
    url.match(/^(\/|)Users\/.*/) ||
    url.match(/^(\/|)(bin|boot|cdrom|dev|etc|home|lib|lib64|media|mnt|opt|propc|root|run|sbin|snap|srv|sys|tmp|usr|var)\/.*/)
  if (!$path) {
    console.error('[Error] urlToPath: $path is ' + $path)
    return url
  }
  $path = $path[0].replace(/(\/|\\)/g, path.sep)
  // linux
  if ($path.match(/^(bin|boot|cdrom|dev|etc|home|lib|lib64|media|mnt|opt|propc|root|run|sbin|snap|srv|sys|tmp|usr|var)/)) $path = '\/' + $path
  // 针对mac
  if ($path.match(/^Users/)) $path = $path.replace(/^Users/, '\/Users')
  return decodeURI($path)
}

export function pathToUrl(path: string): string {
  return 'file:///' + path.replace(/(\/|\\)/g, '\/')
}

export const series1000 = function(fn: Function) {
  if (!series1000.functions) series1000.functions = []
  // $FlowFixMe
  const functions: Function[] = series1000.functions
  functions.push(fn)
  if (functions.length === 1) {
    const interval = setInterval(function run() {
      functions[0]()
      functions.shift()
      if (!functions.length) clearInterval(interval)
      return run
    }, 1000)
  }
}

export function points2rectangle(point1: { x: number, y: number }, point2: { x: number, y: number }) {
  const pointLT = { x: 0, y: 0 }
  const pointLB = { x: 0, y: 0 }
  const pointRB = { x: 0, y: 0 }
  const pointRT = { x: 0, y: 0 }

  pointLT.x = (point1.x <= point2.x) ? point1.x : point2.x
  pointLT.y = (point1.y <= point2.y) ? point1.y : point2.y

  pointRB.x = (point1.x >= point2.x) ? point1.x : point2.x
  pointRB.y = (point1.y >= point2.y) ? point1.y : point2.y

  pointRT.x = pointRB.x
  pointRT.y = pointLT.y

  pointLB.x = pointLT.x
  pointLB.y = pointRB.y

  return {
    x: pointLT.x,
    y: pointLT.y,
    width: pointRT.x - pointLT.x,
    height: pointLB.y - pointLT.y,
  }
}
