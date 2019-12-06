<script>
  import R from 'ramda'
  import fs from 'fs-extra'
  import { existsSync } from 'fs'
  import path from 'path'
  import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
  import url from 'url'

  import { getSourceSrc } from 'lib/helper'
  // import { runScript } from 'lib/utils'
  import {
    AC_PROJECT_CREATE,
    AC_PROJECT_SAVE,
    AC_PROJECT_SAVE_AS,
    AC_SHOW_PROJECT_IMAGE_FOLDER,
    AC_SHOW_PROJECT_FOLDER,
    AC_PROJECT_OPEN,
    AC_PROJECT_EXPORT,
    E_INVALID_PROJECT,
    IPC_PROJECT_SAVED,
    EV_AUTO_SAVE,
    AC_AR_RUN,
    AC_AR_PLAY,
    EV_LOADING_OPEN,
    EV_LOADING_CLOSE,
    IPC_APP_ONLOAD,
    IPC_APP_OPEN_EXTENSION,
    EV_DIALOG_OPEN,
    AC_PROJECT_IMPORT,
    RENAME_FILE,
    RENAME_FILE_COMPLETED,
    ILEGAL_NAME,
    IPC_RELOAD,
    AC_PROJECT_EXPORTED,
  } from 'type/constants'
  import { openFileSelectDialog } from 'lib/electron'
  import { openProject, isThreeDImage, isMpcImage } from 'lib/project'

  export default {
    name: 'IUiEvent',
    computed: {
      ...mapState({
        projectPath: R.path(['project', 'projectPath']),
      }),
      ...mapGetters(['projectExist', 'projectImagePath']),
    },
    events: {
      async [AC_PROJECT_CREATE](projectPath) {
        if (!projectPath) {
          projectPath = await this.chooseProjectPath()
        }
        return this.createProject(projectPath)
      },
      [AC_PROJECT_OPEN]() {
        return openFileSelectDialog({
          directory: true,
          createDirectory: false,
        })
          .then(projectPath => {
            return this.openProject(projectPath).catch(console.log)
          })
          .then(project => {
            // nothing
          })
          .catch(err => {
            switch (err.message) {
              case E_INVALID_PROJECT:
                this.$message.error(err.message)
                break
            }
          })
      },
      [AC_PROJECT_SAVE]() {
        if (!this.projectExist) {
          this.chooseProjectPath().then(path => {
            this.changeProjectPath(path)
            return this.saveProject()
          })
        } else {
          return this.saveProject()
        }
      },
      [AC_PROJECT_IMPORT]() {
        if (!this.projectPath) return
        return openFileSelectDialog({
          directory: true,
          createDirectory: false,
        })
          .then(projectPath => {
            if (projectPath === this.projectPath) return
            return openProject(projectPath).then(project => {
              return this.importProject({ ...project, projectPath })
            })
          })
          .catch(err => {
            switch (err.message) {
              case E_INVALID_PROJECT:
                this.$message.error(err.message)
                break
            }
          })
      },
      [AC_PROJECT_SAVE_AS]() {
        if (this.projectExist) {
          this.chooseProjectPath()
            .then(path => {
              const beforePath = this.projectPath
              this.changeProjectPath(path)
              return this.saveProject(beforePath)
            })
            .then(() => {
              this.$store.state.project.stages.forEach(stage => {
                Object.entries(stage.parameter).forEach(([type, parameter]) => {
                  const source = R.clone(parameter.source)
                  if (source.metadata && type !== 'obj') {
                    source.metadata.src = getSourceSrc(this.projectPath, source)
                  }
                  this.updateStageSource({ stage, type, source })
                })
              })
            })
        } else {
          this.$events.emit(AC_PROJECT_SAVE)
        }
      },
      [AC_SHOW_PROJECT_IMAGE_FOLDER]() {
        if (!this.projectExist) {
          return this.$alert(
            'Image Folder can only open after you saved',
            'Error',
            {
              type: 'error',
            }
          )
        }
        if (!fs.pathExistsSync(this.projectImagePath)) {
          return this.$alert(
            'Image folder cannot found, please create it by yourself',
            'Error',
            {
              type: 'error',
            }
          )
        }
        this.$electron.shell.openItem(this.projectImagePath)
      },
      [AC_SHOW_PROJECT_FOLDER]() {
        if (!this.projectExist) {
          return this.$alert('Please save project first')
        }
        this.$electron.shell.openItem(this.projectPath)
      },
      [AC_PROJECT_EXPORT]() {
        this.doExport()
          .then(() => {
            this.$message.success('exported')
            this.$events.emit(AC_PROJECT_EXPORTED)
          })
          .catch(e => {
            this.$message.error('export error \n' + e)
            console.error(e)
          })
      },
      [AC_AR_RUN]() {
        if (!this.$store.getters.backendScriptValid) return
        this.doExport()
          .then(this.copyStageConfigFile)
          .then(() => {
            return this.$electron.shell.openItem(
              this.$store.state.setting.backendScript
            )
          })
          .then(() => {
            this.$message.success('Start running script success')
          })
          .catch(e => {
            const msg = e instanceof Error && e.message ? e.message : ''
            this.$message.error(`Running Failed ${msg}`)
            console.error(e)
          })
      },
      [AC_AR_PLAY]() {
        if (!this.$store.getters.playScriptValid) return
        this.doExport()
          .then(this.copyStageConfigFile)
          .then(() => {
            return this.$electron.shell.openItem(
              this.$store.state.setting.playScript
            )
          })
          .then(() => {
            this.$message.success('Start play script success')
          })
          .catch(e => {
            const msg = e instanceof Error && e.message ? e.message : ''
            this.$message.error(`Running Failed ${msg}`)
            console.error(e)
          })
      },
      [EV_LOADING_OPEN](option) {
        const loading = this.$loading({
          lock: true,
          text: 'Loading',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)',
          ...option,
        })
        return loading
      },
      [EV_LOADING_CLOSE]() {
        this.$loading().close()
      },
      [RENAME_FILE](filePath) {
        const oldName = path.basename(filePath)
        const { ext, dir } = path.parse(filePath)
        return this.$prompt('Please input new file name', 'Rename', {
          inputValue: oldName,
          inputPattern: ILEGAL_NAME,
          inputErrorMessage:
            'The file name must begin with a letter, no spaces or special character are allowed.',
          inputValidator: newName => {
            if (!newName.endsWith(ext)) {
              return `Cannot change "${ext}" extension`
            }
            if (
              newName !== oldName &&
              fs.pathExistsSync(path.join(dir, newName))
            ) {
              return `The name "${newName}" has been used`
            }
          },
        })
          .then(({ value: newName }) => {
            const newPath = path.join(dir, newName)
            fs.renameSync(filePath, newPath)

            let jsonPath = isThreeDImage(filePath)
            if (ext === '.png' && jsonPath) {
              const newJsonPath = newPath.replace('.png', '.3d.json')
              fs.renameSync(jsonPath, newJsonPath)
            }

            jsonPath = isMpcImage(filePath)
            if (ext === '.png' && jsonPath) {
              const newJsonPath = newPath.replace('.png', '.mpc.json')
              fs.renameSync(jsonPath, newJsonPath)
            }

            this.$events.emit(RENAME_FILE_COMPLETED, {
              fromPath: filePath,
              toPath: newPath,
            })
            return newName
          })
          .catch(e => {
            this.$alert(e.message, 'Rename Failed', { type: 'error' })
          })
      },
    },
    methods: {
      ...mapMutations([
        'changeProjectPath',
        'updateStageSource',
        'importProject',
        'initUser',
      ]),
      ...mapActions([
        'createProject',
        'saveProject',
        'openProject',
        'exportProject',
      ]),
      chooseProjectPath() {
        return openFileSelectDialog({
          defaultPath: this.projectPath || '',
          directory: true,
          createDirectory: true,
          buttonLabel: 'Choose',
        }).then(projectPath => {
          return fs.readdir(projectPath).then(files => {
            const basename = path.basename(projectPath)
            const ilegal = ILEGAL_NAME.test(basename)
            if (!ilegal) {
              return this.$message
                .error(
                  'The folder name must begin with a letter, no spaces or special character are allowed.'
                )
                .then(() => Promise.reject())
            }
            if (files.length) {
              // not empty
              return this.$confirm(
                projectPath + ' is not empty, Are you want to overwrite it?',
                'Overwrite',
                { type: 'warning' }
              ).then(_ => projectPath)
            }
            return projectPath
          })
        })
      },
      doExport() {
        if (!this.projectExist) {
          this.$alert('Please save project first')
          return Promise.reject(new Error('Please save project'))
        }
        return this.$store.dispatch('checkErrors').then(() => {
          if (this.$store.state.project.errors.length) {
            this.$alert('Before export, please resolve all errors', 'Error', {
              type: 'error',
            })
            return Promise.reject(new Error('please resolve all errors'))
          }
          return this.exportProject()
        })
      },
      copyStageConfigFile() {
        return fs.copy(
          path.join(this.projectPath, 'stageconfig.txt'),
          path.join(this.$store.state.setting.stageLocation, 'stageconfig.txt')
        )
      },
    },
    created() {
      const ipc = this.$electron.ipcRenderer
      ipc.on(IPC_RELOAD, () => location.reload())
      ipc.on(IPC_PROJECT_SAVED, (event, result, message) => {
        if (result) {
          this.$events.emit(EV_AUTO_SAVE)
        } else {
          this.$events.emit(EV_AUTO_SAVE, new Error(message))
        }
      })
      ipc.send(IPC_APP_ONLOAD)
      ipc.on('EXIT', () => {
        this.saveProject()
      })

      // if open app through  project folder
      const projectPath = ipc.sendSync(IPC_APP_OPEN_EXTENSION)
      if (projectPath) this.openProject(projectPath)

      // auto save project function every 5 minutes
      setInterval(() => {
        if (this.projectExist) {
          this.saveProject()
        }
      }, 5 * 60 * 1000)

      this.initUser()

      window.onbeforeunload = e => {
        if (process.env.NODE_ENV === 'development') {
          return
        }
        e.returnValue = false
        const win = this.$electron.remote.getCurrentWindow()
        if (this.projectExist) {
          this.saveProject().then(() => {
            setTimeout(() => {
              win.destroy()
            }, 1000)
          })
        } else {
          console.log('关闭')
          win.destroy()
        }
      }
    },
    async beforeDestroy() {
      this.$electron.ipcRenderer.off(IPC_PROJECT_SAVED)
    },
    render(h) {
      return h(
        'div',
        {
          style: {
            display: 'none',
          },
        },
        ['This component used for UI Event Bus, no need to display']
      )
    },
  }
</script>
