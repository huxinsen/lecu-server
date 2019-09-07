const request = require('request')
const { lbsKey, geoUrl, inputTipsUrl } = require('../../conf/config')

module.exports = {
  /**
   * @api {get} /lbs/location Get Location Info
   * @apiVersion 0.1.0
   * @apiGroup Lbs
   * @apiName GetLbsLocation
   * @apiDescription 获取经纬度
   *
   * @apiParam {string} address 地址
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccess {object} location 位置对象
   */
  getLocation(req, res) {
    const options = {
      url: geoUrl,
      qs: {
        address: req.query.address,
        key: lbsKey,
      },
    }

    function callback(error, response, body) {
      if (!error && response.statusCode === 200) {
        let data = JSON.parse(body)
        if (data.status === '1' && data.geocodes.length > 0) {
          res.json({
            success: true,
            message: '定位成功！',
            location: data.geocodes[0].location,
          })
        } else {
          res.json({
            success: false,
            message: '定位失败！',
          })
        }
      } else {
        res.json({
          success: false,
          message: '定位失败！',
        })
      }
    }
    request(options, callback)
  },
  /**
   * @api {get} /lbs/tips Get Location Tips
   * @apiVersion 0.1.0
   * @apiGroup Lbs
   * @apiName GetLbsTips
   * @apiDescription 获取输入提示
   *
   * @apiParam {string} keywords 关键词
   *
   * @apiSuccess {object[]} tips 提示列表
   */
  getTips(req, res) {
    const options = {
      url: inputTipsUrl,
      qs: {
        keywords: req.query.keywords,
        key: lbsKey,
      },
    }

    function callback(error, response, body) {
      if (!error && response.statusCode === 200) {
        res.json(JSON.parse(body).tips)
      } else {
        res.json({
          success: false,
          message: '获取提示失败！',
        })
      }
    }
    request(options, callback)
  },
}
