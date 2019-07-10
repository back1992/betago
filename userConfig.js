
require("./common");
require("./systemConfig");

//系统数据库配置
System_DBConfig={
    Host:"127.0.0.1",
    Port:6379
};


//行情数据库配置

MarketData_DBConfig={
       Host:"127.0.0.1",
       Port:8086,
       Password:"",
       Database:"NodeQuant_Tick_DB"
};

//配置客户端,NodeQuant启动,会连接已经配置的交易客户端
ClientConfig={
     CTP: {
            // userID:"27100317",
            userID:"27100581",
            password:"Joomla8.net",
            brokerID:"0034",
            AppID:"client_nodequant_1.0",
            // userProductInfo:"",
            AuthCode:"WM8UIOXU7YF31CNA",
            // mdAddress:"tcp://140.206.102.130:31413",
            // tdAddress:"tcp://140.206.102.130:31405"
            mdAddress:"tcp://180.166.0.226:31413",
            tdAddress:"tcp://180.166.0.226:31405"
         }

};

StrategyConfig={
    Strategys:[

          {
              name: "i1909",
              className: "AirForceIIIStrategy",
              symbols: {
                  "i1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 4,
              needCloseYesterday: true,
              thresholdPrice:12000,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 18,
                }
          },
    ]
};

//该设置配合NodeQuant通知服务可以通过声音,邮件通知用户策略发生的异常
NotifyExceptionConfig={
    ExceptionType:[
        ErrorType.Disconnected,
        ErrorType.OperationAfterDisconnected,
    ]
};
