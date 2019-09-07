const report = {
  // 添加举报
  insertReport:
    'INSERT INTO report(userId, shopId, cmdtId, reason, reportState) VALUES(?, ?, ?, ?, 1)',
  // 处理（关闭）举报
  updateReport: 'UPDATE report SET reportState = 0 WHERE reportId = ?',
  // 获取举报列表
  queryReports: 'SELECT * FROM report WHERE reportState = 1',
}

module.exports = report
