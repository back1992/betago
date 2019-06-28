let BaseStrategy = require("./baseStrategy");
require("../systemConfig");

class HaiSellStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        super(strategyConfig);
        this.flag = null;
        this.thresholdPrice = null;
        this.stopPrice = null;
        this.step = strategyConfig.step;
        this.total = strategyConfig.total;
    }


    OnClosedBar(closedBar) {
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length !== 0) {
            for (let index in unFinishOrderList) {
                let unFinishOrder = unFinishOrderList[index];
                global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
            }
        }
        console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
        if (this.thresholdPrice === null) {
            this.thresholdPrice = closedBar.lowPrice;
            this.stopPrice = closedBar.lowPrice;
        }
        if (this.thresholdPrice > closedBar.closePrice) {
            this.flag = true;
        } else if (this.thresholdPrice < closedBar.closePrice) {
            this.flag = false;
        }

    }

    OnNewBar(newBar) {
        // global.NodeQuant.MainEngine.QueryTradingAccount("CTP");
        // global.AppEventEmitter.once(EVENT.OnQueryTradingAccount, function (tradingAccountInfo) {
        //     global.Available = tradingAccountInfo["Available"];
        // });
        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice);
    }

    //
    // _adjustSellFlag(tick) {
    //     if (this.thresholdPrice !== null) {
    //         if (tick.lastPrice < this.thresholdPrice) {
    //             this.flag = true;
    //         } else if (tick.lastPrice > this.stopPrice) {
    //             this.flag = false;
    //         } else {
    //             this.flag = null;
    //         }
    //     }
    //     console.log(this.thresholdPrice, tick.lastPrice, this.flag, tick.symbol, this.stopPrice);
    // }


    _closeTodayShort(tick) {
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length === 0) {
            let position = this.GetPosition(tick.symbol);
            if (position !== undefined) {
                let todayShortPositions = position.GetShortTodayPosition();
                let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, 1);
                if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                    if (todayShortPositions > 0) {
                        this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
                    }
                }
            }
        } else {
            for (let index in unFinishOrderList) {
                let unFinishOrder = unFinishOrderList[index];
                global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
            }
        }
        // this.thresholdPrice = null;
        // this.flag = null;
    }


    OnTick(tick) {
        super.OnTick(tick);
        this.lastTick = this.tick;
        this.tick = tick;
        console.log(tick.symbol + "  thresholdPrice: " + this.thresholdPrice, "lastPrice: " + tick.lastPrice, "flag: " + this.flag);

        if (this.flag === true) {
            let priceUp = tick.lastPrice;
            let position = this.GetPosition(tick.symbol);

            if (position === undefined) {
                this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Sell, OpenCloseFlagType.Open);
            } else {
                let todayShortPositions = position.GetShortTodayPosition();
                if (todayShortPositions === 0) {
                    let unFinishOrderList = this.GetUnFinishOrderList();
                    if (unFinishOrderList.length === 0) {
                        this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Sell, OpenCloseFlagType.Open);
                    }
                }
            }

        }
        if (this.flag === false) {
            this._closeTodayShort(tick);
        }
    }


    Stop() {
        super.Stop();
    }
}

module.exports = HaiSellStrategy;
