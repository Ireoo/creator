import {
  CHG_CTR_NO_CHANGE,
  CHG_CTR_TIMED_CHANGE,
  CHG_CTR_FOLLOW_OVERALL_ACTION,
  CHG_CTR_STICK,
  CHG_CTR_HEAD_ZOOM,
  CHG_CTR_END_TIME_FRAME,
  CHG_CTR_FOLLOW_TWO_HANDS_ACTION,
} from 'type/constants'

const parameter = {
  transparencyChangeOptions: [{
    title: 'No change',
    data: '0',
    text: 'no',
  }, {
    title: 'Replace black color to transparent',
    data: '4',
    bg: 'black',
  }, {
    title: 'Replace white color to transparent',
    data: '5',
    bg: 'white',
  }, {
    title: 'Reverse alpha value',
    data: '6',
    img: require('@/assets/icon/fan.png'),
  }, {
    title: 'Replace red color to transparent',
    data: '11',
    bg: 'red',
  }, {
    title: 'Replace green color to transparent',
    data: '12',
    bg: 'green',
  }, {
    title: 'Replace blue color to transparent',
    data: '13',
    bg: 'blue',
  }],
  colorChangeOptions: [{
    title: 'No change',
    data: '0',
    color: 'none',
    text: 'no',
    bg: 'transparent',
  }, {
    title: 'Reverse the color',
    data: '1',
    color: 'invert()',
    bg: 'transparent',
    img: require('@/assets/icon/fanse.png'),
  }, {
    title: 'Gray scale',
    data: '2',
    color: 'grayscale()',
    bg: '#ccc',
  }, {
    title: 'Reverse gray scale',
    data: '3',
    color: 'invert() grayscale()',
    bg: 'transparent',
    img: require('@/assets/icon/huifan.png'),
  }, {
    title: 'All black',
    data: '4',
    color: 'opacity(0)',
    bg: 'black',
  }, {
    title: 'All white',
    data: '5',
    color: 'opacity(0)',
    bg: 'white',
  }, {
    title: 'All red',
    data: '6',
    color: 'opacity(0)',
    bg: 'red',
  }, {
    title: 'All green',
    data: '7',
    color: 'opacity(0)',
    bg: 'green',
  }, {
    title: 'All blue',
    data: '8',
    color: 'opacity(0)',
    bg: 'blue',
  }],
  changeControlOptions: [{
    title: 'No change',
    data: CHG_CTR_NO_CHANGE,
    img: require('@/assets/icon/noaction.png'),
  }, {
    title: 'Timed change',
    data: CHG_CTR_TIMED_CHANGE,
    img: require('@/assets/icon/time.png'),
  }, {
    title: 'Follow overall action',
    data: CHG_CTR_FOLLOW_OVERALL_ACTION,
    img: require('@/assets/icon/action.png'),
  }, {
    title: 'Stick',
    data: CHG_CTR_STICK,
    img: require('@/assets/icon/stick.png'),
  }, {
    title: 'Head zoom',
    data: CHG_CTR_HEAD_ZOOM,
    img: require('@/assets/icon/zoom.png'),
  }, {
    title: 'End time frame',
    data: CHG_CTR_END_TIME_FRAME,
    img: require('@/assets/icon/time.png'),
  }, {
    title: 'Follow two hands action',
    data: CHG_CTR_FOLLOW_TWO_HANDS_ACTION,
    img: require('@/assets/icon/time.png'),
  }],
  customerPosIniOption: [{
    title: 'In front of FG image',
    data: '2',
    img: require('@/assets/icon/front.png'),
  }, {
    title: 'Between FG and Person',
    data: '1',
    img: require('@/assets/icon/between.png'),
  }, {
    title: 'Behind Real-person',
    data: '0',
    img: require('@/assets/icon/behind.png'),
  }, {
    title: 'Random',
    data: 'r0,2',
    // img: require('@/assets/icon/behind.png'),
  }],
  sequenceVisualOptions: [{
    title: 'None',
    data: '2',
  }, {
    title: 'scene Sequence',
    data: '1',
  }, {
    title: 'Frame Sequence',
    data: '0',
  }],
  parameters: ['bg', 'bgc', 'fg', 'fgc', 'cus', 'cusc', 'obj', 'objc'],
  parametersWithoutChange: ['bg', 'fg', 'cus', 'obj'],
  parametersChange: ['bgc', 'fgc', 'cusc', 'objc'],
}

export default parameter
