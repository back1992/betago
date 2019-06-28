let FixedArray = require("fixed-array");
let talib = require('talib-binding');
let BaseStrategy = require("./baseStrategy");
<<<<<<< HEAD
let TimeIndicator = require("../util/TimeIndicator");
=======
// let TimeIndicator = require("../util/TimeIndicator");
>>>>>>> 8087f063d9a940de491712f2c4a328f087ba9bac

// let Position = require("../util/Position");

class FeeCloseShortStrategy extends BaseStrategy {
    constructor(strategyConfig) {
<<<<<<< HEAD
        //一定要使Shorter(strategyConfig)进行基类实例初始化
=======
        //一定要使用super(strategyConfig)进行基类实例初始化
>>>>>>> 8087f063d9a940de491712f2c4a328f087ba9bac
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
        this.direction = null;
        this.flag = null;
        this.thresholdPrice = null;
        this.stopPrice = null;
        this.action = null;
        this.lastSignal = null;
        this.lastOpenPrice = null;
        this.total = strategyConfig.total;
    }

    _get_signal(mfi, cci, cmo, aroonosc, adx, rsi) {
        let score = 0;
        if (cci > 100) {
            score -= 1
        } else if (cci < -100) {
            score += 1
        }
        if (mfi > 80) {
            score -= 1
        } else if (mfi < 20) {
            score += 1
        }
        if (cmo > 50) {
            score -= 1
        } else if (cmo < -50) {
            score += 1
        }
        if (aroonosc < -50) {
            score -= 1
        } else if (aroonosc > 50) {
            score += 1
        }
        if (rsi > 70) {
            score -= 1
        } else if (rsi < 30) {
            score += 1
        }
        return score
    }


    OnClosedBar(closedBar) {
        // console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
        this.openPrice.push(closedBar.openPrice);
        this.highPrice.push(closedBar.highPrice);
        this.lowPrice.push(closedBar.lowPrice);
        this.closePrice.push(closedBar.closePrice);
        this.volume.push(closedBar.volume);
        this.id.push(closedBar.Id);
        // console.log(mfi, cci, cmo, this.aroonosc, this.adx, rsi);
        var retMFI = talib.MFI(this.highPrice.array, this.lowPrice.array, this.closePrice.array, this.volume.array, 14);
        var retCCI = talib.CCI(this.highPrice.array, this.lowPrice.array, this.closePrice.array, 14);
        var retCMO = talib.CMO(this.closePrice.array, 14);
        var retAROONOSC = talib.AROONOSC(this.highPrice.array, this.lowPrice.array, 14);
        var retADX = talib.ADX(this.highPrice.array, this.lowPrice.array, this.closePrice.array, 14);
        var retRSI = talib.RSI(this.closePrice.array, 14);

        var mfi = retMFI[retMFI.length - 1];
        var cci = retCCI[retCCI.length - 1];
        var cmo = retCMO[retCMO.length - 1];
        var aroonosc = retAROONOSC[retAROONOSC.length - 1];
        var adx = retADX[retADX.length - 1];
        var rsi = retRSI[retRSI.length - 1];

        this.lastSignal = this.signal;
        this.signal = this._get_signal(mfi, cci, cmo, aroonosc, adx, rsi);

        if (this.signal >= 2) {
            let unFinishOrderList = this.GetUnFinishOrderList();
            if (unFinishOrderList.length > 0) {
                for (let index in unFinishOrderList) {
                    let unFinishOrder = unFinishOrderList[index];
                    global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
                }
            }
            this.direction = "long";
            this.flag = false;
        } else if (this.signal <= -2) {
            let unFinishOrderList = this.GetUnFinishOrderList();
            if (unFinishOrderList.length > 0) {
                for (let index in unFinishOrderList) {
                    let unFinishOrder = unFinishOrderList[index];
                    global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
                }
            }
            this.direction = "short";
            this.flag = true;
            //avoid elevator buy
            if (this.lastSignal > -2) {
                this.action = true;
            }
        } else {
            this.direction = null
        }
    }

    OnNewBar(newBar) {
        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice, this.signal);
    }



<<<<<<< HEAD
    _closeLong(tick) {
        let position = this.GetPosition(tick.symbol);
        if (position !== undefined) {
            let todayShortPositions = position.GetShortTodayPosition();
            if (todayShortPositions < this.total) {
                this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.Close);
=======
    _closeShort(tick) {
        let position = this.GetPosition(tick.symbol);
        if (position !== undefined) {
            let todayShortPositions = position.GetShortTodayPosition();
            if (todayShortPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.CloseToday);
>>>>>>> 8087f063d9a940de491712f2c4a328f087ba9bac
                this.lastOpenPrice = tick.lastPrice;
                this.action = false;
            } else {
                this.action = false;
            }
<<<<<<< HEAD
        } else {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.Close);
            this.lastOpenPrice = tick.lastPrice;
            this.action = false;
=======
>>>>>>> 8087f063d9a940de491712f2c4a328f087ba9bac
        }
    }

    OnTick(tick) {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度
        super.OnTick(tick);
        // lastTick for close use
        this.lastTick = this.tick;
        this.tick = tick;
        // this._adjustSellFlag(tick);
        if (this.flag === true) {
<<<<<<< HEAD
            if (this.direction === "short") {
                // this._closeShort(tick);
                if (this.action === true) {
                    if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
                        this._closeLong(tick);
=======
            if (this.direction === "long") {
                // this._closeShort(tick);
                if (this.action === true) {
                    if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                        this._closeShort(tick);
>>>>>>> 8087f063d9a940de491712f2c4a328f087ba9bac
                    }

                }
            }
        } else if (this.flag === false) {
            // this._profitShort(tick);
            this.flag = null;
        }
    }

    Stop() {
        super.Stop();
    }
}

module.exports = FeeCloseShortStrategy;