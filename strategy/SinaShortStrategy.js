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
var request = require("request")


/////////////////////// Private Method ///////////////////////////////////////////////
class SinaShortStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        // this.total = strategyConfig.total;
        // define as infinte large
        this.total = 1000000;
        this.sinaSymbol = strategyConfig.sinaSymbol;
        this.BarInterval = strategyConfig.BarInterval;
        this.sum = 0;
        this.flag = null;
        global.actionFlag = {};
        global.actionScore = {};
        global.actionDatetime = {};
        global.actionBarInterval = {};
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        let url = `http://stock2.finance.sina.com.cn/futures/api/json.php/IndexService.getInnerFuturesMiniKLine${this.BarInterval}m?symbol=${this.sinaSymbol}`;
        request({
            url: url,
            json: true
        }, function (error, response, body) {

            if (!error && response.statusCode === 200) {
                let closedBarList = body.slice(0, 50);// Print the json response
                closedBarList.reverse();
                let highPrice = closedBarList.map(e => e["2"]);
                let lowPrice = closedBarList.map(e => e["3"]);
                let closePrice = closedBarList.map(e => e["4"]);
                let volume = closedBarList.map(e => e["5"]);
                let actionDate = closedBarList.map(e => e["0"]);
                let score = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
                global.actionScore[closedBar.symbol] = score;
                global.actionDatetime[closedBar.symbol] = actionDate[actionDate.length - 1];
                global.actionBarInterval[closedBar.symbol] = 15;
            }
        })
    }

    OnNewBar(newBar) {
        if (global.actionScore[newBar.symbol] != undefined) {
            if (global.actionScore[newBar.symbol] <= -2) {
                this.flag = true;
            } else if (global.actionScore[newBar.symbol] >= 2) {
                this.flag = false;
            } else {
                this.flag = null;
            }
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
            let subject = `Today Action Open Short ${this.name} flag: ${this.flag}`;
            let message = `${this.name} flag: ${this.flag}  时间: ${tick.date} ${tick.timeStr}`;
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
        let shortTodayPostionAveragePrice = position.GetShortTodayPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
        // if (todayShortPositions > 0 && price < shortTodayPostionAveragePrice && tick.lastPrice > tick.lowerLimit) {
        if (todayShortPositions > 0 && price < shortTodayPostionAveragePrice) {
            let exchangeName = this._getExchange(tick);
            if (exchangeName === "SHF") {
                this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.CloseToday);
            } else {
                this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.Close);
            }

            let subject = `Today Action Profit Short  ${this.name}`;
            let message = `${this.name}  时间:  ${tick.date}  ${tick.timeStr} price ${price}  shortTodayPostionAveragePrice  ${shortTodayPostionAveragePrice} todayShortPositions  ${todayShortPositions}`
            console.log(message);
            this._sendMessage(subject, message);
        }
    }

    _profitYesterdayShortPositions(tick, position, up = 0) {
        let yesterdayShortPositions = position.GetShortYesterdayPosition();
        let shortYesterdayPostionAveragePrice = position.GetShortYesterdayPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
        // if (yesterdayShortPositions > 0 && price < shortYesterdayPostionAveragePrice && tick.lastPrice > tick.lowerLimit) {
        if (yesterdayShortPositions > 0 && price < shortYesterdayPostionAveragePrice) {
            let exchangeName = this._getExchange(tick);
            if (exchangeName === "SHF") {
                this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.CloseYesterday);
            } else {
                this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.Close);
            }
            let subject = `Yesterday Action Profit Short ${this.name}`;
            let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}  shortYesterdayPostionAveragePrice  ${shortYesterdayPostionAveragePrice} yesterdayShortPositions  ${yesterdayShortPositions}`;
            this._sendMessage(subject, message);
        }
    }


    _profitShortPositions(tick, position, up = 0) {
        let shortPositions = position.GetShortPosition();
        let shortPostionAveragePrice = position.GetShortPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
        if (shortPositions > 0 && price < shortPostionAveragePrice) {
            console.log(`profit short today: ${tick.symbol}`);
            this._profitTodayShortPositions(tick, position, up);
            console.log(`profit short yesterday: ${tick.symbol}`);
            this._profitYesterdayShortPositions(tick, position, up);
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
        let tradeState = this._getOffset(tick, 0, 300);
        if (this.flag === false) {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this._profitYesterdayShortPositions(tick, position, 0);
                    this._profitTodayShortPositions(tick, position, 0);
                } else {
                    this._profitShortPositions(tick, position, 0);
                }
                this.flag = null;
            }
        }
        switch (tradeState) {
            // timeOffset
            case 0:
                this._cancelOrder();
                break;
            // time to close
            case -1:
                this._cancelOrder();
                let position = this.GetPosition(tick.symbol);
                if (position) {
                    let exchangeName = this._getExchange(tick);
                    if (exchangeName === "SHF") {
                        this._profitYesterdayShortPositions(tick, position, 0);
                        this._profitTodayShortPositions(tick, position, 0);
                    } else {
                        this._profitShortPositions(tick, position, 0);
                    }
                }
                break;
            // trade time
            default :
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                    if (this.flag === true && this.lastFlag != false) {
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

module.exports = SinaShortStrategy;
