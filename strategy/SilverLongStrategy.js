require("../systemConfig");
require("../util/Position");
require("../util/MyPostMan");
const Indicator = require("../util/Indicator");
const dotenv = require('dotenv');
dotenv.config();
var _ = require('lodash');
var BaseStrategy = require("./baseStrategy");

// let Position = require("../util/Position");
class SilverLongStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
        global.BarCount = 0;
        // this.total = strategyConfig.total;
        // define as infinte large
        this.total = 1000000;
        this.sum = 0;
        this.flag = null;
        this.leftFund = 0;
        this.closedBarList = [];
    }


    _checkLongCondition(closedBarList) {
        let condition = null;
        if (closedBarList.length === 3) {
            let lowPrice = closedBarList.map(e => e["lowPrice"]);
            let highPrice = closedBarList.map(e => e["highPrice"]);
            let conditionTime = closedBarList[closedBarList.length - 1]["date"] + " " + closedBarList[closedBarList.length - 1]["timeStr"];
            // condition = (lowPrice[2] < lowPrice[1] || highPrice[2] < highPrice[1]) && (lowPrice[1] < lowPrice[0] || highPrice[1] < highPrice[0]);
            condition = lowPrice[2] < lowPrice[1] && lowPrice[1] < lowPrice[0] ;
            console.log(`condition: ${condition} 2: ${lowPrice[2]} 1: ${lowPrice[1]} 0: ${lowPrice[0]}  time: ${conditionTime}`)
        }
        return condition;
    }

    OnClosedBar(closedBar) {
        this.closedBarList.push(closedBar);
        if (this.closedBarList.length > 3) {
            this.closedBarList.shift();
        }
        // console.log(this.closedBarList);
        let condition = this._checkLongCondition(this.closedBarList);
        ;
        let cylinder = Math.abs(closedBar.closePrice - closedBar.openPrice);
        let bottom = (closedBar.closePrice > closedBar.openPrice) ? closedBar.openPrice : closedBar.closePrice;
        let top = (closedBar.closePrice > closedBar.openPrice) ? closedBar.closePrice : closedBar.openPrice;
        let lowerLeader = bottom - closedBar.lowPrice;
        let upperLeader = closedBar.highPrice - top;
        let flagIndex = lowerLeader - upperLeader;
        // this.flag = flagIndex > cylinder ? true : flagIndex < -1 * cylinder ? false : null;
        if (flagIndex > cylinder) {
            // if (flagIndex > 0) {
            if (condition) {
                this.flag = true;
            }
        } else if (flagIndex < -1 * cylinder) {
            // } else if (flagIndex < 0) {
            this.flag = false;
        } else {
            this.flag = null
        }
        console.log(`this.flag: ${this.flag}  openPrice: ${closedBar.openPrice}  highPrice: ${closedBar.highPrice}  lowPrice: ${closedBar.lowPrice}  closePrice: ${closedBar.closePrice}, lowerLeader: ${lowerLeader}, cylinder: ${cylinder}, upperLeader: ${upperLeader}`);
    }

    OnNewBar(newBar) {
        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice);
        this.QueryTradingAccount('CTP');
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
        // console.log(`${tick.symbol}  的Tick,时间: ${tick.date}  ${tick.timeStr} availabelSum： ${availabelSum},  global.availableFund  ${global.availableFund}, unit ${unit}, marginRate ${marginRate}, tick.lastPrice ${tick.lastPrice}, priceUnit ${priceUnit}`);
        return availabelSum;
    }

    _openLong(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvailabelSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.Open);
            let subject = `Today Action Open Long ${this.name} flag: ${this.flag}`;
            let message = `${this.name} flag: ${this.flag}  时间: ${tick.date} ${tick.timeStr}`;
            this._sendMessage(subject, message);
            console.log(message);
            this.flag = null;
        }
    }


    _closeTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.MyGetLongTodayPosition();
        if (todayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            // this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
            this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.CloseToday);
        }
    }


    _ladderCloseTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.MyGetLongTodayPosition();
        if (todayLongPositions > 0) {
            for (let up = 0; up < todayLongPositions; up++) {
                let price = this.PriceDown(tick.symbol, tick.lastPrice, Direction.Sell, up);
                this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.CloseToday);
            }
        }
    }


    _profitTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongTodayPosition();
        if (todayLongPositions > 0) {
            let longTodayPostionAveragePrice = position.GetLongTodayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (price > longTodayPostionAveragePrice && tick.lastPrice < tick.upperLimit) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                }
                let subject = `Today Action Profit Long  ${this.name}`;
                let message = `${this.name}  时间:  ${tick.date}  ${tick.timeStr} price ${price}  longTodayPostionAveragePrice  ${longTodayPostionAveragePrice} todayLongPositions  ${todayLongPositions}`
                console.log(message);
                this._sendMessage(subject, message);
            }
        }
    }


    _profitYesterdayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.GetLongYesterdayPosition();
        if (yesterdayLongPositions > 0) {
            let longYesterdayPostionAveragePrice = position.GetLongYesterdayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (price > longYesterdayPostionAveragePrice && tick.lastPrice < tick.upperLimit) {
                this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                let subject = `Yesterday Action Profit Long ${this.name}`;
                let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}  longYesterdayPostionAveragePrice  ${longYesterdayPostionAveragePrice} yesterdayLongPositions  ${yesterdayLongPositions}`;
                this._sendMessage(subject, message);
            }
        }
    }


    _checkPrice(tick, position, up = 0) {
        let longPositions = position.GetLongPosition();
        let longPostionAveragePrice = position.GetLongPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        return price > longPostionAveragePrice;
    }


    _profitLongPositions(tick, position, up = 0) {
        let longPositions = position.GetLongPosition();
        let longPostionAveragePrice = position.GetLongPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        if (longPositions > 0 && price > longPostionAveragePrice) {
            this._profitTodayLongPositions(tick, position, up);
            this._profitYesterdayLongPositions(tick, position, up);
        }
    }


    OnTick(tick) {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        super.OnTick(tick);
        let tradeState = this._getOffset(tick, 0, 300);
        if (this.flag === false) {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this._profitYesterdayLongPositions(tick, position, 0);
                    this._profitTodayLongPositions(tick, position, 0);
                } else {
                    this._profitLongPositions(tick, position, 0);
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
                        this._profitYesterdayLongPositions(tick, position, 0);
                        this._profitTodayLongPositions(tick, position, 0);
                    } else {
                        this._profitLongPositions(tick, position, 0);
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
        super.Stop();
    }
}

module.exports = SilverLongStrategy;
