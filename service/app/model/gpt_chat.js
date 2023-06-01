/**
 * 好友关系
 * @param {*} app
 * @returns
 */
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const GptChatSchema = new Schema({
    license: { type: String }, // 使用的激活码
    question: { type: String }, // 问题
    question_md5: { type: String }, // 问题md5
    answer: { type: String }, // 答案
    chat: { type: String }, // 完整对话
    token: { type: Number }, // 使用的token数
    add_time: { type: Number }, // 添加时间
    update_time : {type:Number}, // 更新时间
    domain: { type: String }, // 使用的域名
    device_id: { type: String }, // 使用的设备id
    device_ip: { type: String }, // 使用的ip
  });

  GptChatSchema.post('save', function () {
   this.set({update_time:Date.now().valueOf()});
  });
  return mongoose.model('GptChat', GptChatSchema);
};
