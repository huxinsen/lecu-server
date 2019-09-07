const express = require('express')
const router = express.Router()
const { jsonError } = require('../utils/error')

const commodityDao = require('../dao/commodity/commodityDao')

// 商家添加商品
router.post('/', (req, res) => {
  commodityDao.addCommodity(req, res)
})

// 获取商品列表
router.get('/', (req, res) => {
  switch (req.query.type) {
    case 'owner':
      commodityDao.getCommoditiesOwner(req, res)
      break
    case 'admin':
      commodityDao.getCommoditiesAdmin(req, res)
      break
    case 'search':
    case 'nearby':
      commodityDao.getCommoditiesUser(req, res)
      break
    default:
      res.status(400)
      return jsonError(
        res,
        req.query.type ? 'Wrong type' : 'Please provide type',
      )
  }
})

// 商家更新商品信息
router.put('/:cid', (req, res) => {
  commodityDao.updateCommodity(req, res)
})

// 用户（管理员）获取商品信息
router.get('/:cid', (req, res) => {
  commodityDao.getCommodity(req, res)
})

// 用户按照分类获取商品
router.get('/shops/:sid/classes/:cls', (req, res) => {
  commodityDao.getCommoditiesByClass(req, res)
})

// 用户获取商店促销商品个数
router.get('/count/onsale', (req, res) => {
  commodityDao.getCommoditiesCount(req, res)
})

module.exports = router
