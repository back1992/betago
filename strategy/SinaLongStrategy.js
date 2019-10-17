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
class SinaLongStrategy extends BaseStrategy {
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
                console.log(`${closedBar.symbol}: ${score}`);
                console.log(closedBarList[closedBarList.length - 1]);
                global.actionScore[closedBar.symbol] = score;
                global.actionDatetime[closedBar.symbol] = actionDate[actionDate.length - 1];
                global.actionBarInterval[closedBar.symbol] = 15;
                if (score > 1 || score < -1) {
                    console.log(global.actionDatetime)
                    console.log(global.actionScore);
                }
            }
        })
    }

    OnNewBar(newBar) {
        this._cancelOrder();
        if (global.actionScore[newBar.symbol] != undefined) {
            if (global.actionScore[newBar.symbol] >= 2) {
                this.flag = true;
            } else if (global.actionScore[newBar.symbol] <= -2) {
                this.flag = false;
            } else {
                this.flag = null;
            }
        }
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }


    OnQueryTradingAccount(tradingAccountInfo) {
        // console.log(tradingAccountInfo);
        global.availableFund = tradingAccountInfo["Available"];
        global.withdrawQuota = tradingAccountInfo["WithdrawQuota"];
        global.Balance = tradingAccountInfo["Balance"];
    }


    _getAvailabelSum(tick) {
        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
        let upperFutureName = contract.futureName.toUpperCase();
        let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        let unit = tickFutureConfig.Unit;
        let marginRate = tickFutureConfig.MarginRate;
        let priceUnit = tick.lastPrice * unit * marginRate;
        let availabelSum = Math.floor(global.availableFund / priceUnit);
        if (availabelSum < 1) {
            let subject = `Sina Money is Out ${this.name}`;
            let message = `${tick.symbol}  的Tick,时间: ${tick.date}  ${tick.timeStr} availabelSum： ${availabelSum},  global.availableFund  ${global.availableFund}, unit ${unit}, marginRate ${marginRate}, tick.lastPrice ${tick.lastPrice}, priceUnit ${priceUnit}`;
            this._sendMessage(subject, message);
        }
        // console.log(`${tick.symbol}  的Tick,时间: ${tick.date}  ${tick.timeStr} availabelSum： ${availabelSum},  global.availableFund  ${global.availableFund}, unit ${unit}, marginRate ${marginRate}, tick.lastPrice ${tick.lastPrice}, priceUnit ${priceUnit}`);
        return availabelSum;
    }

    _openLong(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvailabelSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.Open);
            let subject = `Sina Today Action Open Long ${this.name} flag: ${this.flag}`;
            let message = `${this.name} flag: ${this.flag}  时间: ${tick.date} ${tick.timeStr}`;
            this._sendMessage(subject, message);
            console.log(message);
            this.flag = null;
        }
    }


    _profitMyTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.MyGetLongTodayPosition();
        if (todayLongPositions > 0) {
            let longTodayPostionAveragePrice = position.MyGetLongTodayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            let subject = `Sina Today Action Profit Long  ${this.name}`;
            let message = `${this.name}  时间:  ${tick.date}  ${tick.timeStr} price ${price}  longTodayPostionAveragePrice  ${longTodayPostionAveragePrice} todayLongPositions  ${todayLongPositions}`
            console.log(message);
            this._sendMessage(subject, message);
            if (price > longTodayPostionAveragePrice && tick.lastPrice < tick.upperLimit) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                }
            }
        }
    }


    _profitMyYesterdayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.MyGetLongYesterdayPosition();
        if (yesterdayLongPositions > 0) {
            let longYesterdayPostionAveragePrice = position.MyGetLongYesterdayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            let subject = `Sina Yesterday Action Profit Long ${this.name}`;
            let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}  longYesterdayPostionAveragePrice  ${longYesterdayPostionAveragePrice} yesterdayLongPositions  ${yesterdayLongPositions}`;
            this._sendMessage(subject, message);
            if (price > longYesterdayPostionAveragePrice && tick.lastPrice < tick.upperLimit) {
                this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
            }
        }
    }


    _checkPrice(tick, position, up = 0) {
        let longPositions = position.GetLongPosition();
        let longPostionAveragePrice = position.GetLongPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        return price > longPostionAveragePrice;
    }


    _profitMyLongPositions(tick, position, up = 0) {
        let longPositions = position.GetLongPosition();
        let longPostionAveragePrice = position.GetLongPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        if (longPositions > 0 && price > longPostionAveragePrice) {
            this._profitMyTodayLongPositions(tick, position, up);
            this._profitMyYesterdayLongPositions(tick, position, up);
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
                    this._profitMyYesterdayLongPositions(tick, position, 0);
                    this._profitMyTodayLongPositions(tick, position, 0);
                } else {
                    this._profitMyLongPositions(tick, position, 0);
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
                        this._profitMyYesterdayLongPositions(tick, position, 0);
                        this._profitMyTodayLongPositions(tick, position, 0);
                    } else {
                        this._profitMyLongPositions(tick, position, 0);
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

module.exports = SinaLongStrategy;
