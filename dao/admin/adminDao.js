const mysql = require('mysql')
const $conf = require('../../conf/config')
const $sql = require('../admin/adminSqlMapping')
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
        connection.query($sql.queryAdmin, [username], (err, result) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          if (result && result[0]) {
            // 检查密码
            if (result[0].password === password) {
              // 创建token
              let token = verify.getToken({
                username,
                admin: true,
              })
              result = {
                success: true,
                message: '登录成功',
                token,
                username,
                type: 'admin',
              }
            } else {
              result = {
                success: false,
                message: '密码不正确！',
              }
            }
          } else {
            result = {
              success: false,
              message: '该用户不存在',
            }
          }
          return res.json(result)
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
}
