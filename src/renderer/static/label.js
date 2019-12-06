import Parameter from './parameter'

function makeLabelFromParameter(data) {
  return data.reduce((labels, option) => {
    labels[option.data] = option.title
    return labels
  }, {})
}

const label = {
  parameter: {
    'bg': 'Background',
    'fg': 'Foreground',
    'cus': 'Customer',
    'obj': 'Object',
  },
  transparencyChange: makeLabelFromParameter(Parameter.transparencyChangeOptions),
  colorChange: makeLabelFromParameter(Parameter.colorChangeOptions),
  changeControl: makeLabelFromParameter(Parameter.changeControlOptions),
  customerPosIni: makeLabelFromParameter(Parameter.customerPosIniOption),
  keepPosition: {
    true: 'Keep',
    false: 'Not Keep',
  },
  stepOrEnd: {
    '0': 'Step',
    '1': 'End',
  },
  stickItem: {
    '0': 'No Stick',
    '1': 'BG',
    '2': 'FG',
    '3': 'CUS',
    '4': 'OBJ',
  },
  bool: {
    true: 'True',
    false: 'False',
  },
}

export default label
