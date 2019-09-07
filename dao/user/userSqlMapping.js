const user = {
  // 添加用户
  insertUser: 'INSERT INTO user(username, password) VALUES(?, ?)',
  // 查询密码
  queryUser: 'SELECT password FROM user WHERE username = ?',
  // 更改密码
  updateUser: 'UPDATE user SET password = ? WHERE username = ? AND password = ?',
}

module.exports = user
