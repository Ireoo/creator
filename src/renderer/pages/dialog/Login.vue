<template>
  <el-form>
    <el-form-item label="Username:">
      <el-input v-model="username"></el-input>
    </el-form-item>
    <el-form-item label="Password:">
      <el-input type="password" v-model="password"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
  import { get } from 'lodash'
  import { mapState, mapMutations, mapGetters } from 'vuex'
  export default {
    name: 'IDialogLogin',
    data() {
      return {
        username: '',
        password: '',
      }
    },
    computed: {
      ...mapState({
        domain: state => state.configuration.domain,
      }),
    },
    methods: {
      ...mapMutations(['initUser']),
      onOK() {
        return new Promise((resolve, reject) => {
          this.$axios
            .post(`${this.domain}/api.php?do=login`, {
              username: this.username,
              password: this.password,
            })
            .then(({ data }) => {
              if (data.success) {
                const user = data.data
                this.$message.success('Login successful')
                this.initUser({
                  id: user.ID,
                  name: user.diaplay_name,
                  email: user.user_email,
                  username: user.user_login,
                })
                return resolve(data.data)
              } else {
                this.$message.error(data.data)
                return reject(data.data)
              }
            })
            .catch(err => {
              reject(err)
            })
        })
      },
    },
  }
</script>