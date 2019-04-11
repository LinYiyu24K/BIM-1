
import ClientAPI from 'ClientAPI'
import BaseSvc from './BaseSvc'

export default class ForgeSvc extends BaseSvc {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor (config) {

    super (config)

    this.api = new ClientAPI(config.apiUrl)

    this.api.ajax('/clientId').then(
      (res) => {

        this._clientId = res.clientId
      })


  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  name() {

    return 'ForgeSvc'
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  get clientId() {

    return this._clientId
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  async login () {

    try {

      const user = await this.getUser()

      console.log('loging.....>>>>>>>>>>>')

      return user

    } catch (ex) {

      console.log('longin,/user接口错误>>>>>>>>>>>>')

      ////////////////////////////////////////////////////////////////
      //const url = await this.getLoginURL()
      //
      //window.location.assign(url)
      //return null
      /////////////////////////////////////////////////////////////////

      // 注释：登录逻辑
      // const url = window.location.href;
      
      const myUser ={
        username:'cangshu',
        password:'123'
      }
      const isSuccessLogin = await this.myLoginAPI(myUser);

      console.log(`>>>>>>>>>>>>>>>>>>>>>isSuccessLogin: ${JSON.stringify(isSuccessLogin)}`)

      if(isSuccessLogin.success == true){
        alert("cangshu已登录")
        // window.location.href = url;
        return myUser.username;
      }else{
        alert('账号密码错误！')
        return null
      }
    }
  }

  

  //注释：新增登录验证逻辑
  myLoginAPI(myUser){

    const url = "/myLogin"

    return this.api.ajax({
      contentType: 'application/json',
      data: JSON.stringify(myUser),
      dataType: 'json',
      type: 'POST',
      url
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  logout () {

    const url = '/logout'

    return this.api.ajax({
      contentType: 'application/json',
      dataType: 'json',
      type: 'POST',
      url
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getUser () {

    return new Promise((resolve, reject) => {

      this.api.ajax('/user').then((user) => {

        resolve(user)

      }, (error) => {

        reject(error)
      })
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getLoginURL () {

    const url = '/login'

    const payload = {
      origin: window.location.href
    }

    return this.api.ajax({
      contentType: 'application/json',
      data: JSON.stringify(payload),
      dataType: 'json',
      type: 'POST',
      url
    })
  }
}
