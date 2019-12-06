// @flow
import joint from 'jointjs'
import type { Stage, StageTransition } from 'type/stage'
import { assignIn, noop, curry, isEqual } from 'lodash'
import { min, max } from 'ramda'
import { limitRange } from 'lib/utils'
import Store from 'electron-store'
import Color from 'color'
import { isRandomTrans } from 'lib/project'

const defaultStore = { pos: { x: 0, y: 0 } }
const store = new Store({ name: 'map', default: defaultStore })

export type MapCoord = {
  x: number,
  y: number
}
export type MapLink = {
  source: joint.shapes.org.Member,
  target: joint.shapes.org.Member,
  label?: string,
  vertices?: Array<MapCoord>,
  linkColor?: string,
}

export type MemberInfo = {
  id: string,
  title: string,
  subTitle: string,
  image: string,
  borderColor?: string,
  groupColor?: string,
  transition: StageTransition
}

export const clearLocalMapData = () => store.clear()
export default class Map {
  graph: joint.dia.Graph
  paper: joint.dia.Paper
  members: joint.dia.org.Member
  // in hold mode,the last origin coordinate
  oldOrigin: MapCoord = defaultStore.pos
  onRemoveLink: Function
  onChangeTarget: Function
  constructor(el: Element, options: joint.dia.Paper.options & { onRemoveLink: Function }) {
    this.graph = new joint.dia.Graph()
    const { clientWidth, clientHeight } = window.document.documentElement
    this.paper = new joint.dia.Paper({
      el,
      width: clientWidth,
      height: clientHeight,
      gridSize: 1,
      model: this.graph,
      background: {
        color: Map.config.paperBackgroundColor,
      },
      snapLinks: true,
      linkPinning: false,
      embeddingMode: true,
      validateConnection: this.validateConnection,
      interactive: this.interactive,
      async: true,
      ...options,
    })
    this.onRemoveLink = options.onRemoveLink || noop
    this.onChangeTarget = options.onChangeTarget || noop
    this.graph.on('remove', cell => {
      cell.isLink() && this.onRemoveLink(cell)
    })
    this.paper.on('link:connect', (linkView, evt, targetView) => {
      const link = linkView.model
      const source = link.getSourceElement()
      const target = link.getTargetElement()
      if (!source || !target) return
      this.onChangeTarget(source, target, link)
    })
    this.paper.on('cell:mouseenter', (cellView, evt) => {
      const type = cellView.model.prop('type')
      if (type === 'org.Member') {
        cellView.model.toFront()
      }
    })
  }
  init(stages: MemberInfo[]): void {
    this.graph && this.graph.clear()
    const { width, height } = this.paper.options
    const radius = (height - 100) / 2
    const angle = 360 / stages.length
    const radian = -angle * Math.PI / 180
    const center = {
      x: width / 2 - 35,
      y: height / 2 - 50,
    }
    this.members = stages.reduce((reducer, stage, index) => {
      const localMemberData = store.get(index.toString()) || {}
      const x = localMemberData.x || center.x - Math.sin(radian * index) * radius
      // const y = limitRange(center.y - Math.cos(radian * index) * radius, 10, height - 100)//
      const y = localMemberData.y || center.y - Math.cos(radian * index) * radius
      const member = this.createMember({
        id: index.toString(),
        x,
        y,
        backColor: stage.groupColor,
      })
      this.setMemberInfo(member, stage)
      this.graph.addCell(member)
      reducer.push(member)
      return reducer
    }, [])

    this.updateLink(stages)

    // Recovery position
    const { x, y } = store.get('pos') || defaultStore.pos
    this.paper.setOrigin(x, y)
  }
  createLink({ source, target, label, vertices, linkColor = '#90caf9' }: MapLink): joint.dia.Link {
    const linkHead = {
      stroke: linkColor,
      fill: linkColor,
      d: 'M 10 0 L 0 5 L 10 10 z',
    }
    const link = new joint.dia.Link({
      markup: [
        '<path class="connection"/>',
        '<path class="marker-source"/>',
        '<path class="marker-target"/>',
        '<path class="connection-wrap"/>',
        '<g class="labels"/>',
        '<g class="marker-vertices"/>',
        '<g class="marker-arrowheads"/>',
      ].join(''),
      source: { id: source.id, port: 'out' },
      target: { id: target.id, port: 'in' },
      labels: [{
        position: 0.5,
        attrs: {
          text: {
            text: label || '',
            'font-weight': 'bold',
          },
        },
      }],
      vertices: vertices || [],
      attrs: {
        '.connection': {
          stroke: linkColor,
          'stroke-width': 2,
        },
        '.marker-target': linkHead,
      },
    })
    return link
  }
  updateLink(stages: MemberInfo[]): void {
    this.graph.getLinks().forEach(this.removeLink)
    const members = this.members
    stages.filter(stage => stage.transition).forEach(({ transition, action }, index) => {
      transition.forEach(({ stageFile, NextStage, stages: destinations }) => {
        if (isRandomTrans(stageFile)) {
          for (const stageId of destinations) {
            const to = stages.findIndex(s => s.id === stageId)
            const link = this.bindLink(members[index], members[to], Map.config.randomLinkColor)
            link.set('type', 'random')
            link.set('transIndex', index)
          }
        } else {
          const isTimeBasedControl = NextStage[0] === '1'
          const linkColor = isTimeBasedControl ? Map.config.linkColor : Map.config.memberPortColor
          const link = this.bindLink(members[index], members[stageFile], linkColor)
          link.set('type', 'normal')
          link.set('transIndex', index)
        }
      })
    })
  }
  bindLink(member: joint.shapes.org.Member, member2: joint.shapes.org.Member, linkColor?: string): joint.dia.Link {
    const link = this.createLink({ source: member, target: member2, linkColor })
    this.graph.addCell(link)
    return link
  }
  removeLink(link: joint.dia.Link): void {
    link.set('source', {})
    link.set('target', {})
    link.remove()
  }
  createMember({ x, y, backColor = '#fff', titleColor = '#000', subTitleColor, id }: {
    backColor?: string,
    titleColor?: string,
    subTitleColor?: string,
    id: string,
    x: number,
    y: number
  }): joint.shapes.org.Member {
    const size = { width: 70, height: 80 }
    const portIn = this.createPort('in', 'left')
    const portOut = this.createPort('out', 'right')
    const cell = new joint.shapes.org.Member({
      id,
      size: size,
      attrs: {
        rect: size,
        '.card': {
          fill: Color(backColor).lighten(0.2),
          stroke: 'none',
        },
        '.rank': {
          fill: Color(titleColor).alpha(0.8),
          'font-size': '12px',
          'word-spacing': '-5px',
          'letter-spacing': 0,
          'text-decoration': 'none',
          'ref-x': 0.05,
          'ref-y': 0.6,
          'text-anchor': 'start',
          'overflow': 'hidden',
        },
        '.name': {
          fill: Color(subTitleColor || titleColor).alpha(0.4),
          'font-size': 10,
          'font-family': 'Arial',
          'letter-spacing': 0,
          'letter-spacing': 0,
          'ref-x': 0.5,
          'ref-y': 0.8,
          'text-anchor': 'middle',
          'font-weight': 'normal',
        },
      },
      ports: {
        groups: { in: portIn, out: portOut },
        items: [portIn, portOut],
      },
    })
    cell.attr('rect/filter', {
      name: 'dropShadow',
      args: {
        dx: 2,
        dy: 2,
        blur: 5,
        opacity: 1,
        color: Map.config.memberShadowColor,
      },
    })
    this.setMemberPos(cell, { x, y })
    cell.on('change:position', this.onMemberPosChange)
    return cell
  }
  updateMember(stages: Array<MemberInfo>, index: number): void {
    const member = stages[index]
    const cell = this.graph.getCell(index.toString())
    if (cell) {
      this.setMemberInfo(cell, member)
      this.updateLink(stages)
    }
  }
  setMemberInfo(member: joint.shapes.org.Member, { image, title, subTitle, borderColor }: MemberInfo): void {
    member.attr({
      image: { 'xlink:href': image },
      '.card': {
        stroke: borderColor || 'none',
      },
      '.rank': {
        text: title,
      },
      '.name': {
        text: subTitle ? subTitle.substring(0, 12) : '',
      },
    })
  }
  static get config() {
    return {
      paperBackgroundColor: '#f5faff',
      memberBackgroundColor: 'white',
      memberTitleColor: '#212121',
      memberSubTitleColor: '#9e9e9e',
      memberShadowColor: '#bbdefb',
      memberPortColor: '#FFC87D',
      linkColor: '#4fc3f7',
      randomLinkColor: '#a2aabf',
      dangerColor: '#ff8a80',
    }
  }
  static get getBorderColor() {
    return stage => isEqual(stage.action.stageAction, ['0', '0']) ? 'none' : Map.config.dangerColor
  }
  onMemberPosChange(member: joint.shapes.org.Member, { x, y }: MapCoord): void {
    // Recording position to local
    const position = {
      id: member.id,
      x,
      y,
    }
    store.set(member.id, position)
  }
  setMemberPos(member: joint.shapes.org.Member, { x, y }: MapCoord): void {
    member.prop({
      position: { x, y },
    })
  }
  createPort(group?: string = 'in', position?: string = 'left'): any {
    return {
      id: group,
      group,
      attrs: {
        circle: {
          stroke: 'none',
          fill: Map.config.memberPortColor,
          'fill-opacity': 0.5,
          magnet: group === 'in' ? 'passive' : false,
        },
      },
      position,
      markup: '<circle class="port-body" r="6"/>',
    }
  }
  validateConnection(cellViewSource: any, magnetSource: any, cellViewTarget: any, magnetTarget: any, end: any, linkView: any): boolean {
    const getPort = magnet => magnet.getAttribute('port-group')
    const sourceIn = magnetSource && getPort(magnetSource) === 'in'
    const targetIn = magnetTarget && getPort(magnetTarget) === 'in'
    if (end === 'source') return false
    // Prevent linking from input ports.
    if (sourceIn) return false
    // Prevent linking from output ports to input ports within one element.
    if (cellViewSource === cellViewTarget) return false
    if (targetIn && magnetSource && getPort(magnetSource) === 'out') return false
    // Prevent linking to input ports.
    if (!targetIn) return false
    return true
  }
  interactive(): any {
    return {
      // disable add link
      addLinkFromMagnet: false,
    }
  }
  // set origin offset position
  setOldPos(x: number, y: number): void {
    const origin = this.paper.options.origin
    x = x || origin.x
    y = y || origin.y
    this.oldOrigin = { x, y }
  }
  setOriginPos(x: number, y: number): void {
    this.paper.setOrigin(x, y)
    store.set('pos', { x, y })
  }
}
