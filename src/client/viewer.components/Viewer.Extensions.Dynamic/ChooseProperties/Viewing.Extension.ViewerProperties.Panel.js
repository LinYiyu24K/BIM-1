///////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2016 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
///////////////////////////////////////////////////////////////////////////////
import EventsEmitter from 'EventsEmitter'
import React from 'react'
import ReactDOM from 'react-dom'
import './chooseProperties.scss'
import ServiceManager from 'SvcManager'
import DatabaseAPI from '../Viewing.Extension.Database.Table/Viewing.Extension.Database.API'
import throttle from 'lodash/throttle'
import Toolkit from 'Viewer.Toolkit'
import { func } from 'prop-types';

///////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////
export default class ViewerPropertiesPanel extends
    EventsEmitter.Composer (Autodesk.Viewing.Extensions.ViewerPropertyPanel) {

  constructor (viewer, opts = {}) {

    super (viewer)

    this.react = opts.react
    this.dbAPI = new DatabaseAPI('/api/materials')
    this.socketSvc = ServiceManager.getService(
      'SocketSvc')

    this.state = {
      properties: [],
      keys: [],
      value: [],
      showMaterialPanel: false,
      buttonCreated: false,
      materials: [],
      map : new Map()
    }

    this.ejectMeterialPanel = this.ejectMeterialPanel.bind(this)
    this.confirm = this.confirm.bind(this)
    this.modal = this.modal.bind(this)
    this.getMaterial = this.getMaterial.bind(this)

  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  setNodeProperties (nodeId) {

    super.setNodeProperties(nodeId)

    this.nodeId = nodeId
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  refresh () {

    this.setVisible(false, true)
    this.setVisible(true, true)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  __setProperties (properties, options) {

    this.removeAllProperties()

    const withoutCategories = []
    const withCategories = []

    for (var i = 0; i < properties.length; i++) {
        var property = properties[i]
        if (!property.hidden) {
            var category = properties[i].displayCategory;
            if (category && typeof category === 'string' && category !== '') {
                withCategories.push(property)
            } else {
                withoutCategories.push(property)
            }
        }
    }

    if ((withCategories.length + withoutCategories.length) === 0) {
        this.showNoProperties()
        return
    }

    for (var i = 0; i < withCategories.length; i++) {

      const property = withCategories[i]

      const precision = property.precision || Autodesk.Viewing.Private.calculatePrecision(
          property.displayValue)

      const displayValue = Autodesk.Viewing.Private.formatValueWithUnits(
          property.displayValue,
          property.units,
          property.type,
          precision)

      this.__addProperty(Object.assign({}, property, {
        displayValue
      }))
    }

    const hasCategories = (withCategories.length > 0);

    for (var i = 0; i < withoutCategories.length; i++) {

      const property = withoutCategories[i]

      const precision = property.precision || Autodesk.Viewing.Private.calculatePrecision(
        property.displayValue)

      const displayValue = Autodesk.Viewing.Private.formatValueWithUnits(
        property.displayValue,
        property.units,
        property.type,
        precision)

      const displayCategory = hasCategories
        ? 'Other'
        : ''

      const opts = hasCategories
        ? {localizeCategory: true}
        : {}

      this.__addProperty(Object.assign({}, property, {
        displayCategory,
        displayValue
      }), opts)
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  setProperties (properties) {

    // var promise = new Promise(function(resolve, reject) {
    //   this.emit('setProperties', {
    //     nodeId: this.nodeId,
    //     properties
    //   })
    //   resolve(properties)
    // })
    // promise.then((properties) => {

    //   this.__setProperties (properties)

    //   this.resizeToContent()
    // })
    this.emit('setProperties', {
      nodeId: this.nodeId,
      properties

    }).then((properties) => {

      this.__setProperties (properties)

      this.resizeToContent()
    })
  }

  /////////////////////////////////////////////////////////
  // addProperty (name, value, category, options)
  //
  /////////////////////////////////////////////////////////
  __addProperty (metaProperty, options) {

    const element = this.tree.getElementForNode({
      category: metaProperty.displayCategory,
      value: metaProperty.displayValue,
      name: metaProperty.displayName
    })

    if (element) {
      return false
    }

    let parent = null

    if (metaProperty.displayCategory) {

        parent = this.tree.getElementForNode({
          name: metaProperty.displayCategory
        })

        if (!parent) {
            parent = this.tree.createElement_({
              name: metaProperty.displayCategory,
              type: 'category'
            }, this.tree.myRootContainer,
            options && options.localizeCategory
              ? {localize: true}
              : null)
        }

    } else {

        parent = this.tree.myRootContainer
    }

    this.tree.createElement_(
      metaProperty,
      parent,
      options && options.localizeProperty
        ? {localize: true}
        : null)

    return true
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  updateProperty (metaProperty) {

    switch (metaProperty.dataType) {

      case 'link':

        break

      case 'img':

        break

      case 'file':

        break

      case 'select':

        break

      case 'text':
      default:

        $('#' + metaProperty.id).text(
          metaProperty.displayValue)

        break
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createPropertyName (metaProperty, displayOptions) {

    const name = document.createElement('div')

    let text = metaProperty.displayName

    if (displayOptions && displayOptions.localize) {
      name.setAttribute('data-i18n', text)
      text = Autodesk.Viewing.i18n.translate(text)
    }

    name.className = 'property-name'
    name.textContent = text
    name.title = text

    return name
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createPropertySeparator () {

    const separator = document.createElement('div')
    separator.className = 'separator'

    return separator
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  displayProperty (metaProperty, parent, displayOptions) {

    this.getMaterial()

    const propertyName = this.createPropertyName(
      metaProperty, displayOptions)

    const separator = this.createPropertySeparator()

    var propertyValue = null

    switch (metaProperty.dataType) {

      case 'link':

        propertyValue = this.createLinkProperty(
          metaProperty,
          displayOptions)

        break

      case 'img':

        propertyValue = this.createImageProperty(
          metaProperty,
          displayOptions)

        break

      case 'file':

        propertyValue = createFileProperty(
          metaProperty,
          displayOptions)

        break

      case 'select':

        propertyValue = this.createSelectProperty(
          metaProperty,
          displayOptions)

        break

      case 'text':
      default:

        propertyValue = this.createTextProperty(
          metaProperty,
          displayOptions)

        break
    }

    parent.appendChild(propertyName)
    parent.appendChild(separator)
    parent.appendChild(propertyValue)
    if (this.state.properties.indexOf(metaProperty.displayName) == -1) {
      const textAdd = this.createAdd (metaProperty)
      parent.appendChild(textAdd )
    }
    else {
      const textDelet = this.createDelete (metaProperty)
      parent.appendChild(textDelet)
      parent.prepend(this.createInclude(metaProperty))
    }
    if(!this.state.buttonCreated) parent.parentNode.parentNode.parentNode.parentNode.parentNode.appendChild(this.createButton())
    // Make the property name and value highlightable
    return [propertyName, propertyValue]
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  async getMaterial () {
    this.state.materials = await this.dbAPI.getItems('rcdb')
  }

  createButton () {
    if (this.state.buttonCreated == true) return
    const value = document.createElement('button')
    const text = document.createTextNode('确认')
    value.className = 'confirmButton'
    value.onclick = function () {
      console.log('确认')
    }
    value.appendChild(text)
    this.state.buttonCreated = true

    return value
  }
   /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  ejectMeterialPanel (name) {
    //面板输入项分为已有输入项和新增输入项，前者打开面板时存在，后者通过点击“新增输入项”按钮生成
    let _this = this
    const defaultValue = {
      "_id": Math.random(),
      "name": name,
      "supplier" : '',
      "currency" : '',
      "price" : ''
    }
    console.log(this.state.materials)
    let materials = this.state.materials
    //material就是面板要展示的材料对象
    let material = materials.find((item) => item.name == name) || defaultValue
    //材料对象的属性数组
    let keys = Object.keys(material).slice(2)

    //新属性、值
    let newProperties = []
    let newValues = []
    //新增输入项个数
    let count = keys.length - 3

    let index = materials.indexOf(material)
    //材料表不存在该材料
    if (index == -1) {
      console.log('新增材料信息')
      materials.push(material)
      index = materials.length - 1
    }

    this.state.map.set("_id", material._id)
    this.state.map.set("name", material.name)

    //把面板已有输入项的属性和值放到map中
    function setMap (map) {
      let values = Object.values(material).slice(2)
      keys.forEach((item, index) => {
        map.set(item, values[index])
      })
    }

    //把新增输入项的属性和值放到map中
    function addNewProperty (map) {
      if (newProperties.length == 0)  return
      newProperties.forEach((item, index) => {
        map.set(item, newValues[index])
      })
    }

    //面板新增的输入项的数值变更
    function newValueChange (event) {
      const target = event.target
      //新值的索引
      let name = parseInt(target.name)
      const value = target.type === 'checkbox' ? target.checked : target.value;

      newValues[name] = value
    }

    //面板新增的输入项的属性变更
    function newPropertyChange (event) {
      const target = event.target
      //新值的索引
      let name = parseInt(target.name)
      const value = target.type === 'checkbox' ? target.checked : target.value;

      newProperties[name] = value
    }

    //map转换为对象
    function strMapToObj(strMap) {
      let obj = Object.create(null);
      for (let [k,v] of strMap) {
        obj[k] = v;
      }
      return obj;
    }

    //面板关闭
    function close () {
      _this.react.popViewerPanel(renderable.id)
      _this.state.showMaterialPanel = false
    }

    //面板已有输入项的属性变更
    function onPropertyChange (keys, item) {

      const target = event.target
      const value = target.type === 'checkbox' ? target.checked : target.value;
      let index = keys.indexOf(item)

      keys.splice(index, 1 , value)
    }

    //面板已有输入项的数值变更
    function onValueChange (event) {

      const target = event.target
      const name = target.name
      const value = target.type === 'checkbox' ? target.checked : target.value;

      material[name] = value
      materials.splice(index, 1, material)
    }

    //插入新输入项
    function insertInput (length) {
      const element = document.createElement('li')

      const propertyElenment = document.createElement('input')
      propertyElenment.className = 'property'
      propertyElenment.type = 'text'
      propertyElenment.name = length
      propertyElenment.onchange = newPropertyChange

      const labelElement = document.createElement('label')
      const textElement = document.createTextNode('：')
      labelElement.append(textElement)

      const valueElement = document.createElement('input')
      valueElement.className = 'value'
      valueElement.type = 'text'
      valueElement.name = length
      valueElement.onchange = newValueChange

      $(element).append(propertyElenment)
                .append(labelElement)
                .append(valueElement)

      $('#newMaterial').append(element)
    }

    const renderable = {
      id: 9,
      onResize ()  {
        console.log('resize')
      },

      renderTitle ()  {
        return (<div className="materialTittle">
                  <span>请输入材料信息</span>
                  <button className="btn close" onClick = {close}>×</button>
                </div>)
      },

      render () {

        const listItems = keys.map((item, index) =>
          <li key={index}>
            <input type="text" className="property" name="" defaultValue={item} onChange={function () { onPropertyChange(keys, item) }}></input>
            <label>：</label>
            <input type="text" className="value" name={item} defaultValue={material[item]} onChange={onValueChange}></input><br></br>
          </li>
        )

        return (
          <div id="material" className="material">
            <label>材料名：</label><label className="name">{name}</label><br></br>
            <ul className="materialList">{listItems}</ul>
            <ul id="newMaterial" className="newMaterial"></ul>
            <button className="btn add" onClick={function () {
              let length = newValues.length
              setMap(_this.state.map)
              insertInput(length)

              //自动调整面板高度
              let height = 340 + 40 * count
              count++
              $('#material').parent().parent().css({'height': height + 'px'})

            }}>新增输入项
            </button>
            <button className="btn cancle" onClick={close}>取消</button>
            <button className="btn confirm" onClick={function () {
              close()
              setMap(_this.state.map)
              addNewProperty(_this.state.map)
              _this.confirm({content: '确认！'})
              console.log('map', _this.state.map)
              let item = strMapToObj(_this.state.map)
              _this.dbAPI.postItem('rcdb', item)
              _this.socketSvc.broadcast(
                'material.update',
                item)
            }}>确认
            </button>
          </div>
        )
      }
    }
    this.react.pushViewerPanel(renderable, {'height': 300 + count * 40})
    this.state.showMaterialPanel = true
  }
  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  confirm (message = {content: '确认！'}, e) {
    function Component (props) {
      return (
        <div className = "messageModal">
          <div className="tittle">
            <span className="text">温馨提示</span>
            <button className = "btn close" onClick = {props.onClose}>×</button>
          </div>
          <div className="content">
            <p className = "modalMessage">{props.content}</p>
          </div>
          <div className="footer">
            <button className="btn confirm" onClick={props.onClose}>确认</button>
          </div>
        </div>
      )
    }
    let props = message
    function component (prop) {
      return <Component content={props.content} onClose={prop.onClose}/>
    }

    this.modal(component, 1)
  }

   /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  modal(Component, zIndex) {

    let body = document.body;
    let showDom = document.createElement("div");
    // 设置基本属性
    showDom.style.position = 'absolute';
    showDom.style.top = '0px';
    showDom.style.left = '0px';
    showDom.style.width = '100%';
    showDom.style.height = '100%';
    showDom.style.zIndex = zIndex || Browser.FLOAT_VIEW_INDEX;
    // showDom.style.backgroundColor = 'rgb(0,0,0,0.3)'
    body.appendChild(showDom);
    // 自我删除的方法
    let close = () => {
        ReactDOM.unmountComponentAtNode(showDom);
        body.removeChild(showDom);
    }
    ReactDOM.render(
        <Component onClose={close} />,
        showDom
    );
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createAdd (metaProperty) {

    const value = document.createElement('span')
    var properties = this.state.properties

    value.textContent = '＋'
    value.id = metaProperty.id || this.guid()
    value.title = metaProperty.displayValue
    value.className = 'add'

    $(value).click( () => {
      //材料面板已存在
      if (this.state.showMaterialPanel) {
        return
      }
      properties.push(metaProperty.displayName)
      console.log('添加', properties)
      $(value).parent().prepend(this.createInclude(metaProperty))
      this.ejectMeterialPanel(metaProperty.displayValue)
      // $('body').append(this.ejectMeterialModel(metaProperty.displayValue))
      $(value).replaceWith($(this.createDelete(metaProperty)))

    })

    return value
  }
  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createDelete (metaProperty) {

    const value = document.createElement('span')
    let properties = this.state.properties
    // let message = { content: '删除成功！'}
    value.textContent = '－'
    value.id = metaProperty.id || this.guid()
    value.title = metaProperty.displayValue
    value.className = 'delete'

    $(value).click( () => {
      //材料面板已存在
      if (this.state.showMaterialPanel) {
        return
      }
      properties.splice(properties.indexOf(metaProperty.displayName), 1)
      console.log('删除', properties)
      // this.confirm(message)
      $(value).parent().children(":first").remove()
      $(value).replaceWith($(this.createAdd(metaProperty)))

    })

    return value
  }
  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createInclude(metaProperty) {
    const value = document.createElement('span')

    value.textContent = '√'
    value.id = metaProperty.id || this.guid()
    value.title = metaProperty.displayValue
    value.className = 'include'

    return value
  }
  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createTextProperty (metaProperty, displayOptions) {

    const value = document.createElement('div')

    value.textContent = metaProperty.displayValue
    value.id = metaProperty.id || this.guid()
    value.title = metaProperty.displayValue
    value.className = 'property-value'

    return value
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createLinkProperty (metaProperty, displayOptions) {

    const value = document.createElement('div')
    value.id = metaProperty.id || this.guid()
    value.title = metaProperty.displayValue
    value.className = 'property-value'

    $(value).append(`
      <a  href="${property.href}" target="_blank">
        ${metaProperty.displayValue}
      </a>
    `)

    return value
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createImageProperty (metaProperty, displayOptions) {

    const value = document.createElement('div')
    value.id = metaProperty.id || this.guid()
    value.title = metaProperty.displayValue
    value.className = 'property-value'

    const imgId = this.guid()

    $(value).append(`
      <a  href="${property.href}">
        <img id="${imgId}" src="${property.href}"
          height="${metaProperty.height}"
          width="${metaProperty.with}"/>
      </a>
    `)

    return value
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  createFileProperty (metaProperty, displayOptions) {

    const value = document.createElement('div')
    value.id = metaProperty.id || this.guid()
    value.title = metaProperty.displayValue
    value.className = 'property-value'

    const imgId = this.guid()

    $(value).append(`
      <a href="${property.href}">
        ${metaProperty.displayValue}
      </a>
    `)

    return value
  }

  /////////////////////////////////////////////////////////
  // onPropertyClick handle
  //
  /////////////////////////////////////////////////////////
  onPropertyClick (metaProperty, event) {

    switch (metaProperty.dataType) {

      // opens link in new tab
      case 'link':

        window.open(metaProperty.href, '_blank')

        break

      // download image or file
      case 'file':
      case 'img':

        this.downloadURI(
          metaProperty.href,
          metaProperty.filename)

        break

      case 'text':
      default :

        //nothing to do for text
        break
    }
  }

  /////////////////////////////////////////////////////////
  // Download util
  //
  /////////////////////////////////////////////////////////
  downloadURI (uri, name) {

    const link = document.createElement("a")

    link.download = name
    link.href = uri
    link.click()
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  guid (format='xxxx-xxxx-xxxx') {

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
}
