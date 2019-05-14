
import PropTypes from 'prop-types'
import './libs/nice-select.css'
import find from 'lodash/find'
import './libs/nice-select'
import React from 'react'
import './libs/footable'
import './DBTable.scss'
import './libs/footable.editable'
import DatabaseAPI from '../Viewing.Extension.Database.API'

class DBTable extends React.Component {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor (props) {

    super(props)

    this.scroll = 0
    this.materials = []
    this.properties = []
    this.show = false
    this.showProp=['supplier','price','currency',]
    this.dbAPI = new DatabaseAPI('/api/materials')

    this.editTittle = this.editTittle.bind(this)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  componentDidMount () {

    if(!this.show) this.showNewProp()
    this.getMaterial()

    $('.footable').footable({
      breakpoints: {
        phone: 400,
        tablet: 400
      }
    })

    this.ftEditable = $().ftEditable()

    this.ftEditable.setUpdateHandler((updateRecord) => {

      let dbItem = find(this.props.items, {
        _id: updateRecord.id
      })

      switch (updateRecord.fieldName) {

        case 'price':

          const price = parseFloat(updateRecord.fieldValue)

          if(!isNaN(price)) {

            dbItem[updateRecord.fieldName] = price
          }

          break

        case 'currency':
          return

        default:
          dbItem[updateRecord.fieldName] =
            updateRecord.fieldValue
          break
      }

      this.props.onUpdateItem(dbItem)
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  shouldComponentUpdate (nextProps) {

    if (nextProps.guid !== this.props.guid) {

      return true
    }

    return false
  }

  /////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////
  componentDidUpdate () {
    let items = this.materials

    items.forEach((value) => {
      this.findNewProp(value, this.properties)
    })
    console.log('props',this.properties)

    this.refresh()
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  componentWillUnmount () {

    $('.footable').remove()
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onRowClicked (id) {

    const selectedItem = find(
      this.props.items, {
        _id: id
      })

    if (selectedItem) {
      console.log('selectedItem',selectedItem)

      this.props.onSelectItem(
        selectedItem, true)
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onHeaderClicked (e) {


  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  async getMaterial () {
    this.materials = await this.dbAPI.getItems('rcdb')
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  //刷新表格内容
  refresh() {

    if (this.ftEditable) {

      this.ftEditable.deleteAllRows(
        '.footable')


      this.ftEditable.addRows(
        '.footable',
        this.props.items.map((dbItem) => {
          let obj = {
            name: dbItem.name
          }
          let properties = this.showProp
          properties.forEach((value) => {
            obj[value] =  dbItem[value]
          })

          obj.id = dbItem._id

          return obj
          // return {
          //   'name': dbItem.name,
          //   'supplier': dbItem.supplier,
          //   price: dbItem.price,
          //   currency: dbItem.currency,
          //   id: dbItem._id
          // }
        }), {

          select: {
            currency: [
              {value:'ARS', label:'ARS'},
              {value:'BRL', label:'BRL'},
              {value:'CAD', label:'CAD'},
              {value:'CHF', label:'CHF'},
              {value:'CNY', label:'CNY'},
              {value:'DKK', label:'DKK'},
              {value:'EUR', label:'EUR'},
              {value:'GBP', label:'CAD'},
              {value:'INR', label:'INR'},
              {value:'JPY', label:'JPY'},
              {value:'MXN', label:'MXN'},
              {value:'PLN', label:'PLN'},
              {value:'RUB', label:'RUB'},
              {value:'USD', label:'USD'},
              {value:'ZAR', label:'ZAR'}
            ]
          }
        })

      this.select = $('select', '.db-table').niceSelect()

      this.select.on('change', (e, option) => {

        const id = $(option).parents('tr')[0].id

        const dbItem = find(this.props.items, {
          _id: id
        })

        dbItem.currency = $(option).attr('data-value')

        this.props.onUpdateItem(dbItem)
      })

      $('.footable > tbody > tr > td:first-child').off(
        'click')

      $('.footable > tbody > tr > td:first-child').on (
        'click', (e) => {
          const id = $(e.target).parent()[0].id
          this.onRowClicked(id)
        })

      $('.footable > tbody > tr > td:first-child label').on (
        'click', (e) => {
          const id = $(e.target).parent().parent()[0].id
          this.onRowClicked(id)
        })

      $('.footable > thead > tr > th').on (
        'click', (e) => this.onHeaderClicked(e))
      //表格数据编辑
      $("td[contenteditable='true']", '.footable').on (
        'keydown keypress',  (e) => {
          //价格属性
          // Allow only numeric for "Price"
          let indexOfPrice = this.showProp.indexOf('price')
          if($(e.target).index() === indexOfPrice + 1) {

            //backspace,  ->, <-, delete, '.', ',',
            const allowed = [8, 37, 39, 46, 188, 190]

            if (allowed.indexOf(e.keyCode) > -1 ||
               (e.keyCode > 47 && e.keyCode < 58)) {

              //console.log('OK')

            //enter
            } else if (e.keyCode === 13) {

              const value = this.getValue(e.target)

              const price = parseFloat(value)

              if(!isNaN(price)) {

                let dbItem = this.getDbItem(e.target)

                dbItem.price = price
                //更新价格
                this.props.onUpdateItem(dbItem)
              }
              console.log('price')
              e.preventDefault()

            } else {

              e.preventDefault()
            }

          } else {
            //其他属性
            // prevents ENTER
            if (e.keyCode === 13) {

              const field = this.getField(e.target)

              const value = this.getValue(e.target)

              let dbItem = this.getDbItem(e.target)

              dbItem[field] = value
              console.log('123',dbItem)
              //更新供应商等
              this.props.onUpdateItem(dbItem)

              e.preventDefault()
            }
          }
        })

      $('.scroll tbody').scroll(()=>{

        this.scroll = $('.scroll tbody').scrollTop()
      })

      $('.scroll tbody').scrollTop(this.scroll)
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getDbItem (target) {

    const id = $(target).parent()[0].id

    return find(this.props.items, {
      _id: id
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getValue (target) {

    const $label = $(target).find('label')

    if($label.length) {

      return $label.text()
    }

    return $(target).text()
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getField (target) {

    const idx = $(target).index()

    const header = $('.footable > thead > tr > th')[idx]
    //以material属性作为data-field属性值
    const field = $(header).attr('data-field')

    return field
  }
  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  //遍历item的属性，如果arr不存在该属性，就添加它
  findNewProp (item, arr) {

    let keys = Object.keys(item)
    keys.forEach((value) => {
      if (arr.indexOf(value) == -1) arr.push(value)
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  //清除标题
  deleteOld () {

    $('.footable > thead > tr > th:eq(1)').remove()
    $('.footable > thead > tr > th:eq(1)').remove()
    $('.footable > thead > tr > th:eq(1)').remove()
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  //显示新标题
  showNewProp () {

    let properties = this.showProp
    properties.forEach((value, index) => {
      let element = document.createElement('th')
      let textEle = document.createTextNode(value)
      element.className = "db-column fooEditable"
      element.setAttribute('data-hide','phone')
      element.setAttribute('data-field',value)
      //本来只有currency需要添加改属性，为了实现表格刷新时select一直可以被匹配，给所有标题项添加该属性，
      //修改了footable.editabel.js的addRows方法，对options.select[name]进行筛选。
      element.setAttribute('data-ft-control', 'select')

      // if (value == 'currency') {
      //   element.setAttribute('data-ft-control', 'select')
      // }

      element.appendChild(textEle)

      switch (index) {
        case 0:  {
          $(element).insertAfter($('.footable > thead > tr > th:eq(0)'))
          break
        }
        case 1: {
          $(element).insertAfter($('.footable > thead > tr > th:eq(1)'))
          break
        }
        case 2: {
          $(element).insertAfter($('.footable > thead > tr > th:eq(2)'))
          break
        }
        default: {
          console.log('只能改变第一到第三列')
          return
        }
      }

      this.show = true
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  //标题编辑面板
  editTittle() {

    let _this = this

    //点击确认按钮
    function confirm () {

      close()
      _this.deleteOld()
      _this.showNewProp()
      _this.refresh()
    }

    //关闭面板
    function  close () {
      _this.props.react.popViewerPanel(renderable.id)
    }

    //使用面板需要传入renderable对象，包括id,renderTitle,render，具体可看component里的Panel类
    const renderable = {
      id: 10,
      renderTitle () {
        return (<div className="materialTittle">
                  <span>编辑要展示的属性</span>
                  <button className="btn close" onClick = {close}>×</button>
                </div>)
      },
      render () {
        const listItems = _this.showProp.map((element, inde) =>
        <li key={inde} className="tittleItem">
            <label>第{inde + 2}列:</label>
            <select defaultValue={_this.showProp[inde]} onChange={function (e) {_this.showProp[inde] = e.target.value}}>
              {
                _this.properties.slice(2).map((item,index) =>
                  <option value={item} key={index}>{item}</option>
                )
              }
            </select>
        </li>
        )

        return (
          <div className="tittleEdit">
            <p>只能修改第2到第4列</p>
            <ul className="tittleList">
              {listItems}
            </ul>
            <button className="btn confirm" onClick={confirm}>确认</button>
          </div>
        )
      }
    }

    this.props.react.pushViewerPanel(renderable)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  render() {

    return (
      <div className="db-table">
        <button className="btn editTittle" onClick={this.editTittle}>修改</button>
        <table className="footable scroll">
          <thead>
            <tr>
              <th className="db-column fooId"
                data-field="material">
                <label>Material</label>
              </th>
              <th className="db-column hidden">
                _id
              </th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    )
  }
}

export default DBTable
