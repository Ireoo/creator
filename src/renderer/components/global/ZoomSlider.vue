<script type="text/jsx">
  export default {
    name: 'ZoomSlider',
    functional: true,
    props: {
      value: {
        type: Number,
        required: true,
      },
      width: {
        type: String,
        default: '100%',
      },
      min: {
        type: Number,
        default: 0.1,
      },
      max: {
        type: Number,
        default: 1,
      },
      step: {
        type: Number,
        default: 0.1,
      },
    },
    render(h, {props, listeners}) {
      const changeZoom = (delta) => {
        listeners.input(Math.min(props.max, Math.max(props.min, props.value + delta)))
      }
      return (
        <div class="zoom-slider" style={{width: props.width}}>
          <i class="fa fa-search-minus fa-fw zoom-slider__designator" onClick={() => changeZoom(-props.step)}/>
            <el-slider class="zoom-slider__slider"
              value={props.value}
              step={props.step}
              min={props.min}
              max={props.max}
              onInput={value => listeners.input(value)}
            />
          <i class="fa fa-search-plus fa-fw zoom-slider__designator" onClick={() => changeZoom(+props.step)}/>
        </div>
      )
    }
  }
</script>

<style lang="stylus">
  .zoom-slider
    display flex
    align-items center
    width 100% // default width

  .zoom-slider__slider
    flex-grow 1

  .zoom-slider__designator
    flex-shrink 0
    vertical-align middle
    color #666666
    cursor pointer
    line-height normal
    margin-left 5px
    margin-right 5px
</style>
