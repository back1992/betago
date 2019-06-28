/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");

/////////////////////// Private Method ///////////////////////////////////////////////

class BladeStrategy extends BaseStrategy {

    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        // this.thresholdPrice = strategyConfig.thresholdPrice;
        this.thresholdPrice = {};
        this.step = strategyConfig.step;
        this.flag = null;
        this.offSeted = false;
        this.needCloseYesterday = strategyConfig.needCloseYesterday;
        this.needCloseToday = strategyConfig.needCloseToday;
        global.deficit = false;
        global.graduate = {};
        this.graduated = false;
        this.totalSymbols = strategyConfig.totalSymbols;
        this.handleDeficited = false;
        this.restartTime = null;
        // this.move = strategyConfig.move;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        if (!this._isEmpty(this.thresholdPrice)) {
            if (closedBar.closePrice < this.thresholdPrice["short"]) {
                this.flag = "short";
            } else if (closedBar.closePrice > this.thresholdPrice["long"]) {
                this.flag = "long";
            } else {
                this.flag = "close";
            }
        }
    }

    OnNewBar(newBar) {
        if (global.deficit === true && global.graduate["symbol"] === newBar.symbol) {
            this.handleDeficited = true;
        }
    }


    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
    }


    OnTick(tick) {
        super.OnTick(tick);


        if(this.needRestart === true){
          this.restartTime = new Date();
          this.needRestart = false;
        }
        let timeOffset = this._getOffset(tick, 18, 30, this.restartTime);
        let position = this.GetPosition(tick.symbol);
        if (timeOffset["isTimeOffset"]) {
            // this.graduated = false;

            if (!this.offSeted) {
                this.thresholdPrice["short"] = tick.lastPrice;
                this.thresholdPrice["long"] = tick.lastPrice;
                this.offSeted = true;
            } else {
                this.thresholdPrice["long"] = (this.thresholdPrice["long"] > tick.lastPrice) ? this.thresholdPrice["long"] : tick.lastPrice;
                this.thresholdPrice["short"] = (this.thresholdPrice["short"] < tick.lastPrice) ? this.thresholdPrice["short"] : tick.lastPrice;
            }

            if (this.needCloseYesterday === true && position) {
                this._closeYesterdayLongPositions(tick, position);
                this._closeYesterdayShortPositions(tick, position);
                this.needCloseYesterday = false;
            }
            if (this.needCloseToday === true && position) {
                this._closeTodayShortPositions(tick, position);
                this.needCloseToday = false;
            }
        } else if (timeOffset["isTimeToClose"]) {
            if (position) {
                this._closeTodayLongPositions(tick, position);
                this._closeTodayShortPositions(tick, position);
            }
        } else {
            this.offSeted = false;
                if (position === undefined) {
                    let unFinishOrderList = this.GetUnFinishOrderList();
                    if (unFinishOrderList.length === 0) {
                        this.QueryTradingAccount(tick.clientName);
                        let sum = this._getAvilabelSum(tick);
                        if (sum >= 1) {
                            if (this.flag === "short") {
                                this._openShort(tick);
                            } else if (this.flag === "long") {
                                this._openLong(tick);
                            }
                        } else {
                            global.deficit = true;
                            this.restarted = false;
                        }
                    } else {
                        for (let index in unFinishOrderList) {
                            let unFinishOrder = unFinishOrderList[index];
                            global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
                        }
                    }
                } else {
                  this._findGradeLong(tick, position);
                  this._findGradeShort(tick, position);
                    // if (this.flag === true && todayShortPositions < this.total) {
                    let unFinishOrderList = this.GetUnFinishOrderList();
                    if (unFinishOrderList.length === 0) {
                        if (this.flag === "close") {
                            this._closeTodayLongPositions(tick, position);
                            this._closeTodayShortPositions(tick, position);
                        } else {
                            this.QueryTradingAccount(tick.clientName);
                            let sum = this._getAvilabelSum(tick);
                            if (sum >= 1) {
                                if (this.flag === "short") {
                                    let todayShortPositions = position.GetShortTodayPosition();
                                    if (todayShortPositions < this.total) {
                                        this._openShort(tick);
                                    }

                                } else if (this.flag === "long") {
                                    let todayLongPositions = position.GetLongTodayPosition();
                                    if (todayLongPositions < this.total) {
                                        this._openLong(tick);
                                    }
                                }
                            } else {
                                global.deficit = true;
                                this.restarted = false;
                            }
                        }
                    } else {
                        for (let index in unFinishOrderList) {
                            let unFinishOrder = unFinishOrderList[index];
                            global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
                        }
                    }
                }

        }


        // this.Stop();
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = BladeStrategy;
