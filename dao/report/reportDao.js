const mysql = require('mysql')
const $conf = require('../../conf/config')
const $sql = require('../report/reportSqlMapping')
const verify = require('../../utils/verify')
const { jsonError, jsonSysError, fieldErrThrow } = require('../../utils/error')
// 使用连接池，提升性能
const pool = mysql.createPool($conf.mysql)

module.exports = {
  /**
   * @api {post} /reports Add a Report
   * @apiVersion 0.1.0
   * @apiGroup Report
   * @apiName PostReports
   * @apiPermission user
   * @apiDescription 添加举报
   *
   * @apiParam {string} userId 用户ID
   * @apiParam {number} shopId 商店ID
   * @apiParam {number} cmdtId 商品ID
   * @apiParam {string} reason 举报理由
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "举报成功，系统将在三个工作日内处理您的举报！"
   *     }
   */
  addReport(req, res) {
    try {
      let userId = req.body.userId
      let shopId = req.body.shopId
      let cmdtId = req.body.cmdtId
      let reason = req.body.reason
      if (!userId) {
        fieldErrThrow(res, 'userId')
      }

      verify.verifyUser(req, res, userId)

      if (!shopId) {
        fieldErrThrow(res, 'shopId')
      }
      if (!cmdtId) {
        fieldErrThrow(res, 'cmdtId')
      }
      if (!reason) {
        fieldErrThrow(res, 'reason')
      }
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query(
          $sql.insertReport,
          [userId, shopId, cmdtId, reason],
          (err, result) => {
            connection.release()
            if (err) return jsonSysError(res, err)
            if (result.affectedRows !== 1) {
              return res.json({
                success: false,
                message: '操作失败！',
              })
            } else {
              return res.json({
                success: true,
                message: '举报成功，系统将在三个工作日内处理您的举报！',
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
   * @api {get} /reports Get list of Reports
   * @apiVersion 0.1.0
   * @apiGroup Report
   * @apiName GetReports
   * @apiPermission admin
   * @apiDescription 获取举报列表
   *
   * @apiSuccess {object[]} reports 举报列表
   */
  getReports(req, res) {
    try {
      verify.verifyAdmin(req, res)
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query($sql.queryReports, (err, reports) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          return res.json(reports)
        })
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
  /**
   * @api {put} /reports/:rid Update a Report
   * @apiVersion 0.1.0
   * @apiGroup Report
   * @apiName PutReportsRid
   * @apiPermission admin
   * @apiDescription 更新举报信息
   *
   * @apiParam {number} rid 举报ID
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "举报处理成功！"
   *     }
   */
  updateReport(req, res) {
    try {
      verify.verifyAdmin(req, res)
      let reportId = req.params.rid
      // 数据库操作
      pool.getConnection((err, connection) => {
        if (err) return jsonSysError(res, err)
        connection.query($sql.updateReport, [reportId], (err, result) => {
          connection.release()
          if (err) return jsonSysError(res, err)
          if (result.affectedRows == 1) {
            return res.json({
              success: true,
              message: '举报处理成功！',
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
