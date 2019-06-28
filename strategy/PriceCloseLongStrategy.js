/**
 * Created by Administrator on 2017/7/4.
 */

var BaseStrategy=require("./baseStrategy");

/////////////////////// Private Method ///////////////////////////////////////////////

class PriceCloseLongStrategy extends BaseStrategy{

    //初始化
    constructor(strategyConfig)
    {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.thresholdPrice = strategyConfig.thresholdPrice;
        this.sum = 0;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar)
    {
      if (this.thresholdPrice) {
          // if (closedBar.highPrice < this.thresholdPrice && closedBar.closePrice < closedBar.openPrice) {
          if (closedBar.closePrice > this.thresholdPrice ) {
              this.flag = true;
          }
          // if (closedBar.lowPrice > this.thresholdPrice) {
          if (closedBar.closePrice < this.thresholdPrice) {
              this.flag = false;
          }
      }

    }

    OnNewBar(newBar)
    {
      // let position = this.GetPosition(newBar.symbol);
      // let todayLongPositions = position.GetLongTodayPosition();
      // let yesterdayLongPositions = position.GetLongYesterdayPosition();
      // console.log(newBar.symbol, todayLongPositions, yesterdayLongPositions);
    }

    _closeShortPositions(tick, shortPositions = 1, up = 0) {
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
        this.SendOrder(tick.clientName, tick.symbol, price, shortPositions, Direction.Buy, OpenCloseFlagType.Close);

    }

    _closeLongPositions(tick, longPositions = 1, up = 0) {
        let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
        this.SendOrder(tick.clientName, tick.symbol, price, longPositions, Direction.Sell, OpenCloseFlagType.Close);
    }


    OnTick(tick)
    {
      super.OnTick(tick);
      this.lastTick = this.tick;
      this.tick = tick;
      if( this.sum < this.total ) {
        if (this.lastTick  && this.lastTick.lastPrice > tick.lastPrice ) {
          // let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 1);
          // if (price > this.thresholdPrice ) {
          //     this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Close);
          //     this.sum += 1;
          // }
          if (this.flag === true) {
              this._closeLongPositions(tick);
              this.sum += 1;
              this.flag = null;
          }
        }
      } else {
        // this.Stop();
      }
    }

    Stop(){
        //调用基类方法
        super.Stop();
    }
}

module.exports=PriceCloseLongStrategy;
