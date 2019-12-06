<template>
  <el-menu collapse size="mini" class="condition-operation-menu" active-text-color="grey">
    <el-submenu index="1" popper-class="submenu" :popper-append-to-body="false">
      <template slot="title">
        <i class="el-icon-more"></i>
      </template>
      <template v-if="conditionItem">
        <el-menu-item index="1-1" @click.native="removeCondition( {stage,conditionItem})">Delete</el-menu-item>
      </template>
      <template v-else-if="conditionGroup">
        <el-menu-item index="1-1" @click.native="removeConditionGroup( {stage,conditionGroup})">Delete</el-menu-item>
        <el-menu-item index="1-1" @click.native="$emit('expand',true)">Expand</el-menu-item>
        <el-menu-item index="1-1" @click.native="$emit('expand',false)">Shrink</el-menu-item>
      </template>
      <el-submenu index="2" v-if="condition.groups.filter(movable).length">
        <span slot="title">Move to group</span>
        <el-menu-item :index="`2-${i}`" v-for="(to,i) in condition.groups" :key="i" v-if="movable(to)"
          @click.native="_moveToConditionGroup(to)">
          {{to.name}}
        </el-menu-item>
      </el-submenu>
      <template v-if="conditionItem">
        <el-menu-item index="1-1" v-if="conditionItem.parent" @click.native="moveOutConditionGroup( {conditionItem})">
          Move out
        </el-menu-item>
      </template>
      <template v-else-if="conditionGroup">
        <el-menu-item index="1-1" v-if="conditionGroup.parent" @click.native="moveOutConditionGroup( {conditionGroup})">
          Move out
        </el-menu-item>
      </template>
    </el-submenu>
  </el-menu>
</template>


<script>
  import { mapState, mapMutations, mapGetters, mapActions } from 'vuex'
  import { path as get, clone } from 'ramda'
  export default {
    name: 'if-scene-drop-menu',
    props: {
      conditionItem: {
        type: Object,
      },
      conditionGroup: {
        type: Object,
      },
    },
    computed: {
      ...mapState({
        stage: get(['project', 'selectedStage']),
        condition: get(['project', 'selectedStage', 'condition']),
        logics: get(['static', 'condition', 'logics']),
        loopMethods: get(['static', 'condition', 'loopMethods']),
        compareMethods: get(['static', 'condition', 'compareMethods']),
        conditionTypes: get(['static', 'condition', 'conditionTypes']),
      }),
      ...mapGetters([]),
      movable() {
        return to => {
          if (this.conditionItem) {
            // 不能移动到当前所属group中
            if (this.conditionItem.parent === to.id) return false
          } else if (this.conditionGroup) {
            // 不能移动到自身中
            if (this.conditionGroup.id === to.id) return false
            // 不能移动到自己的children中
            const childGroups = []
            const recursion = children => {
              children
                .map(id => this.condition.groups.find(group => group.id === id))
                .filter(group => !!group)
                .forEach(group => {
                  childGroups.push(group.id)
                  recursion(group.children)
                })
            }
            recursion(this.conditionGroup.children)
            if (childGroups.includes(to.id)) return false
            // 不能移动到当前所属group中
            if (this.conditionGroup.parent === to.id) return false
          }
          return true
        }
      },
    },
    methods: {
      ...mapMutations([
        'addCondition',
        'removeCondition',
        'removeConditionGroup',
        'moveToConditionGroup',
        'moveOutConditionGroup',
      ]),
      _moveToConditionGroup(to) {
        if (this.conditionItem) {
          this.moveToConditionGroup({ to, conditionItem: this.conditionItem })
        } else if (this.conditionGroup) {
          this.moveToConditionGroup({ to, conditionGroup: this.conditionGroup })
        }
      },
    },
  }
</script>

<style>
  .condition-operation-menu {
    border: none;
  }
  .condition-operation-menu .el-submenu__title {
    height: 40px;
    line-height: 40px;
  }
  .el-menu--popup {
    min-width: 120px;
  }
  .el-menu--popup .el-menu-item,
  .el-menu--popup .el-submenu__title {
    height: 40px;
    line-height: 40px;
    padding-right: 40px;
  }
  .el-submenu__icon-arrow {
    margin-top: -3px;
  }
  .submenu {
    right: 270px;
    left: initial !important;
  }
</style>