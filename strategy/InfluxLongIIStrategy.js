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
class InfluxLongStrategy extends BaseStrategy {
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
            let openPrice = this.closedBarList.map(e => e["openPrice"]);
            let highPrice = this.closedBarList.map(e => e["highPrice"]);
            let lowPrice = this.closedBarList.map(e => e["lowPrice"]);
            let closePrice = this.closedBarList.map(e => e["closePrice"]);
            let volume = this.closedBarList.map(e => e["volume"]);
            this.signal = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
            this.signalTime = this.closedBarList[this.closedBarList.length - 1]["date"] + " " + this.closedBarList[this.closedBarList.length - 1]["timeStr"];
        }
        if (this.signal >= 2) {
            if (global.actionScore[closedBar.symbol] >= 2) {
                this.flag = true;
            } else {
                this.flag = null;
            }
            // let message = this.name + " signal: " + this.signal + " " + this.signalTime + " " + global.actionBarInterval[closedBar.symbol] + "M: " + global.actionScore[closedBar.symbol] + " " + global.actionDatetime[closedBar.symbol] + " flag: " + this.flag + " 时间: " + closedBar.endDatetime.toLocaleString();
            // console.log(message);
        } else if (this.signal <= -2) {
            this.flag = false;
            // let message = this.name + " signal: " + this.signal + " " + this.signalTime + " " + global.actionBarInterval[closedBar.symbol] + "M: " + global.actionScore[closedBar.symbol] + " " + global.actionDatetime[closedBar.symbol] + " flag: " + this.flag + " 时间: " + closedBar.endDatetime.toLocaleString();
            // console.log(message);
        } else {
            this.flag = null;
        }
    }

    OnNewBar(newBar) {
        let LookBackCount = 50;
        let BarType = KBarType.Minute;
        let intervalArray = [5, 15, 30, 60];
        let BarInterval = intervalArray[Math.floor(Math.random() * intervalArray.length)];
        if (BarInterval != 0) {
            global.NodeQuant.MarketDataDBClient.barrange([newBar.symbol, BarInterval, LookBackCount, -1], function (err, ClosedBarList) {
                if (err) {
                    console.log("从" + newBar.symbol + "的行情数据库LoadBar失败原因:" + err);
                    //没完成收集固定K线个数
                    MyOnFinishLoadBar(strategy, newBar.symbol, BarType, BarInterval, undefined);
                    return;
                }
                let openPrice = ClosedBarList.map(e => e["openPrice"]);
                let highPrice = ClosedBarList.map(e => e["highPrice"]);
                let lowPrice = ClosedBarList.map(e => e["lowPrice"]);
                let closePrice = ClosedBarList.map(e => e["closePrice"]);
                let volume = ClosedBarList.map(e => e["volume"]);
                // let actionDatetime = ClosedBarList.map(e => e["actionDatetime"]);
                let actionDate = ClosedBarList.map(e => e["actionDate"]);
                let timeStr = ClosedBarList.map(e => e["timeStr"]);
                let score = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
                if (score >= 2 || score <= -2) {
                    global.actionScore[newBar.symbol] = score;
                    global.actionDatetime[newBar.symbol] = actionDate[actionDate.length - 1] + " " + timeStr[timeStr.length - 1];
                    global.actionBarInterval[newBar.symbol] = BarInterval;
                    // console.log(global.actionScore);
                }
                var filtered = _.pickBy(global.actionScore, function (score) {
                    return score > 1 || score < -1;
                });
                if (score >= 2 || score <= -2) {
                    console.log(actionDate[actionDate.length - 1] + " " + timeStr[timeStr.length - 1]);
                    console.log(filtered);
                }
            });
        }
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }


    _openLong(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvailabelSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.Open);
            let subject = "Today Action Open Long " + this.name + " signal: " + this.signal;
            let message = this.name + " signal: " + this.signal + " " + this.signalTime + " " + global.actionBarInterval[tick.symbol] + "M: " + global.actionScore[tick.symbol] + " " + global.actionDatetime[tick.symbol] + " flag: " + this.flag + " 时间: " + tick.date + " " + tick.timeStr;
            this._sendMessage(subject, message);
            console.log(message);
            this.flag = null;
        }
    }

    _closeTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongTodayPosition();
        if (todayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
        }
    }

    _profitTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongTodayPosition();
        if (todayLongPositions > 0) {
            let longTodayPostionAveragePrice = position.GetLongTodayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (price > longTodayPostionAveragePrice) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                }
                let subject = "Today Action Profit Long  " + this.name + " signal: " + this.signal;
                let message = this.name + " signal: " + this.signal + " " + this.signalTime + " " + global.actionBarInterval[tick.symbol] + "M: " + global.actionScore[tick.symbol] + " " + global.actionDatetime[tick.symbol] + " flag: " + this.flag + " 时间: " + tick.date + " " + tick.timeStr;
                message += `price ${price}  longTodayPostionAveragePrice  ${longTodayPostionAveragePrice} todayLongPositions  ${todayLongPositions}`
                console.log(message);
                this._sendMessage(subject, message);
            }
        }
    }


    _profitYestedayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.GetLongYesterdayPosition();
        if (yesterdayLongPositions > 0) {
            let longYesterdayPostionAveragePrice = position.GetLongYesterdayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (price > longYesterdayPostionAveragePrice) {
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.CloseYesterday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                }
                let subject = "Yesterday Action Profit Long " + this.name + " signal: " + this.signal;
                let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}  longYesterdayPostionAveragePrice  ${longYesterdayPostionAveragePrice} yesterdayLongPositions  ${yesterdayLongPositions}`;
                this._sendMessage(subject, message);
            }
        }
    }


    _closeYesterdayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongYesterdayPosition();
        if (todayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseYesterday);
        }
    }

    // OnTrade(trade) {
    //     this.tradePosition.UpdatePosition(trade);
    // }


    OnTick(tick) {
        super.OnTick(tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let tradeState = this._getOffset(tick, 0, 300);
        if (this.flag === false) {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                let yesterdayLongPositions = position.GetLongYesterdayPosition();
                let todayLongPositions = position.GetLongTodayPosition();
                if (yesterdayLongPositions) {
                    this._profitYestedayLongPositions(tick, position, 0);
                }
                if (todayLongPositions) {
                    this._profitTodayLongPositions(tick, position, 0);
                }
                this.flag = null;
            }
        }
        switch (tradeState) {
            // timeOffset
            case 0:
                break;
            // time to close
            case -1:
                let position = this.GetPosition(tick.symbol);
                if (position) {
                    // this._closeTodayLongPositions(tick, position, 0);
                    let yesterdayLongPositions = position.GetLongYesterdayPosition();
                    let todayLongPositions = position.GetLongTodayPosition();
                    if (yesterdayLongPositions) {
                        this._profitYestedayLongPositions(tick, position, 0);
                    }
                    if (todayLongPositions) {
                        this._profitTodayLongPositions(tick, position, 0);
                    }
                }
                break;
            // trade time
            default :
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                    if (this.flag === true) {
                        let position = this.GetPosition(tick.symbol);
                        if (position === undefined) {
                            this._openLong(tick);
                        } else {
                            let todayLongPositions = position.GetLongTodayPosition();
                            if (todayLongPositions < this.total) {
                                this._openLong(tick);
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

module.exports = InfluxLongStrategy;
