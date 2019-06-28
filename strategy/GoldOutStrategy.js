let FixedArray = require("fixed-array");
let BaseStrategy = require("./baseStrategy");

// let Position = require("../util/Position");
class GoldOutStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
        global.BarCount = 0;
        this.signal = 0;
        this.openPrice = FixedArray(50);
        this.highPrice = FixedArray(50);
        this.lowPrice = FixedArray(50);
        this.closePrice = FixedArray(50);
        this.volume = FixedArray(50);
        this.id = FixedArray(50);
        this.tick = null;
        this.orderPrice = 0;
        this.flag = null;
        this.threadPrice = strategyConfig.threadPrice;
        this.stopPrice = null;
        this.action = null;
        this.lastSignal = null;
        this.lastSignal = null;
        this.total = strategyConfig.total;
        this.availableFund = strategyConfig.availableFund;
        this.sum = 0;
        // this.direction = strategyConfig.direction;
    }


    OnClosedBar(closedBar) {
        // console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
    }

    OnNewBar(newBar) {
        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice, this.signal);
    }

    OnQueryTradingAccount(tradingAccountInfo) {
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
        return Math.floor(global.availableFund / (tick.lastPrice * unit * marginRate));
    }



    OnTick(tick) {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度
        this.lastTick = this.tick;
        this.tick = tick;
        this.QueryTradingAccount(tick.clientName);
        let threadBalance = global.Balance - 111000;
        let meatBalance = global.Balance - 100000;
        console.log(global.availableFund ,this.availableFund);

        if (global.availableFund < this.availableFund) {
          console.log( this.sum , this.total ) ;
          if( this.sum < this.total ) {
            // if (global.withdrawQuota < 500) {
            let unFinishOrderList=this.GetUnFinishOrderList();
            console.log(unFinishOrderList, unFinishOrderList.length);
            if(unFinishOrderList.length === 0) {
              let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 1);
              this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Close);
              this.sum += 1;
            }
          }
        }        // console.log(this._getTimeToGold(tick) );
        if( this._getTimeToGold(tick)){
          if( this.sum < this.total ) {
            if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
              if (global.availableFund <=  2*global.Balance) {
                let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 1);
                  this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Close);
                  this.sum += 1;
              }
            }
          }
        } else {
            let unFinishOrderList=this.GetUnFinishOrderList();
            if(unFinishOrderList.length!=0)
              {
                  for(let index in unFinishOrderList)
                  {
                      let unFinishOrder=unFinishOrderList[index];
                      global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
                  }
              }
          }
    }

    Stop() {
        super.Stop();
    }
}

module.exports = GoldOutStrategy;
