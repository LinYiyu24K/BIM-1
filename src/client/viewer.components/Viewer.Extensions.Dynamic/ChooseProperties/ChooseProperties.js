/////////////////////////////////////////////////////////////////////
// Viewing.Extension.ViewerPropertiesExtension
// by Philippe Leefsma, September 2016
//
/////////////////////////////////////////////////////////////////////
import ViewerPropertyPanel from './Viewing.Extension.ViewerProperties.Panel'
import PropertyPanel from '../Viewing.Extension.ViewerProperties/Viewing.Extension.ViewerProperties.Panel'
import MultiModelExtensionBase from 'Viewer.MultiModelExtensionBase'
import React from 'react'
import ViewerConigurator from '../../Viewer.Configurator'

class ChoosePropertiesExtension extends MultiModelExtensionBase {

  /////////////////////////////////////////////////////////
  // Class constructor
  //
  /////////////////////////////////////////////////////////
  constructor (viewer, options) {

    super (viewer, options)

    this.react = options.react

    this.addModel   = this.addModel.bind(this)
  }

  /////////////////////////////////////////////////////////
  // Extension Id
  //
  /////////////////////////////////////////////////////////
  static get ExtensionId() {

    return 'ChooseProperties'
  }

  /////////////////////////////////////////////////////////
  // Load callback
  //
  /////////////////////////////////////////////////////////
  load() {

    console.log('ChooseProperties loaded')
    this.addModel()
    return true;
  }

  /////////////////////////////////////////////////////////
  // Unload callback
  //
  /////////////////////////////////////////////////////////
  unload() {

    console.log('ChooseProperties unloaded')

    this.panel.off()

    this.off()

    return true
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  addModel () {

    console.log('触发',this.viewer)
    let _this = this
    this.panel = new ViewerPropertyPanel(
      this.viewer, this.options)

    this.panel.on('setProperties', (data) => {
      return this.emit('setProperties', data)
    })
    this.viewer.setPropertyPanel(this.panel)

    let chooseButton = this.viewer.toolbar._controls[4]._controls.find((item) => {
      return item._id == 'choosePropertyButton'
    })

    chooseButton.onClick =  (e) => {
      //再次点击关闭面板
      var presentPanel = this.viewer.getPropertyPanel(true)

      if (presentPanel instanceof ViewerPropertyPanel && presentPanel.isVisible()) {
        presentPanel.setVisible(!presentPanel.isVisible())
        chooseButton.removeClass('active')
        return
      }

      this.panel = new ViewerPropertyPanel(
        this.viewer, this.options)

      this.panel.on('setProperties', (data) => {
        return this.emit('setProperties', data)
      })
      this.viewer.setPropertyPanel(this.panel)

      this.viewer.loadDynamicExtension ('ChooseProperties').then( () => {
        var propertyPanel = this.viewer.getPropertyPanel(true);
        propertyPanel.setVisible(!propertyPanel.isVisible());
        chooseButton.addClass('active')
        //消除平台本身properties按钮的高亮显示
        _this.viewer.toolbar._controls[3].propertiesbutton.removeClass('active')
      });
    };


    this.viewer.settingsTools.propertiesbutton.onClick =  (e) => {
      //再次点击关闭面板
      var presentPanel = this.viewer.getPropertyPanel(true)

      if (presentPanel instanceof PropertyPanel && presentPanel.isVisible()) {
        presentPanel.setVisible(!presentPanel.isVisible())
        return
      }

      this.panel = new PropertyPanel(
        this.viewer, this.options)

      this.panel.on('setProperties', (data) => {
        return this.emit('setProperties', data)
      })
      this.viewer.setPropertyPanel(this.panel)

      this.viewer.loadDynamicExtension ('Viewing.Extension.ViewerProperties').then( () => {
        var propertyPanel = this.viewer.getPropertyPanel(true);
        propertyPanel.setVisible(!propertyPanel.isVisible());
      });
    };
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  addProperties (properties) {

    //suppress "no properties" in panel
    if(properties.length) {

      $('div.noProperties', this.panel.container).remove()
    }

    properties.forEach((property) => {

      this.panel.addProperty(property)
    })

    this.panel.resizeToContent()
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  updateProperties (properties) {

    properties.forEach((property) => {

      this.panel.updateProperty(property)
    })

    return true
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  ChoosePropertiesExtension.ExtensionId,
  ChoosePropertiesExtension)
