const mysql = require('mysql')
const $conf = require('../../conf/config')
const $sql = require('../owner/ownerSqlMapping')
const verify = require('../../utils/verify')
const { jsonError, jsonSysError, fieldErrThrow } = require('../../utils/error')
// 使用连接池，提升性能
const pool = mysql.createPool($conf.mysql)

module.exports = {
  /**
   * @api {post} /session/:type Login
   * @apiVersion 0.1.0
   * @apiGroup Session
   * @apiName PostSessionType
   * @apiDescription 登录
   *
   * @apiParam {string} type 登录类型：user, owner, admin
   * @apiParam {string} username 用户名
   * @apiParam {string} password 密码
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccess {string} token 登录通证
   * @apiSuccess {string} username 用户名
   * @apiSuccess {string} type 登录类型
   */
  login(req, res) {
    try {
      let username = req.body.username
      let password = req.body.password

      if (!username) {
        fieldErrThrow(res, 'username')
      }
      if (!password) {
        fieldErrThrow(res, 'password')
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query($sql.queryOwner, [username], (err, result) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          if (result && result[0]) {
            // 检查密码
            if (result[0].password === password) {
              // 查询商家名下商店列表
              pool.getConnection((err, connection) => {
                if (err) return jsonSysError(res, err)
                connection.query(
                  $sql.getOwnerShops,
                  [username],
                  (err, shopIds) => {
                    connection.release()
                    if (err) return jsonSysError(res, err)
                    let shops = shopIds.map(item => {
                      return item.shopId
                    })
                    let owner = {
                      username,
                      owner: true,
                      shops,
                    }
                    // 创建token
                    let token = verify.getToken(owner)
                    return res.json({
                      success: true,
                      message: '登录成功',
                      token,
                      username,
                      type: 'owner',
                    })
                  },
                )
              })
            } else {
              return res.json({
                success: false,
                message: '密码不正确！',
              })
            }
          } else {
            return res.json({
              success: false,
              message: '该用户不存在',
            })
          }
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {post} /owners Add an Owner
   * @apiVersion 0.1.0
   * @apiGroup Owner
   * @apiName PostOwners
   * @apiDescription 商家注册
   *
   * @apiParam {string} username 用户名
   * @apiParam {string} password 密码
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "注册成功！"
   *     }
   */
  signUp(req, res) {
    try {
      let username = req.body.username
      let password = req.body.password

      if (!username) {
        fieldErrThrow(res, 'username')
      }
      if (!password) {
        fieldErrThrow(res, 'password')
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(
          $sql.insertOwner,
          [username, password],
          (err, result) => {
            connection.release()
            if (err) return jsonSysError(res, err)
            if (result.affectedRows !== 1) {
              return res.json({
                success: false,
                message: '注册失败！',
              })
            } else {
              return res.json({
                success: true,
                message: '注册成功！',
              })
            }
          },
        )
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
}
