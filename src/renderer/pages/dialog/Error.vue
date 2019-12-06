<template>
  <div>
    <ul class="error-list">
      <li class="error-item" v-for="error in errors">
        <span class="error-stage" v-if="error.stage">Stage{{stages.indexOf(error.stage) + 1}}</span>
        <span class="error-type">[{{error.type}}]</span>
        <span class="error-message">{{error.message}}</span>
      </li>
    </ul>
    <div class="no-error" v-if="errors.length === 0">No Error</div>
  </div>
</template>

<script>
  import {mapState, mapActions} from 'vuex'

  export default {
    name: 'IDialogError',
    computed: {
      ...mapState({
        errors: state => state.project.errors,
        stages: state => state.project.stages,
      }),
    },
    methods: {
      ...mapActions(['checkErrors']),
      onOK() {
        return this.checkErrors().then(() => {
          throw new Error('prevent close dialog')
        })
      },
    },
    created() {
      this.checkErrors()
    },
  }
</script>

<style lang="stylus" scoped>
  .error-list {
    list-style none
    margin 0
    padding 0
  }

  .error-item {
    padding 5px 10px
    border 1px solid #cccccc
    border-radius 5px
    margin-bottom 5px
  }

  .error-type {
    color #cccccc
  }

  .error-message {
    color red
  }
</style>