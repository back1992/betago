require("../systemConfig");
require("../util/Position");
require("../util/MyPostMan");
const Indicator = require("../util/Indicator");
const dotenv = require('dotenv');
dotenv.config();
var _ = require('lodash');
var BaseStrategy = require("./baseStrategy");

// let Position = require("../util/Position");
class SilverShortStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
        global.BarCount = 0;
        // this.total = strategyConfig.total;
        // define as infinte large
        this.total = 1000000;
        this.sum = 0;
        this.flag = null;
        this.leftFund = 0;
    }


    OnClosedBar(closedBar) {
        let cylinder = Math.abs(closedBar.closePrice - closedBar.openPrice);
        let bottom = (closedBar.closePrice > closedBar.openPrice) ? closedBar.openPrice : closedBar.closePrice;
        let top = (closedBar.closePrice > closedBar.openPrice) ? closedBar.closePrice : closedBar.openPrice;
        let lowerLeader = bottom - closedBar.lowPrice;
        let upperLeader = closedBar.highPrice - top;
        let flagIndex = upperLeader - lowerLeader;
        this.flag = flagIndex > cylinder ? "short" : flagIndex < -1 * cylinder ? "long" : null;
        console.log(`this.flag: ${this.flag}  openPrice: ${closedBar.openPrice}  highPrice: ${closedBar.highPrice}  lowPrice: ${closedBar.lowPrice}  closePrice: ${closedBar.closePrice}, lowerLeader: ${lowerLeader}, cylinder: ${cylinder}, upperLeader: ${upperLeader}`);
    }

    OnNewBar(newBar) {
        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice);
        this.QueryTradingAccount('CTP');
    }



    OnTick(tick) {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        super.OnTick(tick);
        if (this.flag === "long") {
            let position = this.GetPosition(tick.symbol);
            if (position) {
              this._profitYesterdayShortPositions(tick, position, 0);
              this.flag = null;
            }
        } else if (this.flag === "short") {
          let position = this.GetPosition(tick.symbol);
          if (position) {
            this._profitYesterdayLongPositions(tick, position, 0);
            this.flag = null;
          }
        }

    }

    Stop() {
        super.Stop();
    }
}

module.exports = SilverShortStrategy;
