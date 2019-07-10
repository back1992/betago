/**
 * Created by Administrator on 2017/7/4.
 */
let talib = require('talib-binding');
var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");

/////////////////////// Private Method ///////////////////////////////////////////////
class AirForceIIIStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.flag = null;
        this.needCloseYesterday = strategyConfig.needCloseYesterday;
        this.signal = 0;
        this.signal5m = 0;
        this.closedBarList = [];
        global.actionFlag = {};
        global.airForcePrice = {};
        global.stopPrice = {};
    }


    _get_talib_indicator(highPrice, lowPrice, closePrice, volume) {
      let retMFI = talib.MFI(highPrice, lowPrice, closePrice, volume, 14);
      let retCCI = talib.CCI(highPrice, lowPrice, closePrice, 14);
      let retCMO = talib.CMO(closePrice, 14);
      let retAROONOSC = talib.AROONOSC(highPrice, lowPrice, 14);
      let retADX = talib.ADX(highPrice, lowPrice, closePrice, 14);
      let retRSI = talib.RSI(closePrice, 14);
      let mfi = retMFI[retMFI.length - 1];
      let cci = retCCI[retCCI.length - 1];
      let cmo = retCMO[retCMO.length - 1];
      let aroonosc = retAROONOSC[retAROONOSC.length - 1];
      let adx = retADX[retADX.length - 1];
      let rsi = retRSI[retRSI.length - 1];
      return this._get_signal(mfi, cci, cmo, aroonosc, adx, rsi);
    }
    _myOnFinishLoadBar(strategy,symbol,BarType,BarInterval,ClosedBarList) {
        return ClosedBarList;
    }


    _loadBarFromDB(myStrategy, symbol, LookBackCount, BarType, BarInterval) {
        global.NodeQuant.StrategyEngine.LoadBarFromDB(myStrategy, symbol, LookBackCount, BarType, BarInterval, myOnFinishLoadBar);
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
      if(this.closedBarList) {
          this.closedBarList.push(closedBar);
          if(this.closedBarList.length>50) {
            this.closedBarList.shift();
          }
          console.log(this.closedBarList.length);
          this.openPrice = this.closedBarList.map(e => e["openPrice"]);
          this.highPrice = this.closedBarList.map(e => e["highPrice"]);
          this.lowPrice = this.closedBarList.map(e => e["lowPrice"]);
          this.closeprice = this.closedBarList.map(e => e["closePrice"]);
          this.volume = this.closedBarList.map(e => e["volume"]);
          this.signal = this._get_talib_indicator(this.highPrice, this.lowPrice, this.closePrice, this.volume);
          console.log(this.signal);
      }
        if (this.signal5m <= -2 && this.signal <= -2) {
            this.flag = true;
        }
        if (this.signal >= 2) {
            this.flag = false;
        }
    }

    OnNewBar(newBar) {
        console.log(newBar.symbol + "---" + newBar.startDatetime.toLocaleString() + " flag: " + this.flag + " signal: " + this.signal + " signal5m: " + this.signal5m);
        let barList = this._loadBarFromDB(this, newBar.symbol, 50, KBarType.Minute, 5);
        console.log(barList);
        // console.log(barList.length);
        // if(barList) {
        //     let openPrice = barList.map(e => e["openPrice"]);
        //     let highPrice = barList.map(e => e["highPrice"]);
        //     let lowPrice = barList.map(e => e["lowPrice"]);
        //     let closeprice = barList.map(e => e["closePrice"]);
        //     let volume = barList.map(e => e["volume"]);
        //     this.signal5m = this._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
        // }
    }
    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }
    }
    OnFinishLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }
    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
        global.withdrawQuota = tradingAccountInfo["WithdrawQuota"];
        global.Balance = tradingAccountInfo["Balance"];
    }

    _openShort(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvilableSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.Open);
            this.flag = null;
        }
    }

    _closeTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
        }
    }

    _profitTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let shortTodayPostionAveragePrice = position.GetShortTodayPostionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            if(price < shortTodayPostionAveragePrice){
                this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
            }
        }
    }

    _closeYesterdayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortYesterdayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
        }
    }

    OnTick(tick) {
        super.OnTick(tick);
        global.NodeQuant.MarketDataDBClient.RecordTick(tick.symbol, tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let tradeState = this._getOffset(tick, 0, 30);
        let position = this.GetPosition(tick.symbol);
        if (position) {
            this._profitTodayShortPositions(tick, position, 1);
        }
        console.log(tradeState);
        switch (tradeState) {
            // timeOffset
            case 0:
                // this.thresholdPrice = null;
                if (position) {
                    this._closeYesterdayShortPositions(tick, position, 1);
                }
                break;
            // time to close
            case -1:
                if (position) {
                    // this._closeTodayShortPositions(tick, position, 1);
                    this._profitTodayShortPositions(tick, position, 1);
                }
                break;
            // trade time
            default :
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                    if (this.flag === true) {
                        if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
                            if (position === undefined) {
                                this._openShort(tick);
                            } else {
                                let todayShortPositions = position.GetShortTodayPosition();
                                if (todayShortPositions < this.total) {
                                    this._openShort(tick);
                                }
                            }
                        }
                    } else if (this.flag === false) {
                        if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                            if (position) {
                                this._profitTodayShortPositions(tick, position);
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

module.exports = AirForceIIIStrategy;
