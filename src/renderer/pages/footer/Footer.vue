<template>
  <div class="footer">
    <div class="footer-left">
      <i class="fa fa-fw"
        :class="leftIcon"></i>
      {{footerText(view)}}
    </div>
    <div class="status"
      v-if="tip">
      {{tip}}
    </div>
    <div class="footer-right">
      <zoom-slider v-if="view === 'board' || view === 'preview'"
        width="200px"
        :value="zoom"
        @input="changeZoom"
        :step="0.1"
        :min="0.1"
        :max="2"></zoom-slider>
    </div>
  </div>
</template>

<script>
  import { mapState, mapMutations } from 'vuex'

  export default {
    name: 'IFooter',
    data() {
      return {
        zoomTooltip(value) {
          return value * 100
        },
      }
    },
    computed: {
      ...mapState({
        zoom: state => state.board.zoom,
        view: state => state.board.view,
        tip: state => state.board.tip,
      }),
      leftIcon() {
        if (this.view === 'board') {
          return 'fa-clone'
        } else if (this.view === 'table' || this.view === 'parameter') {
          return 'fa-table'
        } else if (this.view === 'preview') {
          return 'fa-window-maximize'
        }
        return ''
      },
    },
    methods: {
      ...mapMutations(['changeZoom']),
    },
  }
</script>

<style lang="stylus">
  $ratio-width = 150px
  .footer
    border-top 1px solid #cccccc
    height 36px
    line-height 36px
    background $grey100
    z-index 2
    display flex
    justify-content space-between
    align-items center
  .footer-right
    padding 0 10px
  .footer-left
    padding 0 10px
  .zoom
    width $ratio-width
    padding 0 10px
    display inline-block
    vertical-align middle
  .zoom-designator
    vertical-align middle
    color #666666
    cursor pointer
</style>
