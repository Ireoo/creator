通过在目标元素的父元素上绑定v-protect，来拦截目标元素的操作事件；
v-protect接收一个字符串值，当值存在于$store.state.project.protect数组中时，拦截事件，禁止操作。