<template>
  <i class="random-icon" :class="{highlight}" @click="toggle" title="Random between two constants">R</i>
</template>
<script>
  import { isRandomPara } from 'lib/project'
  import { EV_CANVAS_CLEAR_SELECT } from 'type/constants'
  export default {
    name: 'IRandomIcon',
    props: {
      value: Object,
      field: String | Array,
      input: Function,
    },
    computed: {
      highlight() {
        const key = typeof this.field === 'string' ? this.field : this.field[0]
        return isRandomPara(this.value[key])
      },
    },
    methods: {
      toggle() {
        this.$events.emit(EV_CANVAS_CLEAR_SELECT)
        const highlight = this.highlight
        const getValue = x => {
          // .x2 -> .x
          // const value = this.value[x.replace('2', '')]
          return highlight ? null : 0
        }

        if (typeof this.field === 'string') { return this.input(this.field, getValue(this.field)) }
        this.field.forEach(f => this.input(f, getValue(f)))
        this.$forceUpdate()
      },
    },
  }
</script>

<style lang="stylus">
  .random-icon
    position absolute
    right 0
    line-height 28px
    user-select none
    cursor pointer
    color $text300
    &:hover
      color $text100
    &.highlight
      color $primary-color-highlight
</style>