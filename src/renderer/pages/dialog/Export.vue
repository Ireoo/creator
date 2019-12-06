<template>
  <el-form :rules="rules"
    :model="value"
    ref="form">
    <el-form-item :label="exportText('projectName')"
      prop="projectName">
      <el-input v-model="value.projectName"
        size="small"></el-input>
    </el-form-item>
    <el-form-item :label="exportText('thumbnail')"
      prop="thumbnail">
      <file-input v-model="value.thumbnail"
        :filters="imageFilter"></file-input>
    </el-form-item>
    <el-form-item :label="exportText('tag')"
      prop="tag">
      <el-input v-model="value.tag"
        size="small"></el-input>
      <div class="tags">
        <el-tag v-for="tag in tags"
          :key="tag.value"
          @click.native="addTag(tag.value)"
          class="tag">
          {{tag.value}}
        </el-tag>
      </div>
    </el-form-item>
    <el-form-item :label="exportText('description')"
      prop="description">
      <el-input v-model="value.description"
        size="small"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
  import { getTags } from 'lib/sqlite'
  import { last } from 'ramda'
  const requiredField = {
    type: 'string',
    required: true,
  }
  const notRequiredField = {
    type: 'string',
    required: false,
  }

  export default {
    name: 'IDialogExport',
    props: {
      value: {
        type: Object,
        default: {
          projectName: '',
          thumbnail: '',
          tag: '',
          description: '',
        },
      },
    },
    data() {
      const existTags = getTags()
      return {
        rules: {
          projectName: requiredField,
          thumbnail: requiredField,
          description: notRequiredField,
          tag: requiredField,
        },
        imageFilter: [
          {
            name: 'Image',
            extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
          },
        ],
        defaultInfo: {},
        tags: existTags.map(value => ({ value: value.toLowerCase() })),
      }
    },
    methods: {
      onOK() {
        return new Promise((resolve, reject) => {
          this.$refs.form.validate(
            valid => (valid ? resolve(this.value) : reject(valid))
          )
        })
      },
      addTag(str) {
        const end = last(this.value.tag)
        const hasSemicolon = end === ',' || end === ''
        if (this.value.tag.split(',').every(tag => tag.trim() !== str)) { this.value.tag += hasSemicolon ? str : `, ${str}` }
      },
    },
  }
</script>
<style lang="stylus" scoped>
  .tags
    max-height 80px
    overflow auto
    .tag
      cursor pointer
      margin 0 5px
</style>

