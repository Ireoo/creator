// @flow
function group(...type) {
  return type.join(':')
}

// Error Message
export const E_INVALID_PROJECT = 'Invalid Project'

// Dialog
export const EV_DIALOG_OPEN = group('dialog', 'open')
export const EV_DIALOG_CLOSE = group('dialog', 'close')
export const EV_AUTO_SAVE = group('auto', 'saved')

// Loading
export const EV_LOADING_OPEN = group('loading', 'open')
export const EV_LOADING_CLOSE = group('loading', 'close')

export const DIALOG_TRANSITION = 'transition'
export const DIALOG_ACTION = 'action'
export const DIALOG_IMPORT_IMAGE = 'import-parameter-image'
export const DIALOG_PROJECT_PATH = 'project-save'
export const DIALOG_ERROR = 'error'
export const DIALOG_STAGE_SETTING = 'stage-setting'
export const DIALOG_INSTRUCTION_EDITOR = 'instruction-editor'
export const DIALOG_SETTING = 'setting'
export const DIALOG_NEW_STAGE_GROUP = 'new-stage-group'
export const DIALOG_SELECT_IMAGES = 'images'
export const DIALOG_EXPORT = 'export'
export const DIALOG_PROTECT = 'protect'
export const DIALOG_RECORD_AUDIO = 'record-audio'
export const DIALOG_LOGIN = 'login'
// export const DIALOG_MY_CLASS_PROJECT = 'my-class-project'
export const DIALOG_MY_PROJECT = 'my-project'
export const DIALOG_TEMPLATES = 'templates'
export const DIALOG_UPLOAD = 'upload'
export const DIALOG_LOOP = 'function'
export const DIALOG_ACCOUNT_CONFIGURATION = 'account-configuration'
export const DIALOG_DEBUG = 'debug'
export const DIALOG_COMBINE_MULTIPLE_PICTURES = 'combine-multiple-pictures'
export const DIALOG_SELECT_FOLDER = 'select-folder'

// Canvas
export const EV_CANVAS_LAYER_ADD = group('canvas', 'layer', 'add')
export const EV_CANVAS_LAYER_REMOVE = group('canvas', 'layer', 'remove')
export const EV_CANVAS_LAYER_CLEAR = group('canvas', 'layer', 'clear')
export const EV_CANVAS_CHANGE_SELECT = group('canvas', 'change', 'select')
export const EV_CANVAS_SELECT_CHANGED = group('canvas', 'select', 'changed')
export const EV_CANVAS_CLEAR_SELECT = group('canvas', 'clear', 'select')
export const EV_CANVAS_REFRESH = group('canvas', 'refresh')
export const EV_CANVAS_DEEP_REFRESH = group('canvas', 'deep', 'refresh')
export const EV_CANVAS_FIT = group('canvas', 'fit')
export const EV_CANVAS_CHANGE_ZOOM = group('canvas', 'change', 'zoom')
export const CANVAS_SNAPSHOT_SCALE = 0.25
export const EV_ENTRY_3D_MODE = group('canvas', 'entry', '3DMode')

export const EV_MAKE_DIFFERENT_3D_IMAGES = 'Make different 3d-images'
export const EV_MAKE_DIFFERENT_3D_IMAGE = 'Make different 3d-image'

// Stage

// Map
export const MAP_UPDATE_STAGE = group('map', 'update', 'stage')

// Actions
export const AC_PROJECT_CREATE = group('project', 'create')
export const AC_PROJECT_SAVE = group('project', 'save')
export const AC_PROJECT_SAVE_AS = group('project', 'save', 'as')
export const AC_PROJECT_OPEN = group('project', 'open')
export const AC_PROJECT_IMPORT = group('project', 'import')
export const AC_PROJECT_EXPORT = group('project', 'export')
export const AC_PROJECT_EXPORTED = group('project', 'exported')
export const AC_SHOW_PROJECT_IMAGE_FOLDER = group('show', 'project', 'image', 'folder')
export const AC_SHOW_PROJECT_FOLDER = group('show', 'project', 'folder')
export const AC_AR_RUN = group('ar', 'run')
export const AC_AR_PLAY = group('ar', 'play')

// RPC
export const IPC_PROJECT_SAVE = group('ipc', 'project', 'save')
export const IPC_PROJECT_SAVED = group('ipc', 'project', 'saved')
export const IPC_PROJECT_EXPORT = group('ipc', 'project', 'export')
export const IPC_PROJECT_EXPORTED = group('ipc', 'project', 'exported')
export const IPC_PROJECT_OPEN_FOLDER = group('ipc', 'project', 'open', 'folder')
export const IPC_APP_ONLOAD = group('ipc', 'APP', 'ONLOAD')
export const IPC_APP_OPEN_EXTENSION = group('ipc', 'app', 'open', 'extension')
export const IPC_GET_APP_VERSION = group(...'ipc.get.app.version'.split('.'))
export const IPC_DOWNLOAD = group(...'ipc.download'.split('.'))
export const IPC_START_DOWNLOAD = group(...'ipc.start.download'.split('.'))
export const IPC_DOWNLOADED = group(...'ipc.downloaded'.split('.'))
export const IPC_DOWNLOAD_PROGRESS = group(...'ipc.download.progress'.split('.'))
export const IPC_RELOAD = group(...'ipc.reload'.split('.'))

// board view
export const BOARD_BOARD = 'board'
export const BOARD_PERSON = 'person'
export const BOARD_PERSON_CHANGE = 'change person image'
export const BOARD_HALF_PERSON = 'halfPerson'
export const BOARD_TABLE = 'table'
export const BOARD_PARAMETER = 'parameter'
export const BOARD_PREVIEW = 'preview'
export const BOARD_MAP = 'map'
export const BOARD_LMAP = 'lMap'
export const BOARD_SELECT = 'select'
export const BOARD_CHANGE_SELECT = 'change select'
export const BOARD_TOOL_BOX = 'tool box'
export const BOARD_EXPORT = 'export'
export const BOARD_EXPORT_TO_MANAGER = 'export to manager'

export const RESOURCE_DELETE_FILE = 'RESOURCE_DELETE_FILE'

// select mode
export const SELECT = 'select'
export const CROP = 'crop'

// clip board type
export const CB_FORMAT_STAGE = 'application/json+stage'
export const CB_FORMAT_UNIT = 'application/json+unit'
export const CB_FORMAT_TRANSITION = 'application/json+transition'
export const CB_FORMAT_FILE = 'application/json+file'

// Menu
export const MENU_NOT_GROUPED = 'Not grouped'

// layer
export const CUSTOMER_POS = [10, 20, 30]
export const DEFAULT_ORDER = {
  bg: 5,
  fg: 25,
  cus: 10,
  obj: 15
}

// Parameter Form
export const CHG_CTR_NO_CHANGE = '0'
export const CHG_CTR_TIMED_CHANGE = '1'
export const CHG_CTR_FOLLOW_OVERALL_ACTION = '2'
export const CHG_CTR_STICK = '3'
export const CHG_CTR_HEAD_ZOOM = '4'
export const CHG_CTR_END_TIME_FRAME = '5'
export const CHG_CTR_FOLLOW_TWO_HANDS_ACTION = '6'

export const REFRESH_RESOURCE = 'Refresh resource'
export const RENAME_FILE = 'Rename file'
export const RENAME_FILE_COMPLETED = 'Rename file completed'

// size
export const MEDIA_MAX_WIDTH = 1920
export const MEDIA_MAX_HEIGHT = 1080

// global color
export const COLOR_RED = '#F56C6C'
export const COLOR_BLUE = '#409EFF'

export const ILEGAL_NAME = /^[a-zA-Z].[0-9a-zA-Z_\.]{0,25}$/
