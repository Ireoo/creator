<template>
  <el-form ref="form">
    <template v-for="(loop, index) in debug.debugLoops">
      <el-form-item class="form-item" label="Debug Loop Name" :key="`debug${index}`" label-width="200px">
        <el-select v-model="loop.name" style="max-width:80%;">
          <el-option :label="item.name" :value="item.name" v-for="(item,i) in  loops.filter(loop=>loop.type==='loop')"
            :key="i"></el-option>
        </el-select>
        <i class="fa-icon-button fa fa-remove" title="Remove the Loop" @click="debug.debugLoops.splice(index,1)"></i>
      </el-form-item>
      <el-form-item class="form-item" label="Debug Loop #" :key="`debugLoopNumber-${index}`"
        label-width="200px">
        <el-input v-model="loop.loopNumber" type="number"></el-input>
      </el-form-item>
      <hr style="opacity:0.2;" :key="'divider'+index" v-if="debug.debugLoops[index+1]">
    </template>
    <div style="text-align:center;">
      <el-button @click="addDebugLoop" size="mini">
        + Add Debug loop
      </el-button>
    </div>
  </el-form>
</template>

<script>
  import { clone, path as get } from 'ramda'
  import { mapState } from 'vuex'
  import { defaultDebugLoop } from '@/store/modules/project/debug.js'

  export default {
    name: 'IDialogDebug',
    props: {
      options: Object,
    },
    computed: {
      ...mapState({
        loops: get(['project', 'loops']),
      }),
    },
    data() {
      return {
        debug: clone(this.$store.state.project.debug),
      }
    },
    created() {
      if (!this.debug.debugLoops.length) {
        this.addDebugLoop()
      }
    },
    methods: {
      addDebugLoop() {
        this.debug.debugLoops.push(clone(defaultDebugLoop))
      },
      onOK() {
        Object.keys(this.debug).forEach(key => {
          this.$store.commit('updateDebug', { key, value: this.debug[key] })
        })
        return Promise.resolve()
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .fa-remove
    position absolute
    line-height 30px
    right 0
    top 0
</style>
