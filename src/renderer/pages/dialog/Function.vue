<template>
  <el-form :rules="rules" :model="form" ref="form">
    <template v-if="type==='loop'">
      <el-form-item label="Loop name" label-width="200px" prop="name">
        <el-input placeholder="Loop name" v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="Starting stage" label-width="200px" prop="start">
        <el-select placeholder="Starting stage" v-model="form.start">
          <el-option v-for="(stage,i) in stages" :key="i" :label="getStageName(stage,i,true)" :value="stage.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Ending stage" label-width="200px" prop="end">
        <el-select placeholder="Ending stage" v-model="form.end" :disabled="!form.start">
          <el-option v-for="(stage,i) in endStages" :key="i" :label="getStageName(stage,stages.indexOf(stage),true)"
            :value="stage.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="End loop number" label-width="200px" prop="loopNumber">
        <el-input placeholder="End loop number" type="number" v-model="form.loopNumber"></el-input>
      </el-form-item>
    </template>
    <template v-else>
      <el-form-item label="Loop name" label-width="200px" prop="name">
        <el-select placeholder="Loop name" v-model="form.name">
          <el-option v-for="(loop,i) in loops.filter(f=>f.type==='loop')" :key="i" :label="loop.name" :value="loop.name"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="stage" label-width="200px" prop="stage">
        <el-select placeholder="stage" v-model="form.stage">
          <el-option v-for="(stage,i) in stages" :key="i" :label="getStageName(stage,i,true)" :value="stage.id"></el-option>
        </el-select>
      </el-form-item>
      <template v-if="showMore">
        <el-form-item label="Ending method" label-width="200px" prop="method">
          <el-select placeholder="Ending method" v-model="form.method">
            <el-option v-for="(method,i) in ['Loop Count','Time Based']" :key="i" :label="method"
              :value="i"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Ending Condition" label-width="200px" prop="condition">
          <el-input placeholder="Ending Condition" type="number" v-model="form.condition"></el-input>
        </el-form-item>
      </template>
      <div style="text-align:right;">
        <span class="fa-icon-button" @click="showMore=!showMore">More</span>
      </div>
    </template>
    <el-form-item size="large" style="text-align:center;">
      <el-button type="text" @click="remove">REMOVE {{type.toUpperCase()}}</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
  import { clone } from 'ramda'
  import { mapState, mapGetters, mapMutations } from 'vuex'
  import { get, pick } from 'lodash'

  const requiredField = {
    required: true,
    message: 'Required',
  }

  const keyForLoop = ['name', 'type', 'start', 'end', 'loopNumber']
  const keyForContinue = ['name', 'type', 'stage', 'method', 'condition']

  export default {
    name: 'IDialogFunction',
    props: {
      options: Object,
      value: Object,
    },
    computed: {
      ...mapGetters(['stageIndex', 'getStageName']),
      ...mapState({
        stages: state => state.project.stages,
        loops: state => state.project.loops,
      }),
      endStages() {
        return this.stages
      },
    },
    data() {
      const loop = get(this.value, 'loop') || { loopNumber: 1 }
      const type = get(this.value, 'type') || loop.type || 'loop'
      return {
        showMore: false,
        type,
        form: {
          ...keyForLoop.reduce((a, k) => Object.assign(a, { [k]: null }), {}),
          ...keyForContinue.reduce((a, k) => Object.assign(a, { [k]: null }), {}),
          ...loop,
          type,
        },
        rules: {
          ...keyForLoop.reduce(
            (a, k) => Object.assign(a, { [k]: requiredField }),
            {}
          ),
          ...keyForContinue.reduce(
            (a, k) => Object.assign(a, { [k]: requiredField }),
            {}
          ),
        },
      }
    },
    methods: {
      ...mapMutations(['addLoop', 'updateLoop', 'removeLoop']),
      onOK() {
        const update = typeof this.value.index === 'number'
        return new Promise((resolve, reject) => {
          if (
            this.type === 'loop' &&
            !update &&
            this.loops.find(loop => loop.name === this.form.name)
          ) {
            return reject('The loop name already exists')
          }
          this.$refs.form.validate(valid =>
            valid ? resolve(valid) : reject('invalid value')
          )
        }).then(() => {
          const type = this.type
          const loop = pick(
            this.form,
            type === 'loop' ? keyForLoop : keyForContinue
          )
          if (update) {
            this.updateLoop({
              index: this.value.index,
              newLoop: loop,
            })
          } else {
            this.addLoop(loop)
          }
          return Promise.resolve()
        })
      },
      remove() {
        this.removeLoop(this.value.index)
        this.$emit('close')
      },
    },
  }
</script>

<style lang="stylus" scoped>
</style>
