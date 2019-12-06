<template>
  <el-select class="selector" :size="size" :value="value" @input="value => $emit('input', value)">
    <el-option v-for="(stage, index) in (options || stages)" :key="index" :value="stage.id" :label="label(stage)">
    </el-option>
  </el-select>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'

  export default {
    name: 'IStageIdSelector',
    props: {
      value: String,
      size: {
        type: String,
        defualt: 'small',
      },
      // Array<Stage>
      options: {
        type: Array,
        default: null,
      },
    },
    computed: {
      ...mapGetters(['stageIndex']),
      ...mapState({
        stages: state => state.project.stages,
      }),
      label() {
        return stage => {
          if (stage.type === 'end') {
            return `End Stage (${this.stageIndex(stage) + 1})`
          }
          if (stage.type === 'preEed') {
            ;`Pre-End Stage (${this.stageIndex(stage) + 1})`
          }
          return (
            `Stage ${this.stageIndex(stage) + 1}` +
            ` <${stage.description || 'No Description'}>`
          )
        }
      },
    },
  }
</script>
<style lang="stylus" scoped>
  .selector
    width 100px
</style>
