<script type="text/jsx">
  import {
    createFormMap,
    createFormRules,
    createFormWithAdditional
  } from 'lib/form'
  import { doFunctionalData } from 'lib/utils'
  import Validate from 'mixin/proxy-validate'
  import { clone } from 'ramda'
  import { labelI18n } from 'lib/form'

  export default {
    name: 'ObjectForm',
    props: {
      value: Object,
      // override $cfg
      additional: Array,
      formName: {
        type: String,
        required: true
      },
      labelPosition: {
        type: String,
        default: 'left'
      },
      labelWidth: {
        type: String,
        default: '200px'
      }
    },
    mixins: [Validate],
    data() {
      return {
        cache: {},
        fileTypeIcon: {
          image: 'file-image-o',
          none: 'file-o',
          movie: 'file-movie-o'
        }
      }
    },
    computed: {
      form() {
        const staticForm = labelI18n(
          this.$store.state.static.form,
          this.stageDialogText
        )[this.formName]
        const form = this.additional
          ? createFormWithAdditional(staticForm, this.additional)
          : staticForm
        return form
      },
      formMap() {
        return createFormMap(this.form)
      },
      rules() {
        return createFormRules(this.form)
      }
    },
    methods: {
      isUsed(item) {
        let used = true
        while (used && item) {
          used = used && (item.enabled ? item.enabled(this.value) : true)
          item = this.formMap[item.depend]
        }
        return used
      },
      canDisplay(field) {
        if (!field.display) {
          return true
        }
        return field.display(this.value)
      },
      getData(data) {
        return doFunctionalData(data, this.value, this)
      },
      imageFolderSelect(modalName) {
        this.$fileSelector({
          onlyDirectory: true,
          source: `project/${this.$route.params.project}/images`,
          onSelect: path => {
            this.value[modalName] = path
          }
        })
      },
      folderSelect(modalName) {
        this.$fileSelector({
          onlyDirectory: true,
          path: this.value[modalName],
          onSelect: path => {
            this.value[modalName] = path
          }
        })
      },
      fetchSuggestion(item) {
        if (typeof item.suggestions !== 'function') {
          return (query, cb) => cb()
        }
        return (queryString, cb) => {
          item.suggestions(queryString, cb, this.value, this)
        }
      },
      fetchFile(field) {
        field.selections &&
          field.selections(
            files => {
              this.cache[field.name] = files
            },
            this.value,
            this
          )
      }
    },
    created() {
      this.form.forEach(field => {
        if (field.type === 'file-select') {
          this.$set(this.cache, field.name, [])
        }
        field.register && field.register(this.value, this)
      })
    },
    render() {
      const toI18n = this.stageDialogText
      const formItems = []
      const fullWidth = {
        style: {
          width: '100%'
        }
      }
      for (let field of this.form) {
        if (!this.canDisplay(field)) continue
        let item

        const common = {
          props: {
            value: this.value[field.name]
          },
          on: {
            input: e => {
              this.value[field.name] = e.target ? e.target.value : e
            }
          }
        }

        if (field.hasOwnProperty('hint')) {
          common.props.placeholder = toI18n(field.hint)
        }

        const selections = this.getData(field.selections || [])
        switch (field.type) {
          case 'input':
            if (field.suggestions) {
              // auto complete field
              item = (
                <el-autocomplete
                  {...common}
                  fetch-suggestions={this.fetchSuggestion(item)}
                />
              )
              break
            }
            item = <el-input {...common} />
            break
          case 'number':
            common.on.input = e => {
              this.value[field.name] = 1 * (e.target ? e.target.value : e)
            }
            item = <el-input {...common} type="number" />
            break
          case 'textarea':
            item = <el-input {...common} type="textarea" />
            break
          case 'radio':
            item = field.ratios.map(ratio => (
              <el-radio {...common} key={ratio[0]} label={ratio[0]}>
                {ratio[1]}
              </el-radio>
            ))
            break
          case 'select':
            item = (
              <el-select {...common} {...fullWidth}>
                {selections.map(option => (
                  <el-option
                    value={option[0]}
                    label={option[1]}
                    key={option[0]}
                  />
                ))}
              </el-select>
            )
            break
          case 'cascader':
            item = (
              <el-cascader
                {...common}
                {...fullWidth}
                options={field.selections}
                show-all-levels={false}
                expand-trigger="click"
              />
            )
            break
          case 'checkbox-group':
            common.on.change = selectedStages =>
              (this.value.stageFile = `r${selectedStages.length}`)
            item = (
              <el-checkbox-group
                {...common}
                size="mini"
                style="max-height:150px;overflow-y:auto;"
              >
                {selections.map(({ label, displayLabel }, index) => {
                  return (
                    <el-checkbox
                      border
                      value={index}
                      label={label}
                      key={index}
                      style="margin:0;"
                    >
                      {displayLabel}
                    </el-checkbox>
                  )
                })}
              </el-checkbox-group>
            )
            break
          case 'folder-input':
            break
          case 'file-select':
            break
        }

        if (item) {
          formItems.push(
            <el-form-item
              label={toI18n(field.label || field.name)}
              key={field.name}
              prop={field.name}
            >
              {item}
            </el-form-item>
          )
        }
      }

      return (
        <el-form
          labelPosition={this.labelPosition}
          labelWidth={this.labelWidth}
          ref="form"
          rules={this.rules}
          model={this.value}
        >
          {formItems}
        </el-form>
      )
    }
  }
</script>