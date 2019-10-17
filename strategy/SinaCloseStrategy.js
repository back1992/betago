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
