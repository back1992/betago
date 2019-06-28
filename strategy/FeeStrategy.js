let FixedArray = require("fixed-array");
let talib = require('talib-binding');
let BaseStrategy = require("./baseStrategy");

// let Position = require("../util/Position");
class FeeStrategy extends BaseStrategy {
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
        this.thresholdPrice = null;
        this.stopPrice = null;
        this.action = null;
        this.lastSignal = null;
        this.lastSignal = null;
        this.total = strategyConfig.total;
        // this.direction = strategyConfig.direction;
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

    _cancelOrder() {
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length > 0) {
            for (let index in unFinishOrderList) {
                let unFinishOrder = unFinishOrderList[index];
                global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
            }
        }
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
            this._cancelOrder();
            this.flag = "buy";
            //avoid elevator buy
            if (this.lastSignal < 2) {
                this.action = true;
            }
        } else if (this.signal <= -2) {
            this._cancelOrder();
            this.flag = "sell";
            if (this.lastSignal > -2) {
                this.action = true;
            }
        } else {
            this.flag = null
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


    _openLong(tick, num) {
        if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, num, Direction.Buy, OpenCloseFlagType.Open);
            this.action = false;
        }
    }

    _closeLong(tick, num, todayLongPositions, yesterdayLongPositions) {
        if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
            if (todayLongPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, num, Direction.Sell, OpenCloseFlagType.CloseToday);
                this.action = false;
            } else if (yesterdayLongPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, num, Direction.Sell, OpenCloseFlagType.CloseYesterday);
                this.action = false;
            }
        }
    }

    _openShort(tick, num) {
        if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
            this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, num, Direction.Sell, OpenCloseFlagType.Open);
            this.action = false;
        }
    }

    _closeShort(tick, num, todayShortPositions, yesterdayShortPositions) {
        if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
            if (todayShortPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, num, Direction.Buy, OpenCloseFlagType.CloseToday);
                this.action = false;
            } else if (yesterdayShortPositions > 0) {
                this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, num, Direction.Buy, OpenCloseFlagType.CloseYesterday);
                this.action = false;
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
        // this._adjustBuyFlag(tick);
        let position = this.GetPosition(tick.symbol);

        switch (this.flag) {
            case "buy":
                // code block
                if (this.action === true) {
                    if (position !== undefined) {
                        let longPosition = position.GetLongPosition();
                        let shortPosition = position.GetShortPosition();
                        let unLockPosition = longPosition - shortPosition;

                        let todayShortPositions = position.GetShortTodayPosition();
                        let yesterdayShortPositions = position.GetShortYesterdayPosition();
                        //allow negative position
                        let shortPositionAveragePrice = position.GetShortPositionAveragePrice();
                        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
                        let priceTick = contract.priceTick;
                        if (unLockPosition < this.total) {
                            this.QueryTradingAccount(tick.clientName);
                            let sum = this._getAvilableSum(tick);
                            if (sum >= 1) {
                                this._openLong(tick, 1);
                            }
                            if (shortPosition && tick.lastPrice < (shortPositionAveragePrice - priceTick)) {
                                this._closeShort(tick, 1, todayShortPositions, yesterdayShortPositions);
                            }
                        }
                    } else {
                        if (this.total > 0) {
                            this._openLong(tick, 1);
                        }
                    }

                }
                break;
            case "sell":
                // code block
                if (this.action === true) {
                    if (position !== undefined) {
                        let longPosition = position.GetLongPosition();
                        let shortPosition = position.GetShortPosition();
                        let unLockPosition = longPosition - shortPosition;
                        let todayLongPositions = position.GetLongTodayPosition();
                        let yesterdayLongPositions = position.GetLongYesterdayPosition();
                        //allow negative position
                        let longPositionAveragePrice = position.GetLongPositionAveragePrice();
                        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
                        let priceTick = contract.priceTick;
                        if (unLockPosition > this.total) {
                            this.QueryTradingAccount(tick.clientName);
                            let sum = this._getAvilableSum(tick);
                            if (sum >= 1) {
                                this._openShort(tick, 1);
                            }
                            if (longPosition && tick.lastPrice > (longPositionAveragePrice + priceTick)) {
                                this._closeLong(tick, 1, todayLongPositions, yesterdayLongPositions);
                            }
                        }
                    } else {
                        if (this.total < 0) {
                            this._openShort(tick, 1);
                        }
                    }
                }
                break;
            default:
            // code block
        }
    }

    Stop() {
        super.Stop();
    }
}

module.exports = FeeStrategy;
