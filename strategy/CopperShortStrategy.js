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
class CopperShortStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.needCloseYesterday = strategyConfig.needCloseYesterday;
        this.total = strategyConfig.total;
        this.canOpenToday = strategyConfig.canOpenToday;
        this.flag = null;
        this.signal = 0;
        this.lastSignal = 0;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        this.lastSignal = this.signal;
        if (this.closedBarList === undefined) {
            this.closedBarList = [];
        }

        this.closedBarList.push(closedBar);
        if (this.closedBarList.length > 50) {
            this.closedBarList.shift();
        }
        let highPrice = this.closedBarList.map(e => e["highPrice"]);
        let lowPrice = this.closedBarList.map(e => e["lowPrice"]);
        let closePrice = this.closedBarList.map(e => e["closePrice"]);
        let volume = this.closedBarList.map(e => e["volume"]);
        this.signal = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
    }

    OnNewBar(newBar) {
        // console.log(this.name + "策略的" + newBar.symbol + "K线结束,结束时间:" + newBar.endDatetime.toLocaleString() + ",Close价:" + newBar.closePrice);
        //   console.log(`${newBar.symbol} signal: ${this.signal}  flag: ${this.flag}  `);
        if (this.signal <= -2) {
            if (this.lastSignal > -2) {
                this._cancelOrder();
                this.flag = true;
                console.log(`${this.name}  策略的  ${newBar.symbol}  K线结束,结束时间: ${newBar.endDatetime.toLocaleString()}  Close价: ${newBar.closePrice} signal: ${this.signal}  flag: ${this.flag} canOpenToday : ${this.canOpenToday}`);

            }
        } else if (this.signal >= 2) {
            this._cancelOrder();
            // this.flag = this.needCloseYesterday ? "close" : false;
            this.flag = global.availableFund < 0  ? "close" : false;
            console.log(`${this.name}  策略的  ${newBar.symbol}  K线结束,结束时间: ${newBar.endDatetime.toLocaleString()}  Close价: ${newBar.closePrice} signal: ${this.signal}  flag: ${this.flag} canOpenToday : ${this.canOpenToday}`);
        } else {
            this.flag = null;
        }
        // console.log(`${this.name}  策略的  ${newBar.symbol}  K线结束,结束时间: ${newBar.endDatetime.toLocaleString()}  Close价: ${newBar.closePrice} signal: ${this.signal}  flag: ${this.flag} canOpenToday : ${this.canOpenToday}`);
    }

    // OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
    //     this.closedBarList = ClosedBarList;
    // }

    _openShort(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvailabelSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.Open);
            let subject = `Today ${Math.floor(global.Balance)}  Short ${this.name}   signal: ${this.signal}`;
            let message = `${this.name}  signal: ${this.signal} flag: ${this.flag}  时间: ${tick.date} ${tick.timeStr}`;
            this._sendMessage(subject, message);
            this.flag = null;
        }
    }


    _profitTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let shortTodayPostionAveragePrice = position.GetShortTodayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            if (price < shortTodayPostionAveragePrice) {
                let subject = `Today ${Math.floor(global.Balance)}  Profit Short  ${this.name}  signal: ${this.signal}`;
                let message = `${this.name}  signal:  ${this.signal}  flag: ${this.flag}  时间: ${tick.date} ${tick.timeStr}`;
                message += `price ${price}  shortTodayPostionAveragePrice  ${shortTodayPostionAveragePrice} todayShortPositions  ${todayShortPositions}`
                todayShortPositions = 1;
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.Close);
                }
                // console.log(message);
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
                let subject = `YesterdayProfit Short  ${this.name}  signal: ${this.signal}`;
                let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice price ${price}  shortYesterdayPostionAveragePrice  ${shortYesterdayPostionAveragePrice} yesterdayShortPositions  ${yesterdayShortPositions}}`;
                yesterdayShortPositions = 1;
                this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.Buy, OpenCloseFlagType.Close);
                this._sendMessage(subject, message);
            }

        }
        // if (yesterdayShortPositions > 0 && price < shortYesterdayPostionAveragePrice ) {
    }


    _profitShortPositions(tick, position, up = 0) {
        let shortPositions = position.GetShortPosition();
        let shortPostionAveragePrice = position.GetShortPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
        // console.log(`shortPositions: ${shortPositions}, shortPostionAveragePrice: ${shortPostionAveragePrice}, price: ${price}`);
        if (shortPositions > 0 && price < shortPostionAveragePrice && tick.lastPrice > tick.lowerLimit) {
            this._profitTodayShortPositions(tick, position, up);
            this._profitYesterdayShortPositions(tick, position, up);
        }
    }


    _closeYesterdayShortPositions(tick, position, up = 0) {
        let yesterdayShortPositions = position.GetShortYesterdayPosition();
        if (yesterdayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
            let subject = `Yesterday Action Close Short  ${this.name}  signal: ${this.signal}`;
            let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice price ${price}  yesterdayShortPositions  ${yesterdayShortPositions}}`;
            this._sendMessage(subject, message);
        }
    }


    OnTick(tick) {
        super.OnTick(tick);
        // global.NodeQuant.MarketDataDBClient.RecordTick(tick.symbol, tick);
        let tradeState = this._getOffset(tick, 168, 18);
        if (this.flag === false) {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                this._profitShortPositions(tick, position, 0);
                this.flag = null;
            }
        } else if (this.flag === "close") {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.CloseYesterday);
            this.flag = null
        }
        switch (tradeState) {
            // timeOffset
            case 0:
                if (this.canOpenToday === false && this.signal != 0) {
                    let position = this.GetPosition(tick.symbol);
                    if (position) {
                        this._profitShortPositions(tick, position, 0);
                        let shortPositions = position.GetShortPosition();
                        if (shortPositions === 0) {
                            this.canOpenToday = true;
                        }
                    }
                }
                break;
            // time to close
            case -1:
                this._cancelOrder();
                let position = this.GetPosition(tick.symbol);
                if (position) {
                    this._profitShortPositions(tick, position, 1);
                }
                break;
                //    time to cancel
            case -2:
                this._cancelOrder();
                break;
            // trade time
            default :
                if (this.flag === true) {
                    let position = this.GetPosition(tick.symbol);
                    if (position === undefined) {
                        this._openShort(tick);
                    } else {
                        let shortPositions = position.GetShortPosition();
                        if (this.canOpenToday === true) {
                            if (shortPositions < this.total) {
                                this._openShort(tick);
                            }
                        } else {
                            if (shortPositions < 1) {
                                this._openShort(tick);
                                this.canOpenToday = true;
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

module.exports = CopperShortStrategy;
