'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, io  } = app;
  // router.get('/', controller.home.index);
  // router.post('/account/register', controller.account.register);
  // router.post('/account/userkey_login', controller.account.login);
  router.get('/default/getnowtime', controller.default.getnowtime);
  // router.get('/default/test', controller.default.test);
  // router.post('/default/test', controller.default.test);

  // router.post('/gpt/chat', controller.chatgpt.send);
  // router.post('/gpt/custom', controller.chatgpt.custom);
  router.post('/gpt/chat-process', controller.chatgpt.chatProcess);
  router.post('/gpt/verify', controller.chatgpt.verify); 
  router.post('/gpt/token-ephemeral', controller.chatgpt.tokenEphemeral); 
  router.post('/gpt/new-license', controller.chatgpt.newLicense); 
  router.post('/gpt/share', controller.chatgpt.getShareLink); 
  router.get('/gpt/share_list', controller.chatgpt.getShareList); 
  
  // router.get('/user/myinfo', controller.user.getMyInfo);
  // router.get('/user/getuser', controller.user.getUserInfoById);
  
  // router.post('/friend/search', controller.firend.findFirendByNumber);
  // router.post('/friend/apply', controller.firend.applyFirend);
  // router.get('/friend/list', controller.firend.firendApplyList);


  

  
  // socket.io
  io.of('/').route('exchange', io.controller.nsp.exchange);
};
