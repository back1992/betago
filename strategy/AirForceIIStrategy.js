/**
 * Created by Administrator on 2017/7/4.
 */
const dateformat = require('dateformat');
let FixedArray = require("fixed-array");
let talib = require('talib-binding');
var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");
const mongo = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const http = require('http');


/////////////////////// Private Method ///////////////////////////////////////////////
class AirForceStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.thresholdPrice = null;
        this.step = strategyConfig.step;
        this.flag = null;
        this.needCloseYesterday = strategyConfig.needCloseYesterday;
        this.needSleep = false;
        this.sellPrice = null;
        this.stopPrice = null;

        this.signal = 0;
        this.openPrice = [];
        this.highPrice = [];
        this.lowPrice = [];
        this.closePrice = [];
        this.volume = [];
        // this.id = FixedArray(50);
        this.lastSignal = null;
        this.stopStep = 0;
        this.score = 0;
        this.open = false;
        this.isOpened = false;
        global.actionFlag = {};
        global.airForcePrice = {};
        global.stopPrice = {};
    }



    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {

        // this.lastSignal = this.signal;
        this.signal = global.actionFlag[closedBar.symbol];
        if(this.signal <= -2) {
          this.thresholdPrice = global.airForcePrice[closedBar.symbol];
          this.stopPrice = global.stopPrice[closedBar.symbol];
        }

        if (this.thresholdPrice) {
            if (closedBar.closePrice > this.stopPrice) {
                this.flag = false;
            }else if (closedBar.closePrice < this.thresholdPrice) {
                this.flag = true
            }
        }
    }

    OnNewBar(newBar) {
      console.log(newBar.symbol + "---" + newBar.startDatetime.toLocaleString() + " flag: " + this.flag + " thresholdPrice: " + this.thresholdPrice + " signal: " + this.signal);
      mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
          if (err) {
              console.error(err);
              return
          }
          const db = client.db('destiny');
          const collection = db.collection('signalFreq');
          collection.find({
              "ctpContract": newBar.symbol,
              // "date": NowDateStr
          // }).sort({$utime: -1}).limit(1).toArray((err, items) => {
          }).sort({"utime": -1}).limit(1).toArray((err, items) => {
              // console.log(items);
              if (items.length !== 0) {
                  global.airForcePrice[newBar.symbol] = items[0]['price']['low'];
                  global.stopPrice[newBar.symbol] = items[0]['price']['high'];
                  global.actionFlag[newBar.symbol] = items[0]['score'];
              }
          })
      });
    }


    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
        global.withdrawQuota = tradingAccountInfo["WithdrawQuota"];
        global.Balance = tradingAccountInfo["Balance"];
    }

    _openShort(tick, up = 0) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvilableSum(tick);
        if (sum >= 1) {
          if(this.isOpened === false){
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Open);
            this.sellPrice = price;
            this.open = true;
          }
        } else {
            if(this.open === false){
              this.thresholdPrice = null;
            }else{
              this.isOpened = true;
            }
            this.flag = null;
        }
    }

    _closeTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
            this.open = false;
            this.isOpened = false;
            // this.thresholdPrice = null;
        }
    }

    _closeYesterdayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortYesterdayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
            // this.thresholdPrice = null;
        }
    }

    _graduateShort(tick) {
        let profit = (this.sellPrice - tick.lastPrice) / tick.lastPrice;
        if (profit > 0.008) {
            this.flag = false;
        }
    }

    OnTick(tick) {
        super.OnTick(tick);
        global.NodeQuant.MarketDataDBClient.RecordTick(tick.symbol, tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let tradeState = this._getOffset(tick, 0, 30);
        let position = this.GetPosition(tick.symbol);
        if (position != undefined) {
            this.position = position.GetShortTodayPosition();
        }
        switch (tradeState) {
            // timeOffset
            case 0:
                // this.thresholdPrice = null;
                if (position != undefined) {
                    this._closeYesterdayShortPositions(tick, position, 1);
                }
                break;
            // time to close
            case -1:
                if (position != undefined) {
                    this._closeTodayShortPositions(tick, position, 1);
                }
                break;
            // trade time
            default :
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                    if (this.flag === true) {
                        if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
                            if (position === undefined) {
                                this._openShort(tick);
                                this.flag = null;
                            } else {
                                let todayShortPositions = position.GetShortTodayPosition();
                                if (todayShortPositions < this.total) {
                                    this._openShort(tick);
                                    this.flag = null;
                                }
                            }
                        }
                    } else if (this.flag === false) {
                        if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                            if (position != undefined) {
                                this._closeTodayShortPositions(tick, position);
                            }
                        }
                    }
                }
        }
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = AirForceStrategy;
