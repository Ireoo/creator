import Vue from 'vue'
import ParameterSquare from 'components/header/ParameterSquare.vue'

describe('ParameterSquare.vue', () => {
  it('default only show middle and right', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(ParameterSquare, {
        props: {
          type: 'bg',
        },
      }),
    })

    expect(vm.$el.querySelector('.parameter-square__icon_right')).to.be.not.null
    expect(vm.$el.querySelector('.parameter-square__icon_left')).to.be.null
  })

  it('listen click', () => {
    const leftClick = sinon.spy()
    const rightClick = sinon.spy()
    const chooseClick = sinon.spy()
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(ParameterSquare, {
        props: {
          type: 'cus',
          leftIcon: 'help',
        },
        on: {
          left: leftClick,
          choose: chooseClick,
          right: rightClick,
        },
      }),
    })

    vm.$el.click()
    expect(chooseClick).to.be.calledOnce
    expect(leftClick).to.be.not.called
    expect(rightClick).to.be.not.called

    vm.$el.querySelector('.parameter-square__icon_left').click()
    expect(chooseClick).to.be.calledOnce
    expect(leftClick).to.be.calledOnce
    expect(rightClick).to.be.not.called

    vm.$el.querySelector('.parameter-square__icon_right').click()
    expect(chooseClick).to.be.calledOnce
    expect(leftClick).to.be.calledOnce
    expect(rightClick).to.be.calledOnce
  })
})
