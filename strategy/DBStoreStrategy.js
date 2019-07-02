let talib = require('talib-binding');
let BaseStrategy = require("./baseStrategy");

class DBStorStrategy extends BaseStrategy {
    constructor(strategyConfig) {
        //一定要使用super(strategyConfig)进行基类实例初始化
        //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
        //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
        super(strategyConfig);
    }

    OnClosedBar(closedBar) {
        console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
        // let barList = this._loadBarFromDB(this, closedBar.symbol, 50, KBarType.Second, 1);
        // console.log(barList);
        this.closedBarList.push(closedBar);
        this.closedBarList.shift();
        this.openPrice = this.closedBarList.map(e => e["openPrice"]);
        this.highPrice = this.closedBarList.map(e => e["highPrice"]);
        this.lowPrice = this.closedBarList.map(e => e["lowPrice"]);
        this.closeprice = this.closedBarList.map(e => e["closePrice"]);

        var retMFI = talib.MFI(this.highPrice, this.lowPrice, this.closePrice, this.volume, 14);
        var retCCI = talib.CCI(this.highPrice, this.lowPrice, this.closePrice, 14);
        var retCMO = talib.CMO(this.closePrice, 14);
        var retAROONOSC = talib.AROONOSC(this.highPrice, this.lowPrice, 14);
        var retADX = talib.ADX(this.highPrice, this.lowPrice, this.closePrice, 14);
        var retRSI = talib.RSI(this.closePrice, 14);

        var mfi = retMFI[retMFI.length - 1];
        var cci = retCCI[retCCI.length - 1];
        var cmo = retCMO[retCMO.length - 1];
        var aroonosc = retAROONOSC[retAROONOSC.length - 1];
        var adx = retADX[retADX.length - 1];
        var rsi = retRSI[retRSI.length - 1];

        // this.lastSignal = this.signal;
        this.signal = this._get_signal(mfi, cci, cmo, aroonosc, adx, rsi);
        console.log(this.signal);
    }

    OnNewBar(newBar) {
        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice);
    }

    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
        this.closedBarList = ClosedBarList
    }

    OnTick(tick) {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度
        super.OnTick(tick);
        // this.OnFinishPreLoadBar(tick.symbol, KBarType.Second, 10, this.closedBarList)
        global.NodeQuant.MarketDataDBClient.RecordTick(tick.symbol, tick);
        // console.log(this.name+"策略的"+tick.symbol+"的Tick,时间:"+tick.date+" "+tick.timeStr+",价格:"+tick.lastPrice);
    }

    Stop() {
        super.Stop();
    }
}

module.exports = DBStorStrategy;
