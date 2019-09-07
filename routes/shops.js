const express = require('express')
const router = express.Router()
const { jsonError } = require('../utils/error')

const shopDao = require('../dao/shop/shopDao')

// 商家添加商店
router.post('/', (req, res) => {
  shopDao.addShop(req, res)
})

// 获取商店列表
router.get('/', (req, res) => {
  switch (req.query.type) {
    case 'search': {
      shopDao.getShopsUser(req, res)
      break
    }
    case 'toCheck': {
      shopDao.getShopsAdmin(req, res)
      break
    }
    case 'full':
    case 'lite':
    case 'checking':
    case 'toBeChecked': {
      shopDao.getShopsOwner(req, res)
      break
    }
    default: {
      res.status(400)
      return jsonError(
        res,
        req.query.type ? 'Wrong type.' : 'Please provide type.',
      )
    }
  }
})

// 获取商店信息
router.get('/:sid', (req, res) => {
  shopDao.getShop(req, res)
})

// 管理员（商家）更新商店信息
router.put('/:sid', (req, res) => {
  switch (req.body.type) {
    case 'manage': {
      shopDao.updateShopAdmin(req, res)
      break
    }
    case 'update':
    case 'alter': {
      shopDao.updateShopOwner(req, res)
      break
    }
    default: {
      res.status(400)
      return jsonError(
        res,
        req.body.type ? 'Wrong type.' : 'Please provide type.',
      )
    }
  }
})

// 获取商店商品分类
router.get('/:sid/classes', (req, res) => {
  shopDao.getClasses(req, res)
})

module.exports = router
