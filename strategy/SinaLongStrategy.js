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
class SinaLongStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.tick = null;
        this.total = strategyConfig.total;
        this.sinaSymbol = strategyConfig.sinaSymbol;
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
      let cylinder = Math.abs(closedBar.closePrice - closedBar.openPrice);
      let bottom = (closedBar.closePrice > closedBar.openPrice) ? closedBar.openPrice : closedBar.closePrice;
      let top = (closedBar.closePrice > closedBar.openPrice) ? closedBar.closePrice : closedBar.openPrice;
      let lowerLeader = bottom - closedBar.lowPrice;
      let upperLeader = closedBar.highPrice - top;
      let flagIndex = lowerLeader - upperLeader;
      this.flag = flagIndex > cylinder ? true : flagIndex < -1 * cylinder ? false : null;
      if (flagIndex > cylinder) {
        if(global.actionScore[closedBar.symbol] >= 2 ){
          this.flag = true;
        }
      } else if(flagIndex < -1 * cylinder) {
        this.flag = false;
      } else {
        this.flag = null;
      }
      console.log(`this.flag: ${this.flag}  openPrice: ${closedBar.openPrice}  highPrice: ${closedBar.highPrice}  lowPrice: ${closedBar.lowPrice}  closePrice: ${closedBar.closePrice}, lowerLeader: ${lowerLeader}, cylinder: ${cylinder}, upperLeader: ${upperLeader}`);
    }

    OnNewBar(newBar) {
        // let LookBackCount = 50;
        // let BarType = KBarType.Minute;
        // // let BarInterval = 5;
        // let intervalArray = [5, 15, 30, 60];
        // let BarInterval = intervalArray[Math.floor(Math.random() * intervalArray.length)];
        // global.NodeQuant.MarketDataDBClient.barrange([newBar.symbol, BarInterval, LookBackCount, -1], function (err, ClosedBarList) {
        //     if (err) {
        //         console.log("从" + newBar.symbol + "的行情数据库LoadBar失败原因:" + err);
        //         //没完成收集固定K线个数
        //         MyOnFinishLoadBar(strategy, newBar.symbol, BarType, BarInterval, undefined);
        //         return;
        //     }
        //     let highPrice = ClosedBarList.map(e => e["highPrice"]);
        //     let lowPrice = ClosedBarList.map(e => e["lowPrice"]);
        //     let closePrice = ClosedBarList.map(e => e["closePrice"]);
        //     let volume = ClosedBarList.map(e => e["volume"]);
        //     let actionDate = ClosedBarList.map(e => e["actionDate"]);
        //     let timeStr = ClosedBarList.map(e => e["timeStr"]);
        //     let score = Indicator._get_talib_indicator(highPrice, lowPrice, closePrice, volume);
        //     global.actionScore[newBar.symbol] = score;
        //     global.actionDatetime[newBar.symbol] = actionDate[actionDate.length - 1] + " " + timeStr[timeStr.length - 1];
        //     global.actionBarInterval[newBar.symbol] = BarInterval;
        //     var filtered = _.pickBy(global.actionScore, function (score) {
        //         return score > 2 || score < -2;
        //     });
        //     // console.log(actionDate[actionDate.length - 1] + " " + timeStr[timeStr.length - 1]);
        //     // console.log(global.actionScore);
        // });
        let url = `http://stock2.finance.sina.com.cn/futures/api/json.php/IndexService.getInnerFuturesMiniKLine15m?symbol=${this.sinaSymbol}`;
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
                console.log(closedBarList[closedBarList.length-1]);
                console.log(score);
                global.actionScore[newBar.symbol] = score;
                global.actionDatetime[newBar.symbol] = actionDate[actionDate.length - 1] ;
                global.actionBarInterval[newBar.symbol] = 15;
                if(score>1 || score < -1) {
                  console.log(global.actionDatetime)
                  console.log(global.actionScore);
                }
            }
        })
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList;
    }



    OnTick(tick) {
        super.OnTick(tick);

    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = SinaLongStrategy;
