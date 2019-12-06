<script type="text/jsx">
  import instruction from '@/static/instruction'

  export default {
    name: 'IHeaderInstructionSquare',
    functional: true,
    props: {
      type: {
        type: String,
        required: true
      },
      title: {
        type: String
      }
    },
    render(h, { props, listeners }) {
      const title = do {
        if (props.type === 'photo') 'Take ' + props.type
        else if (props.type === 'video') 'Record ' + props.type
        else 'Add ' + props.type
      }
      return (
        <div
          class="instruction-square"
          onClick={e => {
            listeners.click && listeners.click(e)
          }}
        >
          <div
            class="image"
            style={{ backgroundColor: instruction.color[props.type] }}
          >
            <img src={instruction.icon[props.type]} align="center" />
          </div>
          <small class="title">{props.title}</small>
        </div>
      )
    }
  }
</script>

<style lang="stylus" >
  $width = 35px
  .instruction-square
    text-align center
    position relative
    cursor pointer
    min-width 100px
    padding 5px
    radius()
    &:hover
      background rgba(0, 0, 0, 0.03)
    .image
      height $width
      width $width
      line-height $width
      display inline-block
      radius()
      img
        width $width - 10px
        height $width - 10px
    .title
      color $primary-color
      display block
      margin 5px
  .instruction-square__icon
    height 100%
</style>