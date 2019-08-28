/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy = require("./baseStrategy");

/////////////////////// Private Method ///////////////////////////////////////////////

class PriceCloseLongStrategy extends BaseStrategy {

    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.total = strategyConfig.total;
        this.thresholdPrice = strategyConfig.thresholdPrice;
        this.sum = 0;
        this.flag = null;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        let position = this.GetPosition(closedBar.symbol);
        let longPostionAveragePrice = position.GetLongPositionAveragePrice();
        if (closedBar.closePrice > longPostionAveragePrice) {
            if (closedBar.closePrice < closedBar.openPrice) {
                this.flag = true;
            } else {
                this.flag = null;
            }
        } else if (closedBar.closePrice < longPostionAveragePrice) {
            this.flag = false;
        }
    }

    OnNewBar(newBar) {

    }

    _closeLongPositions(tick, longPositions = 1, up = 0) {
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        let position = this.GetPosition(tick.symbol);
        if (position != undefined) {
            let todayLongPositions = position.GetLongTodayPosition();
            let yesterdayLongPositions = position.GetLongYesterdayPosition();
            if (todayLongPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, price, longPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
            } else if (yesterdayLongPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, price, longPositions, Direction.Sell, OpenCloseFlagType.CloseYesterday);
            }
        }
    }


    OnTick(tick) {
        super.OnTick(tick);
        if (this.sum < this.total) {
            if (this.flag === true) {
                this._closeLongPositions(tick);
                this.sum += 1;
                this.flag = null;
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

module.exports = PriceCloseLongStrategy;
