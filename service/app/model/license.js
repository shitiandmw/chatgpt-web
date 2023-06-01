/**
 * 激活码
 * @param {object} app
 * @returns
 */
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const LicenseSchema = new Schema({
    // 类型、激活码总额、激活码余额、创建时间、首次使用时间、首次使用的domain、最后使用时间、最后使用的domain、使用次数、使用总token数、使用总时长、使用总流量、使用总费用、状态、备注
    type: { type: Number }, // 类型 0 试用 1 付费
    total: { type: Number }, // 激活码总额 单位霸 = 元 * 100000
    used: { type: Number }, // 已使用
    create_time: { type: Number }, // 创建时间
    device_id: { type: String }, // 使用的设备id
    device_ip: { type: String }, // 使用的ip
    first_use_time: { type: Number }, // 首次使用时间
    first_use_domain: { type: String }, // 首次使用的domain
    last_use_time: { type: Number }, // 最后使用时间
    last_use_domain: { type: String }, // 最后使用的domain
    code: { type: String },
    id: {type:String},
    share: { type: String }, // 分享码
    share_reward: { type: String }, // 是否已经体验了
  });

  LicenseSchema.pre('save', function () {
    this.set({ update_time: Date.now().valueOf() });
  });
  return mongoose.model('License', LicenseSchema);
};
