export default {
  props: {
    position: String,
  },
  computed: {
    style() {
      switch (this.position) {
        case 'topLeft':
          return {
            top: this.top,
            left: this.left,
          }
        case 'topRight':
          return {
            top: this.top,
            right: this.right,
          }
        case 'bottomLeft':
          return {
            bottom: this.bottom,
            left: this.left,
          }
        case 'bottomRight':
          return {
            bottom: this.bottom,
            right: this.right,
          }
        default:
          return {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }
      }
    },
    styleLayer() {
      let transformOrigin = ''
      switch (this.position) {
        case 'topLeft':
          transformOrigin = 'top left'
          break
        case 'topRight':
          transformOrigin = 'top right'
          break
        case 'bottomLeft':
          transformOrigin = 'bottom left'
          break
        case 'bottomRight':
          transformOrigin = 'bottom right'
          break
        default:
          transformOrigin = 'center center'
      }
      return {
        ...this.style,
        transform: `scale(${this.$store.state.board.zoom})`,
        transformOrigin,
      }
    },
  },
}
