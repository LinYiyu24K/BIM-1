import {ReflexContainer, ReflexElement, ReflexSplitter} from 'react-reflex'//使用弹性布局
import ViewingApplication from 'Viewer.ViewingApplication'
import { ReactLoader, Loader } from 'Loader'
import BaseComponent from 'BaseComponent'
import autobind from 'autobind-decorator'
import ServiceManager from 'SvcManager'
import './Viewer.Configurator.scss'
import PropTypes from 'prop-types'
import Stopwatch from 'Stopwatch'
import ReactDOM from 'react-dom'
import merge from 'lodash/merge'
import find from 'lodash/find'
import easing from 'easing-js'
import Viewer from 'Viewer'
import Panel from 'Panel'
import React from 'react'

import { intlShape } from 'react-intl'

class ViewerConfigurator extends BaseComponent {

  static contextTypes = {
    intl: intlShape
  }

  //这个是用来类型检查的
  static propTypes = {
    setViewerEnv: PropTypes.func.isRequired,
    database: PropTypes.string.isRequired,
    modelId: PropTypes.string.isRequired,
    appState: PropTypes.object
  }

  //
  constructor(props, context) {

    super(props, context)

    this.notifySvc = ServiceManager.getService(
      'NotifySvc')

    this.eventSvc = ServiceManager.getService(
      'EventSvc')

    this.modelSvc = ServiceManager.getService(//用来获取模型的
      'ModelSvc')

    this.state = {
      dataExtension: null,
      viewerPanels: [],
      viewerFlex: 1.0,
      resizing: false,
      dbModel: null
    }

    this.viewerFlex = 1.0
  }

  //component mount上去之后，开始传递一些模型的信息，用于渲染模型
  async componentDidMount () {

    try {
      this.loader = new Loader(this.loaderContainer)

      const dbModel = await this.modelSvc.getModel(
        this.props.database,
        this.props.modelId)//这些值都是在ConfiguratorView.js里面设置的(大概在50行)
      //应该还会获取到dbModel.dynamicExtensions的信息
      //在/resources/db/dev/configurator.models.json中可以看到

      if (!this.props.appState.viewerEnv) {

        const viewerEnv = await this.initialize({
          useConsolidation: true,
          env: dbModel.env
        })

        this.props.setViewerEnv (viewerEnv)

        Autodesk.Viewing.Private.memoryOptimizedSvfLoading = true
      }

      //这里设置state
      this.assignState({
        dbModel
      })

      window.addEventListener(
        'resize', this.onStopResize)

      window.addEventListener(
        'resize', this.onResize)

    } catch (ex) {
      return this.props.onError(ex)
    }
  }

  //应该是关闭页面的时候的一些操作
  componentWillUnmount () {

    window.removeEventListener(
      'resize', this.onStopResize)

    window.removeEventListener(
      'resize', this.onResize)
  }

  // Initialize viewer environment
  initialize (options) {
    return new Promise((resolve, reject) => {
      Autodesk.Viewing.Initializer (options, () => {
        resolve ()
      }, (error) => {
        reject (error)
      })
    })
  }

  // Load a document from URN
  loadDocument (urn) {
    return new Promise((resolve, reject) => {

      const paramUrn = !urn.startsWith('urn:')
        ? 'urn:' + urn : urn

      Autodesk.Viewing.Document.load(paramUrn, (doc) => {
        resolve (doc)
      }, (error) => {
        reject (error)
      })
    })
  }

  // Return viewable path: first 3d or 2d item by default
  @autobind//autobind使onClick=this.handleClick永远正确，而不需要onClick=this.handleClikc.bind(this)
  getViewablePath (doc, pathIdx = 0, query = [
      { type: 'geometry', role: '3d' },
      { type: 'geometry', role: '2d' }
    ]) {

    const toArray = (obj) => {
      return obj ? (Array.isArray(obj) ? obj : [obj]) : []
    }//这个相当于定义一个名为toArray的函数，后面147行才会调用...

    const rootItem = doc.getRootItem()

    let items = []

    toArray(query).forEach((queryItem) => {

      items = [ ...items,
        ...Autodesk.Viewing.Document.getSubItemsWithProperties(
          rootItem, queryItem, true) ]
    })

    if (!items.length || pathIdx > items.length-1) {
      return null
    }

    return doc.getViewablePath(items[pathIdx])
  }

  /////////////////////////////////////////////////////////
  loadDynamicExtension (viewer, extension, options) {

    return new Promise ((resolve, reject) => {

      var ext = viewer.getExtension(extension.id)

      if (ext) {

        if (ext.reload) {

          ext.reload(options)
        }

        return resolve (ext)
      }

      System.import(
        '../../viewer.components/Viewer.Extensions.Dynamic/' +
        extension.id + '/index').then(() => {

        const extState = {
          [extension.id]: {}
        }

        this.assignState(extState).then(() => {

          viewer.loadExtension (
            extension.id, options).then((extInstance) => {

            this.eventSvc.emit('extension.loaded', {
              extension: extInstance
            })

            return resolve (extInstance)

          }, (err) => {

            reject ('Failed to load extension: ' + extension.id)
          })
        })

      }, (error) => {

        reject (error)
      })
    })
  }

  /////////////////////////////////////////////////////////
  @autobind
  pushRenderExtension (extension) {

    return new Promise (async(resolve) => {

      const layout = this.state.dbModel.layout

      layout.rightFlex=0.35

      this.viewerFlex = layout
        ? 1.0 - (layout.leftFlex || layout.rightFlex || 0.3)
        : 1.0

      await this.assignState({
        paneExtStyle: { display: 'block' }
      })

      await this.runAnimation (
        1.0, this.viewerFlex, 1.0)

      setTimeout(() => {

        this.assignState({
          renderExtension: extension
        }).then(() => {
          resolve ()
        })

      }, 250)
    })
  }

  /////////////////////////////////////////////////////////
  @autobind
  popRenderExtension () {

    return new Promise ((resolve) => {

      this.assignState({
        renderExtension: null
      }).then(() => {
        resolve ()
      })

      setTimeout(async() => {

        //layout.rightFlex=0.000001

        await this.runAnimation(
          this.viewerFlex, 1.0, 1.0)

        await this.assignState({
          paneExtStyle: { display: 'none' }
        })

        resolve ()

      }, 250)
    })
  }

  /////////////////////////////////////////////////////////
  @autobind
  pushViewerPanel (viewer) {

    return (renderable, opts = {}) => {

      const nbPanels = this.state.viewerPanels.length

      const panelId = renderable.id

      const props = Object.assign({
          left: 10 + 50 * nbPanels,
          top: 10 + 55 * nbPanels
        }, opts, {
        container: viewer.container,
        id: panelId,
        renderable,
        react: {
          setState: (state) => {

            return new Promise((resolve) => {

              const panelState = this.state[panelId] || {}

              const newPanelState = {
                [panelId]: Object.assign({},
                  panelState, state)
              }

              this.assignState(newPanelState).then(() => {

                resolve(newPanelState)
              })
            })
          },
          getState: () => {

            return this.state[panelId] || {}
          }
        }
      })

      return new Promise ((resolve) => {

        const panel = new Panel (props)

        this.assignState({
          viewerPanels: [
            ...this.state.viewerPanels,
            panel
          ]
        }).then(() => {

          resolve (panel)
        })
      })
    }
  }

  /////////////////////////////////////////////////////////
  @autobind
  popViewerPanel (panelId) {

    return new Promise ((resolve) => {

      const targetPanel = find(this.state.viewerPanels, {
        id: panelId
      })

      targetPanel
        ? targetPanel.destroy().then(() => {

        const viewerPanels =
          this.state.viewerPanels.filter((panel) => {
            return (panel.id !== panelId)
          })

          this.assignState({
            viewerPanels
          })
          resolve ()
        })
       : resolve ()
    })
  }

  /////////////////////////////////////////////////////////
  setupDynamicExtensions (viewer) {

    const ctrlGroup = this.createToolbar (viewer)

    //this.createUI(viewer)

    this.createMyToolbar(viewer)//这个里面会有一个回掉的等待

    const defaultOptions = {
      setNavbarState: this.props.setNavbarState,
      appContainer: ReactDOM.findDOMNode(this),
      getViewablePath: this.getViewablePath,
      loadDocument: this.loadDocument,
      model:this.state.dbModel.model,
      database: this.props.database,
      location: this.props.location,
      appState: this.props.appState,
      dbModel: this.state.dbModel,
      parentControl: ctrlGroup,
      notify: this.notifySvc,
      loader: this.loader,
      apiUrl: '/api'
    }

    const createDefaultOptions = (id) => {

      const fullDefaultOptions = Object.assign({},
        defaultOptions, {
          react: {
            formatMessage: this.context.intl.formatMessage,

            pushRenderExtension:
              this.pushRenderExtension,

            pushViewerPanel:
              this.pushViewerPanel(viewer),

            popRenderExtension:
              this.popRenderExtension,

            popViewerPanel:
              this.popViewerPanel,

            forceUpdate: () => {

              return new Promise ((resolve) => {
                this.forceUpdate(() => {
                  resolve()
                })
              })
            },
            getComponent: () => {
              return this
            },
            getState: () => {

              return this.state[id] || {}
            },
            setState: (state, doMerge) => {

              return new Promise ((resolve) => {

                const extState = this.state[id] || {}

                const newExtState = {
                  [id]: doMerge
                    ? merge({}, extState, state)
                    : Object.assign({}, extState, state)
                }

                this.assignState(newExtState).then(() => {

                  resolve (newExtState)
                })
              })
            },
            props: this.props
          }
        })

      return fullDefaultOptions
    }

    viewer.loadDynamicExtension = (id, options = {}) => {

      const fullOptions = merge ({},
        createDefaultOptions(id), {
          viewerDocument: this.viewerDocument,
          eventSink: this.eventSvc
        },
        options)

      return this.loadDynamicExtension (
        viewer, {id}, fullOptions)
    }

    const extensions =
      this.state.dbModel.dynamicExtensions || []

    const extensionTasks = extensions.map(
      (extension) => {

        return viewer.loadDynamicExtension (
          extension.id,
          extension.options)
      })

    return Promise.all (extensionTasks)
  }

  /////////////////////////////////////////////////////////
  animate (period, easing, update) {

    return new Promise((resolve) => {

      const stopwatch = new Stopwatch()

      let elapsed = 0

      const stepFn = () => {

        const dt = stopwatch.getElapsedMs() * 0.001

        elapsed += dt

        if (elapsed < period) {

          const eased = easing(elapsed/period)

          update (eased).then(() => {

            window.requestAnimationFrame(stepFn)
          })

        } else {

          update(1.0)

          resolve()
        }
      }

      stepFn ()
    })
  }

  /////////////////////////////////////////////////////////
  runAnimation (start, end, animPeriod) {

    const easingFn = (t) => {
      //b: begging value, c: change in value, d: duration
      return easing.easeInOutExpo(t, 0, 1.0, animPeriod * 0.9)
    }

    const update = (eased) => {

      const viewerFlex =
        (1.0 - eased) * start + eased * end

      return new Promise((resolve) => {

        this.assignState({
          viewerFlex
        }).then(() => resolve())
      })
    }

    return this.animate (
      animPeriod, easingFn, update)
  }

  //????????????
  createToolbar (viewer) {

    let toolbarContainer = document.createElement('div')

    toolbarContainer.className = 'configurator-toolbar'

    viewer.container.appendChild(toolbarContainer)

    const toolbar = new Autodesk.Viewing.UI.ToolBar (true)//////??????

    const ctrlGroup =
      new Autodesk.Viewing.UI.ControlGroup(
        'configurator')

    toolbar.addControl(ctrlGroup)

    toolbarContainer.appendChild(
      toolbar.container)

    return ctrlGroup
  }

  createMyToolbar(viewer){
       //加载toolbar
      if (viewer.toolbar) {
        // Toolbar is already available, create the UI
        this.createUI(viewer);
      } else {
        // Toolbar hasn't been created yet, wait until we get notification of its creation
        this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this, viewer);
        this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
      }
    }

  onToolbarCreated(viewer) {
    viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    //把监听工具栏是否加载成功的监听器关掉
    this.onToolbarCreatedBinded = null;
    this.createUI(viewer);
  };

  getCurrentOpenExtension(){
    return this.state.renderExtension;
  }

  createUI(viewer) {
    //创建toolBar的UI
    // alert('TODO: Create Toolbar!');

    // screenshotButton 截图
    var screenshotButton = new Autodesk.Viewing.UI.Button('screenshotButton');
    screenshotButton.onClick = function(e) {
      //viewer.setViewCube('front');//设为后面的视图

      let extension = {id: "Viewing.Extension.ScreenShotManager", name: "ScreenShotManager", enabled: false};
      let curExtension = this.getCurrentOpenExtension();

      if(curExtension){//存在已经打开的extension，把它关掉
        //this.popRenderExtension(curExtension);
      }

      if(curExtension){
        this.setupDynamicExtensions(viewer);
        //this.loadDynamicExtension(viewer, extension, {});
        this.pushRenderExtension(extension);
        //this.renderExtension();
      }

    }.bind(this);
    screenshotButton.addClass('screenshotButton');
    screenshotButton.setToolTip('截图');

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');

    this.subToolbar.addControl(screenshotButton);

    viewer.toolbar.addControl(this.subToolbar);
  };
  /////////////////////////////////////////////////////////
  buildTransform (transform = {}) {

    const matrix = new THREE.Matrix4()

    const position = new THREE.Vector3()

    position.fromArray(transform.position || [0,0,0])

    const euler = new THREE.Euler(
      0,0,0, 'XYZ')

    euler.fromArray(transform.euler || [0,0,0])

    const quaternion = new THREE.Quaternion()

    quaternion.setFromEuler(euler)

    const scale = new THREE.Vector3()

    scale.fromArray(transform.scale || [1,1,1])

    matrix.compose(
      position,
      quaternion,
      scale)

    return matrix
  }

  //
  @autobind
  onModelRootLoaded (event) {

    const viewer = event.target

    viewer.removeEventListener(
      Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT,
      this.onModelRootLoaded)

    const nav = viewer.navigation

    nav.toPerspective()

    viewer.autocam.setHomeViewFrom(
      nav.getCamera())
  }

  /////////////////////////////////////////////////////////
  @autobind
  onGeometryLoaded (event) {

    const viewer = event.target

    viewer.removeEventListener(
      Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT,
      this.onGeometryLoaded)

    setTimeout(() => {
      if (viewer.viewCubeUi) {
        viewer.showViewCubeTriad(true)
      }
    }, 2000)
  }

  /////////////////////////////////////////////////////////
  async onViewerCreated (viewer, modelInfo) {
    try {
      const {appState, showLoader} = this.props

      this.loader = new Loader(viewer.container)

      this.loader.show(showLoader)

      if (this.props.onViewerCreated) {

        this.props.onViewerCreated(
          viewer, this.loader)
      }

      viewer.setTheme(appState.storage.theme.viewer.theme)

      viewer.start()

      viewer.addEventListener(
        Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT,
        this.onModelRootLoaded)

      viewer.addEventListener(
        Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
        this.onGeometryLoaded)

      viewer.prefs.tag('ignore-producer')

      const viewerTheme = appState.storage.theme.viewer

      viewer.setLightPreset(viewerTheme.lightPreset)

      const bgClr = viewerTheme.backgroundColor

      viewer.setBackgroundColor(
        bgClr[0], bgClr[1], bgClr[2],
        bgClr[3], bgClr[4], bgClr[5])

      await this.setupDynamicExtensions (viewer)

      if (modelInfo) {

        const lmvProxy =
          modelInfo.proxy || 'lmv-proxy-2legged'

        Autodesk.Viewing.endpoint.setEndpointAndApi(
          `${window.location.origin}/${lmvProxy}`,
          'modelDerivativeV2')

        switch (this.state.dbModel.env) {

          case 'Local':

            const localOptions = {
              placementTransform: this.buildTransform(
                modelInfo.transform)
            }

            viewer.loadModel(modelInfo.path, localOptions, (model) => {

              model.name = modelInfo.displayName || modelInfo.name
              model.dbModelId = this.state.dbModel._id
              model.urn = modelInfo.urn
              model.guid = this.guid()

              viewer.activeModel = model

              this.eventSvc.emit('model.loaded', {
                model
              })
            })

            break

          case 'AutodeskProduction':

            this.viewerDocument =
              await this.loadDocument(modelInfo.urn)

            const query = modelInfo.query || [
              { type: 'geometry', role: '3d' },
              { type: 'geometry', role: '2d' }
            ]

            const path = this.getViewablePath(
              this.viewerDocument,
              modelInfo.pathIndex || 0,
              query)

            const loadOptions = {
              sharedPropertyDbPath:
                this.viewerDocument.getPropertyDbPath(),
              placementTransform: this.buildTransform(
                modelInfo.transform)
            }

            viewer.loadModel(path, loadOptions, (model) => {

              model.name = modelInfo.displayName || modelInfo.name
              model.dbModelId = this.state.dbModel._id
              model.urn = modelInfo.urn
              model.guid = this.guid()

              viewer.activeModel = model

              this.eventSvc.emit('model.loaded', {
                model
              })
            })

            break
        }
      }

    } catch(ex) {

      console.log('Viewer Initialization Error: ')
      console.log(ex)
    }
  }

  /////////////////////////////////////////////////////////
  onViewingApplicationCreated (viewingApp) {
  }

  /////////////////////////////////////////////////////////
  guid (format = 'xxxxxxxxxxxx') {

    var d = new Date().getTime()

    var guid = format.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16)
      })

    return guid
  }

  //渲染加载器，也就是加载模型的位置，(实际上就是一个div)
  renderLoader () {
    return (
      <div className="configurator-loader"
        ref={ (div) => this.loaderContainer = div /*这个div就是loaderContainer的位置*/}>
      </div>
    )
  }

  //
  renderExtension () {

    const { renderExtension } = this.state

    const renderOptions = {
      showTitle: true,
      docked: true
    }

    const content = renderExtension
      ? this.state.renderExtension.render(renderOptions)//这个地方渲染extension
      : <div/>

    return (
      <div className="data-pane">
        <ReactLoader show={!renderExtension}/>
        { content }
      </div>
    )
  }

  //渲染模型
  renderModel (modelInfo) {

    const {resizing} = this.state

    const viewerStyle = {
      pointerEvents: resizing
        ? 'none'
        : 'all'
    }

    return (
      <Viewer onViewerCreated={(viewer) => {
          this.onViewerCreated(viewer, modelInfo)
        }}
        panels= {this.state.viewerPanels}
        style={viewerStyle}
      />
    )
  }

  /////////////////////////////////////////////////////////
  @autobind
  onViewerStartResize (e) {

    this.assignState({
      resizing: true
    })
  }

  /////////////////////////////////////////////////////////
  @autobind
  onViewerStopResize (e) {

    this.viewerFlex = e.component.props.flex

    if (this.state.renderExtension) {

      if (this.state.renderExtension.onStopResize) {

        this.state.renderExtension.onStopResize()
      }
    }

    this.assignState({
      resizing: false
    })
  }

  /////////////////////////////////////////////////////////
  @autobind
  onStopResize (e) {

    if (this.state.renderExtension) {

      if (this.state.renderExtension.onStopResize) {

        this.state.renderExtension.onStopResize()
      }
    }
  }

  /////////////////////////////////////////////////////////
  @autobind
  onResize (event) {
    if (this.state.renderExtension) {

      if (this.state.renderExtension.onResize) {

        this.state.renderExtension.onResize()
      }
    }
  }

  /////////////////////////////////////////////////////////
  render () {
    const { dbModel, viewerFlex, paneExtStyle } = this.state

    if (!dbModel) {// dbModel not loaded yet -> render loader
      return this.renderLoader ()//模型尚未加载的时候，先渲染加载器，就是指定模型加载的位置而已
    }

    const modelInfo = dbModel.model

    const layout = dbModel.layout

    switch (layout ? layout.type : 'none') {
      //这里renderExtension和renderModel应该是关键
            //我们看到的页面布局应该是flexLayoutRight的，模型在左边，扩展功能在右边

      case 'flexLayoutLeft':
        return (
          <ReflexContainer className="configurator"
            key="configurator" orientation='vertical'>
            <ReflexElement style={paneExtStyle}>
              {this.renderExtension()}
            </ReflexElement>
            <ReflexSplitter
              onStopResize={() => this.forceUpdate()}
              style={paneExtStyle}
            />
            <ReflexElement
              onStartResize={this.onViewerStartResize}
              onStopResize={this.onViewerStopResize}
              propagateDimensions={true}
              onResize={this.onResize}
              flex={viewerFlex}>
              {this.renderModel(modelInfo)}
            </ReflexElement>
          </ReflexContainer>
        )

      case 'flexLayoutRight':
        return (
          <ReflexContainer className="configurator"
            key="configurator" orientation='vertical'>
            <ReflexElement
              onStartResize={this.onViewerStartResize}
              onStopResize={this.onViewerStopResize}
              propagateDimensions={true}
              onResize={this.onResize}
              flex={viewerFlex/*viewerFlex是我们自己在state里面设置的一个属性*/}>
              {this.renderModel(modelInfo)/*渲染模型*/}
            </ReflexElement>
            <ReflexSplitter
              onStopResize={() => this.forceUpdate()}
              style={paneExtStyle}
            />
            <ReflexElement>
              {this.renderExtension()/*渲染extension  ReflexElement style={paneExtStyle}*/}
            </ReflexElement>
          </ReflexContainer>
        )

      case 'none':
      default:
        return this.renderModel(modelInfo)
    }
  }
}

export default ViewerConfigurator
