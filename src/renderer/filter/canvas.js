import {mapObjIndexed} from 'ramda'

const boxAttr = ['left', 'top', 'right', 'bottom', 'width', 'height']

export default {
  ratioBox(value, ratio) {
    return mapObjIndexed((v, k) => {
      if (boxAttr.includes(k)) return v * ratio + 'px'
      else return v
    }, value)
  },
}
