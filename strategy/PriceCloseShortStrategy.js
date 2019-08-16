/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy = require("./baseStrategy");

/////////////////////// Private Method ///////////////////////////////////////////////

class PriceCloseShortStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.thresholdPrice = strategyConfig.thresholdPrice;
        this.sum = 0;
        this.flag = null;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        if (this.thresholdPrice) {
            if (closedBar.closePrice < this.thresholdPrice) {
                if (closedBar.closePrice > closedBar.openPrice) {
                    this.flag = true;
                    console.log(closedBar.symbol + " flag: " + this.flag + "closePrice" + closedBar.closePrice + "thresholdPrice: " + this.thresholdPrice);
                } else {
                    this.flag = null;
                }
            } else if (closedBar.closePrice > this.thresholdPrice) {
                this.flag = false;
            }
        }

    }

    OnNewBar(newBar) {
    }

    _closeShortPositions(tick, shortPositions = 1, up = 0) {
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
        let position = this.GetPosition(tick.symbol);
        if (position != undefined) {
            let todayShortPositions = position.GetShortTodayPosition();
            let yesterdayShortPositions = position.GetShortYesterdayPosition();
            if (todayShortPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, price, shortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
            } else if (yesterdayShortPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, price, shortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
            }
        } else {
            this.SendOrder(tick.clientName, tick.symbol, price, shortPositions, Direction.Buy, OpenCloseFlagType.Close);
        }

    }

    OnTick(tick) {
        super.OnTick(tick);
        this.lastTick = this.tick;
        this.tick = tick;
        if (this.flag === true) {
            this._closeShortPositions(tick);
            this.sum += 1;
            this.flag = null;
        }
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = PriceCloseShortStrategy;
