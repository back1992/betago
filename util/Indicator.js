// export function _get_signal(mfi, cci, cmo, aroonosc, adx, rsi) {
//     let score = 0;
//     if (cci > 100) {
//         score -= 1
//     } else if (cci < -100) {
//         score += 1
//     }
//     if (mfi > 80) {
//         score -= 1
//     } else if (mfi < 20) {
//         score += 1
//     }
//     if (cmo > 50) {
//         score -= 1
//     } else if (cmo < -50) {
//         score += 1
//     }
//     if (aroonosc < -50) {
//         score -= 1
//     } else if (aroonosc > 50) {
//         score += 1
//     }
//     if (rsi > 70) {
//         score -= 1
//     } else if (rsi < 30) {
//         score += 1
//     }
//     return score
// };

export function _get_talib_indicator(strategy, highPrice, lowPrice, closePrice, volume) {
    let retMFI = talib.MFI(highPrice, lowPrice, closePrice, volume, 14);
    let retCCI = talib.CCI(highPrice, lowPrice, closePrice, 14);
    let retCMO = talib.CMO(closePrice, 14);
    let retAROONOSC = talib.AROONOSC(highPrice, lowPrice, 14);
    let retADX = talib.ADX(highPrice, lowPrice, closePrice, 14);
    let retRSI = talib.RSI(closePrice, 14);
    let mfi = retMFI[retMFI.length - 1];
    let cci = retCCI[retCCI.length - 1];
    let cmo = retCMO[retCMO.length - 1];
    let aroonosc = retAROONOSC[retAROONOSC.length - 1];
    let adx = retADX[retADX.length - 1];
    let rsi = retRSI[retRSI.length - 1];
    return _get_signal(mfi, cci, cmo, aroonosc, adx, rsi);
}
