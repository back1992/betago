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
var request = require("request")


/////////////////////// Private Method ///////////////////////////////////////////////
class HaiCloseStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        // this.total = strategyConfig.total;
        // define as infinte large
        this.total = 1000000;
        this.sinaSymbol = strategyConfig.sinaSymbol;
        this.thresholdPrice = strategyConfig.thresholdPrice;
        this.BarInterval = strategyConfig.BarInterval;
        this.sum = 0;
        this.flag = null;
        this.closedBarList = [];
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
      // console.log(this.closedBarList);
      if (this.closedBarList) {
          this.closedBarList.push(closedBar);
          if (this.closedBarList.length > 50) {
              this.closedBarList.shift();
          }
          let highPrice = this.closedBarList.map(e => e["highPrice"]);
          let lowPrice = this.closedBarList.map(e => e["lowPrice"]);
          let closePrice = this.closedBarList.map(e => e["closePrice"]);
          let volume = this.closedBarList.map(e => e["volume"]);
          let score = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
          let signalTime = this.closedBarList[this.closedBarList.length - 1]["date"] + " " + this.closedBarList[this.closedBarList.length - 1]["timeStr"];
          console.log(`${this.name}  ${closedBar.symbol} socre : ${score}`)
          if (score > 2) {
            this._cancelOrder();
            if (closedBar.closePrice>this.thresholdPrice) {
              this.flag = "long";
            } else {
              this.flag = null;
            }
          } else if (score <= -2) {
            this._cancelOrder();
            if (closedBar.closePrice>this.thresholdPrice) {
              this.flag = "short";
            } else {
              this.flag = null;
            }
          } else {
            this.flag = null;
          }
      }
    }

    OnNewBar(newBar) {
      let ladder = newBar.openPrice-this.thresholdPrice;
      if(ladder>400 || ladder < -400){
        this.thresholdPrice = newBar.openPrice;
      }

    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
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
        let priceUnit = tick.lastPrice * unit * marginRate;
        let availabelSum = Math.floor(global.availableFund / priceUnit);
        if (availabelSum < 1) {
            let subject = `Sina Money is Out ${this.name}`;
            let message = `${tick.symbol}  的Tick,时间: ${tick.date}  ${tick.timeStr} availabelSum： ${availabelSum},  global.availableFund  ${global.availableFund}, unit ${unit}, marginRate ${marginRate}, tick.lastPrice ${tick.lastPrice}, priceUnit ${priceUnit}`;
            this._sendMessage(subject, message);
        }
        // console.log(`${tick.symbol}  的Tick,时间: ${tick.date}  ${tick.timeStr} availabelSum： ${availabelSum},  global.availableFund  ${global.availableFund}, unit ${unit}, marginRate ${marginRate}, tick.lastPrice ${tick.lastPrice}, priceUnit ${priceUnit}`);
        return availabelSum;
    }

    _openLong(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvailabelSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.Open);
            let subject = `Hai Today Action Open Long ${this.name} flag: ${this.flag}`;
            let message = `${this.name} flag: ${this.flag}  时间: ${tick.date} ${tick.timeStr}`;
            this._sendMessage(subject, message);
            console.log(message);
        }
    }

    _openShort(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvailabelSum(tick);
        if (sum >= 1) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.Open);
            let subject = `Hai Action Open Short ${this.name} flag: ${this.flag}`;
            let message = `${this.name} flag: ${this.flag}  时间: ${tick.date} ${tick.timeStr}`;
            this._sendMessage(subject, message);
            console.log(message);
        }
    }



    _closeMyTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.MyGetLongTodayPosition();
        if (todayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (tick.lastPrice < tick.upperLimit) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                }
                let subject = `Hai Today Action Close Long  ${this.name}`;
                let message = `${this.name}  时间:  ${tick.date}  ${tick.timeStr} price ${price}  todayLongPositions  ${todayLongPositions}`
                console.log(message);
                this._sendMessage(subject, message);
            }
        }
    }



    _closeMyTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.MyGetShortTodayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            if (tick.lastPrice > tick.lowerLimit) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.Close);
                }
                let subject = `Hai Today Action Close Short  ${this.name}`;
                let message = `${this.name}  时间:  ${tick.date}  ${tick.timeStr} price ${price}  todayShortPositions  ${todayShortPositions}`
                console.log(message);
                this._sendMessage(subject, message);
            }
        }
    }


    _closeMyYesterdayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.MyGetLongYesterdayPosition();
        if (yesterdayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (tick.lastPrice < tick.upperLimit) {
                this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                let subject = `Hai Yesterday Action Close Long ${this.name}`;
                let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}   yesterdayLongPositions  ${yesterdayLongPositions}`;
                this._sendMessage(subject, message);
            }
        }
    }


    _closeMyYesterdayShortPositions(tick, position, up = 0) {
        let yesterdayShortPositions = position.MyGetShortYesterdayPosition();
        if (yesterdayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            if (tick.lastPrice < tick.upperLimit) {
                this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.Buy, OpenCloseFlagType.Close);
                let subject = `Hai Yesterday Action Close Short ${this.name}`;
                let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}   yesterdayShortPositions  ${yesterdayShortPositions}`;
                this._sendMessage(subject, message);
            }
        }
    }


    _checkPrice(tick, position, up = 0) {
        let longPositions = position.GetLongPosition();
        let longPostionAveragePrice = position.GetLongPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        return price > longPostionAveragePrice;
    }


    _closeMyLongPositions(tick, position, up = 0) {
        let longPositions = position.GetLongPosition();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        if (longPositions > 0) {
            this._closeMyTodayLongPositions(tick, position, up);
            this._closeMyYesterdayLongPositions(tick, position, up);
        }
    }


    _closeMyShortPositions(tick, position, up = 0) {
        let shortPositions = position.GetShortPosition();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        if (shortPositions > 0) {
            this._closeMyTodayShortPositions(tick, position, up);
            this._closeMyYesterdayShortPositions(tick, position, up);
        }
    }


    OnTick(tick) {
        super.OnTick(tick);
        let tradeState = this._getOffset(tick, 0, 30);
        if (this.flag === "short") {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this._profitMyYesterdayLongPositions(tick, position, 0);
                    this._profitMyTodayLongPositions(tick, position, 0);
                } else {
                    this._profitMyLongPositions(tick, position, 0);
                }
                let shortPositions = position.GetShortPosition();
                if (shortPositions < this.total) {
                  this._openShort(tick);
                }

            } else {
              let unFinishOrderList = this.GetUnFinishOrderList();
              if (unFinishOrderList.length === 0) {
                  this._openShort(tick);
              }

            }
            this.flag = null;
        }
        if (this.flag === "long") {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this._closeMyYesterdayShortPositions(tick, position, 0);
                    this._closeMyTodayShortPositions(tick, position, 0);
                } else {
                    this._closeMyShortPositions(tick, position, 0);
                }
                let longPositions = position.GetLongPosition();
                if (longPositions < this.total) {
                  this._openLong(tick);
                }

            } else {
              let unFinishOrderList = this.GetUnFinishOrderList();
              if (unFinishOrderList.length === 0) {
                  this._openLong(tick);
              }

            }
            this.flag = null;
        }


    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = HaiCloseStrategy;
