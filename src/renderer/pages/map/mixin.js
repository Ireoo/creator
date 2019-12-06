import 'jointjs/dist/joint.css'

import { mapState, mapGetters, mapMutations } from 'vuex'
import Map from 'type/map'
import {
  EV_CANVAS_CHANGE_ZOOM,
  EV_CANVAS_FIT,
  MAP_UPDATE_STAGE,
  EV_LOADING_OPEN,
  EV_LOADING_CLOSE,
} from 'type/constants'
import { path, ap, adjust, tap, add, equals, difference, pick } from 'ramda'
import { saveMapImage } from 'lib/project'

export default {
  data() {
    return { map: null }
  },
  mounted() {
    this.map = new Map(this.$refs.mapEl, {
      height: this.height,
      width: this.width,
      onChangeTarget: this.onChangeTarget,
    })
    this.init()
  },
  computed: {
    ...mapState({
      panelSize: path(['preference', 'panelSize']),
      zoom: path(['board', 'zoom']),
      mode: path(['board', 'mode']),
      projectPath: path(['project', 'projectPath']),
      stageGroup: path(['project', 'stageGroup']),
      loops: path(['project', 'loops']),
    }),
    ...mapGetters(['projectExist', 'stageIndex', 'thumbnails']),
    width() {
      const { clientWidth } = document.documentElement
      return clientWidth
    },
    height() {
      const headerHeight = document.getElementsByClassName('header')[0]
        .clientHeight
      const footerHeight = document.getElementsByClassName('footer')[0]
        .clientHeight
      const { clientWidth, clientHeight } = document.documentElement
      const height = clientHeight - headerHeight - footerHeight
      return height
    },
    members() {
      return this.stages.map((stage, index) => {
        const group = this.stageGroup.find(g => g.stageIds.includes(stage.id))
        const title =
          index + 1 + (stage.description ? '_' + stage.description : '')
        return {
          id: stage.id,
          title: title.match(/.{0,9}/),
          // subTitle: stage.description,
          image: stage.snapshot,
          groupColor: group ? group.color : undefined,
          borderColor: Map.getBorderColor(stage),
          transition: stage.transition,
        }
      })
    },
  },
  watch: {
    projectPath() {
      this.init()
    },
    stageGroup: {
      deep: true,
      handler() {
        this.init()
      },
    },
  },
  events: {
    [EV_CANVAS_CHANGE_ZOOM](zoom) {
      if (!this.projectExist) return
      const { sx, sy } = this.map.paper.scale()
      const scale = zoom > this.zoom ? 0.5 : -0.5
      this.map.paper.scale(sx + scale, sy + scale)
    },
    [EV_CANVAS_FIT]() {
      if (!this.projectExist) return
      this.map.paper.scale(1, 1, this.width / 2, this.height / 2)
    },
    [MAP_UPDATE_STAGE](stage) {
      this.map.updateMember(this.members, this.stageIndex(stage))
      saveMapImage(this.projectPath, this.$refs.mapEl)
    },
  },
  methods: {
    ...mapMutations(['updateStageTransitionTarget']),
    hold(e) {
      if (this.mode !== 'hold') return
      const { status, offsetX, offsetY } = e
      if (status === 'end') return this.map.setOldPos()
      // old origin coordinate
      const { x, y } = this.map.oldOrigin
      this.map.setOriginPos(x + offsetX, y + offsetY)
    },
    init() {
      this.map && this.map.init(this.members)
    },
    onChangeTarget(source, target, link) {
      const type = link.get('type')
      const transIndex = link.get('transIndex')
      const links = this.map.graph
        .getLinks()
        .filter(link => link.getSourceElement().id === source.id)
        .filter(link => link.get('transIndex') === transIndex)
      const randomIndex = links.indexOf(link)
      this.updateStageTransitionTarget({
        stage: this.stages[source.id],
        transIndex,
        targetIndex: +target.id,
        randomIndex: randomIndex !== -1 ? randomIndex : undefined,
      })
      saveMapImage(this.projectPath, this.$refs.mapEl)
    },
  },
}
