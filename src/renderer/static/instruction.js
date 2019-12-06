import path from 'path'
import fs from 'fs'
const fontsPath = path.join(__static, 'fonts')
const fonts = fs.readdirSync(fontsPath).map(filename => path.basename(filename, '.ttf'))

// load local fonts
const head = document.getElementsByTagName('head')[0]
let styletext = ''
for (const font of fonts) {
  styletext += `
    @font-face{
      font-family:${font}
      src:url("/static/fonts/${font}.ttf")format('woff')
    }
    .font-${font}{
      font-family:${font}
    }
  `
}
const style = document.createElement('style')
style.textContent = styletext
style.id = 'fonts'
head.appendChild(style)

function buildImageMap(map) {
  const o = {}
  for (const first of Object.keys(map)) {
    const prefix = map[first].prefix
    for (const second of Object.keys(map[first]).filter(name => name !== 'prefix')) {
      o[`${first}-${second}`] = prefix + '/' + map[first][second]
    }
  }
  return o
}

const commonMotion = {
  1: 'up.gif',
  2: 'down.gif',
  3: 'up-down.gif',
  4: 'left.gif',
  5: 'right.gif',
  6: 'left-right.gif',
  7: 'forward.gif',
  8: 'backward.gif',
  9: 'forward-backward.gif',
}

const twoHandsMap = {
  prefix: 'two-hands',
  1: 'up.gif',
  2: 'down.gif',
  3: 'rotation.gif',
  4: 'anti-rotation.gif',
}

const hitMap = {
  prefix: 'hit',
  1: 'open-hand.gif',
  2: 'lasso-hand.gif',
  3: 'close-hand.gif',
  4: 'head.gif',
}

export default {
  icon: {
    music: require('@/assets/icon/instruction/music.svg'),
    photo: require('@/assets/icon/instruction/photo.svg'),
    image: require('@/assets/icon/instruction/image.svg'),
    video: require('@/assets/icon/instruction/video.svg'),
    text: require('@/assets/icon/instruction/text.svg'),
    command: require('@/assets/icon/instruction/command.svg'),
    goody: require('@/assets/icon/instruction/goody.svg'),
  },
  color: {
    image: '#A6DD73',
    music: '#548CC8',
    photo: '#F0CF6C',
    video: '#85DE86',
    text: '#E97D6B',
    command: '#16B3C9',
    goody: '#d4237a',
  },
  transitionImageMap: buildImageMap({
    2: hitMap,
    4: {
      prefix: 'hand',
      1: 'open-hand.gif',
      2: 'lasso-hand.gif',
      3: 'close-hand.gif',
    },
    5: twoHandsMap,
    6: {
      prefix: 'head',
      ...commonMotion,
    },
    7: {
      prefix: 'open-hand',
      ...commonMotion,
    },
    8: {
      prefix: 'close-hand',
      ...commonMotion,
    },
    9: {
      prefix: 'lasso-hand',
      ...commonMotion,
    },
  }),
  actionImageMap: {
    2: twoHandsMap,
    3: hitMap,
    4: {
      prefix: 'head',
      ...commonMotion,
    },
    5: {
      prefix: 'open-hand',
      ...commonMotion,
    },
    6: {
      prefix: 'close-hand',
      ...commonMotion,
    },
    7: {
      prefix: 'lasso-hand',
      ...commonMotion,
    },
  },
  fonts,
}
