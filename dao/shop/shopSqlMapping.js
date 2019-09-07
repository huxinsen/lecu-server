const shop = {
  // shopState: 1代表通过审核，0代表未通过审核
  // toBeChecked: 当shopState为0时，0代表待修改，1代表待审核
  insertShop:
    'INSERT INTO shop(owner, name, time, address, lat, lng, tel, legalRepr, idNumber, shopImg, withIdFrontImg, withIdBackImg, licenseImg, notice, shopState, toBeChecked) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)',

  // 搜索附近的商店
  getShopsSearch:
    'SELECT shopId, name FROM shop WHERE ((lat BETWEEN ? AND ?) AND (lng BETWEEN ? AND ?)) AND (LEVENSHTEIN_RATIO(?, name) > 70 OR name LIKE ?)',
  // 获取店铺完整信息
  getShopsFull:
    'SELECT shopId, owner, name, address, lng, lat, notice, tel, time, shopImg FROM shop WHERE owner = ? AND shopState = 1',
  // 获取店铺精简信息
  getShopsLite:
    'SELECT shopId, name, lat, lng FROM shop WHERE owner = ? AND shopState = 1',
  // 获取审核中店铺信息
  getShopsChecking:
    'SELECT shopId, name, address, notice, tel, time, legalRepr, idNumber, shopImg, withIdFrontImg, withIdBackImg, licenseImg FROM shop WHERE owner = ? AND shopState = 0 AND toBeChecked = 1',
  // 获取待修改店铺信息
  getShopsToBeChecked:
    'SELECT shopId, name, address, lng, lat, notice, tel, time, legalRepr, idNumber, shopImg, withIdFrontImg, withIdBackImg, licenseImg, checkMsg FROM shop WHERE owner = ? AND shopState = 0 AND toBeChecked = 0',
  // 管理员获取待审核店铺信息
  getShopsToCheck: 'SELECT * FROM shop WHERE shopState = 0 AND toBeChecked = 1',

  // 更新店铺信息
  updateShop:
    'UPDATE shop SET name = ?, address = ?, lng = ?, lat = ?, notice = ?, tel = ?, time = ?, shopImg = ? WHERE shopId = ?',
  // 修改申请信息
  alterShop:
    'UPDATE shop SET name = ?, address = ?, lng = ?, lat = ?, notice = ?, tel = ?, time = ?, shopImg = ?, legalRepr = ?, idNumber = ?, withIdFrontImg = ?, withIdBackImg = ?, licenseImg = ?, toBeChecked = 1 WHERE shopId = ? AND shopState = 0',
  // 管理员通过申请
  adminPassShop:
    'UPDATE shop SET checkMsg = ?, shopState = 1 WHERE shopId = ? AND shopState = 0',
  // 管理员拒绝申请
  adminRejectShop:
    'UPDATE shop SET checkMsg = ?, toBeChecked = 0 WHERE shopId = ? AND shopState = 0',
  // 管理员下线商店
  adminDownShop:
    'UPDATE shop SET checkMsg = ?, shopState = 0, toBeChecked = 0 WHERE shopId = ? AND shopState = 1',

  // 获取店铺全部信息
  getShopFull: 'SELECT * FROM shop WHERE shopId = ?',
  // 获取店铺精简信息
  getShopLite:
    'SELECT shopId, name, address, notice, tel, time, shopImg FROM shop WHERE shopId = ?',

  // 商家获取商品分类
  getClassesOwner:
    'SELECT DISTINCT class FROM commodity, shop WHERE commodity.shopId = ? AND commodity.shopId = shop.shopId AND shopState = 1',
  // 用户获取商店有效分类
  getClassesUser:
    'SELECT DISTINCT class FROM commodity, shop WHERE commodity.shopId = ? AND commodity.shopId = shop.shopId AND shopState = 1 AND (NOW() BETWEEN commodity.startTime AND commodity.endTime)',
}

module.exports = shop
