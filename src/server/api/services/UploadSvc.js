import BaseSvc from './BaseSvc'
import multer from 'multer'
import crypto from 'crypto'
import rimraf from 'rimraf'
import path from 'path'
import fs from 'fs'

export default class UploadSvc extends BaseSvc {

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  constructor(config) {

    super(config)

    // Initialize upload
    const storage = multer.diskStorage({

      destination: config.tempStorage,
      filename: (req, file, cb) => {
        crypto.pseudoRandomBytes(16, (err, raw) => {
          if (err) return cb(err)
          cb(null, raw.toString('hex') + path.extname(
            file.originalname))
        })
      }
    })

    this.multer = multer({storage: storage})


    //////////////////////////////////////
    //修改：增加资料管理的dataMulter
    // const uploadSvc = new UploadSvc({
    //   tempStorage: path.join(__dirname, '/../../TMP')
    // })
    // 将资料图片存储在 forge/resources/img/newDM 下，避免定时清除
    /////////////////////////////////////////
    const dataStorage = multer.diskStorage({

      destination: path.join(__dirname, '/../../../../resources/img/newDM'),
      filename: (req, file, cb) => {
        crypto.pseudoRandomBytes(16, (err, raw) => {
          if (err) return cb(err)
          cb(null, raw.toString('hex') + path.extname(
            file.originalname))
        })
      }
    })

    this.dataMulter = multer({storage: dataStorage})

    const modelStorage = multer.diskStorage({

      destination: path.join(__dirname, '/../../../../resources/models/dev'),
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      }
    })

    this.modelMulter = multer({storage: modelStorage})

    // start cleanup task to remove uploaded temp files
    setInterval(() => {
      this.clean(config.tempStorage, 60 * 60)
    }, 1000 * 60 * 60)

    setTimeout(() => {
      this.clean(config.tempStorage)
    }, 5 * 1000)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  name() {

    return 'UploadSvc'
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  get uploader () {

    return this.multer
  }


  /////////////////////////////////////////////////////////
  //
  //修改：新增资料管理的multer
  /////////////////////////////////////////////////////////
  get dataUploader () {

    return this.dataMulter
  }

  /////////////////////////////////////////////////////////
  //
  //修改：新增模型上传的multer
  /////////////////////////////////////////////////////////
  get modelUploader () {

    return this.modelMulter
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  clean (dir, maxAge = 0) {

    console.log(`Cleaning Dir: ${dir}`)

    fs.readdir(dir, (err, files) => {

      if (err) {
        return console.error(err)
      }

      files.forEach((file) => {

        const filePath = path.join(dir, file)

        fs.stat(filePath, (err, stat) => {

          if (err) {
            return console.error(err)
          }

          const now = new Date()

          const age = (now - new Date(stat.ctime)) / 1000

          if (age > maxAge) {

            return rimraf(filePath, (err) => {

              if (err) {
                return console.error(err);
              }
            })
          }
        })
      })
    })
  }
}

