const express = require('express')
const router = express.Router()

const favorDao = require('../dao/favor/favorDao')

// 添加收藏
router.post('/', (req, res) => {
  favorDao.addFavor(req, res)
})

// 获取收藏列表
router.get('/:uid/shops/', (req, res) => {
  favorDao.getFavors(req, res)
})

// 取消收藏
router.delete('/:uid/shops/:sid', (req, res) => {
  favorDao.deleteFavor(req, res)
})

module.exports = router
