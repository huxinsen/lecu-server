const favor = {
  // 添加收藏
  insertFavor: 'INSERT INTO favor(userId, shopId) VALUES(?, ?)',
  // 取消收藏
  deleteFavor: 'DELETE FROM favor WHERE userId = ? AND shopId = ?',
  // 获取收藏列表
  queryFavors:
    'SELECT favor.userId, favor.shopId, shop.name FROM favor, shop WHERE userId = ? AND favor.shopId = shop.shopId',
}

module.exports = favor
