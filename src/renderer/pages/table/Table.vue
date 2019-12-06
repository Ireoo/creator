<template>
  <el-table ref="table"
    :data="stages"
    highlight-current-row
    @current-change="handleSelectChange"
    height="100%">
    <el-table-column label="#">
      <template slot-scope="{row}">
        <i class="fa fa-fw"
          :class="'fa-' + (row.selected ? 'dot-circle-o' : 'circle-o')"></i>
      </template>
    </el-table-column>
    <el-table-column :label="tableText('Name')"
      width="100px">
      <template slot-scope="{$index, row}">
        {{tableText('Stage')}}{{$index + 1}}
      </template>
    </el-table-column>
    <el-table-column lable="Thumbnail"
      min-width="200px">
      <template slot-scope="{row}">
        <img :src="row.snapshot + '?' + Date.now()"
          style="width: 160px; height: 90px">
      </template>
    </el-table-column>
    <el-table-column :label="tableText('Action')"
      min-width="200px">
      <template slot-scope="{row}">
        <el-tag type="primary">
          {{value2Label(action[0], row.action.stageAction)}}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column :label="tableText('Transition')"
      min-width="200px">
      <template slot-scope="{row}">
        <el-tag type="danger"
          v-if="row.transition.length === 0">{{stageDialogText('No transition')}}</el-tag>
        <div v-for="(trans, index) in row.transition"
          :key="index">
          T{{index + 1}}:
          <el-tag type="primary">{{stageDialogText(value2Label(transition[2], trans.NextStage))}}</el-tag>
        </div>
      </template>
    </el-table-column>
    <el-table-column :label="tableText('Parameter')"
      align="center">
      <el-table-column v-for="(type,index) in ['bg', 'fg', 'cus']"
        :label="tableText(type)"
        min-width="200px"
        :key="index">
        <template slot-scope="{row}">
          <template v-if="row.parameter[type].source.metadata">
            <div>{{tableText('Directory')}}:
              <el-tag type="primary">{{row.parameter[type].source.directory}}</el-tag>
            </div>
            <div>{{tableText('File')}}:
              <el-tag type="primary">{{row.parameter[type].source.file}}</el-tag>
            </div>
            <div>{{tableText('Reference')}}:
              <el-tag type="primary">{{row.parameter[type].source.reference}}</el-tag>
            </div>
            <div>{{tableText('Units')}}: {{row.parameter[type].units.length}}</div>
          </template>
          <el-tag type="danger"
            v-else>{{tableText('No resource')}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="tableText('OBJ')"
        min-width="100px">
        <template slot-scope="{row}">
          <div>{{tableText('Units')}}: {{row.parameter.obj.units.length}}</div>
        </template>
      </el-table-column>
    </el-table-column>
  </el-table>
</template>

<script>
  import { mapState, mapMutations } from 'vuex'
  import { value2Label, labelI18n } from 'lib/form'

  export default {
    name: 'ITable',
    computed: {
      ...mapState({
        stages: state => state.project.stages,
        selectedStage: state => state.project.selectedStage,
      }),
      transition() {
        return this.$store.state.static.form.transition
      },
      action() {
        const form = labelI18n(
          this.$store.state.static.form,
          this.stageDialogText
        )
        return form.action
      },
    },
    watch: {
      selectedStage(stage) {
        this.$refs.table.setCurrentRow(stage)
      },
    },
    methods: {
      ...mapMutations(['selectStage']),
      value2Label,
      handleSelectChange(stage) {
        this.selectStage(stage)
      },
    },
    mounted() {
      this.$refs.table.setCurrentRow(this.selectedStage)
    },
  }
</script>

<style lang="stylus" scoped>
</style>