const mysql = require('mysql')
const $conf = require('../../conf/config')
const $sql = require('../commodity/cmdtSqlMapping')
const verify = require('../../utils/verify')
const { jsonError, jsonSysError, fieldErrThrow } = require('../../utils/error')
const { filterSocketIds } = require('../../utils/socket')

const path = require('path')
const fs = require('fs')
// 使用连接池，提升性能
const pool = mysql.createPool($conf.mysql)

module.exports = {
  /**
   * @api {post} /commodities Add a Commodity
   * @apiVersion 0.1.0
   * @apiGroup Commodity
   * @apiName PostCommodities
   * @apiPermission owner
   * @apiDescription 添加商品
   *
   * @apiParam {number} shopId 商店ID
   * @apiParam {string} name 商店名称
   * @apiParam {string} classValue 商品分类
   * @apiParam {string} [originalPrice] 原价
   * @apiParam {number} price 现价
   * @apiParam {string} details 商品详情
   * @apiParam {string} promotionInfo 促销信息
   * @apiParam {string} pic1 图片1
   * @apiParam {string} [pic2] 图片2
   * @apiParam {string} [pic3] 图片3
   * @apiParam {string} [pic4] 图片4
   * @apiParam {string} [pic5] 图片5
   * @apiParam {string} startTime 促销开始时间
   * @apiParam {string} endTime 促销结束时间
   * @apiParam {number} lat 纬度
   * @apiParam {number} lng 经度
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "添加成功！"
   *     }
   */
  addCommodity(req, res) {
    try {
      let shopId = req.body.shopId
      let name = req.body.name
      let classValue = req.body.classValue
      let originalPrice = req.body.originalPrice ? req.body.originalPrice : null
      let price = req.body.price
      let details = req.body.details
      let promotionInfo = req.body.promotionInfo
      let pic1 = req.body.pic1
      let pic2 = req.body.pic2
      let pic3 = req.body.pic3
      let pic4 = req.body.pic4
      let pic5 = req.body.pic5
      let startTime = req.body.startTime
      let endTime = req.body.endTime
      let lat = req.body.lat
      let lng = req.body.lng

      if (!shopId) {
        fieldErrThrow(res, 'shopId')
      }

      verify.verifyOwnerShop(req, res, shopId)

      if (!name) {
        fieldErrThrow(res, 'name')
      }
      if (!classValue) {
        fieldErrThrow(res, 'classValue')
      }
      if (!price) {
        fieldErrThrow(res, 'price')
      }
      if (!details) {
        fieldErrThrow(res, 'details')
      }
      if (!promotionInfo) {
        fieldErrThrow(res, 'promotionInfo')
      }
      if (!pic1) {
        fieldErrThrow(res, 'pic1')
      }
      if (!startTime) {
        fieldErrThrow(res, 'startTime')
      }
      if (!endTime) {
        fieldErrThrow(res, 'endTime')
      }
      // 将图片从临时文件夹移动到指定文件夹
      let uploadDir = path.join(__dirname, '../../public/tmp')
      let targetDir = path.join(__dirname, '../../public/upload')
      let imgs = [pic1, pic2, pic3, pic4, pic5]
      imgs.forEach(img => {
        if (img && img !== '') {
          let filePath = uploadDir + '/' + img
          let newPath = targetDir + '/' + img
          // 移动文件
          fs.renameSync(filePath, newPath)
        }
      })
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(
          $sql.insertCommodity,
          [
            shopId,
            name,
            classValue,
            originalPrice,
            price,
            details,
            promotionInfo,
            pic1,
            pic2,
            pic3,
            pic4,
            pic5,
            startTime,
            endTime,
          ],
          (err, result) => {
            connection.release()
            if (err || result.affectedRows !== 1) {
              if (err) return jsonSysError(res, err)
              return res.json({
                success: false,
                message: '添加失败！',
              })
            } else {
              // 当前时间处于商品活动时间范围内
              if (
                new Date().getTime() > Date.parse(startTime) &&
                new Date().getTime() < Date.parse(endTime)
              ) {
                let id = result.insertId
                // 向周围用户推送
                let usersNearby = filterSocketIds(global.users, { lat, lng })
                originalPrice = originalPrice ? originalPrice : ''
                usersNearby.forEach(user => {
                  global.io.to(user.socketId).emit('new_commodity', {
                    id,
                    name,
                    pic1,
                    price,
                    originalPrice,
                  })
                })
              }
              return res.json({
                success: true,
                message: '添加成功！',
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
   * @api {get} /commodities Get list of Commodities
   * @apiVersion 0.1.0
   * @apiGroup Commodity
   * @apiName GetCommodities
   * @apiDescription 获取商品列表
   *
   * @apiParam {string} type 获取类型：owner, admin, nearby, search
   *
   * @apiParam (owner) {string} owner 商家
   *
   * @apiParam (admin) {number} shopId 商店ID
   *
   * @apiParam (nearby) {number} lat 纬度
   * @apiParam (nearby) {number} lng 经度
   *
   * @apiParam (search) {number} lat 纬度
   * @apiParam (search) {number} lng 经度
   * @apiParam (search) {string} keywords 关键字
   *
   * @apiSuccess {object[]} commodities 商品列表
   */
  // 商家获取商品
  getCommoditiesOwner(req, res) {
    try {
      let owner = req.query.owner

      if (req.query.type !== 'owner') {
        return jsonSysError(res, 'SystemError')
      }
      if (!owner) {
        fieldErrThrow(res, 'owner')
      }

      verify.verifyOwner(req, res, owner)

      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(
          $sql.getCommoditiesOwner,
          [owner],
          (err, commodities) => {
            connection.release()
            if (err) return jsonSysError(res, err)
            return res.json(commodities)
          },
        )
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  // 管理员获取商品
  getCommoditiesAdmin(req, res) {
    try {
      let shopId = req.query.shopId

      if (req.query.type !== 'admin') {
        return jsonSysError(res, 'SystemError')
      }

      verify.verifyAdmin(req, res)

      if (!shopId) {
        fieldErrThrow(res, 'shopId')
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(
          $sql.getCommoditiesAdmin,
          [shopId],
          (err, commodities) => {
            connection.release()
            if (err) return jsonSysError(res, err)
            return res.json(commodities)
          },
        )
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  // 用户获取（搜索）附近商品
  getCommoditiesUser(req, res) {
    try {
      let lat = req.query.lat
      let lng = req.query.lng
      let keywords = req.query.keywords
      let sql
      let dist
      switch (req.query.type) {
        case 'nearby': {
          sql = $sql.getCommoditiesNearby
          dist = 5
          break
        }
        case 'search': {
          sql = $sql.getCommoditiesSearch
          dist = 10
          if (!keywords) {
            fieldErrThrow(res, 'keywords')
          }
          break
        }
        default: {
          return jsonSysError(res, 'SystemError')
        }
      }
      if (!lat) {
        fieldErrThrow(res, 'lat')
      }
      if (!lng) {
        fieldErrThrow(res, 'lng')
      }

      //里面的 dist 就代表搜索范围，单位km
      let range = ((180 / Math.PI) * dist) / 6372.797
      let lngR = range / Math.cos((lat * Math.PI) / 180.0)
      let maxLat = Number(lat) + Number(range)
      let minLat = Number(lat) - Number(range)
      let maxLng = Number(lng) + Number(lngR)
      let minLng = Number(lng) - Number(lngR)
      let params = [minLat, maxLat, minLng, maxLng]
      if (req.query.type === 'search') {
        let likeParam = '%' + keywords + '%'
        params = [minLat, maxLat, minLng, maxLng, keywords, likeParam]
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(sql, params, (err, commodities) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          return res.json(commodities)
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {put} /commodities/:cid Update data of a Commodity
   * @apiVersion 0.1.0
   * @apiGroup Commodity
   * @apiName PutCommodiesCid
   * @apiPermission owner
   * @apiDescription 更新商品信息
   *
   * @apiParam {number} shopId 商店ID
   * @apiParam {number} cid 商品ID
   * @apiParam {string} name 商品名称
   * @apiParam {string} classValue 商品分类
   * @apiParam {string} [originalPrice] 原价
   * @apiParam {number} price 现价
   * @apiParam {string} details 商品详情
   * @apiParam {string} promotionInfo 促销信息
   * @apiParam {string} pic1 图片1
   * @apiParam {string} [pic2] 图片2
   * @apiParam {string} [pic3] 图片3
   * @apiParam {string} [pic4] 图片4
   * @apiParam {string} [pic5] 图片5
   * @apiParam {string} [prePic1] 原图片1
   * @apiParam {string} [prePic2] 原图片2
   * @apiParam {string} [prePic3] 原图片3
   * @apiParam {string} [prePic4] 原图片4
   * @apiParam {string} [prePic5] 原图片5
   * @apiParam {string} startTime 促销开始时间
   * @apiParam {string} endTime 促销结束时间
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "修改成功！"
   *     }
   */
  updateCommodity(req, res) {
    try {
      let shopId = req.body.shopId
      let id = req.params.cid
      let name = req.body.name
      let classValue = req.body.classValue
      let originalPrice = req.body.originalPrice ? req.body.originalPrice : null
      let price = req.body.price
      let details = req.body.details
      let promotionInfo = req.body.promotionInfo
      let pic1 = req.body.pic1
      let pic2 = req.body.pic2
      let pic3 = req.body.pic3
      let pic4 = req.body.pic4
      let pic5 = req.body.pic5
      let prePic1 = req.body.prePic1 ? req.body.prePic1 : ''
      let prePic2 = req.body.prePic2 ? req.body.prePic2 : ''
      let prePic3 = req.body.prePic3 ? req.body.prePic3 : ''
      let prePic4 = req.body.prePic4 ? req.body.prePic4 : ''
      let prePic5 = req.body.prePic5 ? req.body.prePic5 : ''
      let startTime = req.body.startTime
      let endTime = req.body.endTime

      if (!shopId) {
        fieldErrThrow(res, 'shopId')
      }

      verify.verifyOwnerShop(req, res, shopId)

      if (!name) {
        fieldErrThrow(res, 'name')
      }
      if (!classValue) {
        fieldErrThrow(res, 'classValue')
      }
      if (!price) {
        fieldErrThrow(res, 'price')
      }
      if (!details) {
        fieldErrThrow(res, 'details')
      }
      if (!promotionInfo) {
        fieldErrThrow(res, 'promotionInfo')
      }
      if (!pic1) {
        fieldErrThrow(res, 'pic1')
      }
      if (!startTime) {
        fieldErrThrow(res, 'startTime')
      }
      if (!endTime) {
        fieldErrThrow(res, 'endTime')
      }

      let photos = [
        {
          pic: pic1,
          prePic: prePic1,
        },
        {
          pic: pic2,
          prePic: prePic2,
        },
        {
          pic: pic3,
          prePic: prePic3,
        },
        {
          pic: pic4,
          prePic: prePic4,
        },
        {
          pic: pic5,
          prePic: prePic5,
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
        connection.query(
          $sql.updateCommodity,
          [
            name,
            classValue,
            originalPrice,
            price,
            details,
            promotionInfo,
            pic1,
            pic2,
            pic3,
            pic4,
            pic5,
            startTime,
            endTime,
            id,
            shopId,
          ],
          (err, result) => {
            connection.release()
            if (err) return jsonSysError(res, err)
            if (result.affectedRows == 1) {
              return res.json({
                success: true,
                message: '修改成功！',
              })
            } else {
              return res.json({
                success: false,
                message: '修改失败！',
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
   * @api {get} /commodities/:cid Get data of a Commodity
   * @apiVersion 0.1.0
   * @apiGroup Commodity
   * @apiName GetCommoditiesCid
   * @apiPermission admin(when type is admin)
   * @apiDescription 获取商品信息
   *
   * @apiParam {string} cid 商品ID
   * @apiParam {string} type 获取类型：user, admin
   *
   * @apiSuccess {object} commodity 商品信息
   */
  getCommodity(req, res) {
    try {
      let id = req.params.cid
      let sql
      switch (req.query.type) {
        case 'user': {
          sql = $sql.getCommodityUser
          break
        }
        case 'admin': {
          verify.verifyAdmin(req, res)
          sql = $sql.getCommodityAdmin
          break
        }
        default: {
          fieldErrThrow(res, 'right type')
        }
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(sql, [id], (err, commodity) => {
          connection.release()
          if (err || commodity.length == 0) {
            if (err) return jsonSysError(res, err)
            return res.json({
              success: false,
              message: '未找到商品！',
            })
          }
          return res.json(commodity[0])
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {get} /commodities/shops/:sid/classes/:cls Get list of Commodities by class
   * @apiVersion 0.1.0
   * @apiGroup Commodity
   * @apiName GetCommoditiesSSCC
   * @apiDescription 用户按照分类获取商品
   *
   * @apiParam {number} sid 商店ID
   * @apiParam {string} cls 商品分类
   *
   * @apiSuccess {object[]} commodities 商品列表
   */
  getCommoditiesByClass(req, res) {
    try {
      let shopId = req.params.sid
      let classValue = req.params.cls
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(
          $sql.getCommoditiesByClass,
          [shopId, classValue],
          (err, commodities) => {
            connection.release()
            if (err) return jsonSysError(res, err)
            return res.json(commodities)
          },
        )
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {get} /commodities/count/onsale Get number of Commodities on sales promotion
   * @apiVersion 0.1.0
   * @apiGroup Commodity
   * @apiName GetCommoditiesCount
   * @apiDescription 获取商店促销商品个数
   *
   * @apiParam {number} shopId 商店ID
   *
   * @apiSuccess {number} count 促销商品个数
   *
   */
  getCommoditiesCount(req, res) {
    try {
      let shopId = req.query.shopId
      if (!shopId) {
        fieldErrThrow(res, 'shopId')
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query($sql.getCommoditiesCount, [shopId], (err, results) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          return res.json({ count: results[0].count })
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
}
