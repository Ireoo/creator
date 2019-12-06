// @flow
import { any, equals, allPass } from 'ramda'
import { camelCase } from 'lodash'
import { isRandomTrans } from 'lib/project'

import type { Form } from 'type/form'

const PLACEHOLDER = 'PLACEHOLDER'

const _commonTransition = [PLACEHOLDER, 'Up', 'Down', 'Up or Down Movement', 'Left', 'Right', 'Left or Right Movement', 'Forward', 'Backward', 'Forward or Backward Movement']

const selectionsOfNextStage = [
  // [Name, sub children...(start from 0)]
  // It's PLACEHOLDER will be ignored.
  PLACEHOLDER,
  ['Time-based Control', PLACEHOLDER, 'Number of Frames', 'Number of Hit Times', 'Absolute Frame Number'],
  ['Hit ROI', PLACEHOLDER, 'Hand', 'Open Hand', 'Lasso Gesture', 'Close Hand', 'Head', 'Person', 'Front Image', 'Customer Image', 'Background Image'],
  ['Leave ROI', PLACEHOLDER, 'Hand', 'Open Hand', 'Lasso Gesture', 'Close Hand', 'Head', 'Person', 'Front Image', 'Customer Image', 'Background Image'],
  ['Hand Gestures', PLACEHOLDER, 'Open Hand', 'Lasso Gesture', 'Close Hand'],
  ['Two Hands Motion', PLACEHOLDER, 'Up', 'Down', 'Clock-wise Rotation', 'Anti-clock-wise Rotation'],
  ['Head Motion-based Control', ..._commonTransition],
  // 7x, 8x, 9x, 10x same as 6x
  ['Open Hand Motion', ..._commonTransition],
  ['Close Hand Motion', ..._commonTransition],
  ['Lasso Gesture Motion', ..._commonTransition],
  ['Hand Motion', ..._commonTransition],
]

const selectionsOfStageAction = [
  ['No Action', 'No Action'],
  ['Gestures and Head Movement', 'Hand in ROI', 'Hand Out of ROI', 'Open Hand Hit ROI', 'Open Hand Out of ROI', 'Close Hand Hit ROI', 'Close Hand Out of ROI', 'Lasso Gesture Hit ROI', 'Lasso Gesture Out of ROI', 'Head Hit ROI', 'Head Out of ROI'],
  ['Two Hands’ Motion', PLACEHOLDER, 'Up/Down/Clockwise Rotation/ Anti-clockwise rotation'],
  ['Follow Actions', PLACEHOLDER, 'Follow Open Hand', 'Follow Close Hand', 'Follow Lasso Hand', 'Follow Head'],
  // 4x, 5x, 6x, 7x, 8x same as transition's 6x
  ['Head Motion-based Control', ..._commonTransition],
  ['Open Hand Motion', ..._commonTransition],
  ['Close Hand Motion', ..._commonTransition],
  ['Lasso Gesture Motion', ..._commonTransition],
  ['Hand Motion', ..._commonTransition],
]

function generateCastaderOptions(selections) {
  const options = []

  for (let i = 0; i < selections.length; i++) {
    const first = selections[i]
    if (first === PLACEHOLDER) continue

    const option = {
      value: i + '',
      label: first[0],
      children: [],
    }

    for (let j = 1; j < first.length; j++) {
      if (first[j] === PLACEHOLDER) continue
      option.children.push({
        value: (j - 1) + '',
        label: first[j],
      })
    }

    options.push(option)
  }

  return options
}

// export for test
export function dependOnValue(prop: string, ...value: any[]) {
  return (data: any) => any(equals(data[prop]))(value)
}

export function composeDepend(...depends: any[]) {
  return allPass(depends)
}

const dependOnNextStageOfROI = data => ['2', '3'].includes(data.NextStage[0])
const dependOnStageActionOfActROI = data => data.stageAction[0] === '1'

const form: {
  rules: {},
  [key: string]: Form,
} = {
  rules: {
    positive: {
      type: 'number',
      min: 0,
    },
  },
  // why not use object instead of array
  // because we need keep order when output
  transition: [{
    name: 'stageFile',
    label: 'Transition to',
    type: 'select',
    default: null,
    showInTable: true,
    required: true,
    hint: 'Stage Number',
    selections(data, vm) {
      const stages = vm.$store.state.project.stages
      const stage = vm.$store.state.project.selectedStage
      const selectedStageIndex = stages.findIndex(s => s.id === stage.id)

      const selections = stages
        .map((stage) => {
          const index = stages.indexOf(stage)
          return [
            index,
            (stage.type === 'end' ? `End Stage (${index + 1})`
              : stage.type === 'preEnd' ? `Pre-End Stage (${index + 1})`
                : `Stage ${index + 1}`) + ` <${stage.description || 'No Description'}>`,
          ]
        })
      selections.push(['r0', 'Random stages'])
      return selections
    },
  },
  {
    name: 'stages',
    type: 'checkbox-group',
    default: [],
    showInTable: false,
    selections(data, vm) {
      return vm.$store.state.project.stages.map((stage, index) => {
        return {
          label: stage.id,
          displayLabel: `stage${index + 1} ${stage.description ? '(' + stage.description + ')' : ''} `,
        }
      })
    },
    display: data => data.stageFile && data.stageFile.match && !!isRandomTrans(data.stageFile), // random stage
  }, {
    name: 'NextStage',
    label: 'Transition',
    type: 'cascader',
    default: ['1', '1'],
    selections: generateCastaderOptions(selectionsOfNextStage),
    showInTable: true,
  }, {
    name: 'NextStageTime',
    type: 'number',
    rule: ['positive'],
    default: 30,
    display: dependOnValue('NextStage', ['1', '1'], ['1', '3']),
  }, {
    name: 'ROITimes',
    type: 'number',
    rule: ['positive'],
    default: 2,
    display: dependOnValue('NextStage', ['1', '2']),
  }, {
    name: 'hitAction',
    type: 'select',
    default: '1',
    selections: [
      ['1', 'Open Hand'],
      ['2', 'Lasso Hand'],
      ['3', 'Close Hand'],
      ['4', 'Head'],
    ],
    display: dependOnValue('NextStage', ['1', '2']),
  }, {
    name: 'EndTimeChoice',
    type: 'select',
    default: '1',
    selections: [
      ['1', 'Background'],
      ['2', 'Foreground'],
      ['3', 'Custom'],
      ['4', 'Run Iteration'],
    ],
    display: dependOnValue('NextStage', ['1', '3']),
  }, {
    name: 'ROI',
    type: 'select',
    default: '0',
    display: dependOnNextStageOfROI,
    selections: [
      ['0', 'pre-defined ROI'],
      ['1', 'BG'],
      ['2', 'FG'],
      ['3', 'Cus'],
    ],
  }, {
    name: 'TLx',
    type: 'number',
    rule: ['positive'],
    default: 42,
    display: composeDepend(dependOnNextStageOfROI, dependOnValue('ROI', '0')),
  }, {
    name: 'TLy',
    type: 'number',
    rule: ['positive'],
    default: 42,
    display: composeDepend(dependOnNextStageOfROI, dependOnValue('ROI', '0')),
  }, {
    name: 'BRx',
    type: 'number',
    rule: ['positive'],
    default: 42,
    display: composeDepend(dependOnNextStageOfROI, dependOnValue('ROI', '0')),
  }, {
    name: 'BRy',
    type: 'number',
    rule: ['positive'],
    default: 42,
    display: composeDepend(dependOnNextStageOfROI, dependOnValue('ROI', '0')),
  }, {
    name: 'MoveThr',
    type: 'number',
    rule: ['positive'],
    default: 200,
    display: data => ['6', '7', '8', '9', '10'].includes(data.NextStage[0]),
  }],
  action: [{
    name: 'stageAction',
    type: 'cascader',
    default: ['1', '1'],
    selections: generateCastaderOptions(selectionsOfStageAction),
  }, {
    name: 'actROI',
    type: 'select',
    default: '0',
    selections: [
      ['0', 'pre-defined ROI'],
      ['1', 'BG'],
      ['2', 'FG'],
      ['3', 'Cus'],
    ],
    display: dependOnStageActionOfActROI,
  }, {
    name: 'actTLx',
    type: 'number',
    default: 100,
    display: composeDepend(dependOnStageActionOfActROI, dependOnValue('actROI', '0')),
  }, {
    name: 'actTLy',
    type: 'number',
    default: 100,
    display: composeDepend(dependOnStageActionOfActROI, dependOnValue('actROI', '0')),
  }, {
    name: 'actBRx',
    type: 'number',
    default: 100,
    display: composeDepend(dependOnStageActionOfActROI, dependOnValue('actROI', '0')),
  }, {
    name: 'actBRy',
    type: 'number',
    default: 100,
    display: composeDepend(dependOnStageActionOfActROI, dependOnValue('actROI', '0')),
  }, {
    name: 'angelSensible',
    label: 'Moving with Angel adjusted',
    type: 'radio',
    default: '1',
    display: data => data.stageAction[0] === '2',
    ratios: [['1', 'true'], ['0', 'false']],
  }, {
    name: 'MoveThr',
    type: 'number',
    rule: ['positive'],
    default: 200,
    display: data => ['4', '5', '6', '7', '8'].includes(data.stageAction[0]),
  }],
}

export default form

export const transitionMap = {
  numberOfFrames: ['1', '1'],
}
