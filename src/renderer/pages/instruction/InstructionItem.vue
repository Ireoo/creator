<script type="text/jsx">
  import instruction from '@/static/instruction'

  export default {
    name: 'IInstructionItem',
    functional: true,
    props: {
      type: {
        type: String,
        required: true,
      },
      prompt: null,
    },
    render(h, {props, listeners}) {
      return (
        <div class="instruction-item" style={{backgroundColor: instruction.color[props.type]}} onClick={e => {
          listeners.click && listeners.click(e)
        }} onContextmenu={e => {
          listeners.contextmenu && listeners.contextmenu(e)
        }}>
          {props.prompt !== void 0 ? <span class="instruction-item__prompt">{props.prompt}</span> : null}
          <img class="instruction-item__icon" src={instruction.icon[props.type]} alt=""/>
        </div>
      )
    },
  }
</script>

<style lang="stylus">
  .instruction-item {
    width 40px
    height @width
    line-height @width
    text-align center
    color white
    border-radius 4px
    font-size 1.75em
    padding 5px
    position relative
  }

  .instruction-item__icon {
    height 100%
  }

  .instruction-item__prompt {
    position absolute
    top -6px
    right -6px
    color white
    font-size 10px
    line-height normal
    background $primary-color-highlight
    padding 1px 2px
    border-radius 10px
    max-width 100%
    text-overflow ellipsis
    white-space nowrap
    overflow hidden
    border 1px solid white
  }
</style>