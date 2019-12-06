import * as project from 'lib/project'
import { createFormObject } from 'lib/form'
import { trimZero2 } from 'lib/utils'
import form from '@/static/form'
import { clone, split, map, trim, compose } from 'ramda'
import { defaultParameterValue, defaultParameter, Stage } from 'type/stage'

const splitMapTrim = compose(map(trim), split(/\r?\n/))

describe('lib/project', function() {
  it('getStageShaderChoice', function() {
    const types = ['obj', 'cus', 'fg', 'bg']
    for (let i = 0; i < 2 ** 4; i++) {
      const expected = i.toString(2).padStart(4, '0')
      const stage = new Stage('')
      expected.split('').forEach((enabled, index) => {
        const type = types[index]
        enabled = +enabled
        if (enabled) {
          stage.parameter[type].units.push(clone(defaultParameterValue[type]))
        }
      })
      expect(project.getStageShaderChoice(stage)).to.be.equal(parseInt(expected, 2))
    }
  })

  describe('formatParameter', function() {
    function doTest(tests) {
      tests.forEach(test => {
        const [init, change] = project.formatParameter(test.type, test.para)
        expect(splitMapTrim(init)).to.be.eql(splitMapTrim(test.init))
        expect(splitMapTrim(change)).to.be.eql(splitMapTrim(test.change))
      })
    }

    function genTestCase1(type) {
      const single = clone(defaultParameter[type])
      const unit = clone(defaultParameterValue[type])
      unit.init.width = unit.init.height = 500
      single.units.push(unit)
      return single
    }

    function genTestCase2(type) {
      const single = clone(defaultParameter[type])
      single.units.push(clone(defaultParameterValue[type]))
      single.units[0].init.keep = true
      single.units[0].change.keep = true
      return single
    }

    function genTestObjectWithNumber(type) {
      const single = clone(defaultParameter[type])
      single.units.push(clone(defaultParameterValue[type]))
      const { init, change } = single.units[0]
      const x0 = 1.111111
      const y0 = 2.222222
      const width = 3.333333
      const height = 4.444444
      const x = 5.555555
      const y = 6.66666
      init.x0 = change.x0 = x0
      init.y0 = change.y0 = y0
      init.width = change.width = width
      init.height = change.height = height
      init.x = change.x = x
      init.y = change.y = y
      return {
        type,
        para: single,
        init: `GroupNo=1
clean=1
backgroundNo=0
LoopVideo=0
No=1
x0=${trimZero2(x0)}
y0=${trimZero2(y0)}
width=${trimZero2(width)}
height=${trimZero2(height)}
initialx=${trimZero2(x)}
initialy=${trimZero2(y)}
initialscalex=1
initialscaley=1
initialalpha=1
initialangle=0
intialshearH=0
initialshearV=0
foreGDReplaceinfo=0`,
        change: `backgroundNo=0
No=1
ChgCtr=0`,
      }
    }

    it('bg', function() {
      const tests = [{
        type: 'bg',
        para: genTestCase1('bg'),
        init: `GroupNo=1
clean=1
backgroundNo=0
LoopVideo=0
No=1
x0=0
y0=0
width=500
height=500
initialx=0
initialy=0
initialscalex=1
initialscaley=1
initialalpha=1
initialangle=0
intialshearH=0
initialshearV=0
foreGDReplaceinfo=0`,
        change: `backgroundNo=0
No=1
ChgCtr=0`,
      }, {
        type: 'bg',
        para: genTestCase2('bg'),
        init: `GroupNo=1
clean=1
backgroundNo=0
LoopVideo=0
No=1
same`,
        change: `backgroundNo=0
No=1
same`,
      } ]
      doTest(tests)
    })

    it('fg', function() {
      doTest([{
        type: 'fg',
        para: genTestCase1('fg'),
        init: `GroupNo=1
clean=1
foregroundNo=0
LoopVideo=0
No=1
x0=0
y0=0
width=500
height=500
initialx=0
initialy=0
initialscalex=1
initialscaley=1
initialalpha=1
initialangle=0
intialshearH=0
initialshearV=0
foreGDReplaceinfo=0`,
        change: `foregroundNo=0
No=1
ChgCtr=0`,
      }, {
        type: 'fg',
        para: genTestCase2('fg'),
        init: `GroupNo=1
clean=1
foregroundNo=0
LoopVideo=0
No=1
same`,
        change: `foregroundNo=0
No=1
same`,
      }])
    })

    it('cus', function() {
      doTest([{
        type: 'cus',
        para: genTestCase1('cus'),
        init: `GroupNo=1
clean=1
CustomerNo=0
LoopVideo=0
No=1
x0=0
y0=0
width=500
height=500
initialx=0
initialy=0
initialscalex=1
initialscaley=1
initialalpha=1
initialangle=0
intialshearH=0
initialshearV=0
foreGDReplaceinfo=0
customerPosIni=1`,
        change: `CustomerNo=0
No=1
ChgCtr=0`,
      }, {
        type: 'cus',
        para: genTestCase2('cus'),
        init: `GroupNo=1
clean=1
CustomerNo=0
LoopVideo=0
No=1
same`,
        change: `CustomerNo=0
No=1
same`,
      }])
    })

    it('obj', function() {
      doTest([{
        type: 'obj',
        para: genTestCase1('obj'),
        init: `GroupNo=1
clean=1
No=1
x0=0
y0=0
width=500
height=500
initialx=0
initialy=0
initialscalex=1
initialscaley=1
initialalpha=1
initialangle=0
intialshearH=0
initialshearV=0
foreGDReplaceinfo=0
Skinsmooth=0
ColorSatAdj=0
handpower=0`,
        change: `No=1
ChgCtr=0`,
      }, {
        type: 'obj',
        para: genTestCase2('obj'),
        init: `GroupNo=1
clean=1
No=1
same`,
        change: `No=1
same`,
      }])
    })

    it('fixed number in some value', function() {
      doTest([
        genTestObjectWithNumber('bg'),
        genTestObjectWithNumber('fg'),
        genTestObjectWithNumber('cus'),
        genTestObjectWithNumber('obj'),
      ])
    })
  })

  describe('formatStage', function() {
    function doTest(tests) {
      tests.forEach((test, index) => {
        const result = project.formatStage(test.stage, index)
        expect(splitMapTrim(result)).to.be.eql(splitMapTrim(test.result))
      })
    }

    it('stage parameter', function() {
      doTest([{
        stage: do {
          const stage = new Stage('')
          Object.assign(stage.parameter.bg.source, {
            file: 'same',
            directory: 'same',
          })
          Object.assign(stage.parameter.fg.source, {
            file: 'image.png',
            directory: 'images',
          })
          stage.parameter.bg.units.push(clone(defaultParameterValue.bg))
          stage.parameter.fg.units.push(clone(defaultParameterValue.fg))
          stage.parameter.obj.units.push(clone(defaultParameterValue.obj))
          stage
        },
        result: `curPeopleNo=1
shaderChoice=11
stageAction=0
BGdirectory=same
BGImageFileName=same
BGTxtFile=stage1.bg
BGTxtChange=stage1.bgc
FGdirectory=\\images
FGImageFileName=image.png
FGTxtFile=stage1.fg
FGTxtChange=stage1.fgc
ObjTxtFile=stage1.obj
ObjTxtChange=stage1.objc
stageChoices=0`,
      }])
    })

    it('transition', function() {
      doTest([{
        stage: do {
          const stage = new Stage('')
          const transition = createFormObject(form.transition)
          transition.stageFile = 0
          transition.NextStageTime = 10
          transition.ROITimes = 2
          transition.hitAction = 2
          transition.EndTimeChoice = 1
          // normal
          transition.NextStage = ['4', '2']
          stage.transition.push(clone(transition))
          // case 1
          transition.NextStage = ['1', '1']
          stage.transition.push(clone(transition))
          // case 2
          transition.NextStage = ['1', '2']
          stage.transition.push(clone(transition))
          // case 3
          transition.NextStage = ['1', '3']
          stage.transition.push(clone(transition))
          stage
        },
        result: `curPeopleNo=0
shaderChoice=0
stageAction=0
stageChoices=4
stageFile=stage1.stage
NextStage=42
stageFile=stage1.stage
NextStage=11
NextStageTime=10
stageFile=stage1.stage
NextStage=12
ROITimes=2
hitAction=2
stageFile=stage1.stage
NextStage=13
NextStageTime=10
EndTimeChoice=1`,
      }])
    })
  })
})
