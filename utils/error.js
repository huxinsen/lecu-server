module.exports = {
  // 返回json error
  jsonError(res, err) {
    res.json({
      error: {
        code: res.statusCode,
        message:
          err && err.message ? err.message : err ? err : 'Unknown Error!',
      },
    })
  },
  // 设置状态码后抛出系统异常
  jsonSysError(res, err) {
    res.status(500).json({
      error: {
        code: 500,
        message: err && err.message ? err.message : err ? err : 'SystemError!',
      },
    })
  },
  // 设置状态码后抛出字段缺失异常
  fieldErrThrow(res, field) {
    res.status(400)
    throw new Error('Please provide ' + field + ' field.')
  },
}
