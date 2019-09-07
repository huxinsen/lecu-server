const express = require('express')
const router = express.Router()

const ownerDao = require('../dao/owner/ownerDao')

// 商家注册
router.post('/', (req, res) => {
  ownerDao.signUp(req, res)
})

module.exports = router
