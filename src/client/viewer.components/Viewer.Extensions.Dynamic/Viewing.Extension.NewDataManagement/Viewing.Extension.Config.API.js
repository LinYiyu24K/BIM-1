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
  getSequences (opts) {

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
  addSequence (user) {

    const payload = {
      user
    }

    const url = '/userdata'

    return this.ajax({
      url: url,
      method: 'POST',
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
  async getStates (sequenceId) {

    try {

      const url = `/usersData/${sequenceId}/states`

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
          //修改：将 'Content-Type': 'application/json' 改为 application/x-www-form-urlencoded
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(payload)
      })
      resolve()
    })
  }

  /////////////////////////////////////////////////////////
  //
  // 修改：新增。添加资料视点的文件上传 请求发起
  // 新增了 file 后台路由接口
  //
  /////////////////////////////////////////////////////////
  addStateFile1 (sequenceId, formData) {

    //  const payload = {
    //   file
    // }

    const url = `/api/newdm/configurator/234567890123456789012345/sequences/${sequenceId}/file`
    // const url = `usersData/${sequenceId}/file`

    console.log('这里是前端第二个处理文件的formdata：',formData)
    console.log('这里是前端第二个处理文件的file：',formData.get('file'))

    return $.ajax({
      url: url,
      type: 'POST',
      async:true,
      ContentType: false,
      processData: false,
        // 'Accept': 'application/json',
        //修改：将 'Content-Type': 'application/json' 改为 application/x-www-form-urlencoded
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: formData,
      success:function(data){
        console.log(`上传成功，addStateFile返回的数据为：${JSON.stringify(data)}`)
      },
      error:function(jqXHR,textStatus,error){
        console.log(`上传文件API发生错误 Error：${JSON.stringify(error)}`)
        throw new Error(error)
      }
    })
  }


  /////////////////////////////////////////////////////////
  //
  // 修改：上传文件的新函数
  //
  /////////////////////////////////////////////////////////
  addStateFile (sequenceId, file, opts = {}) {

    const url = `/sequences/${sequenceId}/file`

    const options = Object.assign({}, {
      tag: 'myUpload'
    }, opts)

    return super.upload (url, file, options)
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
