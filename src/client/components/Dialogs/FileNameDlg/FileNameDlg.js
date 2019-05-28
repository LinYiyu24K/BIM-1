import ServiceManager from 'SvcManager'
import ModelSvc from '../../../services/ModelSvc'
import ClientAPI from 'ClientAPI'
import Modal from 'react-modal'
import React from 'react'
import './FileNameDlg.scss'

export default class FileNameDlg extends React.Component {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor(props) {

    super(props)
    this.state = {
      filePath: 'resources/models/dev/'
    }
    this.handelPathChange =this.handelPathChange.bind(this)
    this.confirm = this.confirm.bind(this)
    this.getName = this.getName.bind(this)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  componentDidMount() {

    this.forgeSvc = ServiceManager.getService('ForgeSvc')
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  close () {

    this.props.close()
  }

    /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  handelPathChange (e) {
    this.setState({filePath: e.target.value})
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getName (str) {
    let arr = str.split('/')
    return arr[3]
  }

  confirm () {
    console.log(this.state.filePath)
    let path = this.state.filePath
    const api = new ClientAPI('api/models/rcdb')

    // api.ajax({
    //   url: '/amodel',
    //   method: 'GET',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   },
    //   data: `name=${this.getName(path)}&path=${path}`
    // })
    const options = {
      'name': this.getName(path),
      path
    }
    let modelsvc = new ModelSvc({apiUrl:'/api/models'})
    modelsvc.addmodel('/rcdb', options)
    this.close()
    this.setState({filePath: 'resources/models/dev/'})
  }
  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  render() {

    return (
      <div>
        <Modal className="dialog fileName"
          contentLabel=""
          isOpen={this.props.open}
          onRequestClose={() => {this.close()}}>

          <div className="title">
            <img/>
            <b>新增模型</b>
          </div>

          <div className="content ">
            <ul className="steps">
              <li className="step">
                <span className="tip">步骤一：将模型文件夹放入 “resources\models\dev”目录下</span>
              </li>
              <li className="step">
                <span className="tip">步骤二：输入模型.svf文件名和所在路径（补全下方路径的后一部分）</span>
                <input type="text" name="path" className="path" value={this.state.filePath} onChange={this.handelPathChange}></input>
              </li>
              <li className="step">
                <span className="tip">步骤三：模型已导入</span>
              </li>
            </ul>
            <div className="foot">
              <button onClick={this.confirm}>确认</button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }
}
