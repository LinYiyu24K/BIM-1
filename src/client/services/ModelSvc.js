
import ClientAPI from 'ClientAPI'
import BaseSvc from './BaseSvc'

export default class ModelSvc extends BaseSvc {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor (opts) {

    super (opts)

    this.api = new ClientAPI(this._config.apiUrl)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  name() {

    return 'ModelSvc'
  }

  /////////////////////////////////////////////////////////
  //新增：2019.4.29
  //模型上传
  /////////////////////////////////////////////////////////
  addmodel (dbName, opts = {}) {

    const url = dbName + "/amodel"

    const query =
      `?name=${opts.name || ''}` +
      `&path=${opts.path || ''}`

    return this.api.ajax (url + query)
    // return this.api.ajax(url + "/addmodel")
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getCount (dbName, opts = {}) {

    const url = `${dbName}/count`

    const query = `?search=${opts.search || ''}`

    return this.api.ajax (url + query)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getModels (dbName, opts = {}) {

    const url = dbName

    const query =
      `?limit=${opts.limit || 100}` +
      `&offset=${opts.offset || 0}` +
      `&search=${opts.search || ''}`

    return this.api.ajax (url + query)
    // return this.api.ajax(url + "/addmodel")
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getRecentModels (dbName) {

    const url = `/${dbName}/recents`

    return this.api.ajax(url)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getModel (dbName, modelId) {

    const url = `/${dbName}/${modelId}`

    return this.api.ajax(url)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getThumbnailUrl (dbName, modelId, size = 200) {

    const url = this.api.apiUrl +
      `/${dbName}/${modelId}/thumbnail` +
      `?size=${size}`

    return url
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getThumbnails (dbName, modelIds) {

    const url = `/${dbName}/thumbnails`

    return this.api.ajax({
      url: url,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(modelIds)
    })
  }

  /////////////////////////////////////////////////////////
  //新增：2019.4.30
  //模型上传接口函数
  /////////////////////////////////////////////////////////
  modelUpload (dbName, file, opts = {}) {

    const url = dbName + '/uploadmodel'

    const options = Object.assign({}, {
      tag: 'model'
    }, opts)

    return this.api.upload (url, file, options)
  }


  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  upload (dbName, file, opts = {}) {

    const url = dbName

    const options = Object.assign({}, {
      tag: 'model'
    }, opts)

    return this.api.upload (url, file, options)
  }
}
