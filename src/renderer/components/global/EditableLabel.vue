<template>
  <div class="editable-label">
    <!-- if use input, cannot select text, but textarea works normally -->
    <textarea v-if="editing"
      :rows="rows"
      ref="input"
      class="editable-label__input"
      :style="{resize:rows===1?'none':null}"
      v-model="newValue"
      @blur="finishInput"
      @keyup.enter="finishInput"
      :placeholder="placeholder"></textarea>
    <div v-else
      class="editable-label__text"
      @click="showInput('click')"
      @dblclick="showInput('dblclick')">
      <span class="editable-label__placeholder"
        v-if="placeholder && !editing && !newValue">{{placeholder}}</span>
      {{newValue}}
    </div>
  </div>
</template>

<script>
  export default {
    name: 'EditableLabel',
    props: {
      value: null,
      formatter: Function,
      parser: Function,
      placeholder: String,
      dblclick: Boolean,
      rows: {
        default: 1,
      },
    },
    data() {
      return {
        editing: false,
        newValue: this.formatter ? this.formatter(this.value) : this.value,
      }
    },
    watch: {
      value(nv) {
        if (!this.editing) {
          this.newValue = this.formatter ? this.formatter(nv) : nv
        }
      },
    },
    methods: {
      finishInput() {
        this.editing = false
        this.newValue = this.formatter
          ? this.formatter(this.newValue)
          : this.newValue
        const value = this.newValue
        this.$emit('input', this.parser ? this.parser(value) : value)
        this.$emit('edited', this.parser ? this.parser(value) : value)
      },
      showInput(type) {
        if ((type === 'dblclick') !== this.dblclick) return
        this.editing = true
        this.$emit('editing')
        this.$nextTick(() => {
          this.$refs.input.focus()
          this.$refs.input.select()
        })
      },
    },
  }
</script>

<style lang="stylus">
  .editable-label
    display inline-block
    vertical-align middle
    input
      border 1px solid #999999
      width 100%
  .editable-label__input
    width 100%
    background none
    border none
    border-bottom 1px solid $grey400
    vertical-align middle
  .editable-label__text, .editable-label__input
    outline none
  .editable-label__text
    text-overflow ellipsis
    overflow hidden
  .editable-label__placeholder
    color #999999
</style>
