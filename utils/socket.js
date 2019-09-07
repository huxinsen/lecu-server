module.exports = {
  // 建立新的socket连接后，记录socketId , lat, lng
  addSocketId(users, info) {
    users.push(info)
  },
  // 关闭页面后，删除对应的socketId
  deleteSocketId(users, socketId) {
    for (let i = 0; i < users.length; i++) {
      if (users[i].socketId === socketId) {
        users.splice(i, 1)
        break
      }
    }
  },
  // 更新地址
  updateLocation(users, info) {
    for (let i = 0; i < users.length; i++) {
      if (users[i].socketId === info.socketId) {
        users[i].lat = info.lat
        users[i].lng = info.lng
        break
      }
    }
  },
  // 过滤得到5公里范围内的用户socketId
  filterSocketIds(users, location) {
    let dist = 5
    let lat = location.lat
    let lng = location.lng
    //里面的 dist 就代表搜索范围，单位km
    let range = ((180 / Math.PI) * dist) / 6372.797
    let lngR = range / Math.cos((lat * Math.PI) / 180.0)
    let maxLat = Number(lat) + Number(range)
    let minLat = Number(lat) - Number(range)
    let maxLng = Number(lng) + Number(lngR)
    let minLng = Number(lng) - Number(lngR)
    return users.filter(user => {
      return (
        user.lat >= minLat &&
        user.lat <= maxLat &&
        user.lng >= minLng &&
        user.lng <= maxLng
      )
    })
  },
}
