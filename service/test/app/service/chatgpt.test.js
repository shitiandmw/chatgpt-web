const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/service/chatgpt.test.js', () => {
    let ctx;

    before(async () => {
      ctx = app.mockContext();
    });
  
    it('Time()', async () => {
      console.log("Time()",ctx.ltool.formatTime(1678579200000));
      assert(true);
    });
    
  });