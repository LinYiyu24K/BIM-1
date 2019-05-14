/////////////////////////////////////////////////////////
//
/////////////////////////////////////////////////////////
import MultiModelExtensionBase from 'Viewer.MultiModelExtensionBase'
import NewDMAPI from './Viewing.Extension.Config.API'
import ContentEditable from 'react-contenteditable'
import './Viewing.Extension.NewDataManagement.scss'
import WidgetContainer from 'WidgetContainer'
import 'react-dragula/dist/dragula.min.css'
import ServiceManager from 'SvcManager'
import Toolkit from 'Viewer.Toolkit'
import Dragula from 'react-dragula'
import Image from 'Image'
import sortBy from 'lodash/sortBy'
import DOMPurify from 'dompurify'
import ReactDOM from 'react-dom'
import Switch from 'Switch'
import Label from 'Label'
import React from 'react'
import DataContainerDlg from 'Dialogs/DataContainerDlg'
import DataDetailContainerDlg from 'Dialogs/DataDetailContainerDlg'
import {
  Modal,
  DropdownButton,
  MenuItem
} from 'react-bootstrap'

import {
  setUser
  } from '../../../store/app'

class NewDataManagementExtension extends MultiModelExtensionBase {

  // Class constructor
  constructor (viewer, options) {

    super (viewer, options)
    //增加this.state
    this.state = {
      show:false
    }

    this.renderTitle = this.renderTitle.bind(this)
    this.toggleItem = this.toggleItem.bind(this)
    this.addItem = this.addItem.bind(this)
    this.searchItem = this.searchItem.bind(this)
    this.renderItemTitle = this.renderItemTitle.bind(this)

    //修改：新增弹窗 Modal 控制事件
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.uploadFileChange = this.uploadFileChange.bind(this);


    this.dialogSvc =
      ServiceManager.getService(
        'DialogSvc')

    this.storageSvc = ServiceManager.getService(
      'StorageSvc')    

    this.restoreFilter = options.restoreFilter || null

    this.playPeriod = this.options.playPeriod || 1800

    this.dialogSvc =
      ServiceManager.getService('DialogSvc') 

    this.itemsClass = this.guid()

    this.react = options.react

    this.restoreStates = {}

    this.drake = null

    this.dataPanel = null

    this.dataDetailPanel = null

    if (this.options.apiUrl) {

      const modelId = this.options.dbModel._id
    // this.api 是 ConfigAPI的实例，所有 ajax 请求的集合
      this.api = new NewDMAPI(
        options.apiUrl +
        `/newdm/${options.database}/${modelId}`)
    }
  }

  //弹窗控制事件
  handleClose() {

    console.log(`这里执行了handleClose`)
    this.react.setState({ show: false });
  }

  handleShow() {

    console.log(`这里执行了handleShow`)
    this.react.setState({ show: true });
  }

  uploadFileChange(e) {
    const filesNum = e.target.files.length;
    if(filesNum == 0){
      this.react.setState({"uploadFileMsg":"未选择文件"})
    }else if(filesNum == 1){
      this.react.setState({"uploadFileMsg":`${e.target.files[0].name}` || `1 个文件`})
    }else{
      this.react.setState({"uploadFileMsg":`${filesNum} 个文件`})
    }
  }

  /////////////////////////////////////////////////////////
  //
  //用户进入资料管理拓展，未登陆，则弹窗提示
  /////////////////////////////////////////////////////////
  showMissUserDlg () {

    const onClose = (result) => {

      this.dialogSvc.off('dialog.close', onClose)

      if (result === 'OK') {

        return
      }

    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      onRequestClose: () => {},
      className: 'login-dlg',
      title: '请登录',
      content:
        <div>
          数据管理与单独用户绑定，请先行登录...
        </div>,
      open: true
      // TODO:将open设为true
      // open: false
    })
  }

  /////////////////////////////////////////////////////////
  //
  //修改：上传资料时候用户没有在模型中选中焦点
  /////////////////////////////////////////////////////////
  showMissPointDlg () {

    const onClose = (result) => {

      this.dialogSvc.off('dialog.close', onClose)

      if (result === 'OK') {

        return
      }

    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      onRequestClose: () => {},
      className: 'login-dlg',
      title: '上传失败',
      content:
        <div>
          请在视图模型中选中焦点，再行上传...
        </div>,
      open: true
    })
  }

/////////////////////////////////////////////////////////
  //
  //修改：上传资料时候用户没有选择资料类型
  /////////////////////////////////////////////////////////
  showMissDataTypeDlg () {

    const onClose = (result) => {

      this.dialogSvc.off('dialog.close', onClose)

      if (result === 'OK') {

        return
      }

    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      onRequestClose: () => {},
      className: 'login-dlg',
      title: '上传失败',
      content:
        <div>
          请选择要视点资料的类型，再行上传...
        </div>,
      open: true
      // TODO:将open设为true
      // open: false
    })
  }


  //
  get className() {
    return 'config-manager'
  }

  // Extension Id
  static get ExtensionId() {
    return 'Viewing.Extension.NewDataManagementExtension'
  }

  // Load callback
  load () {

    this.viewer.addEventListener(
      Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, (e) => {
        if (this.options.loader) {
          this.options.loader.show(false)
        }
      })

    //作用未知，在 renderItem 方法中用这个变量进行if判断，true 时 item 的 onClick 事件会触发 toggleItem 方法
    //然而一直执行 onRestoreState ，可见 this.option.itemToggling 为 flase
    this.itemToggling = this.options.itemToggling

    this.react.setState({
      emptyStateNameCaption:'新资料的名称 ...',
      disabled: this.options.disabled,
      stateSelection: true,//作用未知，在 renderItem 方法中用这个变量进行if判断，true 时 item 的 onClick 事件才会触发
      stateCreation: true,
      newSequenceName: '',
      newStateName: '',
      sequence: null,   //当前视点组队列
      sequences: [],
      play: false,  //播放
      loop: true,   //循环播放
      items: [],    //一个视点序列里的所有视点

      // user: username, // 当前用户，同 sequence
      uploadDataType:{id:0,name:'请选择'},//用户上传时候的视点类型
      selectedDataType:{id:0,name:'请选择'},//用户查询选中的视点类型
      dataName:'',//用户查询输入的字符串
      dataType:[   //搜索用的视点类型
        {
          id:0,
          name:'请选择'
        },
        {
          id:1,
          name:'安全'
        },
        {
          id:2,
          name:'质量'
        },
        {
          id:3,
          name:'进度'
        }
      ],    //资料类型选择
      uploadDataTypes:[   //上传用的视点类型
        {
          id:0,
          name:'请选择'
        },
        {
          id:1,
          name:'安全'
        },
        {
          id:2,
          name:'质量'
        },
        {
          id:3,
          name:'进度'
        }
      ],//用户上传视点的下拉框
      uploadFileMsg:"未选择文件",//用户选择文件之后变化
      show:false

    }).then (() => {

      this.react.pushRenderExtension(this).then(
        async() => {

          if (this.api) {

            this.loadUsers()  //175行
          }

      })
    }).catch((error)=>{

      console.log('NewDataManagementExtension 加载出现了错误',error)
    })

    console.log(this.react.getState())

    console.log('Viewing.Extension.NewDataManagementExtension loaded')

    return true
  }

  // Unload callback
  unload () {

    this.react.popViewerPanel(this)

    console.log('Viewing.Extension.NewDataManagementExtension unloaded')

    return true
  }

  //github上141行代码
  sleep(ms){
    return new Promise((resolve)=>{
      setTimeout(()=>{
        resolve()
      },ms)
    })
  }

  //注释：该方法在该拓展load加载完时，被调用，142行。-->拓展加载完毕后，加载视点组，即初始化数据。
  //      1、加载视点序列,只加载 sequences 数组的第一个sequence,
  //      2、* 使用 setState 方法初始化 sequences 状态，使得 sequences 保存所有的视点组
  //      3、2秒后执行 setActiveSequence 方法（参数：传入视点组集合的第一个视点组sequence）（*显示视点）
  //  loadSequences
  async loadUsers () {

    let hasUserLogin = ''

    if(window.sessionStorage){

      console.log(`hasUserLogin 使用了 sessionStorage>>>>>>>>>>>>>>>>>>>>>`)

      hasUserLogin = window.sessionStorage.getItem('user');
    }else{

      console.log(`hasUserLogin 使用了 storageSvc>>>>>>>>>>>>>>>>>>>>>`)

      let usernameArr = Object.values(this.storageSvc.load('user'));
      usernameArr.pop();
      hasUserLogin = usernameArr.join("")
    }

    
    console.log(` hasUserLogin 的值是 :>>>>>>>>> ${hasUserLogin}`)

    if(hasUserLogin == null || hasUserLogin.length === 0){
      
      this.showMissUserDlg()
      
      return 
    }

    //注释：this.api 就是 Viewing.Extension.Config.API.js导出的实例
    //      这里返回的 sequences 是一个只有一个用户的数组，["cangshu"]
    let users =
      await this.api.getUsers({
        sortByName: true
      })


    console.log("这是所有的用户列表:>>>>>>>>>>>>",users)
    //TODO:这里根据 sessionStorage 中的用户名在所有数据管理用户队列中进行 filter操作，取第一个，需要让用户名唯一！！！
    let user = users.filter((userItem) =>{
      if(userItem.user == hasUserLogin ){
        return true;
      }else{
        return false;
      }
    })[0]
    console.log("过滤得到的 user ： >>>>>>>",user)

    if(!user){

      console.log("用户第一次使用数据管理模块，加入数据管理用户队列")

      const username = hasUserLogin;

      console.log(`存储 storageSvc 的 username 的值是 :>>>>>>>>> ${username}`)

      const loginUser = {
        id: this.guid(),
        userDataIds: [],
        user:username
      }

      if(this.api){

        const resUser = await this.api.addUser(loginUser)

        console.log("增加数据用户的返回值 resUser:>>>>>>",resUser)

        //TODO：这个 users 并不需要
        users =
        await this.api.getUsers({
          sortByName: true
        })

        user = resUser
      }

    }


    this.react.setState({
      user,
      sequences:users
    })

    //await this.sleep(2000)

    setTimeout(() => {
      this.setActiveSequence (user)
    }, 800)
  }


  //
  onModelActivated (event) {

    this.setModel(event.model)

    this.loadUsers()
  }

  //
  setModel (model) {

    const modelId = model.dbModelId ||
      this.options.dbModel._id

    const database = model.database ||
      this.options.database

    const {apiUrl} = this.options
    //路由为newdm
    this.api = new NewDMAPI(
      `${apiUrl}/newdm/${database}/${modelId}`)
  }

  //
  addSequence () {

    this.react.setState({
      newSequenceName: ''
    })

    const onClose = (result) => {

      if (result === 'OK') {

        const state = this.react.getState()

        const name = !!state.newSequenceName
          ? DOMPurify.sanitize(state.newSequenceName)
          : new Date().toString('d/M/yyyy H:mm:ss')

        const sequence = {
          id: this.guid(),
          stateIds: [],
          name
        }

        //注释：用户点击OK则现在state中存入新的sequences(合并)
        const sequences = sortBy([
          ...state.sequences, sequence
        ], (s) => { return s.name })

        this.react.setState({
          sequences,
          items: []
        })

        this.setActiveSequence (sequence)
        //注释：再向数据库中添加新的视点序列
        if (this.api) {

          this.api.addUser(sequence)
        }
      }

      this.dialogSvc.off('dialog.close', onClose)
    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      className: 'config-manager-dlg',
      title: 'Add Sequence ...',
      content:
        <div>
          <ContentEditable
            onChange={(e) => this.onInputChanged(e, 'newSequenceName')}
            onKeyDown={(e) => this.onKeyDown(e)}
            data-placeholder="Sequence name ..."
            className="sequence-name-input"
            html={''}/>
        </div>,
      open: true
    })
  }

  //
  copySequence () {

    this.react.setState({
      newSequenceName: ''
    })

    const onClose = (result) => {

      if (result === 'OK') {

        const state = this.react.getState()

        const items = state.items.map((item) => {

          return Object.assign({},
            item, {
              id: this.guid(),
              active: false
            })
        })

        const stateIds = items.map((item) => {

          return item.id
        })

        const sequence = Object.assign({},
          state.sequence, {
            name: state.newSequenceName,
            readonly: false,
            id: this.guid(),
            stateIds
        })

        const sequences = sortBy([
          ...state.sequences, sequence
        ], (s) => { return s.name })

        this.react.setState({
          sequences,
          sequence,
          items
        })

        if (this.api) {

          this.api.addUser (Object.assign({},
            sequence, {
              stateIds: []
            })).then(() => {

            this.api.addState (sequence.id, items)
          })
        }
      }

      this.dialogSvc.off('dialog.close', onClose)
    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      className: 'config-manager-dlg',
      title: 'Copy Sequence ...',
      content:
        <div>
          <ContentEditable
            onChange={(e) => this.onInputChanged(e, 'newSequenceName')}
            onKeyDown={(e) => this.onKeyDown(e)}
            data-placeholder="Sequence name ..."
            className="sequence-name-input"
            html={''}/>
        </div>,
      open: true
    })
  }

  //
  deleteSequence () {

    const state = this.react.getState()

    const onClose = (result) => {

      if (result === 'OK') {

        clearTimeout(this.playTimeout)

        if (this.api) {

          this.api.deleteSequence(state.sequence.id)
        }

        this.emit('sequence.deleted', state.sequence)

        const sequences = state.sequences.filter(
          (sequence) => {
            return sequence.id !== state.sequence.id
          })

        const sequence = sequences.length ?
          sequences[0] : null

        this.react.setState({
          play: false,
          sequences
        })

        this.setActiveSequence(sequence)
      }

      this.dialogSvc.off('dialog.close', onClose)
    }

    this.dialogSvc.on('dialog.close', onClose)

    const msg = DOMPurify.sanitize(
      `Are you sure you want to delete`
      + ` <b>${state.sequence.name}</b> ?`)

    this.dialogSvc.setState({
      className: 'config-manager-dlg',
      title: 'Delete Sequence ...',
      content:
        <div dangerouslySetInnerHTML={{__html: msg}}>
        </div>,
      open: true
    })
  }

  //注释：根据dom 节点获得 states 的 id 数组
  getStateIds () {

    const domItems = document.getElementsByClassName(
      this.itemsClass)[0]

    const stateIds =
      Array.from(domItems.childNodes).map(
        (childNode) => {

          return childNode.dataset.id
        })

    return stateIds
  }

  //
  async onUpdateSequence () {

    const { sequence, items } = this.react.getState()

    const stateIds = this.getStateIds()

    const newSequence = Object.assign({},
      sequence, {
        stateIds
      })

    const newItems = stateIds.map((id) => {

      for (const item of items) {

        if (item.id === id) {

          return item
        }
      }
    })

    this.react.setState({
      sequence: newSequence,
      items: newItems
    })

    if (this.api) {

      this.api.updateSequence(newSequence)
    }
  }

  //注释：增加资料视点
  async addItem () {

    const state = this.react.getState()

    //注释：设置视点名称，如果用户没有设置视点名，则默认为保存视点的当前时间。
    const name = !state.newStateName.length
      ? new Date().toString('d/M/yyyy H:mm:ss')
      : DOMPurify.sanitize(state.newStateName)

    //注释：viewer.getState()得到一个视点的所有的信息，根据viewer判断当前视点位置？？？？？？？/
    //      dataType 是用户上传视点的类型
    let viewerState = Object.assign({},
      this.viewer.getState(), {
        id: this.guid(),
        name,
        dataType:state.uploadDataType
      })
    
    console.log("this.viewer.getState的值是——————:",this.viewer.getState())

    //更改：新增。判断用户是否选择焦点，如果没有选择，则弹窗提示
    if(viewerState.objectSet[0].id.length === 0){
      this.showMissPointDlg()
      return
    }
    //更改：新增。判断用户是否选择资料类型，如果没有选择，则弹窗提示
    if(viewerState.dataType.id == 0){
      this.showMissDataTypeDlg()
      return
    }

    let files = document.getElementById("myUpload").files;

    console.log("上传的文件 files：>>>>>>>>>>>>>>>",files)

    //修改：增加了this.api.addStateFile请求，
    //这个请求会调用 upLoadSvc 的upload方法，解析data字段，
    //所以在将视点信息存在data中的 states 中，并且转为字符串

    if (this.api) {

        if(files.length>0){

          console.log("有上传文件的情况_____________:)____")

          const keys = Object.keys(files).toString()


          const responseView = await this.api.addStateFile(state.user.id,files,{
            "data":{
              "state":JSON.stringify(viewerState),
              "keys":keys
            }})


            viewerState = Object.assign({},viewerState,responseView.body)

        }else{
    console.log("没有上传文件的情况_____________:)____")
          this.api.addState(
            state.user.id,
            viewerState
          )
        }
    }

    await this.react.setState({
      items: [...state.items, viewerState],
      newStateName: '',
      play: false
    })

    this.restoreStates[viewerState.id] =
      viewerState

    this.onRestoreState(viewerState, true)

    clearTimeout(this.playTimeout)
  }

  //修改：增加方法 searchItem 用于快速搜索
  //TODO：搜索逻辑的主要方法，可以参考上面的addItem方法
  async searchItem () {

    // await this.react.setState({
    //   play: false,
    //   items: []
    // })
    
    var state = this.react.getState();

    var dataName = state.dataName,
        selectedDataType = state.selectedDataType,
        user = state.user;

    console.log('触发 searchItem 方法，此时的state>>>>>>： ',state)

    if(user!=''){
      if (this.api) {

        const allStates =
          await this.api.getStates(
            user.id)
  
        console.log("_____________dataName______",dataName)
  
        var states = allStates.filter(item =>{
          if(dataName.length>0){
            console.log("_____________item.name_______",item.name)
            console.log("____________item.name.indexOf(dataName)>-1_______",item.name.indexOf(dataName)>-1)
            if(selectedDataType.id==0){
              return item.name.indexOf(dataName)>-1 ? true : false;
            }else{
              if(selectedDataType.id==item.dataType.id && item.name.indexOf(dataName)>-1){
                return true;
              }else{
                return false;
              }
            }
          }else{
            if(selectedDataType.id!=0){
              return item.dataType.id==selectedDataType.id ? true : false;
            }else{
              return true;
            }
          }
        })
        console.log('筛选后的视点：========================================',states)
    
        await this.react.setState({
          items: states
        })
      }
    }else{
      //注释：默认已经登陆
      alert("请登陆")
    }
    
  }

  //注释：资料视点的点击事件触发这个方法
  //将 item 过滤之后，调用 this.viewer.restoreState 来翻转 3D 视图？
  onRestoreState (
    viewerState, immediate = this.options.restoreImmediate) {

    //this.viewer.getState (viewerState)

    const filteredState = this.filterState(
      viewerState,
      'objectSet',
      'explodeScale')

    this.viewer.restoreState(
      filteredState,
      this.restoreFilter,
      immediate)
    
  }

  //TODO：不优先，这里需要增加确认删除的弹窗？
  deleteItem (id) {

    const state = this.react.getState()

    this.react.setState({
      items: state.items.filter((item) => {
        return item.id !== id
      }),
      play: false
    })

    this.emit('state.deleted', id)

    delete this.restoreStates[id]

    if (this.api) {

      this.api.deleteState(state.sequence.id, id)
    }

    clearTimeout(this.playTimeout)
  }

  //13 enter=回车键
  onKeyDown (e) {

    if (e.keyCode === 13) {

      e.stopPropagation()
      e.preventDefault()
    }
  }

  //
  onInputChanged (e, key) {

    const state = this.react.getState()

    state[key] = e.target.value

    this.react.setState(state)
  }

  // Filter a state selections
  filterState (srcState, setNames, elementNames) {

    const state = JSON.parse(JSON.stringify(srcState))

    const sets = Array.isArray(setNames)
      ? setNames : [setNames]

    const elements = Array.isArray(elementNames)
      ? elementNames : [elementNames]

    sets.forEach((setName) => {

      if (state[setName]) {

        elements.forEach((elementName) => {

          state[setName].forEach((element) => {

            delete element[elementName]
          })
        })
      }
    })

    return state
  }

  // A fix for viewer.restoreState that also restores pivotPoint
  restoreStateWithPivot(state, filter=null, immediate=false) {

    const viewer = this.viewer

    function onStateRestored() {

      viewer.removeEventListener(
        Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT,
        onStateRestored);

      const pivot = state.viewport.pivotPoint;

      setTimeout(function () {

        viewer.navigation.setPivotPoint(
          new THREE.Vector3(
            pivot[0], pivot[1], pivot[2]))
      }, 1250)
    }

    viewer.addEventListener(
      Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT,
      onStateRestored)

    viewer.restoreState(state, filter, immediate)
  }

  //注释：将视点包含框设置为可拖动
  //TODO: 触发了 updateSequence 方法，需要改动！！！
  activateDrag () {

    //domItems 是包含在 items 外面的 div
    const domItems =
      document.getElementsByClassName(
        this.itemsClass)[0]

    //有可拖动框，则销毁，否则使用 Dragula 将视点设置为可以拖动
    if (this.drake) {

      this.drake.destroy()
    }

    this.drake = Dragula([domItems])

    //如果有视点拖入这个视点框（可拖动区域）,则触发 onUpdateSequence
    this.drake.on('drop', () => {

      this.onUpdateSequence()
    })
  }

  //注释：1、类型下拉框选择的选中事件，传入选中的sequence
  //      2、* 根据传入的 sequence 中的 stateIds 从mongodb中获得该视点的所有视点，
  //         * 并据此初始化状态items，则此视点组被认为是被激活的视点组
  //修改：改为筛选视点资料
  async setActiveSequence (sequence) {

    clearTimeout(this.playTimeout)

    this.restoreStates = {}

    this.playTimeout = null

    this.sequenceIdx = 0

    this.react.setState({
      play: false,
      items: [],
      sequence,
      user:sequence
    })

    if (this.drake) {

      this.drake.destroy()
      this.drake = null
    }
    //注释：如果不存在可以选择的 sequence ，则不可下拉
    if (sequence) {

      if (!sequence.readonly) {

        this.activateDrag()
      }

      if (this.api) {

        const states =
          await this.api.getStates(
            sequence.id)

        console.log(`state的值!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!----`,states)

        states.forEach((state) => {

          this.restoreStates[state.id] = state
        })

        await this.react.setState({
          items: states
        })
      }
    }
  }

  //
  playSequence () {

    // sequence is playing -> stopping it
    if (this.playTimeout) {

      clearTimeout(this.playTimeout)

      this.playTimeout = null

      this.sequenceIdx = 0

      this.react.setState({
        play: false
      })

      return
    }

    const stateIds = this.getStateIds()

    const step = (stateId) => {

      const state = this.react.getState()

      this.onRestoreState(this.restoreStates[stateId])

      this.react.setState({
        play: true,
        items: state.items.map((item) => {
          if (item.active) {
            item.active = false
            this.emit('state.toggled', item)
          }
          if (item.id === stateId) {
            item.active = true
            this.emit('state.toggled', item)
          }
          return item
        })
      })

      if ((++this.sequenceIdx) == stateIds.length) {

        const { loop } = this.react.getState()

        if (!loop) {

          this.react.setState({
            play: false
          })

          this.playTimeout = null

          return
        }

        this.sequenceIdx = 0
      }

      setTimeout(() => {
        const {items} = this.react.getState()
        this.react.setState({
          items: items.map((item) => {
            item.active = false
            return item
          })
        })
      }, this.playPeriod * 0.8)

      return setTimeout(() => {

        this.playTimeout = step(stateIds[this.sequenceIdx])

      }, this.playPeriod)
    }

    if (stateIds.length > 0) {

      this.playTimeout = step (stateIds[this.sequenceIdx])
    }
  }

  //      切换窗口模式的函数
  //      popRenderExtension 在 Viewing.Extension.ExtensionManagerToolbar\Viewing.Extension.ExtensionManagerToolbar.js
  //      pushViewerPanel 疑似在 src\client\viewer.components\Viewer.Configurator\Viewer.Configurator.js
  async setDocking (docked) {

    const id = NewDataManagementExtension.ExtensionId

    const {sequence} = this.react.getState()

    if (docked) {

      await this.react.popRenderExtension(id)

      // this.react.pushViewerPanel方法用于将组件实例推入 Panels , Panel 组件用于拖拽
      //若用于资料的展示，则需要新建一个实例
      //重要！在 ViewingApplication.js 中为的 didcomponentUpdata 生命周期函数中，当 state 变化，为所有的 panels 遍历的 一个 emit('update')，可用于
      //src\client\viewer.components\Viewer.ViewingApplication\ViewingApplication.js
      const panel = await this.react.pushViewerPanel(this, {
          height: 400,
          width: 500
        })

      panel.on('update', () => {

        if (sequence && !sequence.readonly) {

          this.activateDrag ()
        }

        panel.off()
      })

    } else {

      await this.react.popViewerPanel(id)

      await this.react.pushRenderExtension(this)

      this.setActiveSequence (sequence)
    }
  }

  // 拓展的头部header 包括了一个切换模式
  renderTitle (docked) {

    const spanClass = docked
      ? 'fa fa-chain-broken'
      : 'fa fa-chain'

    // TODO: onClick={() => this.closeExt() closeExt 不是一个函数？无法关闭拓展
    // 重新开几次之后都会有 bug 状态无法读取！！！

    return (
      <div className="title">

        <button onClick={this.closeExt}
                title="关闭控件" className="closeExtensionButton">
        </button>

        <label>
          资料管理
        </label>
        <div className="config-manager-controls">
          <button onClick={() => this.setDocking(docked)}
            title="Toggle docking mode">
            <span className={spanClass}/>
          </button>
        </div>
      </div>
    )
  }


  //
  renderControls () {


    const state = this.react.getState()


    ///////////////////////////////////////////////////////////
    //TODO：922行 this.setActiveSequence(data) 待修改为setState
    // dataType 为原状态 sequences
    const dataType = state.dataType.map((data) => {

      const id = data.id

      return (
        <MenuItem eventKey={id} key={id} onClick={() => {

          this.react.setState({"selectedDataType":data})
        }}>
          { data.name }
        </MenuItem>
      )
    })

    //更改：新增了 uploadDataType ，用于上传视点时候的视点状态选择
    const uploadDataType = state.uploadDataTypes.map((data) => {

      const id = data.id

      return (
        <MenuItem eventKey={id} key={id} onClick={() => {

          this.react.setState({'uploadDataType':data})
        }}>
          { data.name }
        </MenuItem>
      )
    })

    //修改：将 state.sequence 修改为 state.dataType
    //TODO:修改所有sequence为dataType
    const sequence = state.dataType

    const sequenceName = sequence
      ? sequence.name +
        (!sequence.readonly ? '' : ' (readonly)')
      : ''

    const stateCreationDisabled =
      !sequence ||
      sequence.readonly ||
      !state.stateCreation

    return (
      <div className="controls">


        {/* 资料上传栏 */}

        <div className="row">
          <h4>资料上传</h4>
        </div>

        <div className="row">

        {
          stateCreationDisabled &&
          <ContentEditable
            onChange={(e) => this.onInputChanged(e, 'newStateName')}
            data-placeholder={state.emptyStateNameCaption}
            onKeyDown={(e) => this.onKeyDown(e)}
            className="state-name-input"
            html={state.newStateName}
            disabled={true}
          />
        }

        {
          !stateCreationDisabled &&
          <ContentEditable
            onChange={(e) => this.onInputChanged(e, 'newStateName')}
            data-placeholder={state.emptyStateNameCaption}
            onKeyDown={(e) => this.onKeyDown(e)}
            className="state-name-input"
            html={state.newStateName}
          />
        }

        <DropdownButton
          title={state.uploadDataType.name}
          className="sequence-dropdown"
          disabled={!uploadDataType}
          key="sequence-dropdown"
          id="sequence-dropdown">
        { uploadDataType }
        </DropdownButton>

          
          <a className="uploadOuter">
          {/* TODO:优先级高，在这里要显示已经选择的文件名，下一行？ */}
          选择文件
          <input 
            type="file" 
            name="myUpload" 
            id="myUpload"
            multiple="multiple" /*多文件上传*/
            className="replyFileid"
            onChange={this.uploadFileChange}
            >
          </input>
          <span>
            {state.uploadFileMsg}
          </span>

          </a>


        <button disabled={stateCreationDisabled}
          onClick={this.addItem}
          title="上传视点资料"
          style={{"width":100}}>
          <span className="fa fa-plus-square">
          上传数据
          </span>
        </button>

        </div>


        {
          //注释：资料管理样式修改
          //899行的onInputChanged为用户搜索的资料名 dataName，在this.state中
          //onKKeyDown中的13是指回车键enter,TODO:应该执行搜索，需要重写onKeyDown
        }
        {/* 资料上传栏 */}

        <div className="row">
          <h4>资料列表</h4>
        </div>

        <div className='row'>
          
        <ContentEditable
              onChange={(e) => this.onInputChanged(e, 'dataName')}
              data-placeholder=""
              onKeyDown={(e) => this.onKeyDown(e)}
              className="state-name-input"
              html={state.dataName}
              // disabled={true}
        />

          <DropdownButton
            title={state.selectedDataType.name}
            className="sequence-dropdown"
            disabled={!sequence}
            key="sequence-dropdown"
            id="sequence-dropdown">
           { dataType }
          </DropdownButton>
          {
            //TODO：这里是搜索按钮，需要写搜索资料逻辑
          }
          <button
            onClick={this.searchItem}
            title="快速搜索视点资料"
            style={{"width":100}}
            >
            <span>
            快速搜索
            </span>
          </button>

        </div>


      </div>
    )
  }

  //注释：资料视点的点击事件，传入选中的视点 selectedItem ，使用 selectedItem.id 与 state.items 中的
  //id 进行匹配，将 state.items 中该视点的 active 设置为true ， 并且向父级组件 emit 了一个事件（未知）
  toggleItem (selectedItem) {

    const state = this.react.getState()

    const items = state.items.map((item) => {

      if (item.id === selectedItem.id) {

        item.active = !item.active

        if (item.active) {

          this.onRestoreState(selectedItem)
        }
      }

      return item
    })

    this.emit('state.toggled', selectedItem)

    this.react.setState({
      items
    })
  }

  renderItemTitle(){

    const state = this.react.getState()

    const className = "itemTitle"

    const userDataName = "数据资料名"

    const status = "状态"

    const oparation  = "操作"

    return (

        <div
        className={className}
        >

              <Label text={userDataName}/>

              <Label text={status}/>

              <Label text={oparation}/>

        </div>
        )
  }

  //注释：资料视点组在这里渲染
  renderItems () {

    const state = this.react.getState()

    
    const that = this

    console.log("渲染的资料 -> renderItems->items ： ",state.items)

    const items = state.items.map((item) => {

      //对 item.name 进行前端过滤防止 xss 攻击
      const text = DOMPurify.sanitize(item.name)

      const status = DOMPurify.sanitize(item.dataType.name) || ""

      //TODO：dev 环境使用，用于视点的图片 src
      const thumbnailUrl = item.filename? item.filename.split(",").map(filename=>{
            return {
              'filepath':`/resources/img/newDM/${filename}`,
              'filename':filename
            }
      }):[]

      // TODO:布到服务器的时候使用这个地址，获得数据资料的地址数组
      // const thumbnailUrl = item.filePath ? item.filePath.split(","):[]

      //选中或者hover变蓝色
      const className = "item" +
        (state.stateSelection ? ' selectable' : '') +
        (this.itemToggling ? ' toggable' : '') +
        (item.active ? ' active' :'')

      return (

          <div data-id={item.id} data-name={text}
              className={className}
              key={item.id}
              onClick={async() => {

                console.log(`>>>>点击数据视点 item : >>>>>>>>>>>>>>>>>>>>>>>>>>>>>`,item)

                if(state.stateSelection) {

                  if (this.itemToggling) {

                    console.log(`>>>>>>>>这里执行了this.toggleItem(item)>>>>>>>>>>>`)
                    this.toggleItem(item)
                  } else {

                    console.log(`>>>>>>>>?>>>>>这里执行了this.onRestoreState (item)>>>>>>>>>>>>>>`)
                    this.onRestoreState (item)
                  }
                    //注释：获取所点击视点的资料图片,如果不存在图片，就不弹窗了
                    //TODO： 这个 getData 方法获取图片实体，多写了
                    // await this.api.getData(state.sequence.id, item.id);
                    
                    if(!this.dataPanel){
                          //使用 this.react.pushViewerPanel API 传入 DataContainerDlg 实例创建资料容器
                          if(thumbnailUrl.length<1){
                              return
                          }

                          const myDataContainerDlg = new DataContainerDlg()
                          this.dataPanel = await this.react.pushViewerPanel(myDataContainerDlg, {
                            height: 350,
                            width: 400
                          })


                          // 获取 弹窗的关闭按钮，注册其 onClick 事件关闭弹窗
                          const dataTitleClose = document.getElementById('dataTitleClose');
                          
                          dataTitleClose.addEventListener('click',()=>{
                            
                            that.react.popViewerPanel(myDataContainerDlg.id).then(()=>{
                              that.dataPanel = null
                            })
                          })
                    }
                  //点击没有资料的视点，关闭 Panel
                  if(thumbnailUrl.length<1  && this.dataPanel){
                    this.react.popViewerPanel(this.dataPanel.id).then(()=>{
                      that.dataPanel = null;
                      return 
                    })
                  }
                  

                  // 遍历 filePath ，添加到弹窗里面
                  let showDataContainer = document.getElementById("myDataContainer");
                      showDataContainer.style.display = "none";
                      showDataContainer.innerHTML = "";

                  let newItemData = null;//资料的节点
                  
                  let itemFileName = null

                  thumbnailUrl.forEach(file=>{
                    itemFileName = file.filename

                    if(/.(swf|avi|flv|mpg|rm|mov|wav|asf|3gp|mkv|rmvb|mp4|m2v)$/i.test(itemFileName)){
  
                      console.log("这是视频")
                      
                      newItemData = document.createElement("video");
                      // newItemData.controls = "controls"
                    }else if(/.(jpg|png|jpeg|bmp|gif)$/i.test(itemFileName)){
                      console.log("这是照片")
  
                      newItemData = document.createElement("img");
                    }else{
                      //TODO:其他文档资料没有判定
                      console.log("该资料其他形式的文档类型！")

                      newItemData = document.createElement("a")
                      newItemData.className = "itemData"

                      newItemData.download = itemFileName;
                      newItemData.innerText = `文件 ${itemFileName} 为资料文档，请点击下载文件`;
                      // newItemData.src = "/resources/img/newDM/"+item.filename;
                      newItemData.href = file.filepath;

                      showDataContainer.appendChild(newItemData);
                      return
                    }
                  

                  newItemData.addEventListener('click',async(e)=>{

                    if(!that.dataDetailPanel){
                      //使用 this.react.pushViewerPanel API 传入 DataContainerDlg 实例创建资料容器

                      console.log("这个容器第一次创建___________")
                      const myDetailDataContainerDlg = new DataDetailContainerDlg()
                      that.dataDetailPanel = await this.react.pushViewerPanel(myDetailDataContainerDlg, {
                        height: 750,
                        width: 750
                      })
                      // 获取 弹窗的关闭按钮，注册其 onClick 事件关闭弹窗
                      const dataDetailTitleClose = document.getElementById('dataDetailTitleClose');
                      
                      dataDetailTitleClose.addEventListener('click',()=>{
                        
                        that.react.popViewerPanel(myDetailDataContainerDlg.id).then(()=>{
                          that.dataDetailPanel = null
                        })
                      })
                    }

                    let showDataDetailContainer = document.getElementById("myDataDetailContainer");
                    
                    const lastDataDetail = showDataDetailContainer.firstChild

                    if(lastDataDetail){
                      showDataDetailContainer.removeChild(lastDataDetail)
                    }

                    const dataDetailContainer = document.createElement(e.target.nodeName);
                    if(e.target.nodeName=="VIDEO"){
                      
                      dataDetailContainer.controls = "controls"
                    }
                    dataDetailContainer.className = "itemData"
                    dataDetailContainer.onload = ()=>{
                      console.log('+++++++++++资料详情放大图加载成功， onload+++++++++++=+++++++')
                    }
                    dataDetailContainer.onerror=(e)=>{
                      console.log('!!!!!!资料详情放大图加载失败!!!!!!: 错误:',e)
                    }
                    dataDetailContainer.src = e.target.src;
                    showDataDetailContainer.appendChild(dataDetailContainer)
                  })

                  //如果存在缓存照片，则 remove
                  // if((oldItemData && oldItemData.id) && oldItemData.id == "itemData"){
                    // showDataContainer.removeChild(showDataContainer.lastChild);
                  // }

                  // showDataContainer.removeChild(showDataContainer.lastChild);

                  newItemData.className = "itemData"
                  newItemData.onload = ()=>{
                    console.log('+++++++++++资料加载 src 成功， onload+++++++++++=+++++++')
                  }
                  newItemData.onerror=(e)=>{
                    console.log('!!!!!!资料加载失败!!!!!!: 错误:',e)
                  }

                  // newItemData.src = "/resources/img/newDM/"+item.filename;
                  newItemData.src = file.filepath;
                  
                  showDataContainer.appendChild(newItemData);
                })

                showDataContainer.style.display = "grid"
                    //设置 show 状态为 true ，显示弹窗
                    // this.handleShow()

                }

              }}>

              <Label text={text}/>

              <Label text={status}/>

              {
                !state.sequence.readonly &&
                <button onClick={(e) => {
                    this.deleteItem(item.id)
                    e.stopPropagation()
                    e.preventDefault()
                }}
                  title="删除视点资料">
                  <span className="fa fa-times"/>
                </button>
              }

        </div>


      )
    })

    const itemTitle = this.renderItemTitle()

    return (
      <div className={`items ${this.itemsClass}`}>
        {itemTitle}
        { items }
      </div>

    )
  }


  //
  render (opts) {

    const state = this.react.getState()

    this.closeExt = ()=>opts.closeExt()

    return (
      <WidgetContainer
        renderTitle={() => this.renderTitle(opts.docked)}
        showTitle={opts.showTitle}
        className={this.className}>
        {
            state.disabled &&
            <div className="disabled-overlay"/>
        }
        { this.renderControls() }
        { this.renderItems() }

      </WidgetContainer>
    )
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  NewDataManagementExtension.ExtensionId,
  NewDataManagementExtension)
