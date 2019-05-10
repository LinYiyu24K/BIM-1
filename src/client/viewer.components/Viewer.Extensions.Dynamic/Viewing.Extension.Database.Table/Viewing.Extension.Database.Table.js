/////////////////////////////////////////////////////////
// Viewing.Extension.Database.Table
// by Philippe Leefsma, September 2017
//
/////////////////////////////////////////////////////////
import MultiModelExtensionBase from 'Viewer.MultiModelExtensionBase'
import DatabaseAPI from './Viewing.Extension.Database.API'
import './Viewing.Extension.Database.Table.scss'
import WidgetContainer from 'WidgetContainer'
import {ReactLoader as Loader} from 'Loader'
import ServiceManager from 'SvcManager'
import throttle from 'lodash/throttle'
import Toolkit from 'Viewer.Toolkit'
import DBTable from './DBTable'
import find from 'lodash/find'
import React from 'react'

class DatabaseTableExtension extends MultiModelExtensionBase {

  /////////////////////////////////////////////////////////
  // Class constructor
  //
  /////////////////////////////////////////////////////////
  constructor (viewer, options) {

    super (viewer, options)

    this.onUpdateItemSocket = this.onUpdateItemSocket.bind(this)
    this.onUpdateItem = this.onUpdateItem.bind(this)
    this.onSelectItem = this.onSelectItem.bind(this)

    this.onResize = throttle(this.onResize, 250)

    this.socketSvc = ServiceManager.getService(
      'SocketSvc')

    this.dbAPI = new DatabaseAPI(
      this.options.apiUrl)
    console.log('options',options)
    // apiUrl: "/api/materials"
    // appContainer: div.reflex-layout.reflex-container.vertical.configurator
    // appState: {navbar: {…}, viewerEnv: undefined, user: null, storage: {…}}
    // database: "rcdb"
    // dbModel: {_id: "57efaead77c8eb0a560ef465", name: "Car Seat", env: "Local", layout: {…}, model: {…}, …}
    // displayIndex: 0
    // eventSink: EventSvc {_events: {…}, _config: {…}}
    // extensions: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
    // flex: 0.4
    // getViewablePath: ƒ ()
    // loadDocument: ƒ loadDocument(urn)
    // loader: Loader {background: div.loader-background.disabled, loader: div.loader}
    // location: {pathname: "/database", search: "?id=57efaead77c8eb0a560ef465", hash: "", state: undefined, action: "POP", …}
    // materialCategories: ["Material"]
    // model: {path: "resources/models/dev/seat/0.svf", name: "Car Seat"}
    // notify: NotifySvc {_events: {…}, _config: {…}, noticationMap: {…}, notify: {…}}
    // parentControl: "modelTools"
    // properties: (7) ["Component Category", "Date Created", "Density", "Description", "Designer", "Material", "Part Number"]
    // react: {formatMessage: ƒ, pushRenderExtension: ƒ, pushViewerPanel: ƒ, popRenderExtension: ƒ, popViewerPanel: ƒ, …}
    // setNavbarState: ƒ ()
    // viewerDocument: undefined
    this.react = options.react
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  get className() {

    return 'database-table'
  }

  /////////////////////////////////////////////////////////
  // Extension Id
  //
  /////////////////////////////////////////////////////////
  static get ExtensionId() {

    return 'Viewing.Extension.Database.Table'
  }

  /////////////////////////////////////////////////////////
  // Load callback
  //
  /////////////////////////////////////////////////////////
  load () {

    this.react.setState({

      selectedItem: null,
      guid: null,
      items: []

    }).then (() => {

      this.react.pushRenderExtension(this)

      this.react.setState({
        guid: this.guid()
      })
    })

    this.socketSvc.on('material.update',
      this.onUpdateItemSocket)

    this.socketSvc.connect()

    this.viewer.loadDynamicExtension(
      'Viewing.Extension.ContextMenu', {
        buildMenu: (menu) => {
          return menu.map((item) => {
            const title = item.title.toLowerCase()
            if (title === 'show all objects') {
              return {
                title: 'Show All objects',
                target: () => {
                  Toolkit.isolateFull(this.viewer)
                  this.viewer.fitToView()
                }
              }
            }
            return item
          })
        }
      })

    console.log('Viewing.Extension.Database.Table loaded')

    return true
  }

  /////////////////////////////////////////////////////////
  // Unload callback
  //
  /////////////////////////////////////////////////////////
  unload () {

    console.log('Viewing.Extension.Database.Table unloaded')

    this.socketSvc.off('material.update',
      this.onUpdateItemSocket)

    super.unload ()

    return true
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  // 对componentIds的每个dbid遍历，每次遍历进行以下操作：
  // 根据dbid在materialResults找到它的材料名，
  // 根据材料名创建materialMap的一个属性，把dbid添加到compenents数组里面
  // 根据材料名在dbmaterals找到记录，作为dbmaterial对象;
  // 根据dbid在massResult找到相应质量（默认为1），然后与totalMass相加，
  // 根据totalMass和材料单价，计算出总价格，作为totalCost的值
  buildMaterialMap (model, dbMaterials) {
    //dbMaterials是rcdb.materials.json的数据,是所以模型可能用到的材料，是固定的一个数组
    return new Promise(async(resolve, reject) => {

      try {

        const materialMap = {}
        //材料节点
        const componentIds =
          await Toolkit.getLeafNodes(model)

        model.getProperties('414', (result) => {
          console.log('properties', result)
        }, (error) => {
          console.log(error)
        })
        model.getObjectTree((result) => {
          console.log('object', result)
        }, (error) => {
          console.log(error)
        })
        model.getBulkProperties(componentIds, null, (result) => {

          console.log('bulkProperties', result)

        }, (error) => {

          console.log(error)
        })

        //读取材料节点的属性值
        const materialPropResults =
          await Toolkit.getBulkPropertiesAsync(
            model, componentIds,
            this.options.materialCategories)

        const materialResults =
          materialPropResults.map((result) => {

            return Object.assign({},
              result.properties[0], {
                dbId: result.dbId
              })
          })
        const massPropResults =
          await Toolkit.getBulkPropertiesAsync(
            model, componentIds, ['Mass'])

        const massResults =
          massPropResults.map((result) => {

            return Object.assign({}, result.properties[0], {
              dbId: result.dbId
            })
          })
        console.log('model',model)
        console.log('dbMaterials',dbMaterials)//一个元素为数组的数组,items也是这个值
        // currency: "USD"
        // name: "Stainless Steel"
        // price: 2
        // supplier: "Autodesk"
        // _id: "583ec501c6bad5f3088806ae"
        console.log('componentIds', componentIds)//一个所有材料节点组成的数组，每个元素对应一个dbId
        console.log('materialPropResults', materialPropResults)
        console.log('materialResult',materialResults)
        // attributeName: "Material"
        // dbId: 177
        // displayCategory: "Physical"
        // displayName: "Material"
        // displayValue: "Stainless Steel"
        // hidden: false
        // precision: 0
        // type: 20
        // units: null
        console.log('massPropResults', massPropResults)
        console.log('massResult', massResults)
        // attributeName: "Mass"
        // dbId: 177
        // displayCategory: "Physical"
        // displayName: "Mass"
        // displayValue: 0.8492693
        // hidden: false
        // precision: 0
        // type: 3
        // units: "kilogram"

        componentIds.forEach((dbId) => {

          const materialProp = find(materialResults, { dbId })

          const materialName = materialProp ?
            materialProp.displayValue :
            null

          if(materialName !== 'undefined') {

            const dbMaterial = find(dbMaterials, {
              name: materialName
            })

            if (dbMaterial) {

              if (!materialMap[materialName]) {

                materialMap[materialName] = {
                  dbMaterial: dbMaterial,
                  components: [],
                  totalMass: 0.0,
                  totalCost: 0.0
                }
              }

              let item = materialMap[materialName]

              if (item) {

                const massProp = find(massResults, { dbId })

                const mass = massProp ? massProp.displayValue : 1.0

                item.totalMass += mass

                item.components.push(dbId)

                item.totalCost =
                  item.totalMass * this.toUSD(
                    item.dbMaterial.price,
                    item.dbMaterial.currency)
              }
            }
          }
        })

        resolve(materialMap)
        console.log('materialMap',materialMap)//一个对象
        // ABS Plastic: {dbMaterial: {…}, components: Array(15), totalMass: 1.2438209138000003, totalCost: 0.14925850965600002}
        // Acetal Resin, Black: {dbMaterial: {…}, components: Array(4), totalMass: 0.1005028013, totalCost: 0}
        // Acetal Resin, White: {dbMaterial: {…}, components: Array(6), totalMass: 0.02813793, totalCost: 0.00768165489}
        // Aluminum-6061: {dbMaterial: {…}, components: Array(1), totalMass: 0.009298702, totalCost: 0.00669506544}
        // Brass, Soft Yellow: {dbMaterial: {…}, components: Array(4), totalMass: 0.008373956, totalCost: 0.00870891424}
        // Nylon Composite (Nylon, molybdenum disulphide): {dbMaterial: {…}, components: Array(7), totalMass: 0.0691189258, totalCost: 0.26956381062}
        // Nylon-6/6: {dbMaterial: {…}, components: Array(6), totalMass: 0.0007944918, totalCost: 0.02097458352}
        // Polyaryletherketone Resin: {dbMaterial: {…}, components: Array(4), totalMass: 0.10141971, totalCost: 1.3843790415}
        // Rubber: {dbMaterial: {…}, components: Array(4), totalMass: 59.809164300000006, totalCost: 373.807276875}
        // Stainless Steel: {dbMaterial: {…}, components: Array(47), totalMass: 3.960041214999998, totalCost: 7.920082429999996}
        // Steel: {dbMaterial: {…}, components: Array(64), totalMass: 13.272220061999993, totalCost: 55.21243545791997}
        // Steel, High Strength Low Alloy: {dbMaterial: {…}, components: Array(15), totalMass: 0.20939382679999996, totalCost: 0.36853313516799996}
        // Steel, Mild: {dbMaterial: {…}, components: Array(8), totalMass: 0.22575207999999997, totalCost: 0.8127074879999998}

      } catch (ex) {

        reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  toUSD (price, currency) {

    var pricef = parseFloat(price)

    switch (currency) {

      case 'EUR': return pricef * 1.25;
      case 'USD': return pricef * 1.0;
      case 'JPY': return pricef * 0.0085;
      case 'MXN': return pricef * 0.072;
      case 'ARS': return pricef * 0.12;
      case 'GBP': return pricef * 1.58;
      case 'CAD': return pricef * 0.88;
      case 'BRL': return pricef * 0.39;
      case 'CHF': return pricef * 1.04;
      case 'ZAR': return pricef * 0.091;
      case 'INR': return pricef * 0.016;
      case 'PLN': return pricef * 0.30;
      case 'CNY': return pricef * 0.16;
      case 'DKK': return pricef * 0.17;
      case 'RUB': return pricef * 0.019;
      default: return 0.0; //Unknown
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  //改变价格后更新rcdb.materals表
  onUpdateItem (item, externalUpdate) {

    if (item) {

      const state = this.react.getState()

      if (!externalUpdate) {

        this.dbAPI.postItem(this.options.database, item)

        this.socketSvc.broadcast(
          'material.update',
          item)
      }

      const entry = this.materialMap[item.name]

      entry.dbMaterial = item

      entry.totalCost = entry.totalMass * this.toUSD(
        entry.dbMaterial.price,
        entry.dbMaterial.currency)

      const items = state.items.map((dbItem) => {

        return dbItem._id !== item._id
          ? dbItem
          : item
      })

      const guid = externalUpdate
          ? this.guid()
          : state.guid

      this.react.setState({
        items,
        guid
      })

      this.costBreakDownExtension.computeCost(
        this.materialMap)

      const dbProperties =
        this.buildViewerPanelProperties(
          item)

      this.viewerPropertiesExtension.updateProperties(
        dbProperties)
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onUpdateItemSocket (item) {

    this.onUpdateItem(item, true)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onSelectItem (item, propagate) {

    if (item) {

      const material = this.materialMap[item.name]
      console.log('material',material)
      // components: (47) [177, 178, 183, 184, 214, 215, 294, 295, 298, 299, 334, 335, 336, 337, 152, 153, 338, 137, 187, 206, 230, 238, 239, 246, 247, 248, 249, 250, 251, 252, 253, 259, 260, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 331, 315, 316]
      // dbMaterial: {_id: "583ec501c6bad5f3088806ae", name: "Stainless Steel", supplier: "Autodesk", currency: "USD", price: 2}
      // totalCost: 7.920082429999996
      // totalMass: 3.960041214999998
      const dbIds = material
        ? material.components
        : (item.components || [])
      console.log('item',item)
      //两个拓展传递的item不一样
      //table
      // currency: "USD"
      // name: "Stainless Steel"
      // price: 2
      // supplier: "Autodesk"
      // _id: "583ec501c6bad5f3088806ae"

      //costBreakDown
      // components: (4) [147, 148, 261, 327]
      // dbMaterial: {_id: "583ec501c6bad5f3088806b5", name: "Acetal Resin, Black", supplier: "Autodesk", currency: "ARS", price: 0}
      // totalCost: 0
      // totalMass: 0.1005028013
      console.log('dbid',dbIds)
      // [177, 178, 183, 184, 214, 215, 294, 295, 298, 299, 334, 335, 336, 337, 152, 153, 338, 137, 187, 206, 230, 238, 239, 246, 247, 248, 249, 250, 251, 252, 253, 259, 260, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 331, 315, 316]
      console.log('propagate',propagate)
      //true

      this.viewer.fitToView(dbIds)

      Toolkit.isolateFull(
        this.viewer,
        dbIds)

    } else {

      Toolkit.isolateFull(
        this.viewer)

      this.viewer.fitToView()
    }

    this.react.setState({
      selectedItem: item
    })

    if (propagate) {

      this.costBreakDownExtension.setSelectedItem(item)
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  async onModelCompletedLoad () {
    //获取数据库数据
    ///api/materials/rcdb
    const materials =
      await this.dbAPI.getItems(
        this.options.database)
    //建立材料数组
    this.materialMap = await this.buildMaterialMap (
      this.viewer.model,
      materials)

    const filteredMaterials =
      materials.filter((material) => {

        return (this.materialMap[material.name] != null)
      })
    //设置items为材料数组
    this.react.setState({
      items: filteredMaterials,
      guid: this.guid()
    })

    this.costBreakDownExtension =
      this.viewer.getExtension(
        'Viewing.Extension.Database.CostBreakdown')

    this.costBreakDownExtension.on(
      'item.selected',
      this.onSelectItem)

    this.costBreakDownExtension.computeCost(
      this.materialMap)

    this.viewerPropertiesExtension =
      this.viewer.getExtension(
        'Viewing.Extension.ViewerProperties')

    this.viewerPropertiesExtension.on(
      'setProperties', (data) => {

        return this.onSetComponentProperties(
          data.properties,
          data.nodeId)
      })

    // this.viewer.unloadExtension('Viewing.Extension.ViewerProperties')
    this.viewer.loadDynamicExtension ('ChooseProperties').then( () => {
      this.choosePropertiesExtension =
      this.viewer.getExtension(
        'ChooseProperties')

      this.choosePropertiesExtension.on(
      'setProperties', (data) => {

        return this.onSetComponentProperties(
          data.properties,
          data.nodeId)
      })
    });
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onSetComponentProperties (viewerProps, nodeId) {

    let materialName = null

    // filter out all 'Material' props because
    // it is added in 'Database' category
    let properties = viewerProps.filter((prop)=> {

      const included =
        this.options.materialCategories.includes(
          prop.displayName)

      if (included) {

        materialName = materialName || prop.displayValue
      }

      return !included
    })

    if (this.materialMap[materialName]) {

      const material = this.materialMap[
        materialName].dbMaterial

      const dbProperties =
        this.buildViewerPanelProperties(
          material)

      properties = [
        ...properties,
        ...dbProperties
      ]
    }

    return Promise.resolve(properties)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  buildViewerPanelProperties (material) {

    return [ {
      id: material._id + '-material',
      displayName: 'Material',
      displayValue: material.name,
      dataType: 'text',
      displayCategory: 'Database'
    },{
      id: material._id + '-supplier',
      displayName: 'Supplier',
      displayValue: material.supplier,
      dataType: 'text',
      displayCategory: 'Database'
    },{
      id: material._id + '-price',
      displayName: 'Price',
      displayValue: material.price,
      dataType: 'text',
      displayCategory: 'Database'
    },{
      id: material._id + '-currency',
      displayName: 'Currency',
      displayValue: material.currency,
      dataType: 'text',
      displayCategory: 'Database'
    }]
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  renderTitle () {

    return (
      <div className="title">
        <label>
          Database
        </label>
      </div>
    )
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onResize () {

    this.react.setState({
      guid: this.guid()
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  renderContent () {

    const {guid, items, selectedItem} =
      this.react.getState()

    const showLoader = !items.length

    return (
      <div className="content">
        <Loader show={showLoader}/>
        <DBTable
          onSelectItem={this.onSelectItem}
          onUpdateItem={this.onUpdateItem}
          selectedItem={selectedItem}
          items={items}
          guid={guid}
        />
      </div>
    )
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  render (opts = {showTitle: true}) {

    return (
      <WidgetContainer
        renderTitle={() => this.renderTitle(opts.docked)}
        showTitle={opts.showTitle}
        className={this.className}>

        { this.renderContent() }

      </WidgetContainer>
    )
  }

  //async listMaterials(create = false, materials = null) {
  //
  //  const componentIds = await Toolkit.getLeafNodes(
  //    this.viewer.model)
  //
  //  var componentsMap = await Toolkit.mapComponentsByProp(
  //    this.viewer.model, 'Material', componentIds)
  //
  //  const keys = Object.keys(componentsMap)
  //
  //  console.log(keys)
  //
  //  if (create) {
  //
  //    keys.forEach((key) => {
  //
  //      if(!materials || materials.indexOf(key) > -1) {
  //
  //        this.dbAPI.postItem(this.options.database, {
  //          name: key,
  //          supplier: 'Autodesk',
  //          currency: 'USD',
  //          price: 1.0
  //        })
  //      }
  //    })
  //  }
  //}
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  DatabaseTableExtension.ExtensionId,
  DatabaseTableExtension)
