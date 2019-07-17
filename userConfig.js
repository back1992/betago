
require("./common");
require("./systemConfig");

//系统数据库配置
System_DBConfig={
    Host:"127.0.0.1",
    Port:6379
};


//行情数据库配置

MarketData_DBConfig={
       Host:"52.80.16.175",
       Port:8086,
       Password:"",
       Database:"NodeQuant_Tick_DB"
};

//配置客户端,NodeQuant启动,会连接已经配置的交易客户端
ClientConfig={
  CTP:{
      userID: "818866",
      password: "cll666666",
      brokerID:"1025",
      AppID:"client_nodequant_1.0",
      AuthCode:"T79FZ0G2PFEAXQ5N",
      // 联通1
      mdAddress:"tcp://140.206.241.147:51213",
      tdAddress:"tcp://140.206.241.147:51205"
  }

};

StrategyConfig={
    Strategys:[


          {
              name: "jd1909InfluxLongStrategy",
              className: "InfluxLongStrategy",
              symbols: {
                  "jd1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 100,
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
