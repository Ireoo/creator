<script type="text/jsx">
  export default {
    name: 'IHeaderParameterSquare',
    functional: true,
    props: {
      type: {
        type: String,
        required: true,
        validator(value) {
          return /^(bg|fg|cus|obj)$/.test(value)
        },
      },
      addable: {
        type: Boolean,
        default: true,
      },
      chooseable: {
        type: Boolean,
        default: true,
      },
      rightIcon: {
        type: String,
        default: 'plus',
      },
      leftIcon: {
        type: String,
      },
    },
    render(h, {props, listeners}) {
      return <div
          class={['parameter-square', 'parameter-square_type_' + props.type, {
            'parameter-square_has-left': !!props.leftIcon,
            'parameter-square_has-right': !!props.rightIcon,
            'parameter-square_chooseable': props.chooseable,
          }]}
          onClick={e => {
            e.stopPropagation()
            listeners.choose && listeners.choose(e)
          }}
      >
        {props.leftIcon ? <span class="parameter-square__icon parameter-square__icon_left" onClick={e => {
          e.stopPropagation()
          listeners.left && listeners.left(e)
        }}>
          <i class={['fa fa-fw', 'fa-' + props.leftIcon]}/>
        </span> : null}
        {props.type !== 'obj' ? props.type.toUpperCase() : ''}
        {props.rightIcon ? <span
            class="parameter-square__icon parameter-square__icon_right" onClick={e => {
          e.stopPropagation()
          listeners.right && listeners.right(e)
        }}
        >
          <i class={['fa fa-fw', 'fa-' + props.rightIcon]}/>
        </span> : null}
      </div>
    },
  }
</script>

<style lang="stylus">
  $square-height = 50px

  typeColor = {
    bg: #4AAFA7
    fg: #AFCA58
    cus: #F5CA2B
    obj: #F05947
  }

  // BEM
  .parameter-square
    height $square-height
    margin 3px 10px
    text-align center
    line-height @height
    color white
    position relative
    border-radius ($square-height / 2)
    padding-right ($square-height / 2) - 5px
    padding-left ($square-height / 2) - 5px
    cursor default

    &&_has-left
      padding-left $square-height + 5px

    &&_has-right
      padding-right $square-height + 5px

    &&_chooseable
      cursor pointer

    &__icon
      position absolute
      top 0
      height $square-height
      width @height
      line-height $square-height
      border-radius 100%
      cursor pointer

      &&_left
        left 0

      &&_right
        right 0

      for type, color in typeColor
        ^[0]_type_{type} &:hover
          background rgba(darken(color, 30%), 0.8)


    for type, color in typeColor
      &_type_{type}
        background color
        &:hover
          background darken(@background, 10%)

</style>
