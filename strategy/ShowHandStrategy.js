/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");

/////////////////////// Private Method ///////////////////////////////////////////////
class ShowHandStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.thresholdPrice;
        this.step = strategyConfig.step;
        this.flag = null;
        this.needCloseYesterday = strategyConfig.needCloseYesterday;
        this.needSleep = false;
        this.sellPrice;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        this._cancelOrder();
        if (!this.thresholdPrice) {
          this.thresholdPrice = closedBar.lowPrice;
        } else {
          if (closedBar.closePrice < this.thresholdPrice && this.thresholdPrice <= closedBar.openPrice) {
              this.flag = true;
          }
          if (closedBar.closePrice > this.thresholdPrice) {
              this.flag = false;
          }
        }
    }

    OnNewBar(newBar) {
      console.log(newBar.symbol + "---" + this.tradeState + " " + newBar.startDatetime.toLocaleString()  +" flag: " + this.flag);
        if (this.needSleep){
          consoel.log(newBar.symbol + " needSleep ");
        }
    }

    //js Date对象从0开始的月份
    _getOffset(tick, breakOffsetSec = 180, closeOffsetSec = 30) {
        let NowDateTime = new Date();
        // var hour = NowDateTime.getHours();
        let NowDateStr = NowDateTime.toLocaleDateString();
        let TickDateTimeStr = NowDateStr + " " + tick.timeStr;
        let TickDateTime = new Date(TickDateTimeStr);
        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
        let upperFutureName = contract.futureName.toUpperCase();
        let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        let AMOpenTimeStr = NowDateStr + " " + tickFutureConfig.AMOpen;
        var AMOpenTime = new Date(AMOpenTimeStr);
        var AMOpenTimeOffset = new Date(AMOpenTime.getTime() + breakOffsetSec * 1000);
        let AMResumeTimeStr = NowDateStr + " " + tickFutureConfig.AMResume;
        var AMResumeTime = new Date(AMResumeTimeStr);
        var AMResumeTimeOffset = new Date(AMResumeTime.getTime() + breakOffsetSec * 1000);
        let PMOpenTimeStr = NowDateStr + " " + tickFutureConfig.PMOpen;
        var PMOpenTime = new Date(PMOpenTimeStr);
        var PMOpenTimeOffset = new Date(PMOpenTime.getTime() + breakOffsetSec * 1000);
        let NightOpenTimeStr = NowDateStr + " " + tickFutureConfig.NightOpen;
        var NightOpenTime = new Date(NightOpenTimeStr);
        var NightOpenTimeOffset = new Date(NightOpenTime.getTime() + breakOffsetSec * 1000);
        let isTimeOffset = (NowDateTime > AMOpenTime && NowDateTime < AMOpenTimeOffset) || (NowDateTime > AMResumeTime && NowDateTime < AMResumeTimeOffset) || (NowDateTime > PMOpenTime && NowDateTime < PMOpenTimeOffset) || (NowDateTime > NightOpenTime && NowDateTime < NightOpenTimeOffset) ;
        let PMCloseTimeStr = NowDateStr + " " + tickFutureConfig.PMClose;
        var PMCloseTime = new Date(PMCloseTimeStr);
        var PMStopTime = new Date(PMCloseTime.getTime() - closeOffsetSec * 1000);
        let NightCloseTimeStr = NowDateStr + " " + tickFutureConfig.NightClose;
        var NightCloseTime = new Date(NightCloseTimeStr);
        var NightStopTime = new Date(NightCloseTime.getTime() - closeOffsetSec * 1000);
        let isTimeToClose = (NowDateTime > PMStopTime && NowDateTime < PMCloseTime) || (TickDateTime > NightStopTime && TickDateTime < NightCloseTime);
        if (isTimeOffset) {
            return 0;

        } else if (isTimeToClose){
            return -1;
        } else {
            return 1;
        }
        // return {'isTimeOffset': isTimeOffset, 'isTimeToClose': isTimeToClose}
    }


    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
        global.withdrawQuota = tradingAccountInfo["WithdrawQuota"];
        global.Balance = tradingAccountInfo["Balance"];
        global.PreBalance = tradingAccountInfo["PreBalance"];
    }

    _openShort(tick, up = 0) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvilableSum(tick);
        if (sum >= 1) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Open);
            this.sellPrice = price;
        }
        // else {
        //     // this.thresholdPrice = null;
        // }
    }

    _closeTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
            // this.thresholdPrice = null;
        }
    }

    _closeTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongTodayPosition();
        if (todayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
            // this.thresholdPrice = null;
        }
    }

    _closeYesterdayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortYesterdayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
            // this.thresholdPrice = null;
        }
    }

    _graduateShort(tick) {
        let profit = (this.sellPrice - tick.lastPrice) / tick.lastPrice;
        if (profit > 0.08) {
            this.flag = false;
        }
    }

    OnTick(tick) {
        super.OnTick(tick);
        let tradeState =  this._getOffset(tick, 60, 30);
        let position = this.GetPosition(tick.symbol);
        switch(tradeState) {
          // time to close
        case -1:
          this.QueryTradingAccount(tick.clientName);
          let threadBalance = global.Balance - global.PreBalance;
          // let meatBalance = global.Balance - 100000;
          if (threadBalance > 0) {
          // if (global.withdrawQuota < 500) {
            if (position != undefined) {
                this._closeTodayLongPositions(tick, position, 1);
            }
          }
          break;
          // trade time
        default :
          this.QueryTradingAccount(tick.clientName);
          let sum = this._getAvilableSum(tick);
          if (sum >= 1) {
                  let price = tick.lastPrice;
                  this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.Open);
              }
          }
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = ShowHandStrategy;
