为需要控制的img标签添加v-gif指令：

//指令接受一个options对象：包含一个autoplay键值，功能类似于video的autoplay属性
<img v-gif="{autoplay:false}" ref="gif">
然后img标签就具备了$play和$stop方法，可以这样使用：

this.$refs.gif.$play()
this.$refs.gif.$stop()