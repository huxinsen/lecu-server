const express = require('express')
const router = express.Router()

const reportDao = require('../dao/report/reportDao')

// 添加举报
router.post('/', (req, res) => {
  reportDao.addReport(req, res)
})

// 获取举报列表
router.get('/', (req, res) => {
  reportDao.getReports(req, res)
})

// 修改举报信息
router.put('/:rid', (req, res) => {
  reportDao.updateReport(req, res)
})

module.exports = router
