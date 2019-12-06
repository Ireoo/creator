import { camelCase, clone } from 'lodash'

export default {
  computed: {
    menuText() {
      return this._getText('header.menu')
    },
    plankHomeText() {
      return this._getText('header.plank.home')
    },
    plankInstructionText() {
      return this._getText('header.plank.instruction')
    },
    thumbText() {
      return this._getText('thumbnail')
    },
    parameterText() {
      return this._getText('parameter')
    },
    sequenceVisualEffectText() {
      return this._getText('parameter.sequenceVisualEffect')
    },
    transparencyChangeText() {
      return this._getText('parameter.transparencyChange')
    },
    colorChangeText() {
      return this._getText('parameter.colorChange')
    },
    resourceText() {
      return this._getText('resource')
    },
    tableText() {
      return this._getText('table')
    },
    dialogText() {
      return this._getText('dialog')
    },
    instructionDialogText() {
      return this._getText('dialog.instruction')
    },
    stageDialogText() {
      return this._getText('dialog.stage')
    },
    contextMenuText() {
      return this._getText('contextMenu')
    },
    registerText() {
      return this._getText('register')
    },
    boardText() {
      return this._getText('board')
    },
    footerText() {
      return this._getText('footer')
    },
    mapText() {
      return this._getText('map')
    },
    exportText() {
      return this._getText('dialog.export')
    },
    protectText() {
      return this._getText('dialog.protect')
    },
    configurationText() {
      return this._getText('dialog.configuration')
    },
  },
  methods: {
    _getText(prefix) {
      return t => this.$t(prefix + '.' + t.split('.').map(camelCase).join('.'))
    },
  },
}
