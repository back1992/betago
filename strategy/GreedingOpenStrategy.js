/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy = require("./baseStrategy");

/////////////////////// Private Method ///////////////////////////////////////////////

class GreedingOpenStrategy extends BaseStrategy {

    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {

    }

    OnNewBar(newBar) {

    }

    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
    }

    _getAvilableSum(tick) {
        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
        let upperFutureName = contract.futureName.toUpperCase();
        let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        let unit = tickFutureConfig.Unit;
        let marginRate = tickFutureConfig.MarginRate;
        return Math.floor(global.availableFund / (tick.lastPrice * unit * marginRate));
    }


    OnTick(tick) {
        this.lastTick = this.tick;
        this.tick = tick;
        let price = tick.lastPrice;
        if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
            this.QueryTradingAccount(tick.clientName);
            let availablesSum = this._getAvilableSum(tick);
            if (availablesSum >= 1) {
                console.log(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.Open, 1, this.total)
                this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.Open);
            }
        } else {
            // this.Stop();
        }
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = GreedingOpenStrategy;
