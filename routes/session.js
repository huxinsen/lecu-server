const express = require('express')
const router = express.Router()
const { jsonError } = require('../utils/error')

const userDao = require('../dao/user/userDao')
const ownerDao = require('../dao/owner/ownerDao')
const adminDao = require('../dao/admin/adminDao')

// 登录
router.post('/:type', (req, res) => {
  switch (req.params.type) {
    case 'user': {
      userDao.login(req, res)
      break
    }
    case 'owner': {
      ownerDao.login(req, res)
      break
    }
    case 'admin': {
      adminDao.login(req, res)
      break
    }
    default: {
      res.status(400)
      return jsonError(res, 'Wrong login type')
    }
  }
})

module.exports = router
