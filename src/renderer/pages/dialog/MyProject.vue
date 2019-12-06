<template>
  <section>
    <el-collapse v-if="list.length" class="list">
      <el-collapse-item :title="post.title" v-for="(post,$index) in list" :key="$index">
        <div style="opacity:0.75;">{{post.content}}</div>
        <el-button size="small" :disabled="downloading" v-if="post.file" type="text" @click="download(post)">Download</el-button>
      </el-collapse-item>
    </el-collapse>

    <div v-else-if="!loading" style="text-align:center;">
      Null
    </div>
    <div class="tip" v-if="tip">
      {{tip}}
    </div>
  </section>
</template>

<script>
  import { mapState, mapMutations, mapGetters } from 'vuex'
  import { openFileSelectDialog } from 'lib/electron'
  import { get } from 'lodash'
  import { remote } from 'electron'
  import unzip from 'node-unzip-2'
  import fs from 'fs-extra'
  import path from 'path'
  import {
    IPC_DOWNLOAD,
    IPC_START_DOWNLOAD,
    IPC_DOWNLOADED,
    IPC_DOWNLOAD_PROGRESS,
  } from 'type/constants'

  export default {
    name: 'IDialogMyProject',
    data() {
      return {
        list: [],
        downloading: false,
        loading: false,
        tip: '',
      }
    },
    props: {
      value: Object,
    },
    computed: {
      ...mapState({
        userId: state => state.user.id,
        domain: state => state.configuration.domain,
      }),
    },
    mounted() {
      this.loading = true
      this.$loading()
      const doName = (() => {
        if (this.value.userId) return 'getPost'
        if (this.value.url) return 'getZip'
      })()
      this.$axios
        .post(`${this.domain}/api.php?do=${doName}`, this.value)
        .then(({ data }) => {
          this.loading = false
          this.$loading().close()
          this.list = data
            .map(data => {
              if (this.value.userId) {
                const zip = data.files.find(
                  file => file.post_mime_type === 'application/zip'
                )
                if (!zip) return null
                return {
                  title: data.post_title + '.zip',
                  id: data.ID,
                  content: data.post_content,
                  file: zip.guid,
                }
              }
              if (this.value.url && data.post_mime_type === 'application/zip') {
                return {
                  title: data.guid.split('/').reverse()[0],
                  id: null,
                  content: null,
                  file: data.guid,
                }
              }
            })
            .filter(f => f)
        })
        .catch(err => {
          this.loading = false
        })
    },
    methods: {
      ...mapMutations(['updateTip']),
      download(post) {
        const ipc = this.$electron.ipcRenderer
        ipc.on(IPC_START_DOWNLOAD, event => {
          this.$message.success('Start downloading')
        })
        ipc.on(IPC_DOWNLOAD_PROGRESS, (event, percent) => {
          this.updateTip(`Download progress: ${parseInt(percent * 100)}%`)
        })
        ipc.on(IPC_DOWNLOADED, (event, zipPath) => {
          this.updateTip('')

          this.downloading = false
          const folder = path.join(
            path.dirname(zipPath),
            path.basename(zipPath, '.zip')
          )
          fs.createReadStream(zipPath).pipe(
            unzip.Extract({
              path: folder,
            })
          )
          this.$message.success(`Download complete`)
          this.tip = `${path.basename(zipPath)} has been downloaded`
        })
        openFileSelectDialog({ directory: true }).then(directory => {
          this.downloading = true
          ipc.send(IPC_DOWNLOAD, {
            url: post.file,
            directory,
            filename: post.title,
            openFolderWhenDone: true,
          })
        })
      },
    },
  }
</script>

<style lang="stylus" scoped>
  .tip
    margin-top 40px
    color grey
    font-size 0.75em
    text-align center
  .list
    max-height 40vh
    overflow-y auto
</style>
