
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
    Port: 8086,
    Username: "",
    Password: "",
    Database: "NodeQuant_Tick_DB"
};

//配置客户端,NodeQuant启动,会连接已经配置的交易客户端
ClientConfig={
     CTP: {
            userID:"27100317",
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
              name: "ag1912InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "ag1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 8,
              MinBarInterval: 2,
              total: 1,
              needCloseYesterday: true,
              canOpenToday: true,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 8,
                }
          },
            
          {
              name: "p2001InfluxLongStrategy",
              className: "SilverShortStrategy",
              symbols: {
                  "p2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 10,
              MinBarInterval: 15,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: true,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 10,
                }
          },
            
          {
              name: "v2001InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "v2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 8,
              MinBarInterval: 2,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: true,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 8,
                }
          },
            
          {
              name: "SF001InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "SF001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 8,
              MinBarInterval: 2,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: true,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 8,
                }
          },
            
          {
              name: "AP001InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "AP001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 8,
              MinBarInterval: 2,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: true,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 8,
                }
          },
            
          {
              name: "SM001InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "SM001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 10,
              MinBarInterval: 5,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: false,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 10,
                }
          },
            
          {
              name: "l2001InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "l2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 10,
              MinBarInterval: 5,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: false,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 10,
                }
          },
            
          {
              name: "ZC001InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "ZC001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 10,
              MinBarInterval: 5,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: false,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 10,
                }
          },
            
          {
              name: "pb1912InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "pb1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 10,
              MinBarInterval: 5,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: false,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 10,
                }
          },
            
          {
              name: "y2001InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "y2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 10,
              MinBarInterval: 5,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: false,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 10,
                }
          },
            
          {
              name: "hc2001InfluxLongStrategy",
              className: "SilverLongStrategy",
              symbols: {
                  "hc2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 10,
              MinBarInterval: 5,
              total: 1,
              needCloseYesterday: false,
              canOpenToday: false,
              PreloadConfig: {
                  LookBackDays:50,
                  BarType: KBarType.Second,
                  BarInterval: 10,
                }
          },
            
          {
              name: "CF001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "CF001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "ru2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "ru2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "zn1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "zn1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "ni2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "ni2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "fu2005DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "fu2005": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "m2005DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "m2005": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "OI001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "OI001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "sn2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "sn2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "pp2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "pp2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "SR001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "SR001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "al1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "al1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "rb2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "rb2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "au1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "au1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "CJ001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "CJ001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "bu1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "bu1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "jd2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "jd2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "FG001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "FG001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "jm2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "jm2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "sc1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "sc1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "RM001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "RM001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "c2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "c2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "cs2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "cs2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "sp2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "sp2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "MA001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "MA001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "a2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "a2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "i2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "i2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "eg2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "eg2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "TA001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "TA001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "j2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "j2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "cu1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "cu1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "CY001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "CY001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "rr2001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "rr2001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "ss2002DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "ss2002": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "nr2002DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "nr2002": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "eb2005DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "eb2005": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
          },
            
          {
              name: "UR001DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "UR001": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Minute,
              BarInterval: 1,
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
    