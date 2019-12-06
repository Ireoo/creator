import ParameterPanelVue from 'pages/parameter/Panel_.vue'
import Vue from 'vue'
import modules from '@/store/modules'
import {clone, flatten} from 'ramda'
import Vuex from 'vuex'

const Panel = Vue.extend(ParameterPanelVue)

describe('ParameterPanel', function() {
  beforeEach(function() {
    this.store = new Vuex.Store({modules: clone(modules)})
    this.vm = new Panel({
      el: document.createElement('div'),
      store: this.store,
    })
  })

  it('when stage or type changed, status assigned "init"', function() {
    const vm = this.vm

    return vm.$nextTick().then(() => {
      expect(vm.currentParameter).to.be.equal('bg')
      expect(vm.parameterStatus).to.be.equal('init')
      vm.parameterStatus = 'change'
      return vm.$nextTick()
    }).then(() => {
      vm.currentParameter = 'fg'
      return vm.$nextTick()
    }).then(() => {
      // test type changed
      expect(vm.parameterStatus).to.be.equal('init')
      return vm.$nextTick()
    }).then(() => {
      vm.parameterStatus = 'change'
      return vm.$nextTick()
    }).then(() => {
      // add new stage, and select new stage
      this.store.commit('newStage')
      this.store.commit('selectStage', this.store.state.project.stages[1])
      return vm.$nextTick()
    }).then(() => {
      // test stage change
      expect(vm.parameterStatus).to.be.equal('init')
    })
  })

  describe('inputValue/inputNumber: value limit', function() {
    function doTest(vm, tests) {
      tests.forEach(([key, value, expected]) => {
        const rawValue = vm.curValue[key]
        vm.inputNumber(key, value)
        expect(vm.curValue[key]).to.be.eql(expected, `${key} assigned ${value} expected to ${expected}`)
        vm.inputNumber(key, rawValue)
      })
    }

    it('initial', function() {
      const tests = [
        ['width', -100, 0],
        ['width', 200, 200],
        ['width', 2000, 1920 - 250 * 2],
        ['height', -100, 0],
        ['height', 200, 200],
        ['height', 2000, 1080],
        ['x0', -100, 0],
        ['x0', 200, 200],
        ['x0', 300, (1920 - 1420) / 2],
        ['y0', -100, 0],
        ['y0', 0, 0],
        ['y0', 100, 0],
        ['opacity', -1, 0],
        ['opacity', 0.3, 0.3],
        ['opacity', 1.2, 1],
      ]
      const vm = this.vm
      return vm.$nextTick().then(() => {
        vm.$store.commit('addStageParameterUnit', {stage: vm.stage, type: 'obj'})
        vm.currentParameter = 'obj'
        vm.parameterStatus = 'init'
        return vm.$nextTick()
      }).then(() => {
        doTest(vm, tests)
      })
    })

    it('change: delta', function() {
      const tests = [
        ['width', -500, -500],
        ['width', -2000, -1420],
        ['width', 500, 0],
        ['height', -100, -100],
        ['height', -2000, -1080],
        ['height', 2000, 0],
        ['x0', -100, -100],
        ['x0', 200, 0],
        ['x0', -500, -250],
        ['y0', -100, 0],
        ['y0', -2000, 0],
        ['y0', 100, 0],
        ['opacity', -1.2, -1],
        ['opacity', 0.3, 0],
        ['opacity', -0.7, -0.7],
      ]
      const vm = this.vm
      return vm.$nextTick().then(() => {
        vm.$store.commit('addStageParameterUnit', {stage: vm.stage, type: 'obj'})
        vm.currentParameter = 'obj'
        return vm.$nextTick()
      }).then(() => {
        vm.parameterStatus = 'change'
        return vm.$nextTick()
      }).then(() => {
        vm.inputValue('chgCtr', '2')
        return vm.$nextTick()
      }).then(() => {
        expect(vm.parameterStatus).to.be.equal('change')
        expect(vm.changeMode).to.be.eql('delta')
        doTest(vm, tests)
      })
    })
  })
})
