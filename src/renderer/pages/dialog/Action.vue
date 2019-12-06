<template>
  <div>
    <object-form formName="action" :value="value" ref="form"></object-form>
    <i-stage-position-selector
        v-if="canShowStagePositionSelector"
        :startX.sync="value.actTLx"
        :startY.sync="value.actTLy"
        :endX.sync="value.actBRx"
        :endY.sync="value.actBRy"
        :src="options.image"
    ></i-stage-position-selector>
  </div>
</template>

<script>
  import {MountComponents} from 'lib/utils'
  import StagePositionSelector from 'components/stage/StagePositionSelector.vue'

  export default {
    name: 'IDialogAction',
    components: MountComponents(StagePositionSelector),
    props: {
      value: Object,
      options: Object,
    },
    computed: {
      canShowStagePositionSelector() {
        return this.value.actROI === '0' && this.value.stageAction[0] === '1'
      },
    },
    methods: {
      onOK() {
        return new Promise((resolve, reject) => {
          this.$refs.form.validate(valid => valid ? resolve(valid) : reject(valid))
        })
      },
    },
  }
</script>

<style lang="stylus">

</style>
