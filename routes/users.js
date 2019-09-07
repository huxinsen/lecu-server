const express = require('express')
const router = express.Router()

const userDao = require('../dao/user/userDao')

// 用户注册
router.post('/', (req, res) => {
  userDao.signUp(req, res)
})

// 修改密码
router.put('/:uid', (req, res) => {
  userDao.changePwd(req, res)
})

module.exports = router
