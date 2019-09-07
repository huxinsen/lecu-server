const formidable = require('formidable')
const path = require('path')
const fs = require('fs')
const uuidV1 = require('uuid/v1')
const { jsonError, jsonSysError } = require('../../utils/error')

module.exports = {
  /**
   * @api {post} /common/images Add an Image
   * @apiVersion 0.1.0
   * @apiGroup Common
   * @apiName PostCommonImages
   * @apiDescription 上传图片
   *
   * @apiSuccess {boolean} success 成功标志
   * @apiSuccess {string} message 返回信息
   * @apiSuccess {string} img_path 图片名称
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "message": "上传成功！"
   *       "img_path": "5a005820-cbb2-11e9-a21f-b747c0a25fd6.jpg"
   *     }
   */
  addImage(req, res) {
    try {
      // 创建上传表单
      let form = new formidable.IncomingForm()
      // 设置编辑
      form.encoding = 'utf-8'
      // 设置上传目录
      form.uploadDir = path.join(__dirname, '../../public/tmp')
      // 保留后缀
      form.keepExtensions = true
      // 上传文件大小限制为最大2M
      form.maxFieldsSize = 2 * 1024 * 1024

      form.parse(req, (err, fields, files) => {
        if (err) return jsonSysError(res, err)

        let filePath = ''
        //如果提交文件的form中将上传文件的input名设置为tmpFile，就从tmpFile中取上传文件。否则取for in循环第一个上传的文件。
        if (files.tmpFile) {
          filePath = files.tmpFile.path
        } else {
          for (let key in files) {
            if (files[key].path && filePath === '') {
              filePath = files[key].path
              break
            }
          }
        }

        let fileExt = filePath.substring(filePath.lastIndexOf('.'))
        if ('.jpg.jpeg.png.gif'.indexOf(fileExt.toLowerCase()) === -1) {
          return res.json({
            success: false,
            message: '只支持jpg、jpeg、png和gif格式的图片！',
          })
        } else {
          // 以当前时间戳对上传文件进行重命名
          let fileName = uuidV1() + fileExt
          let newPath = form.uploadDir + '/' + fileName
          // 移动文件
          fs.rename(filePath, newPath, err => {
            if (err) {
              return jsonError(res, err)
            }
            return res.json({
              success: true,
              message: '上传成功！',
              img_path: fileName,
            })
          })
        }
      })
    } catch (err) {
      return jsonError(res, err)
    }
  },
}
