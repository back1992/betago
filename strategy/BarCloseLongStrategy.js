/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy = require("./baseStrategy");

/////////////////////// Private Method ///////////////////////////////////////////////

class BarCloseLongStrategy extends BaseStrategy {

    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);

        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {
        if (closedBar.closePrice < closedBar.openPrice) {
            this.flag = true;
        }
        console.log(closedBar.closePrice, closedBar.openPrice, this.flag)

    }

    OnNewBar(newBar) {

    }


    OnTick(tick) {
      super.OnTick(tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 1);
        if(this.sum < this.total  && this.flag === true) {
          if (this.lastTick  && this.lastTick.lastPrice > tick.lastPrice ) {
            this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Close);
            // this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.CloseToday);
            this.sum += 1;
            this.flag = false;
          }
        } else {
          // this.Stop();
        }
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = BarCloseLongStrategy;
