let FixedArray = require("fixed-array");
let talib = require('talib-binding');
let BaseStrategy = require("./baseStrategy");
let TimeIndicator = require("../util/TimeIndicator");

// let Position = require("../util/Position");

class FeeSellStrategy extends BaseStrategy {
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
        this.direction = null;
        this.flag = null;
        this.thresholdPrice = null;
        this.stopPrice = null;
        this.action = null;
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
            this.action = true;
        } else {
            this.direction = null
        }
    }

    OnNewBar(newBar) {
        console.log(this.name + "策略的" + newBar.symbol + "K线开始,开始时间" + newBar.startDatetime.toLocaleString() + ",Open价:" + newBar.openPrice, this.signal);
    }

    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
    }

    _getAvilableSum(tick) {
        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
        let upperFutureName = contract.futureName.toUpperCase();
        let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        let unit = tickFutureConfig.Unit;
        let marginRate = tickFutureConfig.MarginRate;
        return Math.floor(global.availableFund / (tick.lastPrice * unit * marginRate));
    }


    _closeShort(tick) {
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length === 0) {
            let position = this.GetPosition(tick.symbol);
            if (position !== undefined) {
                let todayShortPositions = position.GetShortTodayPosition();
                let yesterdayShortPositions = position.GetShortYesterdayPosition();
                let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, 1);
                if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                    if (todayShortPositions > 0) {
                        this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
                    }
                    if (yesterdayShortPositions > 0) {
                        this.SendOrder(tick.clientName, tick.symbol, price, yesterdayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
                    }

                }
            }
        } else {
            for (let index in unFinishOrderList) {
                let unFinishOrder = unFinishOrderList[index];
                global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
            }
        }
    }

    _profitShort(tick) {
        let position = this.GetPosition(tick.symbol);
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (position !== undefined) {
            let todayShortPositions = position.GetShortTodayPosition();
            let shortPositionAveragePrice = position.GetShortPositionAveragePrice();
            let num = todayShortPositions - unFinishOrderList.length;
            console.log("num: " + num + " todayShortPositions: " + todayShortPositions + " unFinishOrderList.length: " + unFinishOrderList.length);
            console.log("tick.lastPrice: " + tick.lastPrice + " shortPositionAveragePrice: " + shortPositionAveragePrice);
            console.log(tick.symbol + " tick.lastPrice < shortPositionAveragePrice " + (tick.lastPrice < shortPositionAveragePrice));
            if (tick.lastPrice < shortPositionAveragePrice) {
                if (todayShortPositions > 0) {
                    this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, num, Direction.Buy, OpenCloseFlagType.CloseToday);
                }
            }
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

        let isTimeToClose = TimeIndicator._getTimeToClose(tick, 30);
        if (isTimeToClose === 2) {
            // this._closeShort(tick);
            this._profitShort(tick);
        } else if (isTimeToClose === 1) {
            this._profitShort(tick);
        } else {
            if (this.flag === true) {
                if (this.direction === "short") {
                    // this._closeShort(tick);
                    this.QueryTradingAccount(tick.clientName);
                    let sum = this._getAvilableSum(tick);
                    if (sum >= 1 && this.action === true) {
                        this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Sell, OpenCloseFlagType.Open);
                        this.action = false;
                    }
                }
            } else if (this.flag === false) {
                this._profitShort(tick);
            }
        }
    }

    Stop() {
        super.Stop();
    }
}

module.exports = FeeSellStrategy;
