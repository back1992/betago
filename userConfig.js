
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
              name: "CF909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "CF909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "ru1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "ru1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "ZC909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "ZC909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "SF909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "SF909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 3,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "fu1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "fu1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 2,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "m1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "m1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "OI909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "OI909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 3,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "pp1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "pp1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "l1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "l1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "SR909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "SR909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 0,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "AP910DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "AP910": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 2,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "rb1910DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "rb1910": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "au1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "au1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "hc1910DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "hc1910": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 0,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "v1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "v1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 0,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "bu1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "bu1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 3,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "jd1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "jd1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 2,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "FG909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "FG909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 0,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "jm1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "jm1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 0,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "RM909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "RM909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "c1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "c1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 0,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "SM909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "SM909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 0,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "y1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "y1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "sp1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "sp1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "a1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "a1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "i1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "i1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 2,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "eg1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "eg1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "TA909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "TA909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "j1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "j1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "p1909DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "p1909": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "ni1908DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "ni1908": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "ag1912DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "ag1912": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "zn1908DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "zn1908": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 2,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "cu1908DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "cu1908": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 2,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "al1908DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "al1908": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 1,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "sc1908DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "sc1908": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 2,
              totalSymbols: 30,
              needCloseYesterday: true,
          },

          {
              name: "pb1908DBStoreStrategy",
              className: "DBStoreStrategy",
              symbols: {
                  "pb1908": {
                      clientName: SupportClients.CTP
                  }
              },
              BarType: KBarType.Second,
              BarInterval: 18,
              step: 5,
              total: 2,
              totalSymbols: 30,
              needCloseYesterday: true,
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
