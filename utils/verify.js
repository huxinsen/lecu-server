const jwt = require('jsonwebtoken')
const $conf = require('../conf/config')

module.exports = {
  getToken(user) {
    return jwt.sign(user, $conf.secretKey, {
      expiresIn: 3600 * 24,
    })
  },
  verifyUser(req, res, user) {
    //检查post的信息或者url查询参数或者头信息
    let token =
      req.body.token || req.query.token || req.headers['x-access-token']
    if (token) {
      // 验证token
      jwt.verify(token, $conf.secretKey, function(err, decoded) {
        if (!err && decoded.username === user) {
          req.api_user = decoded.username
        } else {
          // 认证失败
          res.status(401)
          throw new Error('Unauthorized!')
        }
      })
    } else {
      // 未授权
      res.status(403)
      throw new Error('Forbidden!')
    }
  },
  verifyOwner(req, res, owner) {
    //检查post的信息或者url查询参数或者头信息
    let token =
      req.body.token || req.query.token || req.headers['x-access-token']
    if (token) {
      // 验证token
      jwt.verify(token, $conf.secretKey, function(err, decoded) {
        if (!err && decoded.owner && decoded.username === owner) {
          req.api_user = decoded.username
        } else {
          // 认证失败
          res.status(401)
          throw new Error('Unauthorized!')
        }
      })
    } else {
      // 未授权
      res.status(403)
      throw new Error('Forbidden!')
    }
  },
  verifyOwnerShop(req, res, shopId) {
    //检查post的信息或者url查询参数或者头信息
    let token =
      req.body.token || req.query.token || req.headers['x-access-token']
    if (token) {
      // 验证token
      jwt.verify(token, $conf.secretKey, function(err, decoded) {
        if (
          !err &&
          decoded.shops &&
          decoded.shops.some(item => item === parseInt(shopId))
        ) {
          req.api_user = decoded.username
        } else {
          // 认证失败
          res.status(401)
          throw new Error('Unauthorized!')
        }
      })
    } else {
      // 未授权
      res.status(403)
      throw new Error('Forbidden!')
    }
  },
  verifyAdmin(req, res) {
    //检查post的信息或者url查询参数或者头信息
    let token =
      req.body.token || req.query.token || req.headers['x-access-token']
    if (token) {
      // 验证token
      jwt.verify(token, $conf.secretKey, function(err, decoded) {
        if (!err && decoded.admin) {
          req.api_user = decoded.username
        } else {
          // 认证失败
          res.status(401)
          throw new Error('Unauthorized!')
        }
      })
    } else {
      // 未授权
      res.status(403)
      throw new Error('Forbidden!')
    }
  },
}
