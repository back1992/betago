/**
 * Created by Administrator on 2017/7/4.
 */
let talib = require('talib-binding');
// import _get_talib_indicator from "../util/Indicator";
// import { _get_talib_indicator } from "../util/Indicator";
var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");

function _get_signal(mfi, cci, cmo, aroonosc, adx, rsi) {
    let score = 0;
    if (cci > 100) {
        score -= 1
    } else if (cci < -100) {
        score += 1
    }
    if (mfi > 80) {
        score -= 1
    } else if (mfi < 20) {
        score += 1
    }
    if (cmo > 50) {
        score -= 1
    } else if (cmo < -50) {
        score += 1
    }
    if (aroonosc < -50) {
        score -= 1
    } else if (aroonosc > 50) {
        score += 1
    }
    if (rsi > 70) {
        score -= 1
    } else if (rsi < 30) {
        score += 1
    }
    return score
}

function _get_talib_indicator(strategy, highPrice, lowPrice, closePrice, volume) {
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
    return _get_signal(mfi, cci, cmo, aroonosc, adx, rsi);
}
/////////////////////// Private Method ///////////////////////////////////////////////
class BackTestStrategy extends BaseStrategy {
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
        this.closedBarList = [];
        global.actionFlag = {};
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        if (this.closedBarList) {
            this.closedBarList.push(closedBar);
            if (this.closedBarList.length > 50) {
                this.closedBarList.shift();
            }
            // console.log(this.closedBarList);
            let openPrice = this.closedBarList.map(e => e["openPrice"]);
            let highPrice = this.closedBarList.map(e => e["highPrice"]);
            let lowPrice = this.closedBarList.map(e => e["lowPrice"]);
            let closePrice = this.closedBarList.map(e => e["closePrice"]);
            let volume = this.closedBarList.map(e => e["volume"]);
            this.signal = _get_talib_indicator(highPrice, lowPrice, closePrice, volume);
        }
        // if (this.flag != true && global.actionFlag[closedBar.symbol] >= 2){
        if (global.actionFlag[closedBar.symbol] >= 2){
          if(this.signal >= 2) {
            this.flag = true;
          } else {
            this.flag = null;
          }
        }

        // if (this.flag != false && global.actionFlag[closedBar.symbol] <= -2){
        if ( global.actionFlag[closedBar.symbol] <= -2){
          if(this.signal <= -2) {
            this.flag = false;
          } else {
            this.flag = null;
          }
        }

    }

    OnNewBar(newBar) {
        let LookBackCount = 50;
        let BarType = KBarType.Minute;
        let intervalArray = [5, 15, 30 ,60];
        let BarInterval = intervalArray[Math.floor(Math.random() * intervalArray.length)];
        global.NodeQuant.MarketDataDBClient.barrange([newBar.symbol, BarInterval, LookBackCount, -1], function (err, ClosedBarList) {
            if (err) {
                console.log("从" + newBar.symbol + "的行情数据库LoadBar失败原因:" + err);
                //没完成收集固定K线个数
                MyOnFinishLoadBar(strategy, newBar.symbol, BarType, BarInterval, undefined);
                return;
            }
            let openPrice = ClosedBarList.map(e => e["openPrice"]);
            let highPrice = ClosedBarList.map(e => e["highPrice"]);
            let lowPrice = ClosedBarList.map(e => e["lowPrice"]);
            let closePrice = ClosedBarList.map(e => e["closePrice"]);
            let volume = ClosedBarList.map(e => e["volume"]);
            let score = _get_talib_indicator(highPrice, lowPrice, closePrice, volume);
            if(score >= 2 || score <= -2) {
              global.actionFlag[newBar.symbol] = score;
              // console.log(newBar.symbol + " BarInterval: " + BarInterval + " score : " + score);
            }
        });
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        // console.log(ClosedBarList);
        this.closedBarList = ClosedBarList;
    }



    OnTick(tick) {
        super.OnTick(tick);
        global.NodeQuant.MarketDataDBClient.RecordTick(tick.symbol, tick);
        this.lastTick = this.tick;
        this.tick = tick;
        if (this.flag === true) {
            if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
              global.NodeQuant.MarketDataDBClient.RecordTrade(tick.symbol, tick, "long");
              console.log(this.name + " " + this.signal + " flag: " + this.flag + "时间:" + tick.date + tick.timeStr);
              this.flag = null;
            }
        } else if (this.flag === false) {
            if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
              global.NodeQuant.MarketDataDBClient.RecordTrade(tick.symbol, tick, "short");
              console.log(this.name + " " + this.signal + " flag: " + this.flag + "时间:" + tick.date + tick.timeStr);
              this.flag = null;
            }
        }
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = BackTestStrategy;
