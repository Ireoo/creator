<template>
  <div class="container">
    <span class="start-symbol"></span>
    <el-form-item style="margin-bottom:0;" label="Logic" label-width="50px">
      <el-select style="width:100px;" :value="conditionItem.logic" @input="update(`logic`,$event)"
        placeholder="Logic">
        <template v-if="!index">
          <el-option :label="logics[0]" :value="0" ></el-option>
          <el-option :label="logics[4]" :value="4" ></el-option>
        </template>
        <template v-else>
          <el-option :label="option" :value="i" v-for="(option,i) in  logics" :key="i"></el-option>
        </template>
      </el-select>
    </el-form-item>
    <el-form-item style="margin-bottom:0;" label="Type" label-width="60px">
      <el-select style="width:100px;" :value="conditionItem.type" @input="update(`type`,$event)">
        <el-option :label="type" :value="i" v-for="(type,i) in conditionTypes" :key="i"></el-option>
      </el-select>
    </el-form-item>
    <!-- Goody -->
    <template v-if="conditionItem.type===0">
      <el-form-item style="margin-bottom:0;" label="Name" label-width="70px">
        <el-select style="width:100px;" :value="conditionItem.name" @input="update(`name`,$event)">
          <el-option :label="goody.name" :value="goody.name" v-for="(goody,i) in goodies" :key="i"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item style="margin-bottom:0;" label="Method" label-width="80px">
        <el-select style="width:120px;" :value="conditionItem.method" @input="update(`method`,$event)"
          placeholder="Method">
          <el-option :label="item" :value="i" v-for="(item,i) in goodyMethods" :key="i"></el-option>
        </el-select>
      </el-form-item>
    </template>
    <!-- Loop -->
    <template v-else-if="conditionItem.type===1">
      <el-form-item style="margin-bottom:0;" label="Name" label-width="70px">
        <el-select style="width:100px;" :value="conditionItem.name" @input="update(`name`,$event)">
          <el-option :label="loop.name" :value="loop.name" v-for="(loop,i) in regularLoops" :key="i"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item style="margin-bottom:0;" label="Method" label-width="80px">
        <el-select style="width:120px;" :value="conditionItem.method" @input="update(`method`,$event)"
          placeholder="Method">
          <el-option :label="item" :value="i" v-for="(item,i) in loopMethods" :key="i"></el-option>
        </el-select>
      </el-form-item>
    </template>
    <el-form-item style="margin-bottom:0;" label="Compare" label-width="80px">
      <el-select style="width:70px;" :value="conditionItem.compare" @input="update(`compare`,$event)">
        <el-option :label="item" :value="i" v-for="(item,i) in compareMethods" :key="i"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item style="margin-bottom:0;" label="Threshold" label-width="90px">
      <el-input style="width:70px;" :value="conditionItem.threshold" @input="update(`threshold`,$event)"
        type="number" placeholder="0"></el-input>
    </el-form-item>
    <if-scene-drop-menu :conditionItem="conditionItem" />
  </div>
</template>

<script>
  import { mapState, mapMutations, mapGetters, mapActions } from 'vuex'
  import { path as get, clone } from 'ramda'
  import dropMenu from './dropMenu.vue'
  import { MountComponents } from 'lib/utils'

  export default {
    name: 'if-scene-condition',
    components: MountComponents(dropMenu),
    props: {
      conditionItem: {
        required: true,
        type: Object,
      },
    },
    computed: {
      ...mapState({
        loops: get(['project', 'loops']),
        stages: get(['project', 'stages']),
        stage: get(['project', 'selectedStage']),
        condition: get(['project', 'selectedStage', 'condition']),
        logics: get(['static', 'condition', 'logics']),
        loopMethods: get(['static', 'condition', 'loopMethods']),
        goodyMethods: get(['static', 'condition', 'goodyMethods']),
        compareMethods: get(['static', 'condition', 'compareMethods']),
        conditionTypes: get(['static', 'condition', 'conditionTypes']),
      }),
      ...mapGetters(['protectCheck', 'goodies']),
      regularLoops() {
        return this.loops.filter(loop => loop.type === 'loop')
      },
      index() {
        return this.condition.conditions.indexOf(this.conditionItem)
      },
    },
    methods: {
      ...mapMutations([
        'addCondition',
        'removeCondition',
        'moveToConditionGroup',
        'moveOutConditionGroup',
      ]),
      ...mapActions(['addConditionGroup']),
      update(key, value) {
        const index = this.condition.conditions.indexOf(this.conditionItem)
        this.$emit('update', {
          key: `conditions.${index}.${key}`,
          value,
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .container
    display flex
    align-items center
    margin 10px 0
</style>