/**
 * Created by Administrator on 2017/7/4.
 */
// let talib = require('talib-binding');
require("../systemConfig");
require("../util/Position");
require("../util/MyPostMan");
const Indicator = require("../util/Indicator");
const dotenv = require('dotenv');
dotenv.config();
var _ = require('lodash');
var BaseStrategy = require("./baseStrategy");


/////////////////////// Private Method ///////////////////////////////////////////////
class InfluxCloseStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.flag = null;
        this.signal = 0;
        this.closedBarList = [];
        global.actionFlag = {};
        global.actionScore = {};
        global.actionDatetime = {};
        global.actionBarInterval = {};
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        if (this.closedBarList) {
            this.closedBarList.push(closedBar);
            if (this.closedBarList.length > 50) {
                this.closedBarList.shift();
            }
            let highPrice = this.closedBarList.map(e => e["highPrice"]);
            let lowPrice = this.closedBarList.map(e => e["lowPrice"]);
            let closePrice = this.closedBarList.map(e => e["closePrice"]);
            let volume = this.closedBarList.map(e => e["volume"]);
            this.signal = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
            this.signalTime = this.closedBarList[this.closedBarList.length - 1]["date"] + " " + this.closedBarList[this.closedBarList.length - 1]["timeStr"];
        }
        if (this.signal >= 2) {
            this.flag = "long";
        } else if (this.signal <= -2) {
            this.flag = "short";
        } else {
            this.flag = null;
        }
        console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
        console.log(`${closedBar.symbol} signal: ${this.signal}  flag: ${this.flag}`);
    }

    OnNewBar(newBar) {
      
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }



    _closeYesterdayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.GetLongYesterdayPosition();
        console.log(`yesterdayLongPositions : ${yesterdayLongPositions}`)
        if (yesterdayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
        }
    }

    _closeYesterdayShortPositions(tick, position, up = 0) {
        let yesterdayShortPositions = position.GetShortYesterdayPosition();
        console.log(`yesterdayShortPositions : ${yesterdayShortPositions}`)
        if (yesterdayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.buy, OpenCloseFlagType.Close);
        }
    }


    OnTick(tick) {
        super.OnTick(tick);
        let tradeState = this._getOffset(tick, 30, 300);

        switch (tradeState) {
            // timeOffset
            case 0:
                let position = this.GetPosition(tick.symbol);
                console.log(position);
                if (position) {
                  this._closeYesterdayLongPositions(tick, position, 0)
                }
                break;
            // time to close
            case -1:
                this._cancelOrder();
                let position = this.GetPosition(tick.symbol);
                console.log(position);
                if (position) {
                  this._closeYesterdayLongPositions(tick, position, 0)
                }
                break;
            // trade time
            default :
              if (this.flag === "long") {
                  let position = this.GetPosition(tick.symbol);
                  console.log(position);
                  if (position) {
                      this._cancelOrder();
                      this._closeYesterdayLongPositions(tick, position, 0)
                      this.flag = null;
                  }
              } else if (this.flag === "short") {
                  let position = this.GetPosition(tick.symbol);
                  console.log(position);
                  if (position) {
                      this._cancelOrder();
                      this._closeYesterdayShortPositions(tick, position, 0)
                      this.flag = null;
                  }
              }

        }

    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = InfluxCloseStrategy;
