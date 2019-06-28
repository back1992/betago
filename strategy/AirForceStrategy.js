/**
 * Created by Administrator on 2017/7/4.
 */
const dateformat = require('dateformat');
let FixedArray = require("fixed-array");
let talib = require('talib-binding');
var BaseStrategy = require("./baseStrategy");
require("../util/Position");
require("../systemConfig");
const mongo = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const http = require('http');


/////////////////////// Private Method ///////////////////////////////////////////////
class AirForceStrategy extends BaseStrategy {
    //初始化
    constructor(strategyConfig) {
        //一定要使用super()初始化基类,这样无论基类还是子类的this都是指向子类实例
        super(strategyConfig);
        this.lastTick = null;
        this.tick = null;
        this.total = strategyConfig.total;
        this.sum = 0;
        this.thresholdPrice = null;
        this.step = strategyConfig.step;
        this.flag = null;
        this.needCloseYesterday = strategyConfig.needCloseYesterday;
        this.needSleep = false;
        this.sellPrice = null;
        this.stopPrice = null;

        this.signal = 0;
        this.openPrice = [];
        this.highPrice = [];
        this.lowPrice = [];
        this.closePrice = [];
        this.volume = [];
        // this.id = FixedArray(50);
        this.lastSignal = null;
        this.stopStep = 0;
        this.score = 0;
        this.position = 0;
        this.open = false;
        this.isOpened = false;
        global.actionFlag = {};
        global.airForcePrice = {};
        global.stopPrice = {};
    }



    /////////////////////////////// Public Method /////////////////////////////////////
    OnClosedBar(closedBar) {

        // this.lastSignal = this.signal;
        this.signal = global.actionFlag[closedBar.symbol];
        if(this.signal <= -2 && this.position < 1) {
          this.thresholdPrice = global.airForcePrice[closedBar.symbol];
          this.stopPrice = global.stopPrice[closedBar.symbol];
        }

        if (this.thresholdPrice) {
            if (closedBar.closePrice > this.stopPrice) {
                this.flag = false;
            }else{
              if( this.position < this.total){
                if (closedBar.closePrice > this.thresholdPrice) {
                  this.flag = true
                } else{
                  this.flag = (this.position<1)?true:false;
                }
              }
            }
        }
    }

    OnNewBar(newBar) {
        console.log(newBar.symbol + "---" + newBar.startDatetime.toLocaleString() + " flag: " + this.flag + " thresholdPrice: " + this.thresholdPrice + " signal : " + this.signal);
        var contractSymbol = newBar.symbol.replace(/[0-9]/g, '').toUpperCase();
        var url = `http://stock2.finance.sina.com.cn/futures/api/json.php/IndexService.getInnerFuturesMiniKLine${this.step}m?symbol=${contractSymbol}0`
        let req = http.get(url, function(res) {
        	let data = '',
        		json_data;

        	res.on('data', function(stream) {
        		data += stream;
        	});
        	res.on('end', function() {
        		json_data = JSON.parse(data).slice(0, 50).reverse();

        		// will output a Javascript object
        		// console.log(json_data.slice(50));
            let openPrice =  json_data.map(function(value,index) { return value[1]; });
            let highPrice =  json_data.map(function(value,index) { return value[2]; });
            let lowPrice =  json_data.map(function(value,index) { return value[3]; });
            let closePrice =  json_data.map(function(value,index) { return value[4]; });
            let volume =  json_data.map(function(value,index) { return value[5]; });
            var retMFI = talib.MFI(highPrice, lowPrice, closePrice, volume, 14);
            var retCCI = talib.CCI(highPrice, lowPrice, closePrice, 14);
            var retCMO = talib.CMO(closePrice, 14);
            var retAROONOSC = talib.AROONOSC(highPrice, lowPrice, 14);
            var retADX = talib.ADX(highPrice, lowPrice, closePrice, 14);
            var retRSI = talib.RSI(closePrice, 14);

            var mfi = retMFI[retMFI.length - 1];
            var cci = retCCI[retCCI.length - 1];
            var cmo = retCMO[retCMO.length - 1];
            var aroonosc = retAROONOSC[retAROONOSC.length - 1];
            var adx = retADX[retADX.length - 1];
            var rsi = retRSI[retRSI.length - 1];

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

            // this.lastSignal = this.signal;
            // global.actionFlag[newBar.symbol] = _get_signal(mfi, cci, cmo, aroonosc, adx, rsi);
            global.actionFlag[newBar.symbol] = score;
            global.airForcePrice[newBar.symbol] = lowPrice[lowPrice.length - 1];
            global.stopPrice[newBar.symbol] = highPrice[highPrice.length - 1];
        	});
        });

        // console.log(req);

        req.on('error', function(e) {
            console.log(e.message);
        });

    }


    OnQueryTradingAccount(tradingAccountInfo) {
        global.availableFund = tradingAccountInfo["Available"];
        global.withdrawQuota = tradingAccountInfo["WithdrawQuota"];
        global.Balance = tradingAccountInfo["Balance"];
    }

    _openShort(tick, up = 0) {
        this.QueryTradingAccount(tick.clientName);
        let sum = this._getAvilableSum(tick);
        if (sum >= 1) {
          if(this.isOpened === false){
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Sell, up);
            this.SendOrder(tick.clientName, tick.symbol, price, 1, Direction.Sell, OpenCloseFlagType.Open);
            this.sellPrice = price;
            this.open = true;
          }
        } else {
            if(this.open === false){
              this.thresholdPrice = null;
            }else{
              this.isOpened = true;
            }
            this.flag = null;
        }
    }

    _closeTodayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortTodayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseToday);
            this.open = false;
            this.isOpened = false;
            // this.thresholdPrice = null;
        }
    }

    _closeYesterdayShortPositions(tick, position, up = 0) {
        let todayShortPositions = position.GetShortYesterdayPosition();
        if (todayShortPositions > 0) {
            let price = this.PriceUp(tick.symbol, tick.lastPrice, Direction.Buy, up);
            this.SendOrder(tick.clientName, tick.symbol, price, todayShortPositions, Direction.Buy, OpenCloseFlagType.CloseYesterday);
            // this.thresholdPrice = null;
        }
    }

    _graduateShort(tick) {
        let profit = (this.sellPrice - tick.lastPrice) / tick.lastPrice;
        if (profit > 0.008) {
            this.flag = false;
        }
    }

    OnTick(tick) {
        super.OnTick(tick);
        global.NodeQuant.MarketDataDBClient.RecordTick(tick.symbol, tick);
        this.lastTick = this.tick;
        this.tick = tick;
        let tradeState = this._getOffset(tick, 0, 30);
        let position = this.GetPosition(tick.symbol);
        if (position != undefined) {
            this.position = position.GetShortTodayPosition();
        }
        switch (tradeState) {
            // timeOffset
            case 0:
                // this.thresholdPrice = null;
                if (position != undefined) {
                    this._closeYesterdayShortPositions(tick, position, 1);
                }
                break;
            // time to close
            case -1:
                if (position != undefined) {
                    this._closeTodayShortPositions(tick, position, 1);
                }
                break;
            // trade time
            default :
                let unFinishOrderList = this.GetUnFinishOrderList();
                if (unFinishOrderList.length === 0) {
                    if (this.flag === true) {
                        if (this.lastTick && this.lastTick.lastPrice > tick.lastPrice) {
                            if (position === undefined) {
                                this._openShort(tick);
                                this.flag = null;
                            } else {
                                let todayShortPositions = position.GetShortTodayPosition();
                                if (todayShortPositions < this.total) {
                                    this._openShort(tick);
                                    this.flag = null;
                                }
                            }
                        }
                    } else if (this.flag === false) {
                        if (this.lastTick && this.lastTick.lastPrice < tick.lastPrice) {
                            if (position != undefined) {
                                this._closeTodayShortPositions(tick, position);
                            }
                        }
                    }
                }
        }
    }

    Stop() {
        //调用基类方法
        super.Stop();
    }
}

module.exports = AirForceStrategy;
