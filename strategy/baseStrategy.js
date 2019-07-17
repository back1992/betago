/**
 * Created by Administrator on 2017/6/12.
 */

require("../common");
let NodeQuantError = require("../util/NodeQuantError");
let KBar = require("../util/KBar");

//////////////////////////////// Private Method ////////////////////////////////////////////
function _createBar(myStrategy, tick) {
    if (myStrategy.Symbol_KBarId_TickListDic[tick.symbol] === undefined) {
        myStrategy.Symbol_KBarId_TickListDic[tick.symbol] = {};
    }
    //分钟线结束事件
    if (myStrategy.KBarMillSecondInterval) {
        let KBarId = parseInt(tick.Id / myStrategy.KBarMillSecondInterval);
        //不存在KBarId,说明有一个新K线产生
        if (myStrategy.Symbol_KBarId_TickListDic[tick.symbol][KBarId] === undefined) {
            //创建新K线包含的TickList缓存数组
            _createNewBar(myStrategy, KBarId, tick);
            //创建上一个完整K线,加入到策略订阅合约的K线列表
            for (let barId in myStrategy.Symbol_KBarId_TickListDic[tick.symbol]) {
                if (barId !== KBarId.toString()) {
                    //创建上一个完整K线,加入到策略订阅合约的K线列表
                    _createClosedBar(myStrategy, barId, tick);
                    //创建完删除上一个完整K线的TickList缓存
                    delete myStrategy.Symbol_KBarId_TickListDic[tick.symbol][barId];
                }
            }
        } else {
            myStrategy.Symbol_KBarId_TickListDic[tick.symbol][KBarId].push(tick);
        }
    }
}

function _createNewBar(myStrategy, barId, tick) {
    let KBarTickList = [];
    KBarTickList.push(tick);
    myStrategy.Symbol_KBarId_TickListDic[tick.symbol][barId] = KBarTickList;
    //通知策略产生了一个新Bar
    let bar_StartDatetime = KBarTickList[0].datetime;
    let bar_EndDatetime = KBarTickList[KBarTickList.length - 1].datetime;
    let newBar = new KBar(barId, bar_StartDatetime, bar_EndDatetime, tick.symbol, tick.lastPrice, tick.lastPrice, tick.lastPrice, tick.lastPrice, tick.volume, tick.openInterest);
    myStrategy.OnNewBar(newBar);
}

function _createClosedBar(myStrategy, barId, tick) {
    let bar_TickList = myStrategy.Symbol_KBarId_TickListDic[tick.symbol][barId];
    if (bar_TickList.length > 0) {
        let bar_StartDatetime = bar_TickList[0].datetime;
        let bar_EndDatetime = bar_TickList[bar_TickList.length - 1].datetime;
        let bar_Open = bar_TickList[0].lastPrice;
        let bar_Close = bar_TickList[bar_TickList.length - 1].lastPrice;
        let bar_High = bar_TickList[0].lastPrice;
        let bar_Low = bar_TickList[0].lastPrice;
        let volume = 0;
        let openInterest = bar_TickList[bar_TickList.length - 1].openInterest;
        for (let i = 0; i < bar_TickList.length; i++) {
            bar_High = Math.max(bar_High, bar_TickList[i].lastPrice);
            bar_Low = Math.min(bar_Low, bar_TickList[i].lastPrice);
            volume += bar_TickList[i].volume;
        }
        let bar = new KBar(barId, bar_StartDatetime, bar_EndDatetime, tick.symbol, bar_Open, bar_High, bar_Low, bar_Close, volume, openInterest);
        if (myStrategy.Symbol_KBarListDic[tick.symbol] === undefined) {
            let KBarList = [];
            myStrategy.Symbol_KBarListDic[tick.symbol] = KBarList;
        }
        myStrategy.Symbol_KBarListDic[tick.symbol].push(bar);
        //通知策略产生了一个完整Bar
        myStrategy.OnClosedBar(bar);
    }
}

/// <summary>
/// 对期货价格进行整理。如果价格不是最小单位的整数倍,则调整为最小价格的整数倍。
/// </summary>
/// <param name="price">原下单价格</param>
/// <param name="priceTick">每跳价格</param>
/// <returns name="trimPrice">price相对priceTick进行下舍入的价格</returns>
function _trimPriceByPriceTick(price, priceTick) {
    let tickTime = price / priceTick;
    let trimPrice = tickTime * priceTick;
    return trimPrice;
}

//预加载Tick完成
function _onFinishLoadTick(strategy, symbol, TickList) {
    //多策略
    strategy.OnFinishPreLoadTick(symbol, TickList);
}

//数据从数据库中预先加载
function _loadTickFromDB(myStrategy, symbol, LookBackDays) {
    global.NodeQuant.StrategyEngine.LoadTickFromDB(myStrategy, symbol, LookBackDays, _onFinishLoadTick);
}

//预加载Bar完成
function _onFinishLoadBar(strategy, symbol, BarType, BarInterval, ClosedBarList) {
    strategy.OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList);
}

function _loadBarFromDB(myStrategy, symbol, LookBackCount, BarType, BarInterval) {
    global.NodeQuant.StrategyEngine.LoadBarFromDB(myStrategy, symbol, LookBackCount, BarType, BarInterval, _onFinishLoadBar);
}

class BaseStrategy {
    constructor(strategyConfig) {
        this.name = strategyConfig.name;
        this.symbols = strategyConfig.symbols;
        this.KBarType = strategyConfig.BarType;
        this.KBarInterval = strategyConfig.BarInterval;
        this.Symbol_KBarListDic = {};
        this.KBarMillSecondInterval = undefined;
        this.Symbol_KBarId_TickListDic = {};
        if (this.KBarType !== undefined && this.KBarInterval !== undefined) {
            switch (this.KBarType) {
                case KBarType.Tick:
                    break;
                case KBarType.Second:
                    this.KBarMillSecondInterval = this.KBarInterval * 1000;
                    break;
                case KBarType.Minute:
                    this.KBarMillSecondInterval = this.KBarInterval * 60 * 1000;
                    break;
                case KBarType.Hour:
                    this.KBarMillSecondInterval = this.KBarInterval * 60 * 60 * 1000;
                    break;
                default:
                    break;
            }
        }
        //预加载数据库中行情数据
        this.PreloadConfig = strategyConfig.PreloadConfig;
        if (this.PreloadConfig !== undefined) {
            if (global.NodeQuant.MarketDataDBClient) {
                if (this.PreloadConfig.BarType === KBarType.Tick) {
                    for (let symbol in this.symbols) {
                        _loadTickFromDB(this, symbol, this.PreloadConfig.LookBackDays);
                    }
                } else {
                    for (let symbol in this.symbols) {
                        _loadBarFromDB(this, symbol, this.PreloadConfig.LookBackDays, this.PreloadConfig.BarType, this.PreloadConfig.BarInterval);
                    }
                }
            } else {
                let message = "无法预加载数据,数据库客户端没有实例,请检查系统配置";
                let error = new NodeQuantError(this.name, ErrorType.StrategyError, message);
                global.AppEventEmitter.emit(EVENT.OnError, error);
            }
        }
    }

    ////////////////////////////////////////////////////////////// Public Method ///////////////////////////////////////////////////////////////////////////
    //加载Tick完成
    OnFinishPreLoadTick(symbol, TickList) {
    }

    //加载Bar完成
    OnFinishPreLoadBar(symbol, BarType, BarInterval, ClosedBarList) {
      // console.log(symbol, BarType, BarInterval, ClosedBarList);
    }

    /// <summary>
    /// 策略退出
    /// </summary>
    Stop() {
    }

// my add
    _isEmpty(obj) {
        return Object.keys(obj).length === 0;
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


    _getAvilableSum(tick) {
        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
        let upperFutureName = contract.futureName.toUpperCase();
        let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        let unit = tickFutureConfig.Unit;
        let marginRate = tickFutureConfig.MarginRate;
        return Math.floor(global.availableFund / (tick.lastPrice * unit * marginRate));
    }


    //js Date对象从0开始的月份
    _getOffset(tick, breakOffsetSec = 180, closeOffsetSec = 30) {
        let NowDateTime = new Date();
        // var hour = NowDateTime.getHours();
        let NowDateStr = NowDateTime.toLocaleDateString();
        let TickDateTimeStr = NowDateStr + " " + tick.timeStr;
        let TickDateTime = new Date(TickDateTimeStr);
        let contract = global.NodeQuant.MainEngine.GetContract(tick.clientName, tick.symbol);
        let upperFutureName = contract.futureName.toUpperCase();
        let tickFutureConfig = FuturesConfig[tick.clientName][upperFutureName];
        let AMOpenTimeStr = NowDateStr + " " + tickFutureConfig.AMOpen;
        var AMOpenTime = new Date(AMOpenTimeStr);
        var AMOpenTimeOffset = new Date(AMOpenTime.getTime() + breakOffsetSec * 1000);
        let AMResumeTimeStr = NowDateStr + " " + tickFutureConfig.AMResume;
        var AMResumeTime = new Date(AMResumeTimeStr);
        var AMResumeTimeOffset = new Date(AMResumeTime.getTime() + breakOffsetSec * 1000);
        let PMOpenTimeStr = NowDateStr + " " + tickFutureConfig.PMOpen;
        var PMOpenTime = new Date(PMOpenTimeStr);
        var PMOpenTimeOffset = new Date(PMOpenTime.getTime() + breakOffsetSec * 1000);
        let NightOpenTimeStr = NowDateStr + " " + tickFutureConfig.NightOpen;
        var NightOpenTime = new Date(NightOpenTimeStr);
        var NightOpenTimeOffset = new Date(NightOpenTime.getTime() + breakOffsetSec * 1000);
        let isTimeOffset = (NowDateTime > AMOpenTime && NowDateTime < AMOpenTimeOffset) || (NowDateTime > AMResumeTime && NowDateTime < AMResumeTimeOffset) || (NowDateTime > PMOpenTime && NowDateTime < PMOpenTimeOffset) || (NowDateTime > NightOpenTime && NowDateTime < NightOpenTimeOffset) ;
        let PMCloseTimeStr = NowDateStr + " " + tickFutureConfig.PMClose;
        var PMCloseTime = new Date(PMCloseTimeStr);
        var PMStopTime = new Date(PMCloseTime.getTime() - closeOffsetSec * 1000);
        let NightCloseTimeStr = NowDateStr + " " + tickFutureConfig.NightClose;
        var NightCloseTime = new Date(NightCloseTimeStr);
        var NightStopTime = new Date(NightCloseTime.getTime() - closeOffsetSec * 1000);
        let isTimeToClose = (NowDateTime > PMStopTime && NowDateTime < PMCloseTime) || (TickDateTime > NightStopTime && TickDateTime < NightCloseTime);
        console.log("NowDateTime: "+ NowDateTime + "PMStopTime: " + PMStopTime + "PMCloseTime : " + PMCloseTime  + "TickDateTime: " + TickDateTime  + "NightCloseTime: " + NightCloseTime)
        if (isTimeOffset) {
            return 0;

        } else if (isTimeToClose){
            return -1;
        } else {
            return 1;
        }
        // return {'isTimeOffset': isTimeOffset, 'isTimeToClose': isTimeToClose}
    }


    _cancelOrder() {
        let unFinishOrderList = this.GetUnFinishOrderList();
        if (unFinishOrderList.length != 0) {
            for (let index in unFinishOrderList) {
                let unFinishOrder = unFinishOrderList[index];
                global.NodeQuant.StrategyEngine.CancelOrder(unFinishOrder);
            }
        }
    }

    OnTick(tick) {
        //KarType没有设置或者设置为Tick,默认都不生成K线，不触发OnClosedBar,OnNewBar事件
        if (this.KBarType === undefined || this.KBarType === KBarType.Tick) {
            return;
        } else {
            _createBar(this, tick);
        }
    }

    OnClosedBar(closedBar) {
    }

    OnNewBar(newBar) {
    }

    OnOrder(order) {
    }

    OnTrade(trade) {
    }

    QueryTradingAccount(clientName) {
        global.NodeQuant.StrategyEngine.QueryTradingAccount(clientName, this);
    }

    OnQueryTradingAccount(tradingAccountInfo) {
    }

    //通过合约名字获得合约最新Tick
    GetLastTick(symbol) {
        return global.NodeQuant.StrategyEngine.Symbol_LastTickDic[symbol];
    }

    GetUnFinishOrderList() {
        let unFinishOrderList = global.NodeQuant.StrategyEngine.GetUnFinishOrderList(this.name);
        return unFinishOrderList;
    }

    /// <summary>
    /// 获取合约的仓位对象
    /// </summary>
    /// <returns>仓位对象</returns>
    GetPosition(symbol) {
        if (symbol === undefined)
            return undefined;
        let position = global.NodeQuant.StrategyEngine.GetPosition(this.name, symbol);
        return position;
    }

    /// <summary>
    /// 下单接口
    /// </summary>
    ///<param name="clientName">订单发送的交易客户端名称</param>
    /// <param name="symbol">目标合约</param>
    /// <param name="limitePrice">限定价格</param>
    /// <param name="volume">下单手数</param>
    /// <param name="direction">方向</param>
    /// <param name="openClose">开平类型</param>
    ///以上是限价单必须的参数,如果要下FAK、FOK单需要加多以下参数
    ///<param name="orderType">订单类型</param>
    //以上是FAK、FOK单必须的参数,如果要下 市价单 需要加多以下参数
    ///<param name="tick">市价单需要的tick信息,为了知道涨停、跌停价</param>
    //以上是市价单必须的参数,如果要下 条件单 需要加多以下参数
    //<param name="contingentCondition"> 条件单的价格条件</param>
    //<param name="stopPrice"> 条件单的触发价格，可与limitePrice对比以触发contingentCondition</param>
    /// <returns></returns>
    SendOrder(clientName, symbol, limitePrice, volume, direction, openClose, orderType, tick, contingentCondition, stopPrice) {
        if (arguments.length < 6) {
            let message = "Send Order Failed.Reason:Not Valid Parameters";
            let error = new NodeQuantError(this.name, ErrorType.StrategyError, message);
            global.AppEventEmitter.emit(EVENT.OnError, error);
            return;
        }
        let sendOrderType = arguments[6] ? orderType : OrderType.Limit;
        //记录发出订单
        let orderRecord = {};
        switch (sendOrderType) {
            case OrderType.Limit:
                global.NodeQuant.StrategyEngine.SendLimitOrder(this, clientName, symbol, direction, openClose, volume, limitePrice);
                orderRecord.datetime = new Date();
                orderRecord.clientName = clientName;
                orderRecord.Type = OrderReverseType[OrderType.Limit];
                orderRecord.symbol = symbol;
                orderRecord.direction = DirectionReverse[direction];
                orderRecord.offset = OpenCloseFlagReverseType[openClose];
                orderRecord.price = limitePrice;
                orderRecord.volume = volume;
                orderRecord.contingentCondition = undefined;
                orderRecord.stopPrice = undefined;
                global.NodeQuant.StrategyEngine.RecordOrder(this.name, orderRecord);
                break;
            case OrderType.FAK:
                global.NodeQuant.StrategyEngine.SendFillAndKillLimitOrder(this, clientName, symbol, direction, openClose, volume, limitePrice);
                orderRecord.datetime = new Date();
                orderRecord.clientName = clientName;
                orderRecord.Type = OrderReverseType[OrderType.FAK];
                orderRecord.symbol = symbol;
                orderRecord.direction = DirectionReverse[direction];
                orderRecord.offset = OpenCloseFlagReverseType[openClose];
                orderRecord.price = limitePrice;
                orderRecord.volume = volume;
                orderRecord.contingentCondition = undefined;
                orderRecord.stopPrice = undefined;
                global.NodeQuant.StrategyEngine.RecordOrder(this.name, orderRecord);
                break;
            case OrderType.FOK:
                global.NodeQuant.StrategyEngine.SendFillOrKillLimitOrder(this, clientName, symbol, direction, openClose, volume, limitePrice);
                orderRecord.datetime = new Date();
                orderRecord.clientName = clientName;
                orderRecord.Type = OrderReverseType[OrderType.FOK];
                orderRecord.symbol = symbol;
                orderRecord.direction = DirectionReverse[direction];
                orderRecord.offset = OpenCloseFlagReverseType[openClose];
                orderRecord.price = limitePrice;
                orderRecord.volume = volume;
                orderRecord.contingentCondition = undefined;
                orderRecord.stopPrice = undefined;
                global.NodeQuant.StrategyEngine.RecordOrder(this.name, orderRecord);
                break;
            case OrderType.Market:
                if (arguments[7] !== undefined && tick.upperLimit !== undefined && tick.lowerLimit !== undefined) {
                    if (direction === Direction.Buy)
                        limitePrice = tick.upperLimit;
                    else if (direction === Direction.Sell)
                        limitePrice = tick.lowerLimit;
                    global.NodeQuant.StrategyEngine.SendLimitOrder(this, clientName, symbol, direction, openClose, volume, limitePrice);
                    orderRecord.datetime = new Date();
                    orderRecord.clientName = clientName;
                    orderRecord.Type = OrderReverseType[OrderType.Market];
                    orderRecord.symbol = symbol;
                    orderRecord.direction = DirectionReverse[direction];
                    orderRecord.offset = OpenCloseFlagReverseType[openClose];
                    orderRecord.price = limitePrice;
                    orderRecord.volume = volume;
                    orderRecord.contingentCondition = undefined;
                    orderRecord.stopPrice = undefined;
                    global.NodeQuant.StrategyEngine.RecordOrder(this.name, orderRecord);
                } else {
                    let message = "Send Market Order Failed.Reason:Miss Market Tick INFO";
                    let error = new NodeQuantError(this.name, ErrorType.StrategyError, message);
                    global.AppEventEmitter.emit(EVENT.OnError, error);
                }
                break;
            case OrderType.Condition:
                if (arguments[8] === undefined) {
                    let message = "Send Condition Order Failed.Reason:Miss ContingentCondition Type";
                    let error = new NodeQuantError(this.name, ErrorType.StrategyError, message);
                    global.AppEventEmitter.emit(EVENT.OnError, error);
                } else if (arguments[9] === undefined) {
                    let message = "Send Condition Order Failed.Reason:Miss StopPrice";
                    let error = new NodeQuantError(this.name, ErrorType.StrategyError, message);
                    global.AppEventEmitter.emit(EVENT.OnError, error);
                } else {
                    global.NodeQuant.StrategyEngine.SendStopLimitOrder(this, clientName, symbol, direction, openClose, volume, limitePrice, contingentCondition, stopPrice);
                    orderRecord.datetime = new Date();
                    orderRecord.clientName = clientName;
                    orderRecord.Type = OrderReverseType[OrderType.Condition];
                    orderRecord.symbol = symbol;
                    orderRecord.direction = DirectionReverse[direction];
                    orderRecord.offset = OpenCloseFlagReverseType[openClose];
                    orderRecord.price = limitePrice;
                    orderRecord.volume = volume;
                    orderRecord.contingentCondition = ContingentConditionReverseType[contingentCondition];
                    orderRecord.stopPrice = stopPrice;
                    global.NodeQuant.StrategyEngine.RecordOrder(this.name, orderRecord);
                }
                break;
            default:
                break;
        }
    }

    /// <summary>
    /// 劣势下单价格，在指定的交易方向进行加跳,以达到更好地成交成功率
    /// </summary>
    /// <param name="symbol">目标合约</param>
    /// <param name="price">指定价格</param>
    /// <param name="direction">交易方向</param>
    /// <param name="priceTickCount">加跳数，默认2跳</param>
    /// <returns>加了条数的价格</returns>
    PriceUp(symbol, price, direction, priceTickCount) {
        if (arguments.length < 3) {
            return undefined;
        }
        let tickCount = arguments[3] ? priceTickCount : 2;
        let symbolClientName = this.symbols[symbol].clientName;
        let contract = global.NodeQuant.MainEngine.GetContract(symbolClientName, symbol);
        let priceTick = contract.priceTick;
        let orderPrice = _trimPriceByPriceTick(price, priceTick);
        let worsePrice = undefined;
        if (direction === Direction.Buy)
            worsePrice = orderPrice + tickCount * priceTick;
        else if (direction === Direction.Sell)
            worsePrice = orderPrice - tickCount * priceTick;
        return worsePrice;
    }

    /// <summary>
    /// 优势下单价格，在指定的交易方向进行减跳,以达到更好地成交价格。( 注意：优势价格限价单可能不会立即成交 )
    /// </summary>
    /// <param name="symbol">目标合约</param>
    /// <param name="price">指定价格</param>
    /// <param name="direction">交易方向</param>
    /// <param name="n">加跳数，默认2跳</param>
    /// <returns>减了条数的价格</returns>
    PriceDown(symbol, price, direction, priceTickCount) {
        if (arguments.length < 3) {
            return undefined;
        }
        let tickCount = arguments[3] ? priceTickCount : 2;
        let symbolClientName = this.symbols[symbol].clientName;
        let contract = global.NodeQuant.MainEngine.GetContract(symbolClientName, symbol);
        let priceTick = contract.priceTick;
        let orderPrice = _trimPriceByPriceTick(price, priceTick);
        let betterPrice = undefined;
        if (direction === Direction.Buy)
            betterPrice = orderPrice - tickCount * priceTick;
        else if (direction === Direction.Sell)
            betterPrice = orderPrice + tickCount * priceTick;
        return betterPrice;
    }
    // _loadBarFromDB(myStrategy, symbol, LookBackCount, BarType, BarInterval){
    //   _loadBarFromDB(myStrategy, symbol, LookBackCount, BarType, BarInterval)
    // }


}

module.exports = BaseStrategy;
