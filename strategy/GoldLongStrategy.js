let FixedArray = require("fixed-array");
let talib = require('talib-binding');
let BaseStrategy = require("./baseStrategy");

// let Position = require("../util/Position");
class GoldLongStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
        global.BarCount = 0;
        this.signal = 0;
        this.tick = null;
        this.flag = null;
        this.lastTick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        // this.direction = strategyConfig.direction;
    }


    OnClosedBar(closedBar) {
        // console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
    }

    OnNewBar(newBar) {
        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice, this.signal);
    }

    _closeTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongTodayPosition();
        if (todayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
            this.open = false;
            this.isOpened = false;
            // this.thresholdPrice = null;
        }
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


    //js Date对象从0开始的月份
     _getTimeToGold(tick, breakOffsetSec = 588) {
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
        // let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        // let AMCloseTimeStr = NowDateStr + " " + tickFutureConfig.AMClose;
        // var AMCloseTime = new Date(AMCloseTimeStr);
        // var AMStopTime = new Date(AMCloseTime.getTime() - breakOffsetSec * 1000);
        // return TickDateTime > AMStopTime && TickDateTime < AMCloseTime;
        return TickDateTime > PMStopTime && TickDateTime < PMCloseTime;
    }


    OnTick(tick) {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度
        super.OnTick(tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let position = this.GetPosition(tick.symbol);
        if( ! this._getTimeToGold(tick)){
          // if(tick.lastPrice < tick.openPrice && tick.lastPrice < tick.preClosePrice) {
          if(this.lastTick && this.lastTick.lastPrice <  tick.lastPrice ) {
            this.QueryTradingAccount(tick.clientName);
            let availablesSum = this._getAvailabelSum(tick);
            if (availablesSum >= 1) {
              let price = tick.lastPrice;
              this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.Open);
            }
          }
      } else {
        if(position != undefined) {
          let longTodayPostionAveragePrice = position.GetLongTodayPositionAveragePrice();
          if(tick.lastPrice > longTodayPostionAveragePrice){
              this._closeTodayLongPositions(tick, position);
          }
        }
      }
    }

    Stop() {
        super.Stop();
    }
}

module.exports = GoldLongStrategy;
