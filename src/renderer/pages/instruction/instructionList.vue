<template>
  <ul class="instruction-list">
    <!-- <transition-group name="instruction-list-item"> -->
      <li class="instruction-list__item" v-for="(instr, index) in mixedInstruction" :key="index+''">
        <i-instruction-item :type="instr.type" :prompt="formatPrompt(instr)" @contextmenu="onInstructionMenu($event, instr)"
          @click="editInstruction(instr)"></i-instruction-item>
      </li>
    <!-- </transition-group> -->
  </ul>
</template>

<script>
  import { mapState, mapMutations, mapGetters } from 'vuex'
  import { MountComponents } from 'lib/utils'
  import InstructionItem from './InstructionItem.vue'
  import { clone, uniq } from 'ramda'
  import { EV_DIALOG_OPEN, DIALOG_INSTRUCTION_EDITOR } from 'type/constants'
  const positionMap = new Map([
    ['topLeft', 'TL'],
    ['topRight', 'TR'],
    ['center', 'M'],
    ['bottomLeft', 'BL'],
    ['bottomRight', 'BR'],
  ])
  export default {
    name: 'IInstructionList',
    components: MountComponents(InstructionItem),
    props: {
      // speciafied stage
      current: {
        type: Object,
        default: null,
      },
    },
    computed: {
      ...mapState({
        instruction: state => state.project.instruction,
      }),
      ...mapGetters(['goodies']),
      stage() {
        if (this.current) return this.current
        else return this.$store.state.project.selectedStage
      },
      globalInstruction() {
        return this.instruction.filter(
          instr =>
            instr.start.stage === this.stage.id ||
            instr.stop.find(stop => stop.stage === this.stage.id)
        )
      },
      mixedInstruction() {
        const goodies = this.goodies.filter(
          goody => goody.endStage === this.stage.id
        )
        const mixed = [
          ...this.globalInstruction,
          ...this.stage.instruction,
          ...goodies,
        ]
        return uniq(mixed)
      },
    },
    methods: {
      ...mapMutations(['deleteInstruction', 'updateInstruction']),
      findIndex(instruct) {
        if (instruct.type === 'music' || instruct.type === 'video') {
          return this.instruction.indexOf(instruct)
        } else {
          return this.stage.instruction.indexOf(instruct)
        }
      },
      onInstructionMenu({ menu }, instruct) {
        menu.deleteGroup.onDelete = () => {
          this.deleteInstruction({
            stage: this.stage,
            index: this.findIndex(instruct),
            instruct,
          })
        }
      },
      formatPrompt(instr) {
        switch (instr.type) {
          case 'photo':
            return instr.delay
          case 'video':
            if (instr.start.stage === this.stage.id) return 'Start'
            else if (instr.stop.stage === this.stage.id) return 'Stop'
            else return ''
          case 'music':
            if (instr.start.stage === this.stage.id) return 'Start'
            else if (instr.stop.find(stop => stop.stage === this.stage.id)) { return 'Stop' } else return ''
          case 'text':
            return positionMap.get(instr.position)
          case 'command':
            return instr.delay
          case 'goody':
            if ([undefined, this.stage.id].includes(instr.startStage)) { return 'Start' } else if (instr.endStage === this.stage.id) return 'Stop'
            else return ''
        }
        return void 0
      },
      editInstruction(instruct) {
        const data = clone(instruct)
        this.$events.emit(EV_DIALOG_OPEN, {
          type: DIALOG_INSTRUCTION_EDITOR,
          title: 'Edit ' + instruct.type,
          textOk: 'Save',
          data,
          confirmed: ({ data }) => {
            this.updateInstruction({
              stage: this.stage,
              index: this.findIndex(instruct),
              instruct: data,
            })
          },
        })
      },
    },
  }
</script>

<style scoped lang="stylus">
  .instruction-list
    reset-ul()
    overflow hidden
    position absolute
    top 0
    padding 10px 40px
    width 100%
  .instruction-list__item
    display inline-block
    padding 5px
  .instruction-list-item-enter-active, .instruction-list-item-leave-active
    transition 0.3s
  .instruction-list-item-enter, .instruction-list-item-leave-to
    opacity 0
</style>