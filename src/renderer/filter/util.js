// @flow
import { trimZero } from 'lib/utils'
import { capitalize, round } from 'lodash'

export default {
  toFixed(num: number, size: number): string {
    return num.toFixed(size)
  },
  trimZero,
  trimZero2(num: number): string {
    return trimZero(num, 2)
  },
  capitalize(text: string): string {
    return capitalize(text)
  },
  percent(num: number): string {
    return parseInt(num * 100) + '%'
  },
  inline(s: string): string {
    return s.replace('\n', '').trim()
  },
  radianToDegree(n: number): number {
    return round(n * 180 / Math.PI, 2)
  },
}
