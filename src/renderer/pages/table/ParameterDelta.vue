<script type="text/jsx">
  import {isNumber} from 'lib/utils'
  export default {
    name: 'ITableParameterDelta',
    functional: true,
    props: {
      start: null,
      end: null,
      hideDelta: Boolean,
    },
    render(h, {props}) {
      const deltaView = do {
        if (!props.hideDelta && isNumber(props.start) && isNumber(props.end)) {
          const delta = props.end - props.start
          delta >= 0
            ? <span class="table-parameter-delta__delta table-parameter-delta__delta_pos">+{delta}</span>
            : <span class="table-parameter-delta__delta table-parameter-delta__delta_neg">{delta}</span>
        }
      }
      return <span class="table-parameter-delta">
        <span class="table-parameter-delta__start">{props.start}</span>
        &rarr;
        <span class="table-parameter-delta__end">{props.end}</span>
        {deltaView}
      </span>
    }
  }
</script>

<style lang="stylus">
  .table-parameter-delta
    /*white-space nowrap*/

  .table-parameter-delta__start
    padding 0 2px
    color black

  .table-parameter-delta__end
    padding 0 2px
    color $primary-color-highlight

  .table-parameter-delta__delta
    padding 0 2px

  .table-parameter-delta__delta_pos
    color green

  .table-parameter-delta__delta_neg
    color red
</style>
