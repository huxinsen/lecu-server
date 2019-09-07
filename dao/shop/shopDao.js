const mysql = require('mysql')
const path = require('path')
const fs = require('fs')
const $conf = require('../../conf/config')
const $sql = require('../shop/shopSqlMapping')
const verify = require('../../utils/verify')
const { jsonError, jsonSysError, fieldErrThrow } = require('../../utils/error')

// 使用连接池，提升性能
const pool = mysql.createPool($conf.mysql)

module.exports = {
  /**
   * @api {post} /shops Add a Shop
   * @apiVersion 0.1.0
   * @apiGroup Shop
   * @apiName PostShops
   * @apiPermission owner
   * @apiDescription 添加商店
   *
   * @apiParam {string} owner 商家
   * @apiParam {string} name 商店名称
   * @apiParam {string} [startTime] 营业开始时间
   * @apiParam {string} [endTime] 营业结束时间
   * @apiParam {string} address 地址
   * @apiParam {number} lat 纬度
   * @apiParam {number} lng 经度
   * @apiParam {string} tel 电话
   * @apiParam {string} legalRepr 法人代表
   * @apiParam {string} idNumber 法人身份证号
   * @apiParam {string} shopImg 商店图片
   * @apiParam {string} withIdFrontImg 法人手持身份证正面照
   * @apiParam {string} withIdBackImg 法人手持身份证背面照
   * @apiParam {string} licenseImg 营业执照
   * @apiParam {string} [notice] 告示栏
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "申请成功，系统将在三个工作日内审核您的信息！"
   *     }
   */
  addShop(req, res) {
    try {
      let owner = req.body.owner
      let name = req.body.name
      let time =
        req.body.startTime && req.body.endTime
          ? req.body.startTime + '/' + req.body.endTime
          : req.body.startTime
          ? req.body.startTime + '/20:30'
          : req.body.endTime
          ? '8:30/' + req.body.endTime
          : '8:30/20:30'
      let address = req.body.address
      let lat = req.body.lat
      let lng = req.body.lng
      let tel = req.body.tel
      let legalRepr = req.body.legalRepr
      let idNumber = req.body.idNumber
      let shopImg = req.body.shopImg
      let withIdFrontImg = req.body.withIdFrontImg
      let withIdBackImg = req.body.withIdBackImg
      let licenseImg = req.body.licenseImg
      let notice = req.body.notice ? req.body.notice : ''

      if (!owner) {
        fieldErrThrow(res, 'owner')
      }

      verify.verifyOwner(req, res, owner)

      if (!name) {
        fieldErrThrow(res, 'name')
      }
      if (!address) {
        fieldErrThrow(res, 'address')
      }
      if (!lat) {
        fieldErrThrow(res, 'lat')
      }
      if (!lng) {
        fieldErrThrow(res, 'lng')
      }
      if (!tel) {
        fieldErrThrow(res, 'tel')
      }
      if (!legalRepr) {
        fieldErrThrow(res, 'legalRepr')
      }
      if (!idNumber) {
        fieldErrThrow(res, 'idNumber')
      }
      if (!shopImg) {
        fieldErrThrow(res, 'shopImg')
      }
      if (!withIdFrontImg) {
        fieldErrThrow(res, 'withIdFrontImg')
      }
      if (!withIdBackImg) {
        fieldErrThrow(res, 'withIdBackImg')
      }
      if (!licenseImg) {
        fieldErrThrow(res, 'licenseImg')
      }
      // 将图片从临时文件夹移动到指定文件夹
      let uploadDir = path.join(__dirname, '../../public/tmp')
      let targetDir = path.join(__dirname, '../../public/upload')
      let imgs = [shopImg, withIdFrontImg, withIdBackImg, licenseImg]
      imgs.forEach(img => {
        let filePath = uploadDir + '/' + img
        let newPath = targetDir + '/' + img
        // 移动文件
        if (fs.existsSync(filePath)) {
          fs.renameSync(filePath, newPath)
        } else {
          return jsonSysError(res, 'Image upload failed')
        }
      })
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(
          $sql.insertShop,
          [
            owner,
            name,
            time,
            address,
            lat,
            lng,
            tel,
            legalRepr,
            idNumber,
            shopImg,
            withIdFrontImg,
            withIdBackImg,
            licenseImg,
            notice,
          ],
          (err, result) => {
            connection.release()
            if (err) return jsonSysError(res, err)
            if (result.affectedRows !== 1) {
              return res.json({
                success: false,
                message: '添加失败，请重试！',
              })
            } else {
              return res.json({
                success: true,
                message: '申请成功，系统将在三个工作日内审核您的信息！',
              })
            }
          },
        )
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {get} /shops Get list of Shops
   * @apiVersion 0.1.0
   * @apiGroup Shop
   * @apiName GetShops
   * @apiDescription 获取商店列表
   *
   * @apiParam {string} type 获取类型：search, toCheck, full, lite, checking, toBeChecked
   * @apiParam (search) {number} lat 纬度
   * @apiParam (search) {number} lng 经度
   * @apiParam (search) {string} keywords 关键字
   * @apiParam (full, lite, checking, toBeChecked) {string} owner 商家
   *
   * @apiSuccess {object[]} shops 商店列表
   */
  // 用户获取商店列表
  getShopsUser(req, res) {
    try {
      let lat = req.query.lat
      let lng = req.query.lng
      let keywords = req.query.keywords

      if (req.query.type !== 'search') {
        return jsonSysError(res, 'SystemError')
      }
      if (!lat) {
        fieldErrThrow(res, 'lat')
      }
      if (!lng) {
        fieldErrThrow(res, 'lng')
      }
      if (!keywords) {
        fieldErrThrow(res, 'keywords')
      }

      let likeParam = '%' + keywords + '%'
      let dist = 10
      //dist 代表搜索范围，单位km
      let range = ((180 / Math.PI) * dist) / 6372.797
      let lngR = range / Math.cos((lat * Math.PI) / 180.0)
      let maxLat = Number(lat) + Number(range)
      let minLat = Number(lat) - Number(range)
      let maxLng = Number(lng) + Number(lngR)
      let minLng = Number(lng) - Number(lngR)
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(
          $sql.getShopsSearch,
          [minLat, maxLat, minLng, maxLng, keywords, likeParam],
          (err, shops) => {
            connection.release()
            if (err) return jsonSysError(res, err)
            return res.json(shops)
          },
        )
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  // 管理员获取商店列表
  getShopsAdmin(req, res) {
    try {
      if (req.query.type !== 'toCheck') {
        return jsonSysError(res, 'SystemError')
      }
      verify.verifyAdmin(req, res)
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query($sql.getShopsToCheck, (err, shops) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          return res.json(shops)
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  // 商家获取商店列表
  getShopsOwner(req, res) {
    try {
      let owner = req.query.owner
      let sql
      switch (req.query.type) {
        case 'full': {
          sql = $sql.getShopsFull
          break
        }
        case 'lite': {
          sql = $sql.getShopsLite
          break
        }
        case 'checking': {
          sql = $sql.getShopsChecking
          break
        }
        case 'toBeChecked': {
          sql = $sql.getShopsToBeChecked
          break
        }
        default: {
          return jsonSysError(res, 'SystemError')
        }
      }
      if (!owner) {
        fieldErrThrow(res, 'owner')
      }

      verify.verifyOwner(req, res, owner)
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(sql, [owner], (err, shops) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          return res.json(shops)
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {put} /shops/:sid Update data of a Shop
   * @apiVersion 0.1.0
   * @apiGroup Shop
   * @apiName PutShopsSid
   * @apiPermission owner, admin
   * @apiDescription 更新商店信息
   *
   * @apiParam {number} sid 商店ID
   * @apiParam {string} type 更新类型：update, alter, manage
   *
   * @apiParam (update) {string} name 商店名称
   * @apiParam (update) {string} address 地址
   * @apiParam (update) {number} lat 纬度
   * @apiParam (update) {number} lng 经度
   * @apiParam (update) {string} [notice] 告示栏
   * @apiParam (update) {string} tel 电话
   * @apiParam (update) {string} [startTime] 营业开始时间
   * @apiParam (update) {string} [endTime] 营业结束时间
   * @apiParam (update) {string} shopImg 商店图片
   * @apiParam (update) {string} [preImg] 原商店图片
   *
   * @apiParam (alter) {string} name 商店名称
   * @apiParam (alter) {string} address 地址
   * @apiParam (alter) {number} lat 纬度
   * @apiParam (alter) {number} lng 经度
   * @apiParam (alter) {string} [notice] 告示栏
   * @apiParam (alter) {string} tel 电话
   * @apiParam (alter) {string} [startTime] 营业开始时间
   * @apiParam (alter) {string} [endTime] 营业结束时间
   * @apiParam (alter) {string} shopImg 商店图片
   * @apiParam (alter) {string} [preImg] 原商店图片
   * @apiParam (alter) {string} legalRepr 法人代表
   * @apiParam (alter) {string} idNumber 法人身份证号
   * @apiParam (alter) {string} withIdFrontImg 法人手持身份证正面照
   * @apiParam (alter) {string} [preIdFrontImg] 原法人手持身份证正面照
   * @apiParam (alter) {string} withIdBackImg 法人手持身份证背面照
   * @apiParam (alter) {string} [preIdBackImg] 原法人手持身份证背面照
   * @apiParam (alter) {string} licenseImg 营业执照
   * @apiParam (alter) {string} [preLicenseImg] 原营业执照
   *
   * @apiParam (manage) {string} op 审核操作
   * @apiParam (manage) {string} [checkMsg] 审核意见
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "修改成功！"
   *     }
   *
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "申请提交成功，请耐心等待审核结果！"
   *     }
   *
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "操作成功！"
   *     }
   */
  // 商家更新（修改）商店（申请）信息
  updateShopOwner(req, res) {
    try {
      let type = req.body.type
      let shopId = req.params.sid
      let name = req.body.name
      let address = req.body.address
      let lat = req.body.lat
      let lng = req.body.lng
      let notice = req.body.notice
      let tel = req.body.tel
      let startTime = req.body.startTime
      let endTime = req.body.endTime
      let shopImg = req.body.shopImg
      let preImg = req.body.preImg ? req.body.preImg : ''
      let time =
        startTime && endTime
          ? startTime + '/' + endTime
          : startTime
          ? startTime + '/20:30'
          : endTime
          ? '8:30/' + endTime
          : '8:30/20:30'

      verify.verifyOwnerShop(req, res, shopId)

      if (!name) {
        fieldErrThrow(res, 'name')
      }
      if (!address) {
        fieldErrThrow(res, 'address')
      }
      if (!lat) {
        fieldErrThrow(res, 'lat')
      }
      if (!lng) {
        fieldErrThrow(res, 'lng')
      }
      if (!tel) {
        fieldErrThrow(res, 'tel')
      }
      if (!shopImg) {
        fieldErrThrow(res, 'shopImg')
      }

      let params = [name, address, lng, lat, notice, tel, time, shopImg]
      let sql
      // 如果是店铺申请修改
      let legalRepr
      let idNumber
      let withIdFrontImg
      let preFrontImg
      let withIdBackImg
      let preBackImg
      let licenseImg
      let preLicenseImg
      switch (type) {
        case 'alter': {
          legalRepr = req.body.legalRepr
          idNumber = req.body.idNumber
          withIdFrontImg = req.body.withIdFrontImg
          preFrontImg = req.body.preFrontImg
          withIdBackImg = req.body.withIdBackImg
          preBackImg = req.body.preBackImg
          licenseImg = req.body.licenseImg
          preLicenseImg = req.body.preLicenseImg
          if (!legalRepr) {
            fieldErrThrow(res, 'legalRepr')
          }
          if (!idNumber) {
            fieldErrThrow(res, 'idNumber')
          }
          if (!withIdFrontImg) {
            fieldErrThrow(res, 'withIdFrontImg')
          }
          if (!withIdBackImg) {
            fieldErrThrow(res, 'withIdBackImg')
          }
          if (!licenseImg) {
            fieldErrThrow(res, 'licenseImg')
          }
          params = [
            ...params,
            legalRepr,
            idNumber,
            withIdFrontImg,
            withIdBackImg,
            licenseImg,
            shopId,
          ]
          sql = $sql.alterShop
          break
        }
        case 'update': {
          params = [...params, shopId]
          sql = $sql.updateShop
          break
        }
        default: {
          return jsonSysError(res, 'SystemError')
        }
      }
      // 图片处理
      let photos = [
        {
          pic: shopImg,
          prePic: preImg,
        },
        {
          pic: withIdFrontImg,
          prePic: preFrontImg,
        },
        {
          pic: withIdBackImg,
          prePic: preBackImg,
        },
        {
          pic: licenseImg,
          prePic: preLicenseImg,
        },
      ]
      let uploadDir = path.join(__dirname, '../../public/tmp')
      let targetDir = path.join(__dirname, '../../public/upload')
      photos.forEach(photo => {
        let prePic = photo.prePic
        let pic = photo.pic
        let filePath = uploadDir + '/' + pic
        let newPath = targetDir + '/' + pic
        if (prePic && pic) {
          // 移动文件
          if (fs.existsSync(filePath)) {
            fs.renameSync(filePath, newPath)
          }
          let prePicPath = targetDir + '/' + prePic
          // 删除之前图片
          if (fs.existsSync(prePicPath)) {
            fs.unlinkSync(prePicPath)
          }
        } else if (pic) {
          // 移动文件
          if (fs.existsSync(filePath)) {
            fs.renameSync(filePath, newPath)
          }
        }
      })
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(sql, params, (err, result) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          if (result.changedRows == 1) {
            return res.json({
              success: true,
              message:
                type === 'alter'
                  ? '申请提交成功，请耐心等待审核结果！'
                  : '修改成功！',
            })
          } else {
            return res.json({
              success: false,
              message: type === 'alter' ? '申请提交失败' : '修改失败！',
            })
          }
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  // 管理员审核管理商铺信息
  updateShopAdmin(req, res) {
    try {
      let shopId = req.params.sid
      let op = req.body.op
      let checkMsg = req.body.checkMsg

      if (req.body.type !== 'manage') {
        return jsonSysError(res, 'SystemError')
      }

      verify.verifyAdmin(req, res)

      if (!shopId) {
        fieldErrThrow(res, 'shopId')
      }
      if (!op) {
        fieldErrThrow(res, 'op')
      }
      let sql
      switch (op) {
        case 'pass': {
          sql = $sql.adminPassShop
          break
        }
        case 'reject': {
          sql = $sql.adminRejectShop
          break
        }
        case 'down': {
          sql = $sql.adminDownShop
          break
        }
        default: {
          return jsonSysError(res, 'SystemError')
        }
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(sql, [checkMsg, shopId], (err, result) => {
          connection.release()
          if (err) console.log(err)
          if (err) return jsonSysError(res, err)
          if (result.changedRows == 1) {
            return res.json({
              success: true,
              message: '操作成功！',
            })
          } else {
            return res.json({
              success: false,
              message: '操作失败！',
            })
          }
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {get} /shops/:sid Get data of a Shop
   * @apiVersion 0.1.0
   * @apiGroup Shop
   * @apiName GetShopsSid
   * @apiDescription 获取商店信息
   *
   * @apiParam {string} sid 商店ID
   * @apiParam {string} type 获取类型：full, lite
   *
   * @apiSuccess (full) {number} shopId 商家ID
   * @apiSuccess (full) {string} owner 商家
   * @apiSuccess (full) {string} name 商店名称
   * @apiSuccess (full) {string} time 营业时间
   * @apiSuccess (full) {string} address 商店地址
   * @apiSuccess (full) {number} lat 纬度
   * @apiSuccess (full) {number} lng 经度
   * @apiSuccess (full) {string} tel 电话
   * @apiSuccess (full) {string} legalRepr 法人代表
   * @apiSuccess (full) {string} idNumber 法人身份证号
   * @apiSuccess (full) {string} shopImg 商店图片
   * @apiSuccess (full) {string} withIdFrontImg 法人手持身份证正面照
   * @apiSuccess (full) {string} withIdBackImg 法人手持身份证背面照
   * @apiSuccess (full) {string} licenseImg 营业执照
   * @apiSuccess (full) {string} notice 告示栏
   * @apiSuccess (full) {number} shopState 商店状态
   * @apiSuccess (full) {number} toBeChecked 待审核标志
   * @apiSuccess (full) {string} checkMsg 审核意见
   *
   * @apiSuccess (lite) {number} shopId 商家ID
   * @apiSuccess (lite) {string} name 商店名称
   * @apiSuccess (lite) {string} address 商店地址
   * @apiSuccess (lite) {string} notice 告示栏
   * @apiSuccess (lite) {string} tel 电话
   * @apiSuccess (lite) {string} time 营业时间
   * @apiSuccess (lite) {string} shopImg 商店图片
   */
  getShop(req, res) {
    try {
      let shopId = req.params.sid
      let sql
      switch (req.query.type) {
        case 'full': {
          sql = $sql.getShopFull
          break
        }
        case 'lite': {
          sql = $sql.getShopLite
          break
        }
        default: {
          fieldErrThrow(res, 'right type')
        }
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(sql, [shopId], (err, shops) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          if (shops.length == 0) {
            return res.json({
              success: false,
              message: '未找到商店！',
            })
          }
          return res.json(shops[0])
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {get} /shops/:sid/classes Get classes of a Shop
   * @apiVersion 0.1.0
   * @apiGroup Shop
   * @apiName GetShopsSC
   * @apiDescription 获取商店商品分类
   *
   * @apiParam {number} shopId 商店ID
   * @apiParam {string} type 获取类型: owner, user
   *
   * @apiSuccess {object[]} classes 分类列表
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     [
   *       {
   *         "class": "披萨"
   *       },
   *       {
   *         "class": "套餐"
   *       }
   *     ]
   */
  getClasses(req, res) {
    try {
      let shopId = req.params.sid
      let sql
      switch (req.query.type) {
        case 'owner': {
          sql = $sql.getClassesOwner
          break
        }
        case 'user': {
          sql = $sql.getClassesUser
          break
        }
        default: {
          fieldErrThrow(res, 'right type')
        }
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(sql, [shopId], (err, classes) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          return res.json(classes)
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
}
