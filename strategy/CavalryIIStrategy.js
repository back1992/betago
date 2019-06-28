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
class CavalryStrategy extends BaseStrategy {
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
        this.buyPrice = null;
        this.stopPrice = null;

        this.signal = 0;
        this.lastSignal = null;
        this.stopStep = 0;
        this.score = 0;
        this.position = 0;
        global.actionFlag = {};
        global.cavalryPrice = {};
        global.stopPrice = {};
        global.scoreTime = {};
        this.open = false;
        this.isOpened = false;
    }


    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        this.signal = global.actionFlag[closedBar.symbol];
        //
        if(this.signal >= 2 ) {
          this.thresholdPrice = global.cavalryPrice[closedBar.symbol];
          this.stopPrice = global.stopPrice[closedBar.symbol];
        }
        if (this.thresholdPrice) {
            if (closedBar.closePrice < this.stopPrice) {
                this.flag = false;
            }else if (closedBar.closePrice > this.thresholdPrice) {
                this.flag = true
          }
        console.log(this.thresholdPrice, this.stopPrice , this.flag);
      }
    }

    OnNewBar(newBar) {
        console.log(newBar.symbol + "---" + newBar.startDatetime.toLocaleString() + " flag: " + this.flag + " thresholdPrice: " + this.thresholdPrice + " signal: " + this.signal);
        console.log( global.actionFlag[newBar.symbol],   global.cavalryPrice[newBar.symbol], global.stopPrice[newBar.symbol], global.scoreTime[newBar.symbol]);
        mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
            if (err) {
                console.error(err);
                return
            }
            const db = client.db('destiny');
            const collection = db.collection('signalFreq');
            collection.find({
                "ctpContract": newBar.symbol,
            }).sort({"utime": -1}).limit(1).toArray((err, items) => {
            // }).sort({$utime: 1}).toArray((err, items) => {
                if (items.length !== 0) {
                    // global.cavalryPrice[newBar.symbol] = items[items.length-1]['price']['high'];
                    // global.stopPrice[newBar.symbol] = items[items.length-1]['price']['low'];
                    global.cavalryPrice[newBar.symbol] = items[0]['price']['high'];
                    global.stopPrice[newBar.symbol] = items[0]['price']['low'];
                    global.actionFlag[newBar.symbol] = items[0]['score'];
                    global.scoreTime[newBar.symbol] = items[0]['time'];
                }
            })
        });
    }

    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
        global.withdrawQuota = tradingAccountInfo["WithdrawQuota"];
        global.Balance = tradingAccountInfo["Balance"];
    }

    _openLong(tick, up = 0) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvilableSum(tick);
        if (sum >= 1) {
          if(this.isOpened === false){
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.Open);
            this.buyPrice = price;
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

    _closeTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongTodayPosition();
        if (todayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
            this.open = false;
            this.isOpened = false;
            // this.thresholdPrice = null;
        }
    }

    _closeYesterdayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongYesterdayPosition();
        if (todayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseYesterday);
            // this.thresholdPrice = null;
        }
    }

    _graduateLong(tick) {
        let profit = (tick.lastPrice - this.buyPrice) / tick.lastPrice;
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
            this.position = position.GetLongTodayPosition();
        }
        switch (tradeState) {
            // timeOffset
            case 0:
                // this.thresholdPrice = null;
                if (position != undefined) {
                    this._closeYesterdayLongPositions(tick, position, 1);
                }
                break;
            // time to close
            case -1:
                if (position != undefined) {
                    this._closeTodayLongPositions(tick, position, 1);
                }
                break;
            // trade time
            default :
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                    if (this.flag === true) {
                        if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                            if (position === undefined) {
                                this._openLong(tick);
                                this.flag = null;
                            } else {
                                let todayLongPositions = position.GetLongTodayPosition();
                                if (todayLongPositions < this.total) {
                                    this._openLong(tick);
                                    this.flag = null
                                }
                            }
                        }
                    } else if (this.flag === false) {
                        if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
                            if (position != undefined) {
                                this._closeTodayLongPositions(tick, position);
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

module.exports = CavalryStrategy;