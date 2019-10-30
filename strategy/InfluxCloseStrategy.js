/**
 * Created by Administrator on 2017/7/4.
 */
// let talib = require('talib-binding');
require("../systemConfig");
require("../util/Position");
require("../util/MyPostMan");
const Indicator = require("../util/Indicator");
const dotenv = require('dotenv');
dotenv.config();
var _ = require('lodash');
var BaseStrategy = require("./baseStrategy");


/////////////////////// Private Method ///////////////////////////////////////////////
class InfluxCloseStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.flag = null;
        this.signal = 0;
        this.closedBarList = [];
        global.actionFlag = {};
        global.actionScore = {};
        global.actionDatetime = {};
        global.actionBarInterval = {};
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        if (this.closedBarList) {
            this.closedBarList.push(closedBar);
            if (this.closedBarList.length > 50) {
                this.closedBarList.shift();
            }
            let highPrice = this.closedBarList.map(e => e["highPrice"]);
            let lowPrice = this.closedBarList.map(e => e["lowPrice"]);
            let closePrice = this.closedBarList.map(e => e["closePrice"]);
            let volume = this.closedBarList.map(e => e["volume"]);
            this.signal = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
            this.signalTime = this.closedBarList[this.closedBarList.length - 1]["date"] + " " + this.closedBarList[this.closedBarList.length - 1]["timeStr"];
        }
        if (this.signal >= 2) {
            if (global.actionScore[closedBar.symbol] >= 2) {
                this.flag = "long";
            }
        } else if (this.signal <= -2) {
            if (global.actionScore[closedBar.symbol] <= -2) {
                console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
                console.log(`${closedBar.symbol} signal: ${this.signal} global.actionScore: ${global.actionScore[closedBar.symbol]}  flag: ${this.flag}`);
                this.flag = "short";
            }
        } else {
            this.flag = null;
        }
    }

    OnNewBar(newBar) {
        let LookBackCount = 50;
        let BarType = KBarType.Minute;
        // let BarInterval = 15;
        let intervalArray = [2, 5, 15, 30];
        let BarInterval = intervalArray[Math.floor(Math.random() * intervalArray.length)];
        // query every four  to low down the db stress
        if (BarInterval === 2) {
            // if(true){
            global.NodeQuant.MarketDataDBClient.barrange([newBar.symbol, BarInterval, LookBackCount, -1], function (err, ClosedBarList) {
                if (err) {
                    console.log("从" + newBar.symbol + "的行情数据库LoadBar失败原因:" + err);
                    //没完成收集固定K线个数
                    MyOnFinishLoadBar(strategy, newBar.symbol, BarType, BarInterval, undefined);
                    return;
                }
                let highPrice = ClosedBarList.map(e => e["highPrice"]);
                let lowPrice = ClosedBarList.map(e => e["lowPrice"]);
                let closePrice = ClosedBarList.map(e => e["closePrice"]);
                let volume = ClosedBarList.map(e => e["volume"]);
                let actionDate = ClosedBarList.map(e => e["actionDate"]);
                let timeStr = ClosedBarList.map(e => e["timeStr"]);
                let score = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
                global.actionScore[newBar.symbol] = score;
                global.actionDatetime[newBar.symbol] = actionDate[actionDate.length - 1] + " " + timeStr[timeStr.length - 1];
                global.actionBarInterval[newBar.symbol] = BarInterval;
                var filtered = _.pickBy(global.actionScore, function (score) {
                    return score > 2 || score < -2;
                });
                if (score >= 2 || score <= -2) {
                    console.log(`${newBar.symbol} : ${score}  ${global.actionDatetime[newBar.symbol]}`);
                }
                // console.log(actionDate[actionDate.length - 1] + " " + timeStr[timeStr.length - 1]);
                // console.log(global.actionScore);
            });
        }
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }



    _closeYesterdayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.GetLongYesterdayPosition();
        if (yesterdayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.CloseYesterday);
        }
    }

    _closeYesterdayShortPositions(tick, position, up = 0) {
        let yesterdayShortPositions = position.GetShortYesterdayPosition();
        if (yesterdayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
        }
    }


    OnTick(tick) {
        super.OnTick(tick);
        if (this.flag === "long") {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                this._cancelOrder();
                this._closeYesterdayLongPositions(tick, position, 0)
                this.flag = null;
            }
        } else if (this.flag === "short") {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                this._cancelOrder();
                this._closeYesterdayShortPositions(tick, position, 0)
                this.flag = null;
            }
        }

    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = InfluxCloseStrategy;
