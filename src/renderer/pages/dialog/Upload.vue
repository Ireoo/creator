<template>
  <section>
    <el-row class="list">
      <el-col :span="8" class="left">
        <el-button type="text" @click="newStory" style="display:block;">New project</el-button>
        <el-radio-group v-model="selectedPost">
          <el-radio class="radio" v-for="(item,$index) in list" :key="$index" :label="item">{{item.title}}({{item.id}})</el-radio>
        </el-radio-group>
      </el-col>
      <el-col :span="16" v-if="selectedPost">
        <label>Title:</label>
        <el-input v-model="selectedPost.title" />
        <label>description:</label>
        <el-input @keyup.enter.native.capture.stop="" type="textarea" v-model="selectedPost.content" :autosize="{ minRows: 5, maxRows: 5}">
        </el-input>
      </el-col>
    </el-row>
    <el-row>
      <div>Select a thumbnail:</div>
      <image-selector v-model="selectedThumb" :path="thumbnailPath" :showSearch="false" :showInput="false"></image-selector>
    </el-row>
  </section>
</template>

<script>
  import { get } from 'lodash'
  import { mapState, mapMutations, mapGetters } from 'vuex'
  import path from 'path'
  import fs from 'fs-extra'
  import zipFolder from 'zip-folder'
  export default {
    name: 'IDialogUpload',
    data() {
      return {
        selectedPost: null,
        selectedThumb: '',
        list: [],
        titleChanged: false,
      }
    },
    computed: {
      ...mapState({
        projectPath: state => state.project.projectPath,
        stages: state => state.project.stages,
        user: state => state.user,
        domain: state => state.configuration.domain,
      }),
      thumbnailPath() {
        return path.join(this.projectPath, 'thumbnail')
      },
    },
    watch: {
      'selectedPost.title'(newValue, oldValue) {
        if (this.selectedPost.files.length !== 0) {
          this.titleChanged = true
        }
      },
      selectedPost(newValue, oldValue) {
        this.titleChanged = false
      },
    },
    mounted() {
      this.refresh()
    },
    methods: {
      ...mapMutations(['initUser']),
      onOK() {
        if (!this.selectedThumb) return Promise.reject('thumbnail is null.')
        return new Promise(async resolve => {
          this.$loading()
          // 根据需求，在title变化后，自动newProject
          if (this.titleChanged) {
            const { title, content } = this.selectedPost
            this.selectedPost = await this.newStory()
            this.selectedPost.title = title
            this.selectedPost.content = content
          }
          await this.deleteAttachment()
          await this.update()
          await this.upload('thumbnail')
          await this.upload('zip')
          await this.refresh()
          this.$loading().close()
          resolve(true)
        })
      },
      refresh() {
        this.$loading()
        this.$axios
          .post(`${this.domain}/api.php?do=getPost`, {
            userId: this.user.id,
          })
          .then(({ data }) => {
            this.list = data.reverse().map((post, i) => {
              const info = {
                title: post.post_title,
                id: post.ID,
                content: post.post_content,
                files: post.files,
              }
              if (i === 0) this.selectedPost = info
              return info
            })
            this.$loading().close()
          })
          .catch(err => {
            this.$loading().close()
          })
      },
      async deleteAttachment() {
        if (!this.selectedPost || !this.list.length) return
        let files = this.selectedPost.files || this.list[0].files
        files = files.filter(file => file.post_mime_type !== 'application/json')
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (
            file.post_mime_type === 'image/png' &&
            file.post_content !== 'creator'
          ) { continue }
          await this.$axios.post(`${this.domain}/api.php?do=delMedia`, {
            userId: this.user.id,
            postId: this.selectedPost.id,
            mediaId: file.ID,
          })
        }
      },
      async update() {
        return this.$axios.post(`${this.domain}/api.php?do=update`, {
          userId: this.user.id,
          postId: this.selectedPost.id,
          title: this.selectedPost.title,
          content: this.selectedPost.content,
          category: 'ar-test-projects',
        })
      },
      async upload(type) {
        const title = path.basename(this.projectPath)
        const postId = this.selectedPost.id
        let filePath, formType
        if (type === 'thumbnail') {
          const image = path.join(
            this.projectPath,
            'thumbnail',
            this.selectedThumb
          )
          filePath = image
          formType = 'image/png'
        } else if (type === 'zip') {
          filePath = path.join(
            this.projectPath,
            `../${title.replace(' ', '_')}.zip`
          )
          formType = 'application/zip'
          await new Promise(resolve => {
            const yml =
              `name: ${this.selectedPost.title}\n` +
              `description: ${this.selectedPost.content}\n` +
              `thumbnail: ./thumbnail/${this.selectedThumb}\n` +
              `id: ${this.selectedPost.id}`
            fs.writeFileSync(path.join(this.projectPath, 'config.yml'), yml)
            zipFolder(this.projectPath, filePath, resolve)
          })
        }

        const formData = new FormData()
        formData.append(
          'file',
          new File([fs.readFileSync(filePath)], path.basename(filePath), {
            type: formType,
          })
        )
        formData.append('userId', this.user.id)
        formData.append('postId', postId)
        formData.append('post_content', 'creator')
        await this.$axios.post(`${this.domain}/api.php?do=media`, formData)
        if (type === 'zip') {
          fs.removeSync(filePath)
        }
        return true
      },
      async newStory() {
        const title = 'New project'
        const content = 'content'
        return this.$axios
          .post(`${this.domain}/api.php?do=post`, {
            userId: this.user.id,
            title,
            content,
            category: 'ar-test-projects',
          })
          .then(async({ data: res }) => {
            const postId = res.data.id
            const item = {
              title,
              content,
              id: postId,
              files: [],
            }
            this.list.unshift(item)
            return item
          })
      },
    },
  }
</script>

<style lang="stylus">
  .left
    height 200px
    overflow auto
    overflow-y scroll
    .radio
      display block
      margin 10px 0 !important
</style>