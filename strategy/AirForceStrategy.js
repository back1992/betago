/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");

/////////////////////// Private Method ///////////////////////////////////////////////
class AirForceStrategy extends BaseStrategy {
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
    this.needCloseToday = true;
    this.needSleep = false;
    // this.move = strategyConfig.move;
  }
  /////////////////////////////// Public Method /////////////////////////////////////
  OnClosedBar(closedBar) {
    this._cancelOrder();
    if (!this._isEmpty(this.thresholdPrice)) {
      if (closedBar.closePrice < this.thresholdPrice["short"] && this.thresholdPrice["short"] <= closedBar.openPrice ) {
        this.flag = "short";
      }
      if (closedBar.closePrice > this.thresholdPrice["short"] && this.thresholdPrice["short"] >= closedBar.openPrice) {
        this.flag = "close";
      }
    }
  }

  OnNewBar(newBar) {
    // console.log( newBar.symbol + this.constructor.name  + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + " thresholdPrice short: " + this.thresholdPrice["short"] +  " thresholdPrice long: " + this.thresholdPrice["long"] + " flag: " + this.flag + " needSleep: " + this.needSleep );
    if(newBar.symbol.startsWith("rb")){
      console.log(global.graduate, global.deficited);
    }
  }

  OnQueryTradingAccount(tradingAccountInfo) {
      global.availableFund = tradingAccountInfo["Available"];
      global.withdrawQuota = tradingAccountInfo["WithdrawQuota"];
      global.Balance = tradingAccountInfo["Balance"];
  }

  _needSleep(tick){
    let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
    let upperFutureName = contract.futureName.toUpperCase();
    let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
    let unit = tickFutureConfig.Unit;
    let marginRate = tickFutureConfig.MarginRate;
    if (tick.lastPrice * unit * marginRate > global.Balance) {
      this.needSleep =  true;
    } else {
      this.needSleep =  false;
    }
  }

  _thresholdPrice(tick){
    if (!this.offSeted) {
      this.thresholdPrice["short"] = tick.lastPrice;
      this.thresholdPrice["long"] = tick.lastPrice;
      this.offSeted = true;
    } else {
      this.thresholdPrice["long"] = (this.thresholdPrice["long"] > tick.lastPrice) ? this.thresholdPrice["long"] : tick.lastPrice;
      this.thresholdPrice["short"] = (this.thresholdPrice["short"] < tick.lastPrice) ? this.thresholdPrice["short"] : tick.lastPrice;
    }
  }

  _initPosition(tick, position){
    if (this.needCloseYesterday === true && position) {
      this._closeYesterdayShortPositions(tick, position);
      this.needCloseYesterday = false;
    }
    if (this.needCloseToday === true && position) {
      this._closeTodayShortPositions(tick, position);
      this.needCloseToday = false;
    }
  }

  OnTick(tick) {
    super.OnTick(tick);

    if (this.needRestart) {
      this.restartTime = new Date();
      this.needRestart = false;
    }
    if(this.needSleep === false){
      this._needSleep(tick);
    }

    // let timeOffset = this._getOffset(tick, this.totalSymbols * 8, 30, this.restartTime);


    let position = this.GetPosition(tick.symbol);
    if( position && global.deficited &&  global.graduate["symbol"] ===  tick.symbol){
      let todayShortPositions = position.GetShortTodayPosition();
      if (todayShortPositions > 0) {
        this._handleDeficitedShort(tick, todayShortPositions );
        global.graduate = {};
        global.deficited = false;
      }
    }

    let timeOffset = this._getOffset(tick, 18, 30, this.restartTime);
    if (timeOffset["isTimeOffset"]) {
      this._thresholdPrice(tick);
    } else if (timeOffset["isTimeToClose"]) {
      if (position) {
        this._closeTodayShortPositions(tick, position, 1);
      }
    } else {
          if(this.needSleep === false) {
              this.offSeted = false;
              if (position === undefined) {
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                  if (this.flag === "short") {
                    this.QueryTradingAccount(tick.clientName);
                    let sum = this._getAvilabelSum(tick);
                    if (sum >= 1) {
                      this._openShort(tick);
                    } else {
                      global.deficited = true;
                      this.needRestart = true;
                    }
                  }
                }
              } else {
                this._findGrade0 Short(tick, position);
                // if (this.flag === true && todayShortPositions < this.total) {
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                  if (this.flag === "close") {
                    this._closeTodayShortPositions(tick, position);
                    this.flag = null;
                  } else if (this.flag === "short") {
                    let todayShortPositions = position.GetShortTodayPosition();
                    if (todayShortPositions < this.total) {
                      this.QueryTradingAccount(tick.clientName);
                      let sum = this._getAvilabelSum(tick);
                      if (sum >= 1) {
                        this._openShort(tick);
                      } else {
                        global.deficited = true;
                        this.needRestart = true;
                      }
                    }
                  }
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

module.exports = AirForceStrategy;
