/**
 * Created by Administrator on 2017/7/4.
 */
let talib = require('talib-binding');
const mongo = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");

/////////////////////// Private Method ///////////////////////////////////////////////
class AirForceIIStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.flag = null;
        this.needCloseYesterday = strategyConfig.needCloseYesterday;
        this.signal = 0;
        global.actionFlag = {};
        global.airForcePrice = {};
        global.stopPrice = {};
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        // let barList = this._loadBarFromDB(this, closedBar.symbol, 50, KBarType.Second, 1);
        // console.log(barList);
        this.closedBarList.push(closedBar);
        this.closedBarList.shift();
        this.openPrice = this.closedBarList.map(e => e["openPrice"]);
        this.highPrice = this.closedBarList.map(e => e["highPrice"]);
        this.lowPrice = this.closedBarList.map(e => e["lowPrice"]);
        this.closeprice = this.closedBarList.map(e => e["closePrice"]);
        var retMFI = talib.MFI(this.highPrice, this.lowPrice, this.closePrice, this.volume, 14);
        var retCCI = talib.CCI(this.highPrice, this.lowPrice, this.closePrice, 14);
        var retCMO = talib.CMO(this.closePrice, 14);
        var retAROONOSC = talib.AROONOSC(this.highPrice, this.lowPrice, 14);
        var retADX = talib.ADX(this.highPrice, this.lowPrice, this.closePrice, 14);
        var retRSI = talib.RSI(this.closePrice, 14);
        var mfi = retMFI[retMFI.length - 1];
        var cci = retCCI[retCCI.length - 1];
        var cmo = retCMO[retCMO.length - 1];
        var aroonosc = retAROONOSC[retAROONOSC.length - 1];
        var adx = retADX[retADX.length - 1];
        var rsi = retRSI[retRSI.length - 1];
        this.signal = this._get_signal(mfi, cci, cmo, aroonosc, adx, rsi);
        if (global.actionFlag[closedBar.symbol] <= -2 && this.signal <= -2) {
            this.flag = true;
        }
        if (this.signal >= 2) {
            this.flag = false;
        }
    }

    OnNewBar(newBar) {
        console.log(newBar.symbol + "---" + newBar.startDatetime.toLocaleString() + " flag: " + this.flag + " signal: " + this.signal);
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
                if (items.length !== 0 && items[0]['score'] <= -2) {
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

    _openShort(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvilableSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.Open);
            this.flag = null;
        }
    }

    _closeTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
        }
    }

    _closeYesterdayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortYesterdayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
        }
    }

    OnTick(tick) {
        super.OnTick(tick);
        global.NodeQuant.MarketDataDBClient.RecordTick(tick.symbol, tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let tradeState = this._getOffset(tick, 0, 30);
        let position = this.GetPosition(tick.symbol);
        if (position) {
            this.position = position.GetShortTodayPosition();
        }
        switch (tradeState) {
            // timeOffset
            case 0:
                // this.thresholdPrice = null;
                if (position) {
                    this._closeYesterdayShortPositions(tick, position, 1);
                }
                break;
            // time to close
            case -1:
                if (position) {
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
                            } else {
                                let todayShortPositions = position.GetShortTodayPosition();
                                if (todayShortPositions < this.total) {
                                    this._openShort(tick);
                                }
                            }
                        }
                    } else if (this.flag === false) {
                        if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                            if (position) {
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

module.exports = AirForceIIStrategy;
