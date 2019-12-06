<script type="text/jsx">
  export default {
    name: 'IInstructionPosition',
    functional: true,
    props: {
      value:{
        type:String
      },
      width:{
        type:String,
        default:'120px'
      },
      size:{
        type:String,
        default:'small'
      }
    },
    render(h, {props, listeners, parent}) {
      const {instructionDialogText} = parent
      return (
        <el-select size={props.size} style={{width:props.width}} value={props.value} onInput={e => {
          console.log(1)
          listeners.input && listeners.input(e)
        }}>
          <el-option value="topLeft" label={instructionDialogText('topLeft')}/>
          <el-option value="topRight" label={instructionDialogText('topRight')}/>
          <el-option value="center" label={instructionDialogText('center')}/>
          <el-option value="bottomLeft" label={instructionDialogText('bottomLeft')}/>
          <el-option value="bottomRight" label={instructionDialogText('bottomRight')}/>
        </el-select>
      )
    },
  }
</script>