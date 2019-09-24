/**
 * Created by Administrator on 2017/7/4.
 */
require("../systemConfig");
require("../util/Position");
require("../util/MyPostMan");
const Indicator = require("../util/Indicator");
const dotenv = require('dotenv');
dotenv.config();
var BaseStrategy = require("./baseStrategy");

/////////////////////// Private Method ///////////////////////////////////////////////
class InfluxShortIIStrategy extends BaseStrategy {
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
        this.closedBarList = [];
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
            this.flag = false;
        } else if (this.signal <= -2) {
            if (global.actionScore[closedBar.symbol] <= -2) {
                this.flag = true;
            } else {
                this.flag = null;
            }
        } else {
            this.flag = null;
        }
    }

    OnNewBar(newBar) {
        let LookBackCount = 50;
        let BarType = KBarType.Minute;
        // let intervalArray = [5, 15, 30, 60, 0, 0, 0, 0];
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
                let actionDate = ClosedBarList.map(e => e["actionDate"]);
                let timeStr = ClosedBarList.map(e => e["timeStr"]);
                let volume = ClosedBarList.map(e => e["volume"]);
                let score = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
                if (score >= 2 || score <= -2) {
                    global.actionScore[newBar.symbol] = score;
                    global.actionDatetime[newBar.symbol] = actionDate[actionDate.length - 1] + " " + timeStr[timeStr.length - 1];
                    global.actionBarInterval[newBar.symbol] = BarInterval;
                }
            });

        }
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }

    _openShort(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvailabelSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.Open);
            let subject = "Today Action Open Short " + this.name + " signal: " + this.signal;
            let message = this.name + " signal: " + this.signal + " " + this.signalTime + " " + global.actionBarInterval[tick.symbol] + "M: " + global.actionScore[tick.symbol] + " " + global.actionDatetime[tick.symbol] + " flag: " + this.flag + " 时间: " + tick.date + " " + tick.timeStr;
            this._sendMessage(subject, message);
            console.log(message);
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

    _profitTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let shortTodayPostionAveragePrice = position.GetShortTodayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            if (price < shortTodayPostionAveragePrice) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.Close);
                }
                let subject = "Today Action Profit Short  " + this.name + " signal: " + this.signal;
                let message = this.name + " signal: " + this.signal + " " + this.signalTime + " " + global.actionBarInterval[tick.symbol] + "M: " + global.actionScore[tick.symbol] + " " + global.actionDatetime[tick.symbol] + " flag: " + this.flag + " 时间: " + tick.date + " " + tick.timeStr;
                message += `price ${price}  shortTodayPostionAveragePrice  ${shortTodayPostionAveragePrice} todayShortPositions  ${todayShortPositions}`
                console.log(message);
                this._sendMessage(subject, message);
            }
        }
    }

    _profitYesterdayShortPositions(tick, position, up = 0) {
        let yesterdayShortPositions = position.GetShortYesterdayPosition();
        if (yesterdayShortPositions > 0) {
            let shortYesterdayPostionAveragePrice = position.GetShortYesterdayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            if (price < shortYesterdayPostionAveragePrice) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.Buy, OpenCloseFlagType.Close);
                }
                let subject = "Yesterday Action Profit Short  " + this.name + " signal: " + this.signal;
                let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice price ${price}  shortYesterdayPostionAveragePrice  ${shortYesterdayPostionAveragePrice} yesterdayShortPositions  ${yesterdayShortPositions}}`;
                this._sendMessage(subject, message);
            }
        }
    }


    _closeYesterdayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortYesterdayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
        }
    }


    // OnTrade(trade) {
    //     this.tradePosition.UpdatePosition(trade);
    // }


    OnTick(tick) {
        super.OnTick(tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let tradeState = this._getOffset(tick, 0, 30);
        if (this.flag === false) {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                let yesterdayShortPositions = position.GetShortYesterdayPosition();
                let todayShortPositions = position.GetShortTodayPosition();
                if (yesterdayShortPositions) {
                    this._profitYesterdayShortPositions(tick, position, 0);
                }
                if (todayShortPositions) {
                    this._profitTodayShortPositions(tick, position, 0);
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
                    let yesterdayShortPositions = position.GetShortYesterdayPosition();
                    let todayShortPositions = position.GetShortTodayPosition();
                    if (yesterdayShortPositions) {
                        this._profitYesterdayShortPositions(tick, position, 0);
                    }
                    if (todayShortPositions) {
                        this._profitTodayShortPositions(tick, position, 0);
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
                            this._openShort(tick);
                        } else {
                            let todayShortPositions = position.GetShortTodayPosition();
                            if (todayShortPositions < this.total) {
                                this._openShort(tick);
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

module.exports = InfluxShortIIStrategy;
