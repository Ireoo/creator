<template>
  <div class="main">
    <i-header></i-header>
    <div class="main-container">
      <template v-if="active === 'instruction'">
        <i-thumb-panel class="left-panel"></i-thumb-panel>
        <i-instruction-board class="main-board"></i-instruction-board>
      </template>
      <template v-else-if="view === 'board'">
        <i-thumb-panel class="left-panel"></i-thumb-panel>
        <div class="board-wrapper">
          <i-board v-ref:board
            class="main-board"></i-board>
          <!-- <i-resource-panel class="bottom-panel"></i-resource-panel> -->
        </div>
        <i-parameter-panel class="right-panel"></i-parameter-panel>
      </template>
      <template v-else-if="view === 'table'">
        <i-table></i-table>
        <i-parameter-panel class="right-panel"></i-parameter-panel>
      </template>
      <template v-else-if="view === 'parameter'">
        <i-table-parameter></i-table-parameter>
      </template>
      <template v-else-if="view === 'preview'">
        <i-preview></i-preview>
      </template>
      <template v-else-if="view === 'map'">
        <i-thumb-panel class="left-panel"></i-thumb-panel>
        <i-map></i-map>
      </template>
      <template v-else-if="view === 'lMap'">
        <i-thumb-panel class="left-panel"></i-thumb-panel>
        <i-l-map></i-l-map>
      </template>
    </div>
    <i-footer></i-footer>
    <i-dialog></i-dialog>
  </div>
</template>

<script>
  import { MountComponents } from 'lib/utils'
  import { mapState, mapGetters } from 'vuex'

  import Header from 'pages/header/Header.vue'
  import Stage from 'pages/thumb/StagePanel.vue'
  import Parameter from 'pages/parameter/Panel_.vue'
  import Board from 'pages/board/Board.vue'
  import InstructionBoard from 'pages/instruction/Board.vue'
  import Footer from 'pages/footer/Footer.vue'
  import Dialog from 'pages/dialog/Dialog.vue'
  import Table from 'pages/table/Table.vue'
  import TableParameter from 'pages/table/Parameter.vue'
  import Preview from 'pages/preview/Preview.vue'
  import Map from 'pages/map/Map.vue'
  import LMap from 'pages/map/LMap.vue'
  // import Resource from 'pages/resource/Panel.vue'

  export default {
    name: 'IMain',
    components: MountComponents(
      Header,
      Stage,
      Parameter,
      Board,
      InstructionBoard,
      Footer,
      Dialog,
      Table,
      TableParameter,
      Preview,
      LMap,
      // Resource,
      Map
    ),
    computed: {
      ...mapState({
        view: state => state.board.view,
        active: state => state.header.active,
      }),
      ...mapGetters(['projectExist']),
    },
  }
</script>

<style lang="stylus" scoped>
  .main
    display flex
    flex-direction column
    height 100%
  .main-container
    display flex
    flex-direction row
    height 100%
    background $main-board-background
  .main-board
    flex-grow 1
  .left-panel, .right-panel, .bottom-panel
    flex-shrink 0
    flex-grow 0
    background $main-board-background
    z-index 1
  .left-panel
    padding-bottom 50px
  .board-wrapper
    full-size()
    display flex
    flex-direction column
    overflow hidden
</style>
