/////////////////////////////////////////////////////////
// Viewing.Extension.ExtensionManagerToolbar
// by Philippe Leefsma, April 2016
//
/////////////////////////////////////////////////////////
import MultiModelExtensionBase from 'Viewer.MultiModelExtensionBase'
import './Viewing.Extension.ExtensionManagerToolbar.scss'
import ExtensionPane from './ExtensionPane'
import ServiceManager from 'SvcManager'
import PaneManager from 'PaneManager'
import sortBy from 'lodash/sortBy'
import ReactDOM from 'react-dom'
import React from 'react'

class ExtensionManagerToolbar extends MultiModelExtensionBase {

  // Class constructor
  constructor(viewer, options) {

    super (viewer, options)

    this.storageSvc = ServiceManager.getService(
      'StorageSvc')

    this.renderTitle = this.renderTitle.bind(this)

    this.render = this.render.bind(this)

    this.reactOpts = {
      pushRenderExtension: (extension) => {

        return new Promise(async(resolve) => {

          const state = this.react.getState()

          if (!state.renderExtensions.length &&
            !state.visible) {

            this.react.pushRenderExtension(this)
          }

          this.react.setState({
            renderExtensions: [
              ...state.renderExtensions, extension
            ]

          }).then(async() => {

            resolve()

            await this.react.forceUpdate()

            this.onStopResize()
          })
        })
      },
      popRenderExtension: (extensionId) => {

        const state = this.react.getState()

        const renderExtensions =
          state.renderExtensions.filter((ext) => {
            return ext.id !== extensionId
          })

        return new Promise((resolve) => {

          this.react.setState({
            renderExtensions
          }).then(async() => {

            resolve()

            if (!renderExtensions.length &&
              !state.visible) {

              await this.react.popRenderExtension()
            }

            await this.react.forceUpdate()

            this.onStopResize()
          })
        })
      }
    }

    this.react = options.react
  }

  //
  get className() {
    return 'extension-manager'
  }

  // Extension Id
  static get ExtensionId() {
    return 'Viewing.Extension.ExtensionManagerToolbar'
  }

  // Load callback
  load () {
    this.viewer.addEventListener(
      Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, (e) => {
        this.options.loader.show(false)
      })

    const extensionsByName = sortBy(
      this.options.extensions || [], (ext) => {
        return ext.name
      })

    this.react.setState({

      visible: this.options.visible,
      extensions: extensionsByName,
      renderExtensions: []

    }).then (async() => {

      if (this.options.visible) {

        await this.react.pushRenderExtension(this)
      }

      const extensions = this.options.extensions || []

      const storage = this.storageSvc.load(
        'extension-manager-toolbar')

      const loadExts = extensions.filter ((extension) => {

        if (this.options.useStorage) {

          const storageExtensions = storage.extensions || []

          extension.enabled = extension.enabled ||
            storageExtensions.includes(extension.id)
        }

        return extension.enabled
      })

      for (const extension of loadExts) {

        await this.loadDynamicExtension(extension)
      }
    })

    console.log('Viewing.Extension.ExtensionManagerToolbar loaded')

    //加载toolbar
    if (this.viewer.toolbar) {
      // Toolbar is already available, create the UI
      this.createUI();
    } else {
      // Toolbar hasn't been created yet, wait until we get notification of its creation
      this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
      this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    }

    return true
  }

  onToolbarCreated() {
    this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    //把监听工具栏是否加载成功的监听器关掉
    this.onToolbarCreatedBinded = null;
    this.createUI();
  };

  getExtensionbyId(id){

    const { extensions } = this.react.getState()

    for (let extension of extensions) {
      if (id === extension.id) {
        return extension
      }
    }
    console.log("Cannot find this Extension: "+id);
    return false;
  };

  getCurrentOpenExtension(){
    const { extensions } = this.react.getState()

    for (let extension of extensions) {
      if (extension.enabled == true) {
        return extension
      }
    }
    console.log("当前没有打开的extension！")
    return false;
  }

  createUI() {
    //创建toolBar的UI
    // alert('TODO: Create Toolbar!');

    var viewer = this.viewer;

    // screenshotButton 截图
    var screenshotButton = new Autodesk.Viewing.UI.Button('screenshotButton');
    screenshotButton.onClick = function(e) {
      //viewer.setViewCube('front');//设为后面的视图

      let extension = this.getExtensionbyId("Viewing.Extension.ScreenShotManager");
      let curExtension = this.getCurrentOpenExtension();

      if(curExtension){//存在已经打开的extension，把它关掉
        this.onExtensionItemClicked(curExtension);
      }

      if(extension){
        this.onExtensionItemClicked(extension);
      }

    }.bind(this);
    screenshotButton.addClass('screenshotButton');
    screenshotButton.setToolTip('截图');


    // saveViewButton 视点保存
    var saveViewButton = new Autodesk.Viewing.UI.Button('saveViewButton');
    saveViewButton.onClick = function(e) {
      //viewer.setViewCube('front');//设为后面的视图

      let extension = this.getExtensionbyId("Viewing.Extension.ConfigManager");
      let curExtension = this.getCurrentOpenExtension();

      if(curExtension){//存在已经打开的extension，把它关掉
        this.onExtensionItemClicked(curExtension);
      }

      if(extension){
        this.onExtensionItemClicked(extension);
      }

    }.bind(this);
    saveViewButton.addClass('saveViewButton');
    saveViewButton.setToolTip('视点保存');

    // filterButton 过滤器
    var filterButton = new Autodesk.Viewing.UI.Button('filterButton');
    filterButton.onClick = function(e) {
      //viewer.setViewCube('front');//设为后面的视图

      let extension = this.getExtensionbyId("Viewing.Extension.SelectionFilter");
      let curExtension = this.getCurrentOpenExtension();

      if(curExtension){//存在已经打开的extension，把它关掉
        this.onExtensionItemClicked(curExtension);
      }

      if(extension){
        this.onExtensionItemClicked(extension);
      }

    }.bind(this);
    filterButton.addClass('filterButton');
    filterButton.setToolTip('过滤器');

    // filterShaderButton 过滤器着色
    var filterShaderButton = new Autodesk.Viewing.UI.Button('filterShaderButton');
    filterShaderButton.onClick = function(e) {
      //viewer.setViewCube('front');//设为后面的视图

      let extension = this.getExtensionbyId("Viewing.Extension.Material");
      let curExtension = this.getCurrentOpenExtension();

      if(curExtension){//存在已经打开的extension，把它关掉
        this.onExtensionItemClicked(curExtension);
      }

      if(extension){
        this.onExtensionItemClicked(extension);
      }

    }.bind(this);
    filterShaderButton.addClass('filterShaderButton');
    filterShaderButton.setToolTip('过滤器着色');


     // metaPropertiesButton 属性管理
    var metaPropertiesButton = new Autodesk.Viewing.UI.Button('metaPropertiesButton');
    metaPropertiesButton.onClick = function(e) {
      //viewer.setViewCube('front');//设为后面的视图

      let extension = this.getExtensionbyId("Viewing.Extension.MetaProperties");
      let curExtension = this.getCurrentOpenExtension();

      if(curExtension){//存在已经打开的extension，把它关掉
        this.onExtensionItemClicked(curExtension);
      }

      if(extension){
        this.onExtensionItemClicked(extension);
      }

    }.bind(this);
    metaPropertiesButton.addClass('metaPropertiesButton');
    metaPropertiesButton.setToolTip('属性管理');

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');

    this.subToolbar.addControl(screenshotButton);
    this.subToolbar.addControl(saveViewButton);
    this.subToolbar.addControl(filterButton);
    this.subToolbar.addControl(filterShaderButton);
    this.subToolbar.addControl(metaPropertiesButton);

    viewer.toolbar.addControl(this.subToolbar);
  };

  //用来关闭某个extension的
  closeExt(){
    console.log("test 成功！！！");

    let curExtension = this.getCurrentOpenExtension();

    if(curExtension){//存在已经打开的extension，把它关掉
      this.onExtensionItemClicked(curExtension);
    }
  }

  // Unload callback
  unload () {
    console.log('Viewing.Extension.ExtensionManagerToolbar unloaded')
    this.viewer.toolbar.removeControl(this.subToolbar);

    return true
  }

  //
  onExtensionLoaded (e) {

    const { extensions } = this.react.getState()

    for (let extension of extensions) {

      if (e.extensionId === extension.id) {

        extension.enabled = true

        this.react.setState({
          extensions
        })

        return
      }
    }
  }

  //
  loadDynamicExtension (extension) {

    return new Promise((resolve, reject) => {

      if(extension.isPop){
        console.log("空的extension")

        this.viewer.loadDynamicExtension(
            123, {isPop:true})

      }else{

        const { extensions } = this.react.getState()

        extension.loading = true

        this.react.setState({
          extensions
        })

        const options = Object.assign({},
          this.options, extension.options, {
            react: this.reactOpts
          })

        // native extensions are the ones available
        // with the viewer API
        if (extension.native) {

          this.viewer.loadExtension(
            extension.id, options).then((extInstance) => {

            extension.loading = false
            extension.enabled = true

            this.react.setState({
              extensions
            })

            resolve (extInstance)

          }, (error) => {

            extension.loading = false

            reject (error)
          })

        } else {

          this.viewer.loadDynamicExtension(
            extension.id, options).then((extInstance) => {

            extension.loading = false
            extension.enabled = true

            this.react.setState({
              extensions
            })

            resolve (extInstance)

          }, (error) => {

            extension.loading = false

            reject (error)
          })
        }
      }

    })
  }

  //这是用来开关使用的工具的
  async onExtensionItemClicked (extension) {

    if (extension.loading) {
      return
    }

    if (extension.enabled) {//如果是已经打开的工具，那么pop一下关闭

      await this.react.popViewerPanel(extension.id)

      this.viewer.unloadExtension(extension.id)

      const { extensions, renderExtensions } =
        this.react.getState()

      extension.enabled = false

      const renderExts =
        renderExtensions.filter((ext) => {
          return ext.id !== extension.id
        })

      await this.react.setState({
        renderExtensions: renderExts,
        extensions
      })

      this.react.forceUpdate()

      await this.loadDynamicExtension ({isPop:true})//joe:压一个空的extension进去，为了在Viewer.Configurator中把右边的拓展栏关闭
      //loadDynamicExtension疑似是它和Viewer疑似是它和Viewer.Configurator之间传递数据的唯一通道

      if (this.options.useStorage) {

        this.storageSvc.save(
          'extension-manager', {
            extensions: extensions.filter((ext) => {
              return ext.enabled
            }).map((ext) => {
              return ext.id
            })
          })
      }

    } else {//否则开启这个工具的使用

      const { extensions } = this.react.getState()

      const extInstance =
        await this.loadDynamicExtension (extension)

      if (this.options.useStorage) {

        this.storageSvc.save(
          'extension-manager', {
            extensions: extensions.filter((ext) => {
              return ext.enabled
            }).map((ext) => {
              return ext.id
            })
          })
      }
    }
  }

  //
  onStopResize () {

    const { renderExtensions } = this.react.getState()

    renderExtensions.forEach((extension) => {

      if (extension.onStopResize) {

        extension.onStopResize()
      }
    })
  }

  //
  onResize () {

    const { renderExtensions } = this.react.getState()

    renderExtensions.forEach((extension) => {

      if (extension.onResize) {

        extension.onResize()
      }
    })
  }

  //
  renderTitle () {
    return (
      <div className="title">
        <label>
          Extension Manager
        </label>
      </div>
    )
  }

  //
  renderExtensions () {
    const { extensions } = this.react.getState()

    const visibleExtensions = extensions.filter(
      (extension) => {
        return !extension.hidden
      })

    return visibleExtensions.map((extension) => {

      const className = 'item' +
        (extension.enabled ? ' enabled' : '') +
        (extension.loading ? ' loading' : '')

      return (
        <div key={extension.id} className={className}
             onClick={() => {
               this.onExtensionItemClicked(extension)
             }}>
          <label>
            { extension.name}
          </label>
        </div>
      )
    })
  }

  //
  renderExtensionManagerToolbar () {

    return (
      <ExtensionPane renderTitle={this.renderTitle}
                     key={ExtensionManagerToolbar.ExtensionId}
                     className="extension-manager">

        <div className="extension-list">
          { this.renderExtensions() }
        </div>

      </ExtensionPane>
    )
  }

  //
  render () {
    const state = this.react.getState()

    const renderExtensions = sortBy(
      state.renderExtensions, (ext) => {
        return ext.options.displayIndex || 0
      })

    const nbExt = renderExtensions.length +
      (this.options.visible ? 1 : 0)

    const extensionPanes = renderExtensions.map (
      (extension) => {

        const flexProp = nbExt > 1 && extension.options.flex
          ? {flex: extension.options.flex }
          : {}

        return (
          <ExtensionPane
            renderTitle={() => extension.renderTitle(true)}
            onStopResize={(e) => this.onStopResize()}
            onResize={(e) => this.onResize()}
            testFunc={()=>this.testFunc()}
            className={extension.className}
            key={extension.id}
            {...flexProp}>

            {/*<button type="button" style="float:left;">关闭扩展!</button>*/}
            {
              extension.render({
                showTitle: false,
                docked: true,
                closeExt: ()=>this.closeExt()
              })
            }
          </ExtensionPane>
        )
      })

    state.visible=false;

    const panes = state.visible
      ? [this.renderExtensionManagerToolbar(), ...extensionPanes]
      :  extensionPanes

    return (
      <PaneManager orientation="horizontal">
        { panes }
      </PaneManager>
    )
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  ExtensionManagerToolbar.ExtensionId,
  ExtensionManagerToolbar)
