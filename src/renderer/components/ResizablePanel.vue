<template>
  <div class="panel"
    :class="['_' + controlPosition, expand ? '_expand' : '_shrink',panelClass]"
    :style="panelStyle">
    <template v-if="expand">
      <div class="resize"
        v-movable="handleResize"></div>
      <div class="content">
        <div class="header"
          :class="headerClass"
          v-if="title||$slots.title">
          {{title}}
          <slot name="title"></slot>
          <i class="fa-icon-button fa fa-remove close"
            title="Close"
            @click.stop="doExpand(false)"></i>
        </div>
        <slot></slot>
      </div>
    </template>
    <div class="expand"
      v-if="!expand"
      @click.stop="doExpand(true)">
      <i class="fa"
        :class="'fa-icon-button fa-angle-' + controlPosition"></i>
      {{title}}
    </div>
  </div>
</template>

<script>
  import { clone } from 'ramda'
  import { mapState } from 'vuex'

  export default {
    name: 'ResizablePanel',
    props: {
      controlPosition: String,
      title: String,
      panelClass: String | Object,
      headerClass: String | Object,
      minSize: {
        required: false,
        default: 200,
      },
      maxSize: {
        required: false,
        default: 450,
      },
    },
    data() {
      const pos = this.controlPosition
      return {
        expand: true,
        size: this.$store.state.preference.panelSize[pos],
      }
    },
    computed: {
      panelStyle() {
        if (this.expand) {
          switch (this.controlPosition) {
            case 'top':
              return {
                height: this.size + 'px',
              }
            case 'right':
              return {
                width: this.size + 'px',
              }
            case 'left':
              return {
                width: this.size + 'px',
              }
          }
        }
        return {}
      },
    },
    mounted() {
      this.$emit('update', this.size)
    },
    methods: {
      doExpand(value) {
        if (value) {
          this.size = this.minSize
        }
        this.expand = !!value
      },
      handleResize({ store, status, offsetX, offsetY }) {
        switch (status) {
          case 'start':
            store.set('size', this.size)
          case 'moving':
            let size = store.get('size')
            this.size = Math.max(
              size +
                do {
                  const pos = this.controlPosition
                  if (pos === 'top') -offsetY
                  else if (pos === 'left') -offsetX
                  else if (pos === 'right') offsetX
                  else offsetY
                },
              this.minSize
            )
            this.size = this.size > this.maxSize ? this.maxSize : this.size
          case 'end':
            this.$store.commit('updatePanelSize', {
              [this.controlPosition]: this.size,
            })
        }
        this.$emit('update', this.size)
      },
    },
  }
</script>

<style lang="stylus" scoped>
  $resize-width = 5px
  $resize-dot-size = 5px
  directions = top right left bottom
  .panel
    overflow hidden
    position relative
    outline 0
    for dir in directions
      &._{dir}
        // border-{dir}: 1px solid #999;
        padding-{dir} $resize-width
    &._left, &._right
      height 100%
    &._top, &._bottom
      width 100%
    &._shrink
      cursor default
      padding ($resize-width * 2)
      &._left, &._right
        writing-mode vertical-lr
  .header
    padding ($resize-width * 2)
  .content
    height 100%
    ._left &
      margin-left - $resize-width
    ._right &
      margin-right -1px
  .close
    float right
    color $text300
  .resize
    top 0
    position absolute
    display flex
    flex-direction column
    justify-content center
    ._left &, ._right &
      height 100%
      width $resize-width
      cursor ew-resize
    ._top &, ._bottom &
      width 100%
      height $resize-width
      cursor ns-resize
    for dir in directions
      ._{dir} &
        {dir} 0
  .resize-dot
    width $resize-dot-size
    height $resize-dot-size
    background #ACADAE
    border-radius 50%
    margin 2px auto
</style>
