// let talib = require('./build/Release/talib');
let BaseStrategy = require("./baseStrategy");
require("../systemConfig");
let TimeIndicator = require("../util/TimeIndicator");
const dateformat = require('dateformat');
const mongo = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';

// let Action = require("../util/Action")

class MongoSellStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.flag = null;
        this.step = 0.005;
        this.thresholdPrice = null;
        this.stopPrice = null;
        this.direction = null;
        global.actionFlag = [];
        global.stopPrice = [];
        global.thresholdPrice = [];
    }


    OnClosedBar(closedBar) {
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length !== 0) {
            for (let index in unFinishOrderList) {
                let unFinishOrder = unFinishOrderList[index];
                global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
            }
        }


        // console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
        if (global.actionFlag[closedBar.symbol] >= 2) {
            this.direction = "long";
        } else if (global.actionFlag[closedBar.symbol] <= -2) {
            this.direction = "short";
            this.thresholdPrice = global.thresholdPrice[closedBar.symbol];
            this.stopPrice = global.stopPrice[closedBar.symbol];
        } else {
            this.direction = null
        }
    }

    OnNewBar(newBar) {
        let NowDateTime = new Date();
        let NowDateStr = dateformat(NowDateTime, 'yyyy-mm-dd');
        mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
            if (err) {
                console.error(err);
                return
            }
            const db = client.db('destiny');
            const collection = db.collection('fsignals');
            collection.find({
                "ctpContract": newBar.symbol,
                "date": NowDateStr
            // }).sort({$utime: -1}).limit(1).toArray((err, items) => {
            }).sort({$utime: 1}).toArray((err, items) => {
                console.log(items[items.length-1]);
                if (items.length !== 0) {
                    if (items[items.length-1]['score'] >= 2 || items[items.length-1]['score'] <= -2 ) {
                      console.log("items[0]['score']", items[items.length-1]['score']);
                    }
                    global.actionFlag[newBar.symbol] = items[items.length-1]['score'];
                    global.thresholdPrice[newBar.symbol] = items[items.length-1]['price']['low'];
                    global.stopPrice[newBar.symbol] = items[items.length-1]['price']['high'];
                } else {
                    global.actionFlag[newBar.symbol] = null;
                }
            })
        });

        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice + ",global.actionFlag of:" + newBar.symbol + ": " + global.actionFlag[newBar.symbol]);
        console.log(newBar.symbol, this.thresholdPrice, this.flag, this.stopPrice);
    }

    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
    }

    _getAvilableSum(tick) {
        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
        let upperFutureName = contract.futureName.toUpperCase();
        let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        let unit = tickFutureConfig.Unit;
        let marginRate = tickFutureConfig.MarginRate;
        return Math.floor(global.availableFund / (tick.lastPrice * unit * marginRate));
    }


    _openShort(tick) {
        let priceUp = tick.lastPrice;
        let position = this.GetPosition(tick.symbol);
        if (position === undefined) {
            this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Sell, OpenCloseFlagType.Open);
        } else {
            let todayShortPositions = position.GetShortTodayPosition();
            if (todayShortPositions === 0) {
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                    this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Sell, OpenCloseFlagType.Open);
                }
            }
        }
    }

    _openShortMulti(tick) {
        let priceUp = tick.lastPrice;
        let position = this.GetPosition(tick.symbol);
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (position === undefined) {
            this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Sell, OpenCloseFlagType.Open);
        } else {
            let todayShortPositions = position.GetShortTodayPosition();
            if (todayShortPositions === 0) {
                if (unFinishOrderList.length === 0) {
                    this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Sell, OpenCloseFlagType.Open);
                } else {
                  let priceDown = this.PriceDown(tick.symbol,tick.lastPrice,Direction.Sell,unFinishOrderList.length);
                    this.SendOrder(tick.clientName, tick.symbol, priceDown, 1, Direction.Sell, OpenCloseFlagType.Open);
                }
            } else {
              if (unFinishOrderList.length === 0) {
                  let priceDown = this.PriceDown(tick.symbol,tick.lastPrice,Direction.Sell,todayShortPositions);
              } else {
                let priceDown = this.PriceDown(tick.symbol,tick.lastPrice,Direction.Sell,unFinishOrderList.length + todayShortPositions);
                  this.SendOrder(tick.clientName, tick.symbol, priceDown, 1, Direction.Sell, OpenCloseFlagType.Open);
              }
            }
        }
    }





    _closeShort(tick) {
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length === 0) {
            let position = this.GetPosition(tick.symbol);
            if (position !== undefined) {
                let todayShortPositions = position.GetShortTodayPosition();
                let yesterdayShortPositions = position.GetShortYesterdayPosition();
                let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, 1);
                if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                    if (todayShortPositions > 0) {
                        this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
                    }
                    if (yesterdayShortPositions > 0) {
                        this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
                    }

                }
            }
        } else {
            for (let index in unFinishOrderList) {
                let unFinishOrder = unFinishOrderList[index];
                global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
            }
        }
    }
    _adjustSellFlag(tick) {
        if (this.thresholdPrice !== null) {
            if (tick.lastPrice < this.thresholdPrice) {
                this.flag = true;
            } else if (tick.lastPrice > this.stopPrice) {
                this.flag = false;
            } else {
                this.flag = null;
            }
        }
    }



    OnTick(tick) {
        super.OnTick(tick);
        // lastTick for close use
        this.lastTick = this.tick;
        this.tick = tick;
        this._adjustSellFlag(tick);
        let isTimeToClose = TimeIndicator._getTimeToClose(tick, 30);
        if (isTimeToClose) {
            this._closeShort(tick);
        } else {
            if (this.flag === true) {
                if (this.direction === "short") {
                    // this._closeShort(tick);
                    this.QueryTradingAccount(tick.clientName);
                    let sum = this._getAvilableSum(tick);
                    if (sum >= 1) {
                        if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
                            this._openShortMulti(tick)
                        }
                    }
                } else if (this.direction === "long") {
                    // this._closeLong(tick);
                }
            } else if (this.flag === false) {
                this._closeShort(tick);
            }
        }
    }


    Stop() {
        super.Stop();
    }
}

module.exports = MongoSellStrategy;
