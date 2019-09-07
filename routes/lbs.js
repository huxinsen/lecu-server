const express = require('express')
const router = express.Router()

const lbsDao = require('../dao/lbs/lbsDao')

// 获取经纬度
router.get('/location', (req, res) => {
  lbsDao.getLocation(req, res)
})

// 获取输入提示
router.get('/tips', (req, res) => {
  lbsDao.getTips(req, res)
})

module.exports = router
