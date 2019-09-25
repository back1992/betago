let BaseStrategy = require("./baseStrategy");

// let Position = require("../util/Position");
class GoldShortStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
        global.BarCount = 0;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.flag = null;
        this.leftFund = 0;
    }

    //
    // OnClosedBar(closedBar) {
    //     if (closedBar.closePrice > closedBar.openPrice) {
    //         this.flag = true;
    //     } else {
    //         this.flag = false;
    //     }
    // }

    OnClosedBar(closedBar) {
        let cylinder = Math.abs(closedBar.closePrice - closedBar.openPrice);
        let bottom = (closedBar.closePrice > closedBar.openPrice) ? closedBar.openPrice : closedBar.closePrice;
        let top = (closedBar.closePrice > closedBar.openPrice) ? closedBar.closePrice : closedBar.openPrice;
        let lowerLeader = bottom - closedBar.lowPrice;
        let upperLeader = closedBar.highPrice - top;
        let flagIndex = lowerLeader - upperLeader;
        this.flag = flagIndex > cylinder ? false : flagIndex < -1 * cylinder ? true : null;
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


    _closeTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.MyGetShortTodayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            // this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
            this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.CloseToday);
        }
    }


    //js Date对象从0开始的月份
    _getTimeToGold(tick, breakOffsetSec = 28) {
        require("../systemConfig");
        let NowDateTime = new Date();
        let NowDateStr = NowDateTime.toLocaleDateString();
        let TickDateTimeStr = NowDateStr + " " + tick.timeStr;
        let TickDateTime = new Date(TickDateTimeStr);
        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
        let upperFutureName = contract.futureName.toUpperCase();
        let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        let PMCloseTimeStr = NowDateStr + " " + tickFutureConfig.PMClose;
        var PMCloseTime = new Date(PMCloseTimeStr);
        var PMStopTime = new Date(PMCloseTime.getTime() - breakOffsetSec * 1000);
        let NightCloseTimeStr = NowDateStr + " " + tickFutureConfig.NightClose;
        var NightCloseTime = new Date(NightCloseTimeStr);
        var NightStopTime = new Date(NightCloseTime.getTime() - breakOffsetSec * 1000);
        return (TickDateTime > PMStopTime && TickDateTime < PMCloseTime) || (TickDateTime > NightStopTime && TickDateTime < NightCloseTime);
    }


    OnTick(tick) {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度
        super.OnTick(tick);
<<<<<<< HEAD:strategy/GoldLongIIStrategy.js
        console.log(tick);
=======
        if (this.flag === false) {
            this._cancelOrder();
            let position = this.GetPosition(tick.symbol);
            if (position != undefined) {
                let shortTodayPostionAveragePrice = position.MyGetShortTodayPositionAveragePrice();
                if (tick.lastPrice < shortTodayPostionAveragePrice && tick.lastPrice > tick.lowerLimit) {
                    this._closeTodayShortPositions(tick, position);
                } else {
                    // if (global.Balance > 110000 && global.withdrawQuota < 90000) {
                    if (global.availableFund < 0) {
                        this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.CloseToday);
                        this.flag = null;
                    }
                }
            }
        }
>>>>>>> 9ed16a24cf8b58d723eee3229e7f16ef507f72f1:strategy/GoldShortStrategy.js
        if (!this._getTimeToGold(tick)) {
            if (this.flag) {
                this.QueryTradingAccount(tick.clientName);
                let availablesSum = this._getAvailabelSum(tick);
                if (availablesSum >= 1) {
                    let price = tick.lastPrice;
                    this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Open);
                    this.flag = null;
                }
            }
        } else {
            this._cancelOrder();
                let position = this.GetPosition(tick.symbol);
                if (position != undefined) {
                    let shortTodayPostionAveragePrice = position.MyGetShortTodayPositionAveragePrice();
                    if (tick.lastPrice < shortTodayPostionAveragePrice && tick.lastPrice > tick.lowerLimit) {
                        this._closeTodayShortPositions(tick, position);
                    }
                }
        }
    }

    Stop() {
        super.Stop();
    }
}

module.exports = GoldShortStrategy;
