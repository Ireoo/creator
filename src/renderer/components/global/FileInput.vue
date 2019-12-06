<template>
  <el-input :value="value" @input="$emit('input',$event)" size="small">
    <span slot="prepend" v-if="$slots.prepend">
      <slot name="prepend"></slot>
    </span>
    <el-button slot="append" @click="select()">
      <i class="fa fa-folder-o"></i>
    </el-button>
  </el-input>
</template>

<script>
  import path from 'path'
  import { openFileSelectDialog } from 'lib/electron'

  export default {
    name: 'FileInput',
    props: {
      value: String,
      directory: {
        type: Boolean,
        default: false,
      },
      file: {
        type: Boolean,
        default: true,
      },
      relative: String,
      defaultDirectory: String,
      filters: Array,
    },
    methods: {
      select() {
        openFileSelectDialog({
          defaultPath: this.defaultDirectory || this.relative,
          directory: !!this.directory,
          filters: this.filters,
        })
          .then(p => {
            if (this.relative) {
              const relative = path.relative(this.relative, p)
              if (relative.startsWith('..')) {
                // error
              } else {
                this.$emit('input', relative)
              }
            } else {
              this.$emit('input', p)
            }
          })
          .catch(() => {
            // cancel open
          })
      },
    },
  }
</script>

<style lang="stylus">
</style>
