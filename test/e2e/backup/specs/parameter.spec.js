import utils from '../utils'

describe('Parameter', function() {
  beforeEach(utils.beforeEach)
  afterEach(utils.afterEach)

  it('click choose resource before save should alert', function() {
    const client = this.app.client
    return client.click('.menu > .menu-item:nth-child(3)').then(() => {
      return client.getText('.menu-item._active')
    }).then(text => {
      expect(text).to.be.eql('Element')
    }).then(() => {
      return client.click('.parameter-square_type_bg')
    }).then(() => {
      return utils.getMessageBoxVisible(this.app)
    }).then(() => {
      return client.click('.el-message-box__btns > button:nth-child(2)')
    }).then(() => {
      // TODO: check if open dialog opened
    })
  })
})
