const commodity = {
  // 商家添加商品
  insertCommodity:
    'INSERT INTO commodity(shopId, name, class, originalPrice, price, details, promotionInfo, pic1, pic2, pic3, pic4, pic5, startTime, endTime) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  // 商家更新商品
  updateCommodity:
    'UPDATE commodity SET name = ?, class = ?, originalPrice = ?, price = ?, details = ?, promotionInfo = ?, pic1 = ?, pic2 = ?, pic3 = ?, pic4 = ?, pic5 = ?, startTime = ?, endTime = ? WHERE id = ? AND shopId = ?',

  // 商家获取商品列表
  getCommoditiesOwner:
    'SELECT id, commodity.shopId, shop.name as shopName, shop.address, commodity.name, class as classValue, originalPrice, price, details, promotionInfo, pic1, pic2, pic3, pic4, pic5, commodity.startTime, commodity.endTime FROM commodity, shop WHERE shop.owner = ? AND shop.shopId = commodity.shopId',
  // 管理员获取商品列表
  getCommoditiesAdmin: 'SELECT * FROM commodity WHERE shopId = ?',
  // 用户获取附近的商品列表
  getCommoditiesNearby:
    'SELECT id, commodity.name, price, originalPrice, pic1, (To_Days(commodity.endTime) - To_Days(NOW())) AS daysLeft FROM commodity, shop WHERE ((lat BETWEEN ? AND ?) AND (lng BETWEEN ? AND ?)) AND commodity.shopId = shop.shopId AND (NOW() BETWEEN commodity.startTime AND commodity.endTime) AND shopState = 1',
  // 用户搜索附近商品列表
  getCommoditiesSearch:
    'SELECT id, commodity.name, price, originalPrice, pic1, (To_Days(commodity.endTime) - To_Days(NOW())) AS daysLeft FROM commodity, shop WHERE ((lat BETWEEN ? AND ?) AND (lng BETWEEN ? AND ?)) AND commodity.shopId = shop.shopId AND (NOW() BETWEEN commodity.startTime AND commodity.endTime) AND shopState = 1 AND (LEVENSHTEIN_RATIO(?, commodity.name) > 68 OR commodity.name LIKE ?)',

  // 管理员获取商品信息
  getCommodityAdmin: 'SELECT * FROM commodity WHERE id = ?',
  // 用户获取商品信息
  getCommodityUser:
    'SELECT id, commodity.shopId, shop.name as shopName, shop.address, shop.time, commodity.name, originalPrice, price, details, promotionInfo, pic1, pic2, pic3, pic4, pic5, commodity.endTime FROM commodity, shop WHERE id = ? AND shop.shopId = commodity.shopId',

  // 用户按商店的分类获取促销商品列表
  getCommoditiesByClass:
    'SELECT *, (To_Days(commodity.endTime) - To_Days(NOW())) AS daysLeft FROM commodity WHERE shopId = ? AND class = ? AND (NOW() BETWEEN commodity.startTime AND commodity.endTime)',
  // 用户获取商店促销商品个数
  getCommoditiesCount:
    'SELECT COUNT(*) AS count FROM commodity WHERE shopId = ? AND (NOW() BETWEEN commodity.startTime AND commodity.endTime)',
}

module.exports = commodity
