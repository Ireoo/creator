<template>
  <el-form labelPosition="left"
    labelWidth="170px">
    <template v-if="!isObj">
      <div class="media-control flex-around">
        <div>
          <label>{{parameterText('play')}}</label>
          <i class="icon-button fa fa-play"
            :class="{locked:common.playVideo}"
            @click="inputCommon('playVideo', !common.playVideo)"></i>
        </div>
        <div>
          <label>{{parameterText('loop')}}</label>
          <i class="icon-button fa fa-undo "
            :class="{locked:common.videoLoop}"
            @click="inputCommon('videoLoop', !common.videoLoop)"></i>
        </div>
      </div>
      <br>
    </template>
    <div class="flex-between para-row image-file-name">
      <div>
        <span class="field">File name:</span>
        <span>{{current.source.directory}}\{{current.source.file}}</span>
      </div>
      <div style="white-space: nowrap;">
        <i class="icon-button entry-3d-mode"
          v-if="current.source.metadata3D"
          @click="$events.emit($constants.EV_ENTRY_3D_MODE)">3D Mode</i>
      </div>
    </div>
    <br>

    <div class="sequence-visual-effect flex-between para-row"
      v-protect="'sequenceVisualEffect'">
      <small class="label">{{parameterText('sequenceVisualEffect.title')}}</small>
      <el-select size="mini"
        style="width:100px;"
        :value="common.clean"
        @input="value => inputCommon('clean', value)">
        <el-option v-for="option in $store.state.static.parameter.sequenceVisualOptions"
          :key="option.data"
          :label="sequenceVisualEffectText(option.title)"
          :value="option.data" />
      </el-select>
    </div>
    <br>
    <!-- common:end -->

    <div class="keep-last-position flex-between para-row"
      v-protect="isChange ? 'keepTheLastAction' : 'keepTheLastPosition'">
      <small class="label">{{parameterText(isChange ? 'KeepTheLastAction' : 'KeepTheLastPosition')}}</small>
      <el-switch :value="value.keep"
        @input="value => inputValue('keep', value)"></el-switch>
    </div>
    <br>

    <template v-if="isCus">
      <div class="image-layer-position flex-between para-row"
        v-protect="'imageLayerPosition'">
        <small class="label">Image Layer Position</small>
        <el-select size="mini"
          class="parameter-input"
          :value="value.customerPosIni"
          @input="value => inputValue('customerPosIni', value)">
          <el-option v-for="option in $store.state.static.parameter.customerPosIniOption"
            :key="option.data"
            :label="option.title"
            :value="option.data">
            <div class="parameter-form__option-preview"
              :style="{background: option.bg}">
              <img v-if="option.img"
                :src="option.img"
                class="parameter-form__option-preview-img">
              <template v-else-if="option.text">{{option.text}}</template>
            </div>
            {{option.title}}
          </el-option>
        </el-select>
      </div>
      <br>
    </template>

    <transition name="accordion">
      <div v-if="!value.keep">
        <template v-if="isChange">
          <div class="change-control flex-between para-row"
            v-protect="'changeControl'">
            <small class="label">{{parameterText('Change Control')}}</small>
            <el-select size="mini"
              class="parameter-input-x2"
              :value="value.chgCtr"
              @input="value => inputValue('chgCtr', value)">
              <el-option v-for="option in $store.state.static.parameter.changeControlOptions"
                :key="option.data"
                :label="option.title"
                :value="option.data"
                :disabled="option.data === '4' && !isObj">
                <div class="parameter-form__option-preview"
                  :style="{background: option.bg}">
                  <img v-if="option.img"
                    :src="option.img"
                    class="parameter-form__option-preview-img">
                  <template v-else-if="option.text">{{option.text}}</template>
                </div>
                {{option.title}}
              </el-option>
            </el-select>
          </div>
          <br>

          <div class="TimeCh flex-between para-row"
            v-protect="'TimeChl'"
            v-if="value.chgCtr === '1' || value.chgCtr === '5'">
            <small class="label">Frame numbers</small>
            <el-input type="text"
              size="mini"
              :value="value.timeCh + ''"
              @input="value => inputNumber('timeCh', value)"></el-input>
          </div>
          <br v-if="value.chgCtr === '1' || value.chgCtr === '5'">

          <div class="step-or-end flex-between para-row"
            v-protect="'stepOrEnd'"
            v-if="value.chgCtr === '1' || value.chgCtr === '5'">
            <small class="label">Step Or End</small>
            <el-select size="mini"
              :value="value.stepOrEnd"
              @input="value => inputValue('stepOrEnd', value)">
              <el-option value="0"
                label="Step"></el-option>
              <el-option value="1"
                label="End"></el-option>
            </el-select>
          </div>
          <br v-if="value.chgCtr === '1' || value.chgCtr === '5'">

          <div class="stick-item flex-between para-row"
            v-protect="'stickItem'"
            v-if="value.chgCtr === '3' ">
            <small class="label">Stick item</small>
            <el-select size="mini"
              :value="value.stickItem"
              @input="value => inputValue('stickItem', value)">
              <el-option value="0"
                label="No Stick"
                disabled></el-option>
              <el-option value="1"
                label="BG"
                :disabled="!canStickWith('bg')"></el-option>
              <el-option value="2"
                label="FG"
                :disabled="!canStickWith('fg')"></el-option>
              <el-option value="3"
                label="CUS"
                :disabled="!canStickWith('cus')"></el-option>
              <el-option value="4"
                label="OBJ"
                :disabled="!canStickWith('obj')"></el-option>
            </el-select>
          </div>
          <br v-if="value.chgCtr === '3' ">
        </template>

        <div class="scale-x-y flex-between para-row"
          v-protect="'dimension'">
          <small class="label">{{parameterText('demension')}}</small>
          <div class="flex-around">
            <small class="lower-label">width</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              step="0.05"
              :value="demension.width | trimZero(0)"
              @input="value => inputDemension('width', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">height</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="demension.height | trimZero(0)"
              @input="value => inputDemension('height', value)"></el-input>
          </div>
        </div>
        <br>

        <div class="scale-x-y flex-between para-row"
          v-protect="'scale'">
          <small class="label">{{parameterText('scale')}}</small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              step="0.05"
              :value="value.scaleX | trimZero2"
              @input="value => inputScale('scaleX', value)"></el-input>
          </div>
          <i class="lock-aspect-ratio fa fa-link"
            :class="{locked:lockAspectRatio}"
            @click="updateLockAspectRatio(!lockAspectRatio)"></i>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.scaleY | trimZero2"
              @input="value => inputScale('scaleY', value)"></el-input>
          </div>
          <i-random-icon :value="value"
            :field="['scaleX2','scaleY2']"
            :input="inputValue" />
        </div>
        <div class="scale-x-y flex-between para-row"
          v-if="isRandomPara(value.scaleX2)"
          v-protect="'scale'">
          <small class="label"></small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              step="0.05"
              :value="value.scaleX2 | trimZero2"
              @input="value => inputScale('scaleX2', value)"></el-input>
          </div>
          <i class="lock-aspect-ratio fa fa-link"
            :class="{locked:lockAspectRatio}"
            style="visibility:hidden;"
            @click="updateLockAspectRatio(!lockAspectRatio)"></i>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.scaleY2 | trimZero2"
              @input="value => inputScale('scaleY2', value)"></el-input>
          </div>
        </div>
        <br>

        <div class="flex-between para-row"
          v-protect="'opacity'">
          <small class="label">{{parameterText(formatLabel('Opacity'))}}</small>
          <mu-slider class="parameter-input parameter-opacity-slider"
            :min="0"
            :max="1"
            :step="0.01"
            :value="value.opacity"
            @change="value => inputNumber('opacity', value)" />
          <el-input type="text"
            class="parameter-input"
            size="mini"
            :step="0.01"
            :value="value.opacity | trimZero2"
            @input="value => inputNumber('opacity', value)"></el-input>
          <i-random-icon :value="value"
            field="opacity2"
            :input="inputValue" />
        </div>
        <div class="flex-between para-row"
          v-if="isRandomPara(value.opacity2)"
          v-protect="'opacity'">
          <small class="label"></small>
          <mu-slider class="parameter-input parameter-opacity-slider"
            :min="0"
            :max="1"
            :step="0.01"
            :value="value.opacity2"
            @change="value => inputNumber('opacity2', value)" />
          <el-input type="text"
            class="parameter-input"
            size="mini"
            :step="0.01"
            :value="value.opacity2 | trimZero2"
            @input="value => inputNumber('opacity2', value)"></el-input>
        </div>
        <br>

        <div class="transform flex-between para-row"
          v-protect="'transform'">
          <small class="label">{{parameterText('transform')}} </small>
          <div class="flex-around">
            <small class="lower-label">rotate</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              step="0.05"
              :value="value.angle | trimZero2"
              @input="value => inputScale('angle', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              step="0.05"
              :value="value.skewH | trimZero2"
              @input="value => inputScale('skewH', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.skewV | trimZero(0)"
              @input="value => inputNumber('skewV', value)"></el-input>
          </div>
          <i-random-icon :value="value"
            :field="['angle2','skewH2','skewV2']"
            :input="inputValue" />
        </div>
        <div class="transform flex-between para-row"
          v-if="isRandomPara(value.angle2)"
          v-protect="'transform'">
          <small class="label"></small>
          <div class="flex-around">
            <small class="lower-label">rotate</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              step="0.05"
              :value="value.angle2 | trimZero2"
              @input="value => inputScale('angle2', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              step="0.05"
              :value="value.skewH2 | trimZero2"
              @input="value => inputScale('skewH2', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.skewV2 | trimZero2"
              @input="value => inputNumber('skewV2', value)"></el-input>
          </div>
        </div>
        <br>

        <!-- <div class="parameter-form__group-title">Center Location of Selected Image Area</div> -->
        <div class="center-x-y flex-between para-row"
          v-protect="'centerPosition'">
          <small class="label">{{parameterText('centerPosition')}}</small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.x | trimZero2"
              @input="value => inputNumber('x', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.y | trimZero2"
              @input="value => inputNumber('y', value)"></el-input>
          </div>
          <i-random-icon :value="value"
            :field="['x2','y2']"
            :input="inputValue" />
        </div>
        <div class="center-x-y flex-between para-row"
          v-if="isRandomPara(value.x2)"
          v-protect="'centerPosition'">
          <small class="label"></small>
          <div class="flex-around">
            <small class="lower-label">x</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.x2 | trimZero2"
              @input="value => inputNumber('x2', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">y</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.y2 | trimZero2"
              @input="value => inputNumber('y2', value)"></el-input>
          </div>
        </div>
        <br>

        <div class="x0 flex-between para-row"
          v-protect="'cropPoint'">
          <small class="label">{{parameterText('cropPoint')}}</small>
          <div class="flex-around">
            <small class="lower-label">X0</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.x0 | trimZero(0)"
              @input="value => inputNumber('x0', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">Y0</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.y0 | trimZero(0)"
              @input="value => inputNumber('y0', value)"></el-input>
          </div>
        </div>
        <!-- <small class="label">Left Corner Pixel Coordinates of the Selected Image Area</small> -->

        <br>
          <div class="image-area-size flex-between para-row"
          v-protect="'cropArea'">
          <small class="label">{{parameterText('cropArea')}}</small>
          <div class="flex-around">
            <small class="lower-label">W</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.width | trimZero(0)"
              @input="value => inputNumber('width', value)"></el-input>
          </div>
          <div class="flex-around">
            <small class="lower-label">H</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              :value="value.height | trimZero(0)"
              @input="value => inputNumber('height', value)"></el-input>
          </div>
        </div>
        <br>
        <!-- <small class="label">Selected Image Area Size</small> -->

        <div class="transparence-chang flex-between para-row"
          v-protect="'transparencyChange'">
          <small class="label">{{transparencyChangeText('title')}}</small>
          <el-select size="mini"
            class="parameter-input-x2"
            :value="value.transparencyChange"
            @input="value => inputValue('transparencyChange', value)">
            <el-option v-for="option in $store.state.static.parameter.transparencyChangeOptions"
              :key="option.data"
              :value="option.data">
              <div class="parameter-form__option-preview"
                :style="{background: option.bg}">
                <img v-if="option.img"
                  :src="option.img"
                  class="parameter-form__option-preview-img">
                <template v-else-if="option.text">{{option.text}}</template>
              </div>
              {{transparencyChangeText(option.title)}}
            </el-option>
          </el-select>
        </div>
        <br>

        <div class="color-chang flex-between para-row"
          v-protect="'colorChange'">
          <small class="label">{{colorChangeText('title')}}</small>
          <el-select size="mini"
            class="parameter-input-x2"
            :value="value.colorChange"
            @input="value => inputValue('colorChange', value)">
            <el-option v-for="option in $store.state.static.parameter.colorChangeOptions"
              :key="option.data"
              :value="option.data">
              <div class="parameter-form__option-preview"
                :style="{background: option.bg}">
                <img v-if="option.img"
                  :src="option.img"
                  class="parameter-form__option-preview-img">
                <template v-else-if="option.text">{{option.text}}</template>
              </div>
              {{colorChangeText(option.title)}}
            </el-option>
          </el-select>
        </div>
        <br>

        <template v-if="isObj && !isChange">
          <div class="smooth-skin flex-between para-row"
            v-protect="'smoothSkin'">
            <small class="label">{{parameterText('smoothSkin')}}</small>
            <el-switch :value="value.skinSmooth"
              @input="value => inputValue('skinSmooth', value)"></el-switch>
          </div>
          <br>

          <div class="brighterness flex-between para-row"
            v-protect="'brightness'">
            <small class="label">{{parameterText('brightness')}}</small>
            <el-select size="mini"
              :value="value.brighterness"
              @input="value => inputValue('brighterness', value)">
              <el-option value="0">0</el-option>
              <el-option value="5">5</el-option>
              <el-option value="6">6</el-option>
              <el-option value="7">7</el-option>
              <el-option value="8">8</el-option>
              <el-option value="9">9</el-option>
              <el-option value="10">10</el-option>
            </el-select>
          </div>
          <br>

          <div class="saturation-adjustment flex-between para-row"
            v-protect="'saturationAdjustment'">
            <small class="label">{{parameterText('saturationAdjustment')}}</small>
            <el-input type="text"
              class="parameter-input"
              size="mini"
              step="0.01"
              :value="value.saturation"
              @input="value => inputNumber('saturation', value)"></el-input>
          </div>
          <br>

          <div class="mark-open-hand flex-between para-row"
            v-protect="'markOpenHand'">
            <small class="label">{{parameterText('markOpenHand')}}</small>
            <el-switch :value="value.handPower"
              @input="value => inputValue('handPower', value)"></el-switch>
          </div>
          <br>
        </template>
      </div>
    </transition>
  </el-form>
</template>

<script>
  import { mapState, mapMutations } from 'vuex'
  import {
    COLOR_RED,
    COLOR_BLUE,
    CHG_CTR_FOLLOW_TWO_HANDS_ACTION,
  } from 'type/constants'
  import { MountComponents } from 'lib/utils'
  import RandomIcon from './RandomIcon.vue'
  import { isRandomPara } from 'lib/project'
  import constants from 'mixin/constants'
  export default {
    name: 'IParameterForm',
    components: MountComponents(RandomIcon),
    mixins: [constants],
    data() {
      return {
        COLOR_RED,
        COLOR_BLUE,
        CHG_CTR_FOLLOW_TWO_HANDS_ACTION,
      }
    },
    props: {
      changeMode: String,
      current: {
        type: Object,
        required: true,
      },
      inputCommon: {
        type: Function,
        required: true,
      },
      inputValue: {
        type: Function,
        required: true,
      },
      inputNumber: {
        type: Function,
        required: true,
      },
      value: {
        type: Object,
        required: true,
      },
      common: {
        type: Object,
        required: true,
      },
      isBg: Boolean,
      isFg: Boolean,
      isCus: Boolean,
      isObj: Boolean,
      isChange: Boolean,
      canStickWith: Function,
    },
    computed: {
      ...mapState({
        lockAspectRatio: state => state.board.lockAspectRatio,
      }),
      demension() {
        const { scaleX, scaleY, width, height } = this.value
        return {
          width: scaleX * width,
          height: scaleY * height,
        }
      },
    },
    methods: {
      ...mapMutations(['updateLockAspectRatio']),
      isRandomPara,
      formatLabel(value) {
        if (this.changeMode === 'stick') {
          return `stick delta ${value}`
        } else if (this.changeMode === 'delta') {
          return `delta ${value}`
        } else {
          return value
        }
      },
      formatLabelOnlyDelta(value) {
        if (this.changeMode) {
          return `delta ${value}`
        }
        return value
      },
      getValue(key) {
        // if(['stick','delta'].includes(this.changeMode)){
        //   if(this.)
        // }else{
        //   return this.value[key]
        // }
        return this.value[key]
      },
      inputDemension(type, value) {
        if (type === 'width') {
          const scaleX = value / this.value.width
          this.inputScale('scaleX', scaleX)
        } else {
          const scaleY = value / this.value.height
          this.inputScale('scaleY', scaleY)
        }
      },
      inputScale(type, value) {
        const lockList = ['scaleX', 'scaleY', 'scaleX2', 'scaleY2']
        if (this.lockAspectRatio && lockList.includes(type)) {
          const scale = value / this.value[type]
          const keyX = type.match(/2$/) ? 'scaleX2' : 'scaleX'
          const keyY = type.match(/2$/) ? 'scaleY2' : 'scaleY'
          if (Number.isFinite(scale)) {
            this.inputNumber(keyX, scale * this.value[keyX])
            this.inputNumber(keyY, scale * this.value[keyY])
          } else {
            this.inputNumber(keyX, value)
            this.inputNumber(keyY, value)
          }
        } else {
          this.inputNumber(type, value)
        }
      },
    },
  }
</script>
<style lang="stylus" scoped>
  .parameter-opacity-slider
    margin 0 15px
  .accordion-enter-active, .accordion-leave-active
    transition all 0.2s
    height 300px
  .accordion-enter, .accordion-leave-to
    height 0
    overflow hidden
  .transform
    div
      width 60px
  .lock-aspect-ratio
    cursor pointer
    color $text200
    &.locked
      color $primary-color-highlight
  .para-row
    padding-right 20px
  .image-file-name
    font-size 12px
    color $text300
    .field
      margin-right 10px
      color $text100
    .entry-3d-mode
      margin-left 5px
      padding 0 5px
      font-style normal
</style>
