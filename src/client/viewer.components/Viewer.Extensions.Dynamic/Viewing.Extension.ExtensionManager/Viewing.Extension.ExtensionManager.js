/////////////////////////////////////////////////////////
// Viewing.Extension.ExtensionManager
// by Philippe Leefsma, April 2016
//
/////////////////////////////////////////////////////////
import MultiModelExtensionBase from 'Viewer.MultiModelExtensionBase'
import './Viewing.Extension.ExtensionManager.scss'
import ExtensionPane from './ExtensionPane'
import ServiceManager from 'SvcManager'
import PaneManager from 'PaneManager'
import sortBy from 'lodash/sortBy'
import ReactDOM from 'react-dom'
import React from 'react'

class ExtensionManager extends MultiModelExtensionBase {

  /////////////////////////////////////////////////////////
  // Class constructor
  //
  /////////////////////////////////////////////////////////
  constructor(viewer, options) {

    super (viewer, options)

    this.storageSvc = ServiceManager.getService(
      'StorageSvc')

    this.renderTitle = this.renderTitle.bind(this)

    this.render = this.render.bind(this)
    this.closeExt = this.closeExt.bind(this)

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

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  get className() {

    return 'extension-manager'
  }

  /////////////////////////////////////////////////////////
  // Extension Id
  //
  /////////////////////////////////////////////////////////
  static get ExtensionId() {

    return 'Viewing.Extension.ExtensionManager'
  }

  /////////////////////////////////////////////////////////
  // Load callback
  //
  /////////////////////////////////////////////////////////
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
        'extension-manager')

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

    console.log('Viewing.Extension.ExtensionManager loaded')


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
    console.log("state中的extensions: ",JSON.stringify(extensions));
    return false;
  };

  getCurrentOpenExtension(){
    const { extensions } = this.react.getState()
    console.log('extensions',extensions);
    for (let extension of extensions) {
      if (extension.enabled == true) {
        return extension
      }
    }
    console.log("当前没有打开的extension！")
    return false;
  }

  createUI() {
     var viewer = this.viewer;

    ///////////////////////////////////////////////////////////////////////////////////////

    // DataManagement 资料管理
    var dataManagement = new Autodesk.Viewing.UI.Button('dataManagement');
    dataManagement.onClick = function(e) {
      //viewer.setViewCube('front');//设为后面的视图

      //添加了这个loadDE函数，然后把原有的代码（下边注释的）放入函数体内
      // let extension = this.getExtensionbyId("Viewing.Extension.DataManagement");
      // let curExtension = this.getCurrentOpenExtension();

      // if(curExtension){//存在已经打开的extension，把它关掉
      //   this.onExtensionItemClicked(curExtension);
      // }

      // if(extension){
      //   this.onExtensionItemClicked(extension);
      // }
      var that = this
      viewer.loadDynamicExtension('Viewing.Extension.NewDataManagementExtension').then(function(){
        let extension = that.getExtensionbyId("Viewing.Extension.NewDataManagementExtension");
        let curExtension = that.getCurrentOpenExtension();

        if(curExtension){//存在已经打开的extension，把它关掉
          that.onExtensionItemClicked(curExtension);
        }

        if(extension){
          that.onExtensionItemClicked(extension);
        }
      });

    }.bind(this);
    dataManagement.addClass('dataManagementButton');
    // dataManagement.addClass('adsk-icon-fullscreen');
    dataManagement.setToolTip('数据管理');


    /////////////////////////////////////////////////////////////////////////////////////////
    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');

    this.subToolbar.addControl(dataManagement);
    // this.subToolbar.addControl(choosePropertyButton);

    viewer.toolbar.addControl(this.subToolbar);

  }

  ////////////////////////////////////////////////////////
  //用来关闭某个extension的
  //
  ///////////////////////////////////////////////////////
  closeExt(){
    console.log("test 成功！！！");

    let curExtension = this.getCurrentOpenExtension();

    if(curExtension){//存在已经打开的extension，把它关掉
      this.onExtensionItemClicked(curExtension);
    }
  }

  /////////////////////////////////////////////////////////
  // Unload callback
  //
  /////////////////////////////////////////////////////////
  unload () {

    console.log('Viewing.Extension.ExtensionManager unloaded')
    this.viewer.toolbar.removeControl(this.subToolbar);
    return true
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
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

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  loadDynamicExtension (extension) {

    return new Promise((resolve, reject) => {

      const { extensions } = this.react.getState()

      extension.loading = true

      this.react.setState({
        extensions
      })

      const options = Object.assign({},
        this.options, extension.options, {
          react: this.reactOpts
        })

      // console.log(`执行到了 extensionManager 的 loadDynamicExtension 函数，传入的 extension 是:>>>>>>>>>>>>>>>`)
      // console.log(extension)
      // console.log(`extension 其中的 native 决定是否使用 viewer.loadDynamicExtension 方法 ，值为 ： ${extension.native}`)
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
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  async onExtensionItemClicked (extension) {

    if (extension.loading) {

      return
    }

    if (extension.enabled) {

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

    } else {

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

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onStopResize () {

    const { renderExtensions } = this.react.getState()

    renderExtensions.forEach((extension) => {

      if (extension.onStopResize) {

        extension.onStopResize()
      }
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onResize () {

    const { renderExtensions } = this.react.getState()

    renderExtensions.forEach((extension) => {

      if (extension.onResize) {

        extension.onResize()
      }
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  renderTitle () {

    return (
      <div className="title">
        <label>
          Extension Manager
        </label>
      </div>
    )
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
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

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  renderExtensionManager () {

    return (
      <ExtensionPane renderTitle={this.renderTitle}
        key={ExtensionManager.ExtensionId}
        className="extension-manager">

        <div className="extension-list">
          { this.renderExtensions() }
        </div>

      </ExtensionPane>
    )
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
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
            className={extension.className}
            key={extension.id}
            {...flexProp}>
            {
              //TODO:这里关闭拓展的逻辑仅仅是获取当前打开的拓展然后关闭，没有根据 id 来关闭
              extension.render({
                showTitle: false,
                docked: true,
                closeExt: ()=>this.closeExt()
              })
            }
          </ExtensionPane>
        )
      })

    const panes = state.visible
      ? [this.renderExtensionManager(), ...extensionPanes]
      :  extensionPanes

    return (
      <PaneManager orientation="horizontal">
        { panes }
      </PaneManager>
    )
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  ExtensionManager.ExtensionId,
  ExtensionManager)
















