/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1673064796027_4890';

  // 中间件
  config.middleware = ["responseHandler"];

  // socket模块
  config.io = {
    // Egg Socket 内部默认使用 ws 引擎，uws 因为某些原因被废止。如坚持需要使用，请按照以下配置即可：
    // init: { wsEngine: 'uws' }, // default: ws
    init: {}, // passed to engine.io
    namespace: {
      '/': {
        // 针对连接事件的授权处理
        connectionMiddleware: ['connection'],
        // 针对消息的处理 （暂时不实现）
        packetMiddleware: ['packet'],
      },
      '/example': {
        connectionMiddleware: [],
        packetMiddleware: [],
      },
    },
    redis: {
      host: '192.168.1.26',
      port: 18002,
      auth_pass: 'lfluYk4reffZDjzzXfeNA2ub9odfJ1Ic',
      db: 0,
    },
  };

  config.mongoose = {
    client: {
      // 使用root用户名连接egg_chat数据库，认证库为admin
      url: `mongodb://192.168.1.26:18001/egg_chat?authSource=admin`,
      options: {
        user: 'db_root',
        pass: 'WiW5aEoN4vfzv16UN+',
        useUnifiedTopology:true
      },
    },
  };

  // 参数验证模块
  config.validate  = {
    // convert: false,
    // validateRoot: false,
  };

  // 跨域访问配置
  config.cors = {
    origin:'*',
    allowMethods: 'GET,POST'
  };
  config.security = {
    csrf:{
      enable:false
    }
  }

  config.redis = {
    client: {
      port: 18002,          // Redis port
      host: "192.168.1.26",   // Redis host
      password: 'lfluYk4reffZDjzzXfeNA2ub9odfJ1Ic',
      db: 0,
    },
  }

  config.logger = {
    consoleLevel: 'DEBUG',
  };
  config.cluster = {
    listen: {
      port: 7002,
      hostname: '0.0.0.0'
    },
  }


  config.openai = {
    key:'',
    base_url:'https://api.openai.com',
  }

  config.socks5 = {
    host:'192.168.1.26',
    port:'10801'
  }
  config.license_pwd = "8ZooT3BlbkFJ7LL";
  config.license_total = 30000;
  config.share_reward = 100000;
  // add your user config here
  const userConfig = {
    
    // myAppName: 'egg',
  };

  // // # 注意，开启此模式后，应用就默认自己处于反向代理之后，
  // // # 会支持通过解析约定的请求头来获取用户真实的 IP，协议和域名。
  // // # 如果你的服务未部署在反向代理之后，请不要开启此配置，以防被恶意用户伪造请求 IP 等信息。
  config.proxy = true;
  
  return {
    ...config,
    ...userConfig,
  };
};
