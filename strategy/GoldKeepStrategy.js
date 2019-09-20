let FixedArray = require("fixed-array");
let BaseStrategy = require("./baseStrategy");

// let Position = require("../util/Position");
class GoldOutStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
        this.flag = null;
        this.total = strategyConfig.total;
        this.sum = 0;
    }

    OnClosedBar(closedBar) {
        // console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
        if (global.availableFund < 0) {
            this.flag = true;
        } else {
            this.flag = false;
        }

    }

    OnNewBar(newBar) {
        this.QueryTradingAccount('CTP');
        // console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice, this.flag);
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
        return Math.floor(global.availableFund / (tick.lastPrice * unit * marginRate));
    }

    OnTick(tick) {
        super.OnTick(tick);
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度

        if (this.flag) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 1);
            let position = this.GetPosition(tick.symbol);
            if (position != undefined) {
                let yesterdayLongPositions = position.GetLongYesterdayPosition();
                let todayLongPositions = position.GetLongTodayPosition();
                if (yesterdayLongPositions > 0) {
                    this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.CloseYesterday);
                    this.flag = null;
                } else if (todayLongPositions > 0) {
                    this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.CloseToday);
                    this.flag = null;
                }
            }
        }
    }

    Stop() {
        super.Stop();
    }
}

module.exports = GoldOutStrategy;
