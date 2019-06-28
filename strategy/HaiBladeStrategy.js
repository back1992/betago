/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy = require("./baseStrategy");
require("../util/Position");

/////////////////////// Private Method ///////////////////////////////////////////////
class HaiBladeStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.thresholdPrice = strategyConfig.thresholdPrice;
        this.step = strategyConfig.step;
        this.move = strategyConfig.move;
        this.takeoff = false;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
    }

    OnNewBar(newBar) {
    }

    //js Date对象从0开始的月份
    _getTimeTakeOff(tick, breakOffsetSec = 1800) {
        let NowDateTime = new Date();
        var hour = NowDateTime.getHours();
        let NowDateStr = NowDateTime.toLocaleDateString();
        let TickDateTimeStr = NowDateStr + " " + tick.timeStr;
        let TickDateTime = new Date(TickDateTimeStr);
        if (hour > 7 && hour <= 17) {
            let TakeOffTimeStr = NowDateStr + " " + "9:03";
        } else {
            let TakeOffTimeStr = NowDateStr + " " + "21:03";
        }
        var TackOffTime = new Date(TakeOffTimeStr);
        var PrepaireTime = new Date(TackOffTime.getTime() - breakOffsetSec * 1000);
        return TickDateTime > PrepaireTime && TickDateTime < TackOffTime;
    }

    OnTick(tick) {
        // console.log(tick.lastPrice , this.thresholdPrice, tick.lastPrice - this.thresholdPrice);
        // let todayShortPositions = 0;
        let position = this.GetPosition(tick.symbol);
        // console.log(position);
        if ((tick.lastPrice - this.thresholdPrice) > 40) {
            this.thresholdPrice = this.thresholdPrice + 40;
        }
        if ((tick.lastPrice - this.thresholdPrice) < -40) {
            this.thresholdPrice = this.thresholdPrice - 40;
        }
        if (tick.lastPrice > 3680 && tick.lastPrice < 3686) {
            this.takeoff = true;
        }
        if (!this._getTimeTakeOff(tick)) {
            if (this.takeoff === true) {
                if (position === undefined) {
                    if (tick.lastPrice <= (this.thresholdPrice - this.step)) {
                        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 1);
                        this.SendOrder(tick.clientName, tick.symbol, price, this.total, Direction.Sell, OpenCloseFlagType.Open);
                    }
                } else {
                    let todayShortPositions = position.GetShortTodayPosition();
                    let yesterdaydayShortPositions = position.GetShortYesterdayPosition();
                    let todayLongPositions = position.GetLongTodayPosition();
                    let yesterdaydayLongPositions = position.GetLongYesterdayPosition();
                    console.log(todayShortPositions, yesterdaydayShortPositions, todayLongPositions, yesterdaydayLongPositions);
                    if (tick.lastPrice <= (this.thresholdPrice - this.step)) {
                        this._closeTodayLongPositions(tick, position);
                        this._closeYesterdayLongPositions(tick, position);
                        if (todayShortPositions < 2 && yesterdaydayShortPositions < 2) {
                            this._openShort(tick, 2);
                        }
                    } else if (tick.lastPrice >= (this.thresholdPrice + this.step)) {
                        this._closeTodayShortPositions(tick, position);
                        this._closeYesterdayShortPositions(tick, position);
                        if (todayLongPositions < 2 && yesterdaydayLongPositions < 2) {
                            this._openLong(tick, 2);
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

module.exports = HaiBladeStrategy;
