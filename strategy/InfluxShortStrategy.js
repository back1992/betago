/**
 * Created by Administrator on 2017/7/4.
 */
let talib = require('talib-binding');
// import _get_talib_indicator from "../util/Indicator";
// import { _get_talib_indicator } from "../util/Indicator";
var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");
require("../util/MyPostMan");

function _get_signal(mfi, cci, cmo, aroonosc, adx, rsi) {
    let score = 0;
    if (cci > 100) {
        score -= 1
    } else if (cci < -100) {
        score += 1
    }
    if (mfi > 80) {
        score -= 1
    } else if (mfi < 20) {
        score += 1
    }
    if (cmo > 50) {
        score -= 1
    } else if (cmo < -50) {
        score += 1
    }
    if (aroonosc < -50) {
        score -= 1
    } else if (aroonosc > 50) {
        score += 1
    }
    if (rsi > 70) {
        score -= 1
    } else if (rsi < 30) {
        score += 1
    }
    return score
}

function _get_talib_indicator(strategy, highPrice, lowPrice, closePrice, volume) {
    let retMFI = talib.MFI(highPrice, lowPrice, closePrice, volume, 14);
    let retCCI = talib.CCI(highPrice, lowPrice, closePrice, 14);
    let retCMO = talib.CMO(closePrice, 14);
    let retAROONOSC = talib.AROONOSC(highPrice, lowPrice, 14);
    let retADX = talib.ADX(highPrice, lowPrice, closePrice, 14);
    let retRSI = talib.RSI(closePrice, 14);
    let mfi = retMFI[retMFI.length - 1];
    let cci = retCCI[retCCI.length - 1];
    let cmo = retCMO[retCMO.length - 1];
    let aroonosc = retAROONOSC[retAROONOSC.length - 1];
    let adx = retADX[retADX.length - 1];
    let rsi = retRSI[retRSI.length - 1];
    return _get_signal(mfi, cci, cmo, aroonosc, adx, rsi);
}

/////////////////////// Private Method ///////////////////////////////////////////////
class InfluxShortStrategy extends BaseStrategy {
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
            this.signal = _get_talib_indicator(highPrice, lowPrice, closePrice, volume);
        }

        if (this.signal >= 2) {
            this.flag = false;
        } else if (this.signal <= -2) {
            if (global.actionScore[closedBar.symbol] <= -2) {
                this.flag = (this.flag != true) ? true : null;
                let message = this.name + " signal: " + this.signal + " " + global.actionBarInterval[closedBar.symbol] + "M: " + global.actionScore[closedBar.symbol] + " " + global.actionDatetime[closedBar.symbol] + " flag: " + this.flag + " 时间: " + closedBar.endDatetime.toLocaleString();
                console.log(message);
                if (this.flag) {
                    // 设置邮件内容（谁发送什么给谁）
                    let mailOptions = {
                        from: '"林慕空 👻" <465613067@qq.com>', // 发件人
                        to: '465613067@qq.com, 13261871395@163.com', // 收件人
                        subject: this.name + " signal: " + this.signal, // 主题
                        text: message, // plain text body
                        html: `<b>${message}</b>`, // html body
                    };
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            return console.log(error);
                        }
                    });
                }
            } else {
                this.flag = null;
            }
        }
        // console.log(this.name + " signal: " + this.signal + " " + global.actionBarInterval[closedBar.symbol] + "M: " + global.actionScore[closedBar.symbol] + " " + global.actionDatetime[closedBar.symbol] + " flag: " + this.flag + " 时间: " + closedBar.endDatetime.toLocaleString());
    }

    OnNewBar(newBar) {
        let LookBackCount = 50;
        let BarType = KBarType.Minute;
        let intervalArray = [5, 15, 30, 60];
        let BarInterval = intervalArray[Math.floor(Math.random() * intervalArray.length)];
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
            let actionDatetime = ClosedBarList.map(e => e["actionDatetime"]);
            let volume = ClosedBarList.map(e => e["volume"]);
            let score = _get_talib_indicator(highPrice, lowPrice, closePrice, volume);
            global.actionScore[newBar.symbol] = score;
            global.actionDatetime[newBar.symbol] = actionDatetime[actionDatetime.length - 1];
            global.actionBarInterval[newBar.symbol] = BarInterval;
        });
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        // console.log(ClosedBarList);
        this.closedBarList = ClosedBarList;
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

    _profitTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let shortTodayPostionAveragePrice = position.GetShortTodayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            if (price < shortTodayPostionAveragePrice) {
                this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
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


    OnTick(tick) {
        super.OnTick(tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let tradeState = this._getOffset(tick, 0, 30);
        let position = this.GetPosition(tick.symbol);
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
                    // this._closeTodayShortPositions(tick, position, 1);
                    this._profitTodayShortPositions(tick, position, 1);
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
                                this._profitTodayShortPositions(tick, position);
                                // 设置邮件内容（谁发送什么给谁）
                                let mailOptions = {
                                    from: '"林慕空 👻" <465613067@qq.com>', // 发件人
                                    to: '465613067@qq.com, 13261871395@163.com', // 收件人
                                    subject: this.name + " signal: " + this.signal, // 主题
                                    text: message, // plain text body
                                    html: `<b>${message}</b>`, // html body
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        return console.log(error);
                                    }
                                });
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

module.exports = InfluxShortStrategy;
