import { LinkContainer } from 'react-router-bootstrap'
import { browserHistory } from 'react-router'
import DatabaseDlg from 'Dialogs/DatabaseDlg'
import LayoutDlg from 'Dialogs/LayoutDlg'
import ThemeDlg from 'Dialogs/ThemeDlg'
import AboutDlg from 'Dialogs/AboutDlg'
import FileNameDlg from 'Dialogs/FileNameDlg'
import FileUploader from 'fileUploader'
import ServiceManager from 'SvcManager'
import PropTypes from 'prop-types'
import './AppNavbar.scss'
import React from 'react'

import DropdownButton from 'react-bootstrap/lib/DropdownButton'
import NavDropdown from 'react-bootstrap/lib/NavDropdown'
import MenuItem from 'react-bootstrap/lib/MenuItem'
import NavItem from 'react-bootstrap/lib/NavItem'
import Navbar from 'react-bootstrap/lib/Navbar'
import Button from 'react-bootstrap/lib/Button'
import Modal from 'react-bootstrap/lib/Modal'
import Nav from 'react-bootstrap/lib/Nav'
import ContentEditable from 'react-contenteditable'

import { intlShape } from 'react-intl'
import messages from 'translations/messages'

export default class AppNavbar extends React.Component {

  static contextTypes = {
    intl: intlShape
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor (props, context) {

    super(props, context)

    this.state = {
      databaseOpen: false,
      layoutOpen:   false,
      themeOpen:    false,
      aboutOpen:    false,
      menuIcons:    false,
      filenameOpen: false,
      menuIcons:    false,
      choseModel:   false,
      uploadFile:   null,
      inputFileName: false
    }

    this.forgeSvc = ServiceManager.getService(
      'ForgeSvc')

    //注释：新增引入 storagesvc 用于存储用户登录,用于 this.login
    this.storageSvc = ServiceManager.getService(
      'StorageSvc')

    //注释：新增引入 dialogSvc 用于弹窗用户登录,用于 this.myLogin
    this.dialogSvc =
      ServiceManager.getService(
        'DialogSvc')

    this.formatMessage = this.context.intl.formatMessage
    this.choseModel = this.choseModel.bind(this)
    this.onSelectFile = this.onSelectFile.bind(this)
    this.inputFileName = this.inputFileName.bind(this)


  }


  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  openDatabaseDlg () {

    this.setState(Object.assign({}, this.state, {
      databaseOpen: true
    }))
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  openLayoutDlg () {

    this.setState(Object.assign({}, this.state, {
      layoutOpen: true
    }))
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  openThemeDlg () {

    this.setState(Object.assign({}, this.state, {
      themeOpen: true
    }))
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  openAboutDlg () {

    this.setState(Object.assign({}, this.state, {
      aboutOpen: true
    }))
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  async login () {

    const { appState } = this.props

    console.log(`appState是值：>>>>>>>>>>>>>>${appState}`)

    const user = appState.user

    const sessionStorageUser = window.sessionStorage.getItem('user')

    console.log(`sessionStorageUser 的值:>>>>>>>>>${sessionStorageUser}`)

    const username = user
      ? `${user}`
      : sessionStorageUser ?`${sessionStorageUser}`:``

    console.log(`login 中最终的`)

    if (username) {

      this.props.setUser(null)

      this.forgeSvc.logout().then(() => {

        if(window.sessionStorage){

          window.sessionStorage.setItem('user','')
        }else{

          this.storageSvc.save('user',null)
        }

        console.log("退出登录之后的 stotageSvc 中的 user 的值:>>>>>>>>")
        console.log(this.storageSvc.load('user'))
        console.log("退出登录之后的 sessionStorage 中的 user 的值:>>>>>>>>")
        console.log(sessionStorage.getItem('user'))

        window.location.reload()
      })

    } else {

      await this.myLogin()

    }
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

      const state = this.state

      state[key] = e.target.value

      this.setState(state)
    }

  myLogin () {

    this.setState({
      loginUsername: '',
      loginPassword:''
    })

    const onClose = async(result) => {

      console.log(this.state.loginUsername,">>>>>>>>this.state.loginUsername")

      const state = this.state;

      const myUser = {
        username: state.loginUsername,
        password: state.loginPassword
      }

      if (result === 'OK') {

        const isSuccessLogin = await this.forgeSvc.myLoginAPI(myUser);

        console.log(`>>>>>>>>>>>>>>>>>>>>>isSuccessLogin: ${JSON.stringify(isSuccessLogin)}`)

        const user = myUser.username;

        if(isSuccessLogin.success == true){
          console.log("cangshu已登录")
          // window.location.href = url;
          // return myUser.username;

          console.log(`登录的用户名是:>>>>>>>>>>>>>>${user}`)

          this.props.setUser(user)

          if(window.sessionStorage){

            window.sessionStorage.setItem('user',user)
          }else{

            this.storageSvc.save('user',user)
          }

          window.location.reload()

          console.log(`此时 sessionStorage 中的 user 值是:>>>>>>>>>>>>>>>>>${window.sessionStorage.getItem('user')}`)

        }else{

          alert('账号密码错误！')

          this.props.setUser(null)

          if(window.sessionStorage){

            window.sessionStorage.setItem('user','')
          }else{

            this.storageSvc.save('user',null)
          }

          console.log(`此时 sessionStorage 中的 user 值是:>>>>>>>>>>>>>>>>>${window.sessionStorage.getItem('user')}`)

        }
      }

      this.dialogSvc.off('dialog.close', onClose)
    }

    this.dialogSvc.on('dialog.close', onClose)

    this.dialogSvc.setState({
      className: 'config-manager-dlg',
      title: 'Login ...',
      content:
        <div>
          <ContentEditable
            onChange={(e) => this.onInputChanged(e, 'loginUsername')}
            onKeyDown={(e) => this.onKeyDown(e)}
            data-placeholder="User name ..."
            className="sequence-name-input"
            html={''}/>
            <ContentEditable
            onChange={(e) => this.onInputChanged(e, 'loginPassword')}
            onKeyDown={(e) => this.onKeyDown(e)}
            data-placeholder="Password ..."
            className="sequence-name-input"
            html={''}/>
        </div>,
      open: true
    })
  }
  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  choseModel () {
    this.setState({choseModel: true})
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onSelectFile (file) {
    console.log('file', file)
  }

    /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  inputFileName () {
    this.setState({filenameOpen: true})
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  render() {

    const { appState } = this.props

    const {user} = appState

    const sessionStorageUser = window.sessionStorage.getItem('user')

    const username = user
      ? `${user}`
      : sessionStorageUser ?`${sessionStorageUser}`:``

      // console.log(`此时 appNavbar render中 appState 的 user 值是:>>>>>>>>>>>>>>>>>${user}`)
      // console.log(`此时 appNavbar render中 sessionStorage 的 user 值是:>>>>>>>>>>>>>>>>>${sessionStorageUser}`)
      // console.log(`此时 appNavbar render中 sessionStorage 的 user 类型是:>>>>>>>>>>>>>>>>>${sessionStorageUser}`)
      // console.log(`此时 appNavbar render中 最终填充的 的 username 值是:>>>>>>>>>>>>>>>>>${username}`)

    return appState.navbar.visible && (
    <div>

      <Navbar className="forge-rcdb-navbar">
        <Navbar.Header>
          <Navbar.Brand>
            <NavItem className="forge-rcdb-brand-item"
              href="">
              <img height="30" src="/resources/img/logos/adsk-forge.png"/>
            </NavItem>
          </Navbar.Brand>
          <Navbar.Toggle/>
        </Navbar.Header>

        <Navbar.Collapse>

          {
            appState.navbar.links.home &&

            <Nav>
              <LinkContainer to={{ pathname: '/', query: { } }}>
                <NavItem eventKey={1}>
                  <label className="nav-label">
                    &nbsp; {this.formatMessage(messages.home)}
                  </label>
                </NavItem>
              </LinkContainer>
            </Nav>
          }

          {
            appState.navbar.links.demos &&

            <Nav>
              <LinkContainer to={{ pathname: '/configurator'}}>
                <NavItem eventKey={2}>
                  <label className="nav-label">
                    &nbsp;{this.formatMessage(messages.demo)}
                  </label>
                </NavItem>
              </LinkContainer>
            </Nav>
          }

          {
            appState.navbar.links.gallery &&

            <Nav>
              <LinkContainer to={{ pathname: '/gallery', query: { } }}>
                <NavItem eventKey={3}>
                  <label className="nav-label">
                    &nbsp;{this.formatMessage(messages.gallery)}
                  </label>
                </NavItem>
              </LinkContainer>
            </Nav>
          }

          <Nav pullRight>
            {
              appState.navbar.links.choseModel &&

              <NavItem eventKey={6} onClick={() => {this.choseModel()}}>
                <label className="nav-label">
                  &nbsp; {this.formatMessage(messages.choseModel)}
                </label>
              </NavItem>
            }

            {
              appState.navbar.links.inputFileName &&

              <NavItem eventKey={6} onClick={() => {this.inputFileName()}}>
                <label className="nav-label">
                  &nbsp; {this.formatMessage(messages.inputFileName )}
                </label>
              </NavItem>
            }

            {

              appState.navbar.links.login &&

              <NavItem eventKey={4} onClick={() => {this.login()}}>
                  {
                    !appState.user &&
                    <span className="a360-logo"/>
                  }
                  {
                    appState.user &&
                    <span className="a360-logo"/>
                    // <img className="avatar" src={appState.user.profileImages.sizeX80}/>
                  }
                <label className="nav-label">
                  &nbsp; { appState.user ? username : sessionStorageUser ?sessionStorageUser:this.formatMessage(messages.login)}
                </label>
              </NavItem>
            }

            {
              appState.navbar.links.settings &&

              <NavDropdown id="settings-dropdown" eventKey={5}
                title={
                  <div className="dropdown-div">
                    <label className="nav-label">
                    &nbsp; Settings &nbsp;
                    </label>
                  </div>
                  }>
                <MenuItem eventKey={5.1} onClick={() => {
                  this.openLayoutDlg()
                }}>
                  <span className="fa fa-th-large"/>
                  &nbsp; Select layout ...
                </MenuItem>
                <MenuItem divider/>
                <MenuItem eventKey={5.2} onClick={() => {
                  this.openThemeDlg()
                }}>
                  <span className="fa fa-paint-brush">
                  </span>
                  &nbsp; Select theme ...
                </MenuItem>
              </NavDropdown>
            }

            {
              appState.navbar.links.about &&

              <NavItem eventKey={6} onClick={() => {this.openAboutDlg()}}>
                <label className="nav-label">
                  &nbsp; {this.formatMessage(messages.about)} ...
                </label>
              </NavItem>
            }
          </Nav>

          {
            false &&
            <DatabaseDlg
              close={()=> {
                this.setState(Object.assign({}, this.state, {
                  databaseOpen: false
                }))
              }}
              databaseChange={this.props.databaseChange}
              open={this.state.databaseOpen}
            />
          }

          <LayoutDlg
            close={()=>{ this.setState(Object.assign({}, this.state, {
              layoutOpen: false
            }))}}
            saveAppState={this.props.saveAppState}
            layoutChange={this.props.layoutChange}
            open={this.state.layoutOpen}
          />

          <ThemeDlg
            close={()=>{ this.setState(Object.assign({}, this.state, {
              themeOpen: false
            }))}}
            saveAppState={this.props.saveAppState}
            themeChange={this.props.themeChange}
            open={this.state.themeOpen}
          />

          <AboutDlg
            close={()=>{ this.setState(Object.assign({}, this.state, {
              aboutOpen: false
            }))}}
            open={this.state.aboutOpen}
          />

        </Navbar.Collapse>
      </Navbar>

      {
        this.state.choseModel &&
        <FileUploader close={()=> {
          this.setState(Object.assign({}, this.state, {
            choseModel: false
          }))
        }}
        />
      }

      {
        <FileNameDlg
          close={()=> {
            this.setState(Object.assign({}, this.state, {
              filenameOpen: false
            }))
          }}
          open={this.state.filenameOpen}
        />
      }

    </div>
    )
  }
}
