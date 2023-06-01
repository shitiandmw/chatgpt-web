const { Service } = require('egg');
const axios = require('axios');

// import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from 'chatgpt'
let ChatGPTAPI, ChatGPTUnofficialProxyAPI, fetch;
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
// const fetch = require('node-fetch')
const XMLHttpRequest = require('xhr2');

let httpsAgent = null;
const ErrorCodeMessage = {
  401: '[OpenAI] 提供错误的API密钥 | Incorrect API key provided',
  403: '[OpenAI] 服务器拒绝访问，请稍后再试 | Server refused to access, please try again later',
  502: '[OpenAI] 错误的网关 |  Bad Gateway',
  503: '[OpenAI] 服务器繁忙，请稍后再试 | Server is busy, please try again later',
  504: '[OpenAI] 网关超时 | Gateway Time-out',
  500: '[OpenAI] 服务器繁忙，请稍后再试 | Internal Server Error',
};
const timeoutMs = !isNaN(+process.env.TIMEOUT_MS)
  ? +process.env.TIMEOUT_MS
  : 120 * 1000;
let apiModel;
let api;

const ex_rate = 100000;
function isNotEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function sendResponse(options) {
  if (options.type === 'Success') {
    return Promise.resolve({
      message: options.message ?? null,
      data: options.data ?? null,
      status: options.type,
    });
  }

  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject({
    message: options.message ?? 'Failed',
    data: options.data ?? null,
    status: options.type,
  });
}

class ChatGptSevice extends Service {
  /**
   * 生成license
   * @param {*} num 要生成的数量
   * @param {*} price 每张卡的价值
   */
  async newLicense(num, price, pwd) {
    if (pwd != this.app.config.license_pwd) return [];
    let result = [];
    for (let index = 0; index < num; index++) {
      let token = this.ctx.ltool.uuid();
      let license = await this.ctx.model.License.create({
        type: 1,
        total: price * ex_rate,
        used: 0,
        create_time: Date.now().valueOf(),
        code: token,
      });
      result.push(license);
    }
    return result;
  }

  async initChatGpt() {
    if (!ChatGPTAPI) {
      fetch = (await import('node-fetch')).default;
      // console.log('fetch', fetch)
      let chagpt = await import('chatgpt');
      ChatGPTAPI = chagpt.ChatGPTAPI;
      ChatGPTUnofficialProxyAPI = chagpt.ChatGPTUnofficialProxyAPI;
      const OPENAI_API_MODEL = '';
      if (this.ctx.ltool.isNotEmptyString(this.app.config.openai.key)) {
        const OPENAI_API_BASE_URL = this.app.config.openai.base_url;
        const model = this.ctx.ltool.isNotEmptyString(OPENAI_API_MODEL)
          ? OPENAI_API_MODEL
          : 'gpt-3.5-turbo';

        const options = {
          apiKey: this.app.config.openai.key,
          completionParams: { model },
          debug: false,
        };

        // increase max token limit if use gpt-4
        if (model.toLowerCase().includes('gpt-4')) {
          // if use 32k model
          if (model.toLowerCase().includes('32k')) {
            options.maxModelTokens = 32768;
            options.maxResponseTokens = 8192;
          } else {
            options.maxModelTokens = 8192;
            options.maxResponseTokens = 2048;
          }
        }

        if (this.ctx.ltool.isNotEmptyString(OPENAI_API_BASE_URL))
          options.apiBaseUrl = `${OPENAI_API_BASE_URL}/v1`;

        if (this.app.config.socks5.host && this.app.config.socks5.port) {
          const agent = new SocksProxyAgent({
            hostname: this.app.config.socks5.host,
            port: this.app.config.socks5.port,
          });
          options.fetch = (url, options) => {
            return fetch(url, { agent, ...options });
          };
        }

        api = new ChatGPTAPI({ ...options });
        apiModel = 'ChatGPTAPI';
      }
    }
  }

  /**
   * 发送消息
   * @param {*} options
   * @returns
   */
  async chatReplyProcess(options) {
    await this.initChatGpt();
    const { message, lastContext, process, systemMessage } = options;
    try {
      let options_ = { timeoutMs };

      if (apiModel === 'ChatGPTAPI') {
        if (this.ctx.ltool.isNotEmptyString(systemMessage))
          options_.systemMessage = systemMessage;
      }

      if (lastContext != null) {
        if (apiModel === 'ChatGPTAPI')
          options_.parentMessageId = lastContext.parentMessageId;
        else options_ = { ...lastContext };
      }

      options_.systemMessage ="You are a personal assistant in the China region, please reply in Chinese unless the other party does not speak Chinese. Due to the special policies in the China region, if someone mentions information about Chinese history, politics, economy, leaders, sovereignty, etc., you can only reply with these four words: \"问题违规\". Other questions can be answered normally, without the need to indicate whether or not they are non-compliant.";
      const response = await api.sendMessage(message, {
        ...options_,
        onProgress: partialResponse => {
          process?.(partialResponse);
        },
      });

      let chat_res = await this.chatReply(
        message,
        response,
        this.ctx.token,
        api._completionParams.model,
        options
      );
      // console.log('chat_res', chat_res)
      response.used = chat_res.used;
      return response;

      // return sendResponse({ type: 'Success', data: response });
    } catch (error) {
      const code = error.statusCode;
      global.console.log(error);
      if (Reflect.has(ErrorCodeMessage, code))
        return sendResponse({ type: 'Fail', message: ErrorCodeMessage[code] });
      return sendResponse({
        type: 'Fail',
        message: error.message ?? 'Please check the back-end console',
      });
    }
  }

  /**
   * 处理聊天消息
   * @param {*} response 返回的消息
   * @param {*} token token
   * @returns
   */
  async chatReply(message, response, token, apiModel, headers) {
    // 记录问题和答案
    await this.ctx.model.GptChat.create({
      question_md5: this.ctx.ltool.md5(message),
      license: token,
      question: message,
      answer: response.text,
      add_time: Date.now().valueOf(),
      update_time: Date.now().valueOf(),
      token: response.detail.usage.total_tokens,
      domain: headers.referer,
      device_id: headers.device_id,
      device_ip: headers.device_ip,
    });
    // 扣除token
    return this.deductToken(
      token,
      response.detail.usage.total_tokens,
      apiModel,
      headers
    );
  }

  /**
   * 扣除某个激活码的token
   * @param {*} license 激活码
   * @param {*} num 扣除数量
   */
  async deductToken(license, num, apiModel, headers) {
    let price = await this.getTokenPrice(num, apiModel);

    // redis 扣除price
    let use = await this.app.redis.incrby(
      `license:use:${license}`,
      parseInt(price)
    );

    // 更新数据库 （这里也可以延迟更新，避免频繁更新数据库，此处暂不实现）
    let update_data = {
      used: use,
      last_use_time: Date.now().valueOf(),
      last_use_domain: headers.referer,
    };
    if (use == parseInt(price)) {
      update_data.first_use_time = Date.now().valueOf();
      update_data.first_use_domain = headers.referer;

      update_data.device_id = headers.device_id;
      update_data.device_ip = headers.device_ip;

      // 更新分享奖励
      await this.updShareReward(license);
    }

    await this.ctx.model.License.updateOne({ code: license }, update_data);

    return update_data;
  }

  /**
   *  更新分享奖励
   * @param {*} license_code
   */
  async updShareReward(license_code) {
    // 获得激活码信息
    let license = await this.getLicenseInfoDB(license_code);
    if (license && license.share) {
      let share_license = await this.ctx.model.License.findOne({
        id: license.share,
      });
      if (share_license) {
        let share_reward = this.app.config.share_reward || 100000;
        await this.ctx.model.License.updateOne(
          { id: license.share },
          {
            $inc: { total: share_reward },
          }
        );
      }
      await this.ctx.model.License.updateOne(
        { id: license.id },
        { share_reward: 1 }
      );
    }
  }
  /**
   * 获得token数对应的金额
   */
  async getTokenPrice(num, apiModel) {
    let multiple = 4;
    // 定义汇率
    let use_rate = 7;
    let result = 0;
    switch (apiModel) {
      case 'gpt-3.5-turbo':
        result = num * 0.000002;
        break;
      default:
        result = num * 0.00012;
        break;
    }
    result = result * multiple * ex_rate * use_rate;

    return result;
  }

  /**
   * 根据设备id或者ip获取临时的token
   * @param {*} device_id
   * @param {*} device_ip
   * @param {*} share
   */
  async getEphemeralToken(device_id, device_ip, share) {
    let token = await this.getEphemeralTokenByCache(device_id, device_ip);
    if (!token) {
      // 加个锁，防止快速点击
      let lock_key = `applyFirend:${device_id},${device_ip}`;
      const selfMark = await this.app.redis.sLock(lock_key, 20);
      if (selfMark) {
        try {
          let init_total = this.app.config.license_total || 50000;
          // 从数据库查询当前ip或者设备ip是否生成过临时的token
          let license = await this.ctx.model.License.findOne({
            $and: [{ $or: [{ device_ip }, { device_id }] }, { type: 0 }],
          });
          if (!license) {
            token = this.ctx.ltool.uuid();
            license = await this.ctx.model.License.create({
              type: 0,
              total: init_total,
              used: 0,
              create_time: Date.now().valueOf(),
              device_id,
              device_ip,
              code: token,
              share: share,
              share_reward: 0,
              id: this.ctx.ltool.nonceString(),
            });
          }
          token = this.formatLicense(license);
          // 存入缓存
          await this.setEphemeralToken(device_id, device_ip, token);
        } catch (error) {
          throw this.ctx.ltool.err(err.message, err.code || 5001);
        } finally {
          // 解锁
          this.app.redis.sUnLock(lock_key, selfMark);
        }
      }
    }

    return token;
  }

  async formatLicense(license) {
    return Promise.resolve({
      token: license.code,
      total: license.total,
      used: license.used,
      code: license.code.substr(0, 4) + '**********' + license.code.slice(-4),
      is_use: license.total - license.used > 0,
      type: license.type,
    });
  }

  async setEphemeralToken(device_id, device_ip, token) {
    await this.app.redis.sSet(
      'getEphemeralToken:' + device_id,
      token,
      31536000
    );
    await this.app.redis.sSet(
      'getEphemeralToken:' + device_ip,
      token,
      31536000
    );
  }

  async getEphemeralTokenByCache(device_id, device_ip) {
    let token = await this.app.redis.sGet(
      'getEphemeralToken:' + device_id,
      async () => {
        return null;
      }
    );
    if (!token) {
      token = await this.app.redis.sGet(
        'getEphemeralToken:' + device_ip,
        async () => {
          return null;
        }
      );
    }
    return token;
  }

  /**
   *  获取激活码信息
   * @param {*} license
   */
  async getLicenseInfo(code) {
    let license = await this.app.redis.sGet('licenseInfo:' + code, async () => {
      return await this.getLicenseInfoDB(code);
    });
    if (license) {
      license.used = await this.app.redis.sGet(
        'license:use:' + code,
        async () => {
          return 0;
        }
      );
    }
    return license;
  }

  /**
   * 获得分享链接
   * @param {*} code
   */
  async getShareLink(code) {
    let license = await this.getLicenseInfoDB(code);
    if (!license) throw this.ctx.ltool.err('获取分享链接失败', 40003);
    let share = license.id;
    if (!share) {
      share = this.ctx.ltool.nonceString();
      await this.ctx.model.License.updateOne({ code: code }, { id: share });
    }
    return share;
  }

  /**
   * 获取分享列表
   * @param {*} code 激活码
   * @param {*} page 页码
   */
  async getShareList(code,page) {
    let license = await this.getLicenseInfo(code);
    if (!license) throw this.ctx.ltool.err('获取分享列表失败', 40003);
    let share = license.id;
    let page_size = 5;
    let list = await this.ctx.model.License.find({  share: share, _id: { $ne:license._id } }).sort({create_time:-1}).skip((page-1)*page_size).limit(page_size);
    if(list)
      list = list.map(item=>{
        return {
          code:item.code.substr(0, 4) + '**********' + item.code.slice(-4),
          time: this.ctx.ltool.formatTime(item.create_time,2),
          status: parseInt( item.share_reward || 0)
        };
      })
    let total = await this.ctx.model.License.countDocuments({ share: share, _id: { $ne:license._id }  });
    return {
      list,
      total,
    };
  }

  /**
   * 获取激活码信息
   * @param {*} license
   */
  async getLicenseInfoDB(license) {
    return this.ctx.model.License.findOne({ code: license });
  }


}

module.exports = ChatGptSevice;
