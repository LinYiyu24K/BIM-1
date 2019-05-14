////////////////////////////////////////////////////////////////
// NewDataManagement API
//
/////////////////////////////////////////////////////////////////
import sortBy from 'lodash/sortBy'
import ClientAPI from 'ClientAPI'

export default class ConfigAPI extends ClientAPI {

  /////////////////////////////////////////////////////////
  // Class constructor
  //
  /////////////////////////////////////////////////////////
  constructor (apiUrl) {

    super (apiUrl)
  }

  /////////////////////////////////////////////////////////
  //
  // 注释：获取所有视点队列（组）sequences
  // 更改：改为 获取所有用户的存有数据的视点组
  /////////////////////////////////////////////////////////
  getUsers (opts) {

    return new Promise ((resolve, reject) => {

      const url = '/usersData'

      this.ajax(url).then ((sequences) => {
        //修改：这里的seq.name 改为 seq.username
        const result = opts.sortByName
          ? sortBy(sequences, (seq) => { return seq.username })
          : sequences

        resolve (result)

      }, (error) => reject(error))
    })
  }

  /////////////////////////////////////////////////////////
  //
  // 注释：这个功能应该需要改动，addSequence类似增加用户
  //
  /////////////////////////////////////////////////////////
  addUser (user) {

    return new Promise((resolve,reject) => {
    const payload = {
      user
    }

    const url = '/usersdata'

    this.ajax({
      url: url,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(payload)
    }).then((result)=>{

      resolve(result)

    }, (error)=>reject(error))
    })

  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  updateSequence (sequence) {

    const payload = {
      sequence
    }

    const url = '/sequences'

    return this.ajax({
      url: url,
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(payload)
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  deleteSequence (sequenceId) {

    const url = `/sequences/${sequenceId}`

    return this.ajax({
      url: url,
      method: 'DELETE'
    })
  }

  /////////////////////////////////////////////////////////
  //
  // 注释：这里的sequenceId应该是userId
  // * 返回的 res 是根据 sequenceId 指定的视点组 sequence 中的 statesId 中所有视点得具体信息组合得数组
  /////////////////////////////////////////////////////////
  async getStates (userId) {

    try {

      const url = `/usersData/${userId}/states`

      const res = await this.ajax(url)

      return res

    } catch (ex) {

      return []
    }
  }

  /////////////////////////////////////////////////////////
  //
  // 注释：添加资料视点的 ajax 请求发起
  //
  /////////////////////////////////////////////////////////
  addState (sequenceId, state) {

    const payload = {
      state
    }

    const url = `/sequences/${sequenceId}/states`
    // const url = `/usersData/${sequenceId}/states`

    return new Promise(async(resolve,reject)=>{
      await this.ajax({
        url: url,
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(payload)
      })
      resolve()
    })
  }

  /////////////////////////////////////////////////////////
  //
  // 新增。添加资料视点的文件上传 请求发起
  // 多文件上传，使用 formData 技术上传
  //
  /////////////////////////////////////////////////////////
  addStateFiles (sequenceId, formData) {

    const payload = {
      formData
    }

    const url = `/sequences/${sequenceId}/file`

    return this.ajax({
        url,
        method:"POST",
        data:JSON.stringify(payload),
        processData:false,
        cache:false,
        "Content-Type": false
    })
  }


  /////////////////////////////////////////////////////////
  //
  // 修改：上传文件的新函数,使用 super.upload 函数上传
  //
  /////////////////////////////////////////////////////////
  addStateFile (userId, files, opts = {}) {

    const url = `/usersData/${userId}/file`

    /*const options = Object.assign({}, {
      keys: keys.toString()
    }, opts)*/

    return super.myUpload (url, files, opts)

  }




  /////////////////////////////////////////////////////////
  //
  //修改：将 /sequences/${}.../  改为 /usersData/${}.../
  /////////////////////////////////////////////////////////
  deleteState (sequenceId, stateId) {

    const url = `/usersData/${sequenceId}/states/${stateId}`

    return this.ajax({
      url: url,
      method: 'DELETE'
    })
  }


  /////////////////////////////////////////////////////////
  //
  // 修改：获取视点关联的图片
  //
  /////////////////////////////////////////////////////////
  async getData (sequenceId, stateId) {

    try {

      const url = `/usersData/${sequenceId}/states/${stateId}`

      const res = await this.ajax(url)
      // console.log(res)

      return res

    } catch (ex) {

      return []
    }

  }


}
