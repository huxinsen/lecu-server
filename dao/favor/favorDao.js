const mysql = require('mysql')
const $conf = require('../../conf/config')
const $sql = require('../favor/favorSqlMapping')
const verify = require('../../utils/verify')
const { jsonError, jsonSysError, fieldErrThrow } = require('../../utils/error')
// 使用连接池，提升性能
const pool = mysql.createPool($conf.mysql)

module.exports = {
  /**
   * @api {post} /favors Add a Favor
   * @apiVersion 0.1.0
   * @apiGroup Favor
   * @apiName PostFavors
   * @apiDescription 添加收藏
   *
   * @apiParam {string} userId 用户ID
   * @apiParam {number} shopId 商店ID
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "收藏成功！"
   *     }
   */
  addFavor(req, res) {
    try {
      let userId = req.body.userId
      let shopId = req.body.shopId

      if (!userId) {
        fieldErrThrow(res, 'userId')
      }
      if (!shopId) {
        fieldErrThrow(res, 'shopId')
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query($sql.insertFavor, [userId, shopId], (err, result) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          if (result.affectedRows !== 1) {
            return res.json({
              success: false,
              message: '收藏失败！',
            })
          } else {
            return res.json({
              success: true,
              message: '收藏成功！',
            })
          }
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {get} /favors/:uid/shops Get list of Favors
   * @apiVersion 0.1.0
   * @apiGroup Favor
   * @apiName GetFavorsUidShops
   * @apiPermission user
   * @apiDescription 获取收藏列表
   *
   * @apiParam {string} uid 用户ID
   *
   * @apiSuccess {object[]} favors 收藏列表
   */
  getFavors(req, res) {
    try {
      let userId = req.params.uid
      verify.verifyUser(req, res, userId)
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query($sql.queryFavors, [userId], (err, favors) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          return res.json(favors)
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {delete} /favors/:uid/shops/:sid Delete a Favor
   * @apiVersion 0.1.0
   * @apiGroup Favor
   * @apiName GetFavorsUSS
   * @apiPermission user
   * @apiDescription 取消收藏
   *
   * @apiParam {string} uid 用户ID
   * @apiParam {number} sid 商店ID
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "取消成功！"
   *     }
   */
  deleteFavor(req, res) {
    try {
      let userId = req.params.uid
      let shopId = req.params.sid
      verify.verifyUser(req, res, userId)
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query($sql.deleteFavor, [userId, shopId], (err, result) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          if (result.affectedRows == 1) {
            return res.json({
              success: true,
              message: '取消成功！',
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
}
