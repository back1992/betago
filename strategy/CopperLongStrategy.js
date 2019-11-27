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
class CopperLongStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.needCloseYesterday = strategyConfig.needCloseYesterday;
        this.total = strategyConfig.total;
        this.canOpenToday = strategyConfig.canOpenToday;
        this.flag = null;
        this.signal = 0;
        // this.closedBarList = [];
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        if (this.closedBarList === undefined) {
            this.closedBarList = [];
        }

        this.closedBarList.push(closedBar);
        if (this.closedBarList.length > 50) {
            this.closedBarList.shift();
        }
        let highPrice = this.closedBarList.map(e => e["highPrice"]);
        let lowPrice = this.closedBarList.map(e => e["lowPrice"]);
        let closePrice = this.closedBarList.map(e => e["closePrice"]);
        let volume = this.closedBarList.map(e => e["volume"]);
        this.signal = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
    }

    OnNewBar(newBar) {

        console.log(`${this.name}  策略的  ${newBar.symbol}  K线结束,结束时间: ${newBar.endDatetime.toLocaleString()}  Close价: ${newBar.closePrice}  signal: ${this.signal}  flag: ${this.flag} canOpenToday : ${this.canOpenToday}`);
        if (this.signal >= 2) {
            this._cancelOrder();
            this.flag = true;
        } else if (this.signal <= -2) {
            this._cancelOrder();
            this.flag = this.needCloseYesterday ? "close" : false;
        } else {
            this.flag = null;
        }
    }


    _openLong(tick) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvailabelSum(tick);
        if (sum >= 1) {
            let subject = `Today Action Open Long ${this.name}  signal: ${this.signal}`;
            let message = `${this.name}  signal: ${this.signal}   flag: ${this.flag}  时间: ${tick.date}  ${tick.timeStr}`;
            console.log(message);
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.Open);
            this._sendMessage(subject, message);
            this.flag = null;
        }
    }


    _profitTodayLongPositions(tick, position, up = 0) {
        let todayLongPositions = position.GetLongTodayPosition();
        if (todayLongPositions > 0) {
            let longTodayPostionAveragePrice = position.GetLongTodayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (price > longTodayPostionAveragePrice && tick.lastPrice < tick.upperLimit) {
                let subject = `Today Action Profit Long  ${this.name} signal: ${this.signal}`;
                let message = `${this.name}  signal: ${this.signal} flag: ${this.flag}   时间: ${tick.date} ${tick.timeStr}`;
                message += `price ${price}  longTodayPostionAveragePrice  ${longTodayPostionAveragePrice} todayLongPositions  ${todayLongPositions}`
                console.log(message);
                // position need debug;
                todayLongPositions = 1;
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
                } else {
                    this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                }
                this._sendMessage(subject, message);
            }
        }
    }


    _profitYesterdayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.GetLongYesterdayPosition();
        if (yesterdayLongPositions > 0) {
            let longYesterdayPostionAveragePrice = position.GetLongYesterdayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (price > longYesterdayPostionAveragePrice && tick.lastPrice < tick.upperLimit) {
                let subject = `Yesterday Action Profit Long ${this.name}  signal: ${this.signal}`;
                let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}  longYesterdayPostionAveragePrice  ${longYesterdayPostionAveragePrice} yesterdayLongPositions  ${yesterdayLongPositions}`;
                // position need debug;
                yesterdayLongPositions = 1;
                this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                this._sendMessage(subject, message);
            }
        }
    }


    _profitLongPositions(tick, position, up = 0) {
        let longPositions = position.GetLongPosition();
        let longPostionAveragePrice = position.GetLongPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        if (longPositions > 0 && price > longPostionAveragePrice) {
            this._profitTodayLongPositions(tick, position, up);
            this._profitYesterdayLongPositions(tick, position, up);
        }
    }


    _closeYesterdayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.GetLongYesterdayPosition();
        if (yesterdayLongPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.CloseYesterday);
            let subject = `Yesterday Action Close Long  ${this.name}  signal: ${this.signal}`;
            let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice price ${price}   yesterdayLongPositions  ${yesterdayLongPositions}}`;
            this._sendMessage(subject, message);
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
            let isTimeOffset = (NowDateTime > AMOpenTime && NowDateTime < AMOpenTimeOffset) || (NowDateTime > AMResumeTime && NowDateTime < AMResumeTimeOffset) || (NowDateTime > PMOpenTime && NowDateTime < PMOpenTimeOffset) || (NowDateTime > NightOpenTime && NowDateTime < NightOpenTimeOffset);
            let PMCloseTimeStr = NowDateStr + " " + tickFutureConfig.PMClose;
            var PMCloseTime = new Date(PMCloseTimeStr);
            var PMStopTime = new Date(PMCloseTime.getTime() - closeOffsetSec * 1000);
            let NightCloseTimeStr = NowDateStr + " " + tickFutureConfig.NightClose;
            var NightCloseTime = new Date(NightCloseTimeStr);
            var NightCancelTime = new Date(NightCloseTime.getTime() - 3 * 1000);
            var NightStopTime = new Date(NightCloseTime.getTime() - closeOffsetSec * 1000);
            let isTimeToClose = (NowDateTime > PMStopTime && NowDateTime < PMCloseTime) || (TickDateTime > NightStopTime && TickDateTime < NightCancelTime);
            let isTimeToCancel = (TickDateTime > NightCancelTime && TickDateTime < NightCloseTime);
            if (isTimeOffset) {
                return 0;

            } else if (isTimeToClose) {
                return -1;

            } else if (isTimeToCancel) {
                return -2;
            } else {
                return 1;
            }
        }



    OnTick(tick) {
        super.OnTick(tick);
        // global.NodeQuant.MarketDataDBClient.RecordTick(tick.symbol, tick);
        let tradeState = this._getOffset(tick, 168, 18);

        if (this.flag === false) {
            let position = this.GetPosition(tick.symbol);
            if (position) {
                let exchangeName = this._getExchange(tick);
                if (exchangeName === "SHF") {
                    this._profitYesterdayLongPositions(tick, position, 0);
                    this._profitTodayLongPositions(tick, position, 0);
                } else {
                    this._profitLongPositions(tick, position, 0);
                }
                this.flag = null;
            }
        } else if (this.flag === "close") {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.CloseYesterday);
            this.flag = null
        }
        switch (tradeState) {
            // timeOffset
            case 0:
                this._cancelOrder();
                if(this.canOpenToday === false  && this.signal!= 0){
                  let position = this.GetPosition(tick.symbol);
                  if (position) {
                      let exchangeName = this._getExchange(tick);
                      if (exchangeName === "SHF") {
                          this._profitYesterdayLongPositions(tick, position, 0);
                          this._profitTodayLongPositions(tick, position, 0);
                      } else {
                          this._profitLongPositions(tick, position, 0);
                      }
                      let longPositions = position.GetLongPosition();
                      if(longPositions === 0){
                        this.canOpenToday = true;
                      }
                  }
                }
                break;
            // time to close
            case -1:
                this._cancelOrder();
                let position = this.GetPosition(tick.symbol);
                if (position) {
                    let exchangeName = this._getExchange(tick);
                    if (exchangeName === "SHF") {
                        this._profitYesterdayLongPositions(tick, position, 0);
                        this._profitTodayLongPositions(tick, position, 0);
                    } else {
                        this._profitLongPositions(tick, position, 0);
                    }
                }
                break;
            // time to cancel
            case -2:
                this._cancelOrder();
                break;
            // trade time
            default :
                // let unFinishOrderList = this.GetUnFinishOrderList();
                // if (unFinishOrderList.length === 0) {
                    if (this.flag === true) {
                        let position = this.GetPosition(tick.symbol);
                        if (position === undefined) {
                            this._openLong(tick);
                        }else {
                            let longPositions = position.GetLongPosition();
                            if(this.canOpenToday === true) {
                              if (longPositions < this.total) {
                                  this._openLong(tick);
                                }
                            } else {
                              if(longPositions < 1) {
                                this._openLong(tick);
                                this.canOpenToday = true;
                              }
                            }
                        }
                    }
                // }
        }
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = CopperLongStrategy;
