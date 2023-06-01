'use strict';

const { Controller } = require('egg');
const { Stream } = require('stream');

class ChatGPTController extends Controller {
  // async send() {
  //   const { ctx, app } = this;
  //   const { messages } = ctx.request.body;
  //   const result = await ctx.service.chatgpt.SendMsg(messages);
  //   ctx.body = result;
  // }

  /**
   * 验证激活码
   */
  async verify() {
    const { token } = this.ctx.request.body;
    let license_info = await this.ctx.service.chatgpt.getLicenseInfoDB(token);
    console.log('license_info', license_info);
    if (!license_info) throw this.ctx.ltool.err('激活码不正确', 4011);
    if (license_info.type !== 1) throw this.ctx.ltool.err('激活码无效', 4011);
    license_info = await this.ctx.service.chatgpt.formatLicense(license_info);
    this.ctx.body = license_info;
  }

  /**
   * 生成新的激活码
   */
  async newLicense() {
    console.log('this.ctx.request.body', this.ctx.request.body);
    const { num, price, pwd } = this.ctx.request.body;
    let licenses = await this.ctx.service.chatgpt.newLicense(num, price, pwd);
    let body = '';
    if (licenses && licenses.length > 0)
      body = licenses.map(obj => obj.code).join(',');
    this.ctx.body = body;
  }

  /**
   * 获得临时token
   */
  async tokenEphemeral() {
    const { ctx, app } = this;

    const { code } = this.ctx.request.body;
    let license_info = null;
    if (code) {
      license_info = await this.ctx.service.chatgpt.getLicenseInfoDB(code);
      if (license_info)
        license_info = await this.ctx.service.chatgpt.formatLicense(license_info);
    }
    // 获得赠送的码
    if (!license_info) {
      // 获得ip
      const device_ip = ctx.request.ip;
      // 从hearder中获得device_id
      const device_id = ctx.request.header.deviceid;
      const share = ctx.request.header.share;
      license_info = await ctx.service.chatgpt.getEphemeralToken(
        device_id,
        device_ip,
        share
      );
    }
    ctx.body = license_info || '';
  }

  /**
   * 发送聊天消息
   */
  async chatProcess() {
    const { ctx, app } = this;
    ctx.status = 200;
    ctx.set('Transfer-Encoding', 'chunked');
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    // ctx.set('Content-Type', 'application/octet-stream');
    try {
      const { prompt, options = {}, systemMessage } = ctx.request.body;

      let firstChunk = true;

      // 获得ip
      const device_ip = ctx.request.ip;
      // 从hearder中获得device_id
      const device_id = ctx.request.header.deviceid;


      let response = await ctx.service.chatgpt.chatReplyProcess({
        message: prompt,
        lastContext: options,
        process: chat => {
          // console.log(chat.detail.choices)
          ctx.res.write(
            firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`
          );
          firstChunk = false;
        },
        systemMessage,
        device_ip,
        device_id,
        referer : ctx.request.header.referer
      });
      // console.log("response",response)
      ctx.res.write(
        firstChunk ? JSON.stringify(response) : `\n${JSON.stringify(response)}`
      );
    } catch (error) {
      ctx.res.write(JSON.stringify(error), 'utf8');
    } finally {
      ctx.res.end();
    }
    ctx.respond = false;
  }

  /**
   * 获得分享链接
   */
  async getShareLink()
  {
    const code = this.ctx.request.header.authorization;
    this.ctx.body = await this.ctx.service.chatgpt.getShareLink(code);
  }

  /**
   * 获得成功分享的列表
   */
  async getShareList()
  {
    let { page } = this.ctx.request.query;
    page = page || 1;
    const code = this.ctx.request.header.authorization;
    this.ctx.body = await this.ctx.service.chatgpt.getShareList(code,page) || [];
  }
  
  // async custom() {
  //   const { ctx, app } = this;
  //   const { message } = ctx.request.body;
  //   let command = await ctx.service.chatgpt.CustomMade(message);
  //   // 判断command是否是json结构
  //   if (!ctx.ltool.isJson(command)) {
  //     ctx.body = command;
  //   } else {
  //     command = JSON.parse(command);
  //     ctx.body = await ctx.service.memo.ExecCommand(command);
  //   }
  // }

}

module.exports = ChatGPTController;
