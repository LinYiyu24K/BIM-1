import ServiceManager from './SvcManager'
import BaseSvc from './BaseSvc'
import find from 'lodash/find'
import mongo from 'mongodb'
import _ from 'lodash'

export default class ModelSvc extends BaseSvc {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor (config) {

    super (config)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  name() {

    return (this._config.name + '-ModelSvc') || 'ModelSvc'
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getById (modelId, opts = {}) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const query = Object.assign({}, opts, {
          fieldQuery: {
            _id: new mongo.ObjectId (modelId)
          }
        })

        const model = await dbSvc.findOne(
          this._config.collection, query)

        return resolve (model)

      } catch (ex) {

        return reject (ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getModel (opts = {}) {

    try {

      const dbSvc = ServiceManager.getService(
        this._config.dbName)

      return dbSvc.findOne(
        this._config.collection,
        opts)

    } catch (ex) {

      return Promise.reject (ex)
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getModels (opts = {}) {

    try {

      const dbSvc = ServiceManager.getService(
        this._config.dbName)

      return dbSvc.getItems(
        this._config.collection,
        opts)

    } catch (ex) {

      return Promise.reject (ex)
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  getThumbnails (modelIds, opts = {}) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const query = {
          fieldQuery:{
           $or: modelIds.map((id) => {
             return { _id: new mongo.ObjectId(id) }
           })
          },
          pageQuery: {
            thumbnail: 1
          }
        }

        const models = await dbSvc.getItems(
          this._config.collection,
          Object.assign({}, opts, query))

        const thumbnails = modelIds.map((id) => {

          const mongoId = new mongo.ObjectId(id)

          return find(models, { _id: mongoId }).thumbnail
        })

        return resolve (thumbnails)

      } catch (ex) {

        return reject (ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  register (modelInfo) {

    try {

      const dbSvc = ServiceManager.getService(
        this._config.dbName)

      return dbSvc.insert(
        this._config.collection,
        modelInfo)

    } catch (ex) {

      return Promise.reject (ex)
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  deleteModel (modelId) {

    try {

      const dbSvc = ServiceManager.getService(
        this._config.dbName)

      return dbSvc.removeItems(this._config.collection, {
        _id: new mongo.ObjectId(modelId)
      })

    } catch (ex) {

      return Promise.reject (ex)
    }
  }

  /////////////////////////////////////////////////////////
  // returns config sequence by Id
  //
  /////////////////////////////////////////////////////////
  getConfigSequence (modelId, sequenceId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const query = {
          fieldQuery:{
            _id: new mongo.ObjectId(modelId)
          },
          pageQuery:{
            sequences: 1
          }
        }


        const model = await dbSvc.findOne(
          this._config.collection,
          query)

        return resolve (model.sequences || [])

      } catch(ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // returns config sequences
  //
  /////////////////////////////////////////////////////////
  getConfigSequences (modelId) {

    return new Promise(async(resolve, reject) => {

      try {

      console.log("数据库操作：sequences接口的 this._config 值为: "+JSON.stringify(this._config))
      console.log("数据库操作：sequences接口的 this._config.dbName 值为: "+this._config.dbName)        


        const dbSvc = ServiceManager.getService(
          this._config.dbName)
          //////////////////////////////////////////
          //注释：fieldQuery是查询字段，符合条件的文档将会被返回
          //pageQuery用于限制返回的文档字段，有时我们不需要返回命中的文档的所有字段
          //这时候只有pageQuery中值置为1的字段才会返回
          /////////////////////////////////////////
        const query = {
          fieldQuery:{
            _id: new mongo.ObjectId(modelId)
          },
          pageQuery:{
            sequences: 1
          }
        }


        console.log(`this._config是：${JSON.stringify(this._config)}`)

        console.log(`获得视点组数据库获取的collection是：${this._config.collection}`)

        const model = await dbSvc.findOne(
          this._config.collection,
          query)
        return resolve (model.sequences || [])

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  //修改：新增方法,同 this.getConfigSequences(),获取资料管理用户视点资料
  getUserData (modelId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)
          //////////////////////////////////////////
          //注释：fieldQuery是查询字段，符合条件的文档将会被返回
          //pageQuery用于限制返回的文档字段，有时我们不需要返回命中的文档的所有字段
          //这时候只有pageQuery中值置为1的字段才会返回
          /////////////////////////////////////////
        const query = {
          fieldQuery:{
            _id: new mongo.ObjectId(modelId)
          },
          pageQuery:{
            users: 1
          }
        }

        const model = await dbSvc.findOne(
          this._config.collection,
          query)
          //修改：将model.sequences 改为 model.users
        return resolve (model.users || [])

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  ////////////////////////////////////////////////
  //注释：登陆使用
  //
  ////////////////////////////////////////////////
  postMyLogin (username) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

          console.log(`postMyLogin操作的dbName是：${this._config.dbName}>>>>>>>>>>>`)

          //////////////////////////////////////////
          //注释：fieldQuery是查询字段，符合条件的文档将会被返回
          //pageQuery用于限制返回的文档字段，有时我们不需要返回命中的文档的所有字段
          //这时候只有pageQuery中值置为1的字段才会返回
          /////////////////////////////////////////
        const query = {
          fieldQuery:{
            "username":username
          },
          pageQuery:{
            password:1
          }
        }

        const model = await dbSvc.findOne(
          this._config.collection,
          query)

        console.log(`postMyLogin成功`)


        return resolve (model || {})

      } catch (ex) {

        console.log(`postMyLogin发生错误： ${ex}`)

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // add new config sequence
  //
  /////////////////////////////////////////////////////////
  addConfigSequence (modelId, sequence) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId)
          },
          {
            $push: {
              'sequences': sequence
            }
          },
          (err) => {

            return err
              ? reject(err)
              : resolve (sequence)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // update existing config sequence
  //
  /////////////////////////////////////////////////////////
  updateConfigSequence (modelId, sequence) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId),
            'sequences.id': sequence.id
          },
          {
            $set: {
              'sequences.$.stateIds': sequence.stateIds
            }
          },
          (err) => {

            return err
              ? reject(err)
              : resolve (sequence)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // delete config sequence
  //
  /////////////////////////////////////////////////////////
  deleteConfigSequence (modelId, sequenceId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        const states =
          await this.getConfigSequenceStates (
            modelId, sequenceId)

        /////////////////////////////////////////////////////////////////////////
        // update方法
        // 第一个参数<query>： update的查询条件，类似sql update查询内where后面的
        // 第二个参数<update>：指定更新的内容，和一些更新的操作符（ $pull 删除所有指定值[在sequences中删除一项，而在states中删除 所有视点序列中的states数组中包含指定项]，$in 相当于SQL语句的in操作）。 
        // 第三个参数：multi-->可选，mongodb 默认是false,只更新找到的第一条记录，如果这个参数为true,就把按条件查出来多条记录全部更新。
        /////////////////////////////////////////////////////////////////////////
        collection.update(
          {
            '_id': new mongo.ObjectID(modelId)
          },
          { '$pull': {
              'sequences': {id: sequenceId},
              'states': {$in: states}
            }
          },
          { multi: true }, (err) => {

            return err
              ? reject(err)
              : resolve (sequenceId)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // get states from specific sequence
  //
  /////////////////////////////////////////////////////////
  getConfigSequenceStates (modelId, sequenceId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        console.log(`getConfigSequenceStates接收到的 modelId,sequenceId分别是${modelId},${sequenceId}`)
        /////////////////////////////////////////////////////////////////
        // aggregate方法：类似于SQL的count方法
        // $match：用于过滤数据，只输出符合条件的文档。$match使用MongoDB的标准查询操作。
        // $project：修改输入文档的结构。可以用来重命名、增加或删除域，也可以用于创建计算结果。也就是结果中只有三个字段：_id、states、sequences。
        // $unwind：指定一个数组字段用于分割，对每个值创建一个单独的文档。可以将sequences中的每个数据都被分解成一个文档,并且除了sequences的值不同外,其他的值都是相同的.
        //////////////////////////////////////////////////////////////////
        collection.aggregate([

          {
            $match: {
              '_id': new mongo.ObjectId(modelId)
            }
          },
          {
            $project: {
              states: 1,
              sequences: 1
            }
          },
          {
            $unwind: '$sequences'
          },
          {
            $match: {
              'sequences.id': sequenceId
            }
          },

        ], function (err, result) {

          if (err) {

            console.log(`getConfigSequenceStates发成了错误：\n${err}`)

            return reject(err)
          }

          if(!result || !result.length){

            return reject({error: 'Not Found'})
          }

          const sequence = result[0].sequences

          console.log(`getConfigSequenceStates得到 result 的sequences：\n${sequence}`)

          console.log(`getConfigSequenceStates得到 result 的sequences 的statesId是：\n${JSON.stringify(sequence.stateIds)}`)

          const stateMap = {};

          result[0].states.forEach((state) => {

            if (sequence.stateIds.indexOf(state.id) > -1){

              stateMap[state.id] = state
            }
          })

          const states = sequence.stateIds.map((id) => {
            return stateMap[id]
          })

          //注释：这个返回的states包含根据 sequenceId 得到的 sequence 中的 stateIds 中的所有 state，
          //不仅仅只有id值，还有state实体内容 ， 是一个数组
          return resolve(states)
        })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

    /////////////////////////////////////////////////////////
  // 修改：新增的函数，同 this.getConfigSequenceStates
  // 功能：根据用户获取视点组，sequenceId就是用户Id
  /////////////////////////////////////////////////////////
  getUserDataStates (modelId, sequenceId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)


        /////////////////////////////////////////////////////////////////
        // aggregate方法：类似于SQL的count方法
        // $match：用于过滤数据，只输出符合条件的文档。$match使用MongoDB的标准查询操作。
        // $project：修改输入文档的结构。可以用来重命名、增加或删除域，也可以用于创建计算结果。也就是结果中只有三个字段：_id、states、sequences。
        // $unwind：指定一个数组字段用于分割，对每个值创建一个单独的文档。可以将sequences中的每个数据都被分解成一个文档,并且除了sequences的值不同外,其他的值都是相同的.
        //////////////////////////////////////////////////////////////////
        collection.aggregate([

          {
            $match: {
              '_id': new mongo.ObjectId(modelId)
            }
          },
          {
            $project: {
              userData: 1,
              users: 1
            }
          },
          {
            $unwind: '$users'
          },
          {
            $match: {
              'users.id': sequenceId
            }
          },

        ], function (err, result) {

          if (err) {

            return reject(err)
          }

          if(!result || !result.length){

            return reject({error: 'Not Found'})
          }

          const sequence = result[0].users

          const stateMap = {};

          result[0].userData.forEach((state) => {

            if (sequence.stateIds.indexOf(state.id) > -1){

              stateMap[state.id] = state
            }
          })

          const states = sequence.stateIds.map((id) => {
            return stateMap[id]
          })

          //注释：这个返回的states包含根据 sequenceId 得到的 sequence 中的 stateIds 中的所有 state，
          //不仅仅只有id值，还有state实体内容 ， 是一个数组
          return resolve(states)
        })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // add state or array of states to specific sequence
  //
  /////////////////////////////////////////////////////////
  addConfigSequenceStates (modelId, sequenceId, states) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)
          console.log(`》》》》》》》执行到了操作数据库`)
          console.log(`》》》》》》》数据库操作的states是： ${JSON.stringify(states)}`)
        const statesArray = Array.isArray(states)
          ? states : [states]
          console.log(`》》》》》》》数据库操作数组化之后的states是： ${JSON.stringify(states)}`)
        console.log("____________________:__________:",states)


        const stateIds = statesArray.map((item) => {
          return item.id
        })

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId),
            'sequences.id': sequenceId
          },
          {
            $push: {
              'sequences.$.stateIds': {
                $each: stateIds
              },
              'states': {
                $each: statesArray
              }
            }
          }, (err) => {

            return err
              ? reject(err)
              : resolve (states)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  //
  // add state or array of states to specific sequence
  // 修改：新增的，资料管理上传文件的数据库操作逻辑
  /////////////////////////////////////////////////////////
  
  addDataSequenceFile (modelId, sequenceId, states) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)
          console.log(`》》》》》》》执行到了！！上传文件!!!的数据库`)
        console.log(`>>>>>>>数据库这里states的值是： ${JSON.stringify(states)}`)
        const statesArray = Array.isArray(states)
          ? states : [states]

        const stateIds = statesArray.map((item) => {
          return item.id
        })

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId),
            'users.id': sequenceId
          },
          {
            $push: {
              'users.$.stateIds': {
                $each: stateIds
              },
              'userData': {
                $each: statesArray
              }
            }
          }, (err) => {

            return err
              ? reject(err)
              : resolve (states)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // delete config sequence state
  //
  /////////////////////////////////////////////////////////
  deleteConfigSequenceState (modelId, sequenceId, stateId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId),
            'sequences.id': sequenceId
          },
          {
            '$pull': {
              'sequences.$.stateIds': stateId,
              'states': {id: stateId}
            }
          },
          { multi: true }, (err) => {

            return err
              ? reject(err)
              : resolve (sequenceId)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

    /////////////////////////////////////////////////////////
  // delete config sequence state
  //修改：新增函数，同 deleteConfigSequenceState
  //功能： 根据用户删除资料视点，sequenceId即用户
  /////////////////////////////////////////////////////////
  deleteUserDataState (modelId, sequenceId, stateId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId),
            'users.id': sequenceId
          },
          {
            '$pull': {
              'users.$.stateIds': stateId,
              'userData': {id: stateId}
            }
          },
          { multi: true }, (err) => {

            return err
              ? reject(err)
              : resolve (sequenceId)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // Get all meta properties for model (debug only)
  //
  /////////////////////////////////////////////////////////
  getModelMetaProperties (modelId) {

    return new Promise(async(resolve, reject)=> {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const query = {
          fieldQuery:{
            _id: new mongo.ObjectId(modelId)
          },
          pageQuery:{
            metaProperties: 1
          }
        }

        const model = await dbSvc.findOne(
          this._config.collection,
          query)

        return resolve (model.metaProperties || [])

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // Get meta properties for specific dbId
  //
  /////////////////////////////////////////////////////////
  getNodeMetaProperties (modelId, dbId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.aggregate([

          {
            $match: {
              '_id': new mongo.ObjectId(modelId)
            }
          },
          {
            $project: {
              metaProperties: 1
            }
          },
          {
            "$unwind": "$metaProperties"
          },
          {
            $match: {
              'metaProperties.dbId': dbId
            }
          },

        ], (err, result) => {

          const properties = result
            ? result.map((e) => { return e.metaProperties})
            : []

          return err
            ? reject(err)
            : resolve(properties)
        })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // Get single meta property
  //
  /////////////////////////////////////////////////////////
  getNodeMetaProperty (modelId, metaId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.aggregate([

          {
            $match: {
              '_id': new mongo.ObjectId(modelId)
            }
          },
          {
            $project: {
              metaProperties: 1
            }
          },
          {
            "$unwind": "$metaProperties"
          },
          {
            $match: {
              'metaProperties.id': metaId
            }
          },

        ], (err, result) => {

          const properties = result
            ? result.map((e) => { return e.metaProperties})
            : []

          if (err) {

            return reject(err)
          }

          if (!properties.length) {

            return reject({
              statusCode: 404,
              msg: 'Not Found'
            })
          }

          resolve(properties[0])
        })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // add meta property
  //
  /////////////////////////////////////////////////////////
  addNodeMetaProperty (modelId, metaProperty) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId)
          },
          {
            $push: {
              'metaProperties': metaProperty
            }
          }, (err) => {

            return err
              ? reject(err)
              : resolve (metaProperty)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // update existing config sequence
  //
  /////////////////////////////////////////////////////////
  updateNodeMetaProperty (modelId, metaProperty) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId),
            'metaProperties.id': metaProperty.id
          },
          {
            $set: {
              'metaProperties.$': metaProperty
            }
          }, (err) => {

            return err
              ? reject(err)
              : resolve (metaProperty)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // delete node meta property
  //
  /////////////////////////////////////////////////////////
  deleteNodeMetaProperty (modelId, metaId) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        collection.update(
          {
            '_id': new mongo.ObjectID(modelId)
          },
          {
            '$pull': {
              'metaProperties': {id: metaId}
            }
          },
          { multi: true }, (err) => {

            return err
              ? reject(err)
              : resolve (metaId)
          })

      } catch (ex) {

        return reject(ex)
      }
    })
  }

  /////////////////////////////////////////////////////////
  // search meta properties
  //
  /////////////////////////////////////////////////////////
  searchMetaProperties (modelId, searchParams) {

    return new Promise(async(resolve, reject) => {

      try {

        const dbSvc = ServiceManager.getService(
          this._config.dbName)

        const collection = await dbSvc.getCollection(
          this._config.collection)

        const text = searchParams.text

        collection.aggregate([

          {
            $match: {
              '_id': new mongo.ObjectId(modelId)
            }
          },
          {
            $project: {
              metaProperties: 1
            }
          },
          {
            "$unwind": "$metaProperties"
          },
          {
            $match: {
              'metaProperties.displayValue': {
                $regex: new RegExp(text)
              }
            }
          },

        ], (err, result) => {

          const properties = result
            ? result.map((e) => { return e.metaProperties})
            : []

          return err
            ? reject(err)
            : resolve(properties)
        })

      } catch (ex) {

        return reject(ex)
      }
    })
  }
}
