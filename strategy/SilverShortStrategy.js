require("../systemConfig");
require("../util/Position");
require("../util/MyPostMan");
const Indicator = require("../util/Indicator");
const dotenv = require('dotenv');
dotenv.config();
var _ = require('lodash');
var BaseStrategy = require("./baseStrategy");

// let Position = require("../util/Position");
class SilverShortStrategy extends BaseStrategy {
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
        this.lastFlag = null;
        this.leftFund = 0;
        this.closedBarList = [];
    }

    _checkShortCondition(closedBarList) {
        let condition = null;
        if (closedBarList.length === 3) {
            let highPrice = closedBarList.map(e => e["highPrice"]);
            let lowPrice = closedBarList.map(e => e["lowPrice"]);
            let conditionTime = closedBarList[closedBarList.length - 1]["date"] + " " + closedBarList[closedBarList.length - 1]["timeStr"];
            condition = highPrice[2] > highPrice[1] && highPrice[1] > highPrice[0];
            // condition = (lowPrice[2] > lowPrice[1] || highPrice[2] > highPrice[1]) && (lowPrice[1] > lowPrice[0] || highPrice[1] > highPrice[0]);
            // condition = (highPrice[highPrice.length - 1] === highPrice.max());
            // console.log(highPrice[highPrice.length - 1], highPrice.max(), condition);
            console.log(`condition: ${condition} 2: ${highPrice[2]} 1: ${highPrice[1]} 0: ${highPrice[0]}  time: ${conditionTime}`)
        }
        return condition;
    }

    OnClosedBar(closedBar) {
        this.closedBarList.push(closedBar);
        if (this.closedBarList.length > 3) {
            this.closedBarList.shift();
        }
        // console.log(this.closedBarList);
        let condition = this._checkShortCondition(this.closedBarList);
        let cylinder = Math.abs(closedBar.closePrice - closedBar.openPrice);
        let bottom = (closedBar.closePrice > closedBar.openPrice) ? closedBar.openPrice : closedBar.closePrice;
        let top = (closedBar.closePrice > closedBar.openPrice) ? closedBar.closePrice : closedBar.openPrice;
        let lowerLeader = bottom - closedBar.lowPrice;
        let upperLeader = closedBar.highPrice - top;
        let flagIndex = upperLeader - lowerLeader;
        // this.lastFlag = this.flag;
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
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        super.OnTick(tick);
        this.lastTick = this.tick;
        this.tick = tick;
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
        super.Stop();
    }
}

module.exports = SilverShortStrategy;
