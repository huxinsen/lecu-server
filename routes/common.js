const express = require('express')
const router = express.Router()

const commonDao = require('../dao/common/commonDao')

// 添加图片
router.post('/images', (req, res) => {
  commonDao.addImage(req, res)
})

module.exports = router
