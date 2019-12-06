<template>
  <div :class="{
            'menu-button': true,
            'menu-button_line': singleLine,
            'menu-button_disabled': disabled,
            'menu-button highlight': highlight
          }"
    @mouseover.self="mouseover" @click="click">
    <template v-if="trigger==='hover'">
      <div :class="{
              'menu-button__icon ': true,
            }">
        <i :class="'fa fa-fw fa-' + icon" />
      </div>
      <small class="menu-button__text">{{text}}</small>
    </template>

    <el-dropdown style="position:static;" ref="dropdown" @visible-change="visibleChange"
      :hide-on-click="false" v-if="dropdownMenu && dropdownMenu.length" :trigger="trigger">
      <div>
        <template v-if="trigger==='click'">
          <div :class="{
              'menu-button__icon ': true,
            }">
            <i :class="'fa fa-fw fa-' + icon" />
          </div>
          <small class="menu-button__text">{{text}}</small>
        </template>
        <div class="dropdown-icon">▾</div>
      </div>

      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item v-for="(item,index) in dropdownMenu" :key="index" :divided="item.divided"
          :disabled="item.disabled || disabled" @click.native="!disabled && $emit('command',item)">
          <i :class="'fa fa-fw fa-'+item.icon" />
          {{item.text}}
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
  export default {
    name: 'IHeaderMenuButton',
    props: {
      icon: String,
      text: String,
      singleLine: Boolean,
      disabled: Boolean,
      highlight: Boolean,
      dropdownMenu: Array,
      trigger: {
        type: String,
        default: 'hover',
      },
    },
    data: _ => ({ showDropdown: false }),
    methods: {
      mouseover(e) {
        if (
          this.enableMouseover &&
          this.dropdownMenu &&
          this.dropdownMenu.length &&
          !this.showDropdown
        ) {
          this.$refs.dropdown.visible = true
        }
      },
      visibleChange(show) {
        this.showDropdown = show
      },
      click(e) {
        if (this.$listeners.click && e.target.classList.contains('dropdown-icon')) {
          return e.preventDefault()
        }
        !this.disabled && this.$emit('click')
      },
    },
  }
</script>

<style lang="stylus">
  .menu-button
    position relative
    background transparent
    outline none
    border none
    cursor pointer
    color black
    padding 10px
    border-radius 5px
    .dropdown-icon
      position absolute
      line-height 100%
      top 0
      bottom 0
      right 6px
      height 30px
      margin auto
      &:hover
        color $primary-color-highlight
    &.highlight
      color $primary-color-highlight
    &:hover
      color $primary-color-highlight
    &__icon, &__text
      text-align center
      .menu-button_line &
        display inline-block
    // &__icon.dropdown
    // position relative
    // &:after
    // position absolute
    // content '▼'
    // top 5px
    // left 0
    // right 0
    // margin auto
    // margin-right -25px
    &_disabled
      color grey
      cursor not-allowed
      &:hover
        color @color
</style>
