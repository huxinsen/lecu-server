const owner = {
  // 添加商家
  insertOwner: 'INSERT INTO owner(username, password) VALUES(?, ?)',
  // 查询密码
  queryOwner: 'SELECT password FROM owner WHERE username = ?',
  // 获取商家上线的商店列表
  getOwnerShops: 'SELECT shopId FROM shop WHERE owner = ?',
}

module.exports = owner
