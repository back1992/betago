let FixedArray = require("fixed-array");
let talib = require('talib-binding');
let BaseStrategy = require("./baseStrategy");
let TimeIndicator = require("../util/TimeIndicator");

class IndicatorBuyStrategy extends BaseStrategy {
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
        this.step = strategyConfig.step;
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
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length !== 0) {
            for (let index in unFinishOrderList) {
                let unFinishOrder = unFinishOrderList[index];
                global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
            }
        }

        // console.log(this.name + "策略的" + closedBar.symbol + "K线结束,结束时间:" + closedBar.endDatetime.toLocaleString() + ",Close价:" + closedBar.closePrice);
        // this.LoadBarFromDB(closedBar);
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
        let amplitude = Math.abs(this.thresholdPrice - closedBar.closePrice) / closedBar.closePrice;
        // 风浪太大，小心翻船
        // if (amplitude > this.step) {
        //     this.thresholdPrice = closedBar.closePrice;
        //     this.stopPrice = closedBar.lowPrice;
        // }

        if (this.signal >= 2) {
            this.direction = "long"
            this.thresholdPrice = closedBar.HighPrice;
            this.stopPrice = closedBar.lowPrice;
        } else if (this.signal <= -2) {
            this.direction = "short"
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

    // LoadBarFromDB(closedBar) {
    //     // if (global.NodeQuant.MarketDataDBClient) {
    //     //     let barList = this._loadBarFromDB(closedBar.symbol);
    //     //     console.log(barList);
    //     //
    //     // } else {
    //     //     let message = "无法预加载数据,数据库客户端没有实例,请检查系统配置";
    //     //     let error = new NodeQuantError(this.name, ErrorType.StrategyError, message);
    //     //
    //     //     global.AppEventEmitter.emit(EVENT.OnError, error);
    //     // }
    //     let barList = this._myLoadBarFromDB(closedBar.symbol);
    //     // console.log(barList);
    // }


    _openLong(tick) {
        let priceUp = tick.lastPrice;
        let position = this.GetPosition(tick.symbol);
        if (position === undefined) {
            this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Buy, OpenCloseFlagType.Open);
        } else {
            let todayLongPositions = position.GetLongTodayPosition();
            if (todayLongPositions === 0) {
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                    this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Buy, OpenCloseFlagType.Open);
                }
            }
        }
    }


    _closeLong(tick) {
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length === 0) {
            let position = this.GetPosition(tick.symbol);
            if (position !== undefined) {
                let todayLongPositions = position.GetLongTodayPosition();
                let yesterdayLongPositions = position.GetLongYesterdayPosition();
                let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, 1);
                if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
                    if (todayLongPositions > 0) {
                        this.SendOrder(tick.clientName, tick.symbol, price, todayLongPositions, Direction.Sell, OpenCloseFlagType.CloseToday);
                    }
                    if (yesterdayLongPositions > 0) {
                        this.SendOrder(tick.clientName, tick.symbol, price, yesterdayLongPositions, Direction.Sell, OpenCloseFlagType.CloseYesterday);

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

    _openLongMulti(tick) {
        let priceUp = tick.lastPrice;
        let position = this.GetPosition(tick.symbol);
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (position === undefined) {
            this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Buy, OpenCloseFlagType.Open);
        } else {
            let todayLongPositions = position.GetLongTodayPosition();
            if (todayLongPositions === 0) {
                if (unFinishOrderList.length === 0) {
                    this.SendOrder(tick.clientName, tick.symbol, priceUp, 1, Direction.Buy, OpenCloseFlagType.Open);
                } else {
                  let priceDown = this.PriceDown(tick.symbol,tick.lastPrice,Direction.Buy,unFinishOrderList.length);
                    this.SendOrder(tick.clientName, tick.symbol, priceDown, 1, Direction.Buy, OpenCloseFlagType.Open);
                }
            } else {
              if (unFinishOrderList.length === 0) {
                  let priceDown = this.PriceDown(tick.symbol,tick.lastPrice,Direction.Buy,todayLongPositions);
              } else {
                let priceDown = this.PriceDown(tick.symbol,tick.lastPrice,Direction.Buy,unFinishOrderList.length + todayLongPositions);
                  this.SendOrder(tick.clientName, tick.symbol, priceDown, 1, Direction.Buy, OpenCloseFlagType.Open);
              }
            }
        }
    }



    _adjustBuyFlag(tick) {
        if (this.thresholdPrice !== null) {
            if (tick.lastPrice > this.thresholdPrice) {
                this.flag = true;
            } else if (tick.lastPrice < this.stopPrice) {
                this.flag = false;
            } else {
                this.flag = null;
            }
        }
    }


    OnTick(tick) {
        //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
        //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度
        super.OnTick(tick);
        let isTimeToClose = TimeIndicator._getTimeToClose(tick, 30);
        // lastTick for close use
        this.lastTick = this.tick;
        this.tick = tick;
        this._adjustBuyFlag(tick);
        if (isTimeToClose) {
            this._closeLong(tick);
            // this._closeShort(tick);
        } else {
            if (this.flag === true) {
                this.QueryTradingAccount(tick.clientName);
                let sum = this._getAvilableSum(tick);
                if (sum >= 1) {
                    // if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                    //     this.SendOrder(tick.clientName, tick.symbol, tick.lastPrice, 1, Direction.Buy, OpenCloseFlagType.Open);
                    // }
                    this._openLongMulti(tick);
                }
            } else if (this.flag === false) {
                this._closeLong(tick);
            }
        }
    }

    Stop() {
        super.Stop();
    }
}

module.exports = IndicatorBuyStrategy;
