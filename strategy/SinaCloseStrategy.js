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
class SinaCloseStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        // this.total = strategyConfig.total;
        // define as infinte large
        this.total = 1000000;
        this.sinaSymbol = strategyConfig.sinaSymbol;
        this.BarInterval = strategyConfig.BarInterval;
        this.sum = 0;
        this.flag = null;
        global.actionFlag = {};
        global.actionScore = {};
        global.actionDatetime = {};
        global.actionBarInterval = {};
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        let url = `http://stock2.finance.sina.com.cn/futures/api/json.php/IndexService.getInnerFuturesMiniKLine${this.BarInterval}m?symbol=${this.sinaSymbol}`;
        request({
            url: url,
            json: true
        }, function (error, response, body) {

            if (!error && response.statusCode === 200) {
                let closedBarList = body.slice(0, 50);// Print the json response
                closedBarList.reverse();
                let highPrice = closedBarList.map(e => e["2"]);
                let lowPrice = closedBarList.map(e => e["3"]);
                let closePrice = closedBarList.map(e => e["4"]);
                let volume = closedBarList.map(e => e["5"]);
                let actionDate = closedBarList.map(e => e["0"]);
                let score = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
                global.actionScore[closedBar.symbol] = score;
                global.actionDatetime[closedBar.symbol] = actionDate[actionDate.length - 1];
                global.actionBarInterval[closedBar.symbol] = 15;
                console.log(`${closedBar.symbol}: ${score}  ${actionDate[actionDate.length - 1]} flag: ${this.flag}`);
                console.log(global.actionScore);
            }
        })
    }

    OnNewBar(newBar) {
        this._cancelOrder();
        if (global.actionScore[newBar.symbol] != undefined) {
            if (global.actionScore[newBar.symbol] >= 2) {
                this.flag = "long";
            } else if (global.actionScore[newBar.symbol] <= -2) {
                this.flag = "short";
            } else {
                this.flag = null;
            }
        }
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }

    _profitMyYesterdayLongPositions(tick, position, up = 0) {
        let yesterdayLongPositions = position.MyGetLongYesterdayPosition();
        if (yesterdayLongPositions > 0) {
            let longYesterdayPostionAveragePrice = position.MyGetLongYesterdayPositionAveragePrice();
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            if (price > longYesterdayPostionAveragePrice && tick.lastPrice < tick.upperLimit) {
                this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.Close);
                let subject = `Sina Yesterday Action Profit Long ${this.name}`;
                let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}  longYesterdayPostionAveragePrice  ${longYesterdayPostionAveragePrice} yesterdayLongPositions  ${yesterdayLongPositions}`;
                this._sendMessage(subject, message);
            }
        }
    }


    _profitMyLongPositions(tick, position, up = 0) {
        let longPositions = position.GetLongPosition();
        let longPostionAveragePrice = position.GetLongPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        if (longPositions > 0 && price > longPostionAveragePrice) {
            this._profitMyYesterdayLongPositions(tick, position, up);
        }
    }

    _profitMyYesterdayShortPositions(tick, position, up = 0) {
        let yesterdayShortPositions = position.MyGetShortYesterdayPosition();
        let shortYesterdayPostionAveragePrice = position.MyGetShortYesterdayPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
        // if (yesterdayShortPositions > 0 && price < shortYesterdayPostionAveragePrice && tick.lastPrice > tick.lowerLimit) {
        if (yesterdayShortPositions > 0 && price < shortYesterdayPostionAveragePrice) {
            let exchangeName = this._getExchange(tick);
            if (exchangeName === "SHF") {
                this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.CloseYesterday);
            } else {
                this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Buy, OpenCloseFlagType.Close);
            }
            let subject = `Yesterday Action Profit Short ${this.name}`;
            let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}  shortYesterdayPostionAveragePrice  ${shortYesterdayPostionAveragePrice} yesterdayShortPositions  ${yesterdayShortPositions}`;
            this._sendMessage(subject, message);
        }
    }


    _profitShortPositions(tick, position, up = 0) {
        let shortPositions = position.GetShortPosition();
        let shortPostionAveragePrice = position.GetShortPositionAveragePrice();
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
        if (shortPositions > 0 && price < shortPostionAveragePrice) {
            console.log(`profit short yesterday: ${tick.symbol}`);
            this._profitMyYesterdayShortPositions(tick, position, up);
        }
    }


    OnTick(tick) {
        super.OnTick(tick);
        let tradeState = this._getOffset(tick, 0, 300);

        switch (tradeState) {
            // timeOffset
            case 0:
                this._cancelOrder();
                break;
            // time to close
            case -1:

                let position = this.GetPosition(tick.symbol);
                if (position) {
                    this._profitLongPositions(tick, position, 0);
                    this._profitShortPositions(tick, position, 0);
                }
                break;
            // trade time
            default :
                if (this.flag === "long") {
                    let position = this.GetPosition(tick.symbol);
                    if (position) {
                        this._profitShortPositions(tick, position, 0);
                        this.flag = null;
                    }
                } else if (this.flag === "short") {
                    let position = this.GetPosition(tick.symbol);
                    if (position) {
                        this._profitLongPositions(tick, position, 0);
                        this.QueryTradingAccount(tick.clientName);
                        if (global.availableFund < 0) {
                            let yesterdayLongPositions = position.MyGetLongYesterdayPosition();
                            if (yesterdayLongPositions > 0) {
                                let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
                                if (tick.lastPrice < tick.upperLimit) {
                                    this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Close);
                                    let subject = `Sina Account money  is negetive Yesterday Action Close Long ${this.name}`;
                                    let message = `${this.name}  时间: ${tick.date}   ${tick.timeStr} closePrice ${price}   yesterdayLongPositions 1`;
                                    this._sendMessage(subject, message);
                                }
                            }
                        }
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

module.exports = SinaCloseStrategy;
