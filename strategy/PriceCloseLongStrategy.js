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
        this.threadPrice = strategyConfig.threadPrice;
        this.sum = 0;
    }

    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar)
    {

    }

    OnNewBar(newBar)
    {

    }


    OnTick(tick)
    {
      this.lastTick = this.tick;
      this.tick = tick;
      let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 1);
      // console.log(this.sum , this.total )
      // console.log(price , this.threadPrice )
      if( this.sum < this.total ) {
        if (this.lastTick  && this.lastTick.lastPrice > tick.lastPrice ) {
          // console.log(this.lastTick , this.lastTick.lastPrice , tick.lastPrice )
          if (price > this.threadPrice ) {
              this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.CloseToday);
              this.sum += 1;
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
