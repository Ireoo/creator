<template>
  <section>
    <el-collapse v-if="list.length" class="list">
      <el-row>
        <el-col style="position: relative;" v-for="(post, $index) in list" :key="$index">
          <div style="line-height: 30px; padding: 0 70px 0 5px;">{{ post.title }}</div>
          <el-button
            style="position: absolute; top: 0; right: 5px;"
            size="small"
            :disabled="downloading"
            v-if="post.file"
            type="text"
            @click="download(post)"
          >
            Download
          </el-button>
        </el-col>
      </el-row>
      <!-- <el-collapse-item :title="post.title" v-for="(post, $index) in list" :key="$index">
        <div style="opacity:0.75;">{{ post.content }}</div>
        <el-button size="small" :disabled="downloading" v-if="post.file" type="text" @click="download(post)">
          Download
        </el-button>
      </el-collapse-item> -->
    </el-collapse>

    <div v-else-if="!loading" style="text-align:center;">
      Null
    </div>
    <div class="tip" v-if="tip">
      {{ tip }}
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
import { IPC_DOWNLOAD, IPC_START_DOWNLOAD, IPC_DOWNLOADED, IPC_DOWNLOAD_PROGRESS } from 'type/constants'
import { openProject } from 'lib/project'

export default {
  name: 'IDialogMyProject',
  data() {
    return {
      list: [],
      downloading: false,
      loading: false,
      tip: ''
    }
  },
  props: {
    value: Object
  },
  computed: {
    ...mapState({
      userId: state => state.user.id,
      domain: state => state.configuration.domain
    })
  },
  mounted() {
    this.loading = true
    this.$loading()
    const doName = (() => {
      if (this.value.class) return 'getUserInfo'
      if (this.value.userId) return 'getPost'
      if (this.value.url) return 'getZip'
    })()
    console.log(`Get project -> ${doName}`)
    this.$axios
      .post(`${this.domain}/api.php?do=${doName}`, this.value)
      .then(async ({ data }) => {
        // console.log(JSON.stringify(data, null, 2))

        let des
        switch (doName) {
          case 'getUserInfo':
            // console.log(data.filter(d => d.meta_key === 'description'))
            des = (data.filter(d => d.meta_key === 'description')[0].meta_value === ''
              ? 'videos/157593927332348059,  videos/157593927332348059'
              : data.filter(d => d.meta_key === 'description')[0].meta_value
            ).split(/[, ]+/)
            data = []
            // console.log(des)

            for (let k in des) {
              let url = `${this.domain}/${des[k]}`
              console.log(url)
              try {
                let d = await this.$axios.post(`${this.domain}/api.php?do=getZip`, { url })
                console.log(d)
                data = data.concat(d.data.filter(d => d.post_mime_type === 'application/zip'))
              } catch (e) {
                console.log(e)
              }
            }
            this.list = data
              .map((_data, _index) => {
                // if (_data.post_mime_type === 'application/zip') {
                return {
                  title: `Class Project ${_index + 1}.zip`, //_data.guid.split('/').reverse()[0],
                  id: null,
                  content: null,
                  file: _data.guid
                }
                // }
              })
              .filter(f => f)
            break
        }

        // console.log(data)
        this.loading = false
        this.$loading().close()

        this.list = data
          .map((_data, _index) => {
            if (this.value.class && _data.post_mime_type === 'application/zip') {
              return {
                title: `Class Project ${_index + 1}.zip`,
                id: null,
                content: null,
                file: _data.guid
              }
            }
            if (this.value.userId) {
              const zip = _data.files.find(file => file.post_mime_type === 'application/zip')
              if (!zip) return null
              return {
                title: _data.post_title + '.zip',
                id: _data.ID,
                content: _data.post_content,
                file: zip.guid
              }
            }
            if (this.value.url && _data.post_mime_type === 'application/zip') {
              return {
                title: _data.guid.split('/').reverse()[0],
                id: null,
                content: null,
                file: _data.guid
              }
            }
          })
          .filter(f => f)
      })
      .catch(err => {
        this.$message.error(err.message)
        this.loading = false
        this.$loading().close()
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
      ipc.on(IPC_DOWNLOADED, async (event, zipPath) => {
        this.updateTip('')

        this.downloading = false
        const folder = path.join(path.dirname(zipPath), path.basename(zipPath, '.zip'))
        fs.createReadStream(zipPath).pipe(
          unzip.Extract({
            path: folder
          })
        )
        this.$message.success(`Download complete`)
        this.tip = `${path.basename(zipPath)} has been downloaded`
        // console.log(folder)
        try {
          await openProject(folder).catch(console.error)
        } catch (e) {
          console.error(e)
        }
      })
      openFileSelectDialog({ directory: true }).then(directory => {
        this.downloading = true
        ipc.send(IPC_DOWNLOAD, {
          url: post.file,
          directory,
          filename: post.title,
          openFolderWhenDone: true
        })
      })
    }
  }
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
