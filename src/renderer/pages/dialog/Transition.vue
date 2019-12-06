<template>
  <div>
    <object-form formName="transition" :value="value" :additional="additional" ref="form"></object-form>
    <i-stage-position-selector v-if="canShowStagePositionSelector" :startX.sync="value.TLx"
      :startY.sync="value.TLy" :endX.sync="value.BRx" :endY.sync="value.BRy" :src="options.image"></i-stage-position-selector>

    <el-form size="mini" class="form-2" :model="form2" ref="form2">
      <template v-for="(transition, index) in form2.goodies">
        <hr style="opacity:0.2;" :key="'divider'+index">
        <el-form-item class="form-item" label="Goody Name" :key="`name-${index}`" :rules="form2.rules"
          :prop="`goodies[${index}].name`" label-width="200px">
          <el-select :value="transition.name" @input="form2.goodies[index].name = $event">
            <el-option :label="goody.name" :value="goody.name" v-for="(goody,i) in  goodies"
              :key="i"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item class="form-item" label="Goody Change Method" :key="`method${index}`" :rules="form2.rules"
          :prop="`goodies[${index}].method`" label-width="200px">
          <el-select :value="transition.method" @input="form2.goodies[index].method = $event">
            <el-option :label="option" :value="i" v-for="(option,i) in  ['Increase Value','Decrease Value','Reduce to zero','Set Value to']"
              :key="i"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item class="form-item" label="Goody Change Value" :key="`changeValue-${index}`"
          :rules="form2.rules" :prop="`goodies[${index}].changeValue`" label-width="200px">
          <el-input :value="transition.changeValue" @input="form2.goodies[index].changeValue = $event"
            type="number"></el-input>
        </el-form-item>
        <el-form-item align="center" :key="`remove${index}`">
          <i class="fa-icon-button fa fa-remove" title="Remove the Goody Transition" @click="form2.goodies.splice(index,1)"></i>
        </el-form-item>
      </template>
    </el-form>
    <div style="text-align:center;">
      <el-button @click="addGoodyTransition" size="mini">
        + Add Goody Transition
      </el-button>
    </div>
  </div>

</template>

<script>
  import { MountComponents } from 'lib/utils'
  import StagePositionSelector from 'components/stage/StagePositionSelector.vue'
  import { mapGetters } from 'vuex'
  import { pick } from 'lodash'

  export default {
    name: 'IDialogTransition',
    components: MountComponents(StagePositionSelector),
    props: {
      value: Object,
      options: Object,
    },
    data() {
      return {
        additional: [
          {
            name: 'NextStage',
            rule: {
              validator: (rule, value, callback) => {
                // only use time-based transition in end/pre-end stage
                const stage = this.options.stage
                if (!stage) return callback()
                if (stage.type !== 'normal' && this.value.NextStage[0] !== '1') {
                  return callback(
                    new Error(
                      'Transition can only be time-based in End/Pre-End stage'
                    )
                  )
                }
                callback()
              },
              trigger: 'change',
            },
          },
        ],
        form2: {
          rules: { required: true, message: 'Required', trigger: 'blur' },
          goodies: [],
        },
      }
    },
    computed: {
      ...mapGetters(['goodies']),
      canShowStagePositionSelector() {
        return (
          this.value.ROI === '0' && ['2', '3'].includes(this.value.NextStage[0])
        )
      },
    },
    created() {
      Object.assign(this.form2, pick(this.value, Object.keys(this.form2)))
    },
    methods: {
      addGoodyTransition() {
        this.form2.goodies.push({
          name: null,
          method: null,
          changeValue: null,
        })
      },
      async onOK() {
        await this.$refs.form.validate()
        await this.$refs.form2.validate()
        Object.assign(this.value, this.form2)
        return true
      },
    },
  }
</script>
