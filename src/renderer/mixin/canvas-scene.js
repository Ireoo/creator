import {mapState} from 'vuex'
import Layer from 'lib/layer'
import {Stage} from 'type/stage'

export default {
  props: {
    select: {
      type: Layer,
      default: null,
    },
    stage: {
      type: Stage,
      required: true,
    },
  },
  computed: {
    ...mapState({
      ratio: state => state.board.zoom,
      mode: state => state.board.mode,
      paraStatus: state => state.board.status,
      paraType: state => state.board.type,
      paraIndex: state => state.board.index,
    }),
  },
}
