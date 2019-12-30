/**
 * Created by Administrator on 2017/6/27.
 */

AppConfig={
    Port:"3000"
};

SystemConfig={
    DayStartTime : "8:20:00",
    DayStopTime: "16:00:00",
    NightStartTime:"20:20:00",
    NightStopTime: "2:40:00"
};

SupportClients={
    CTP:"CTP"
};

//可在不同交易客户端订阅的合约
//Tick过滤器会根据时间过滤
FuturesConfig={
    CTP:{
        IC:{
            name:"中证500",
            exchange:"CFE",
            AMOpen:"9:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:00:00"
        },
        IF:{
            name:"沪深300",
            exchange:"CFE",
            AMOpen:"9:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:00:00"
        },
        IH:{
            name:"上证50",
            exchange:"CFE",
            AMOpen:"9:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:00:00"
        },
        T:{
            name:"十债",
            exchange:"CFE",
            AMOpen:"9:15:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:15:00"
        },
        TF:{
            name:"五债",
            exchange:"CFE",
            AMOpen:"9:15:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:15:00"
        },
        AP:{
            name:"苹果",
            exchange:"CZC",
            Unit:10,
            MarginRate:0.18,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        CF:{
            name:"郑棉",
            exchange:"CZC",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        CY:{
            name:"棉纱",
            exchange:"CZC",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        CJ:{
            name:"红枣",
            exchange:"CZC",
            Unit:7,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        FG:{
            name:"玻璃",
            exchange:"CZC",
            Unit:20,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        JR:{
            name:"粳稻",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        MA:{
            name:"甲醇",
            exchange:"CZC",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        PM:{
            name:"普麦",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        RI:{
            name:"早稻",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        RM:{
            name:"菜粕",
            exchange:"CZC",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        RS:{
            name:"菜籽",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        SF:{
            name:"硅铁",
            exchange:"CZC",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        SM:{
            name:"锰硅",
            exchange:"CZC",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        SR:{
            name:"白糖",
            exchange:"CZC",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        TA:{
            name:"PTA",
            exchange:"CZC",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        WH:{
            name:"郑麦",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        ZC:{
            name:"郑煤",
            exchange:"CZC",
            Unit:100,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        UR:{
            name:"尿素",
            exchange:"CZC",
            Unit:20,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
        },
        A:{
            name:"豆一",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        B:{
            name:"豆二",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        BB:{
            name:"胶板",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        C:{
            name:"玉米",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.05,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        CS:{
            name:"淀粉",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.05,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        RR:{
            name:"粳米",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.05,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        EB:{
            name:"苯乙烯",
            exchange:"DCE",
            Unit:5,
            MarginRate:0.05,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        FB:{
            name:"纤板",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        I:{
            name:"铁矿石",
            exchange:"DCE",
            Unit:100,
            MarginRate:0.08,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        J:{
            name:"焦炭",
            exchange:"DCE",
            Unit:100,
            MarginRate:0.08,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        JD:{
            name:"鸡蛋",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        JM:{
            name:"焦煤",
            exchange:"DCE",
            Unit:60,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        L:{
            name:"塑料",
            exchange:"DCE",
            Unit:5,
            MarginRate:0.05,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        M:{
            name:"豆粕",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        P:{
            name:"棕榈",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        PP:{
            name:"丙烯",
            exchange:"DCE",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        EG:{
            name:"乙二醇",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        V:{
            name:"PVC",
            exchange:"DCE",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        Y:{
            name:"豆油",
            exchange:"DCE",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        AG:{
            name:"白银",
            exchange:"SHF",
            Unit:15,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"2:30:00"
        },
        AL:{
            name:"沪铝",
            exchange:"SHF",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        AU:{
            name:"黄金",
            exchange:"SHF",
            Unit:1000,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"2:30:00"
        },
        BU:{
            name:"沥青",
            exchange:"SHF",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        CU:{
            name:"沪铜",
            exchange:"SHF",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        FU:{
            name:"燃油",
            exchange:"SHF",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        HC:{
            name:"热卷",
            exchange:"SHF",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        NI:{
            name:"沪镍",
            exchange:"SHF",
            Unit:1,
            MarginRate:0.07,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        PB:{
            name:"沪铅",
            exchange:"SHF",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        RB:{
            name:"螺纹",
            exchange:"SHF",
            Unit:10,
            MarginRate:0.08,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        RU:{
            name:"橡胶",
            exchange:"SHF",
            Unit:10,
            MarginRate:0.09,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        SN:{
            name:"沪锡",
            exchange:"SHF",
            Unit:1,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        ZN:{
            name:"沪锌",
            exchange:"SHF",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        SP:{
            name:"纸浆",
            exchange:"SHF",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        SC:{
            name:"原油",
            exchange:"SHF",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"2:30:00"
        },
        NR:{
            name:"二十号胶",
            exchange:"SHF",
            Unit:10,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        SS:{
            name:"不锈钢",
            exchange:"SHF",
            Unit:5,
            MarginRate:0.10,
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
    },
    Sgit:{
        "AG(T+D)":{
            name:"白银延期",
            exchange:"SGE",
            AMOpen:"9:00:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:30:00",
            NightOpen:"20:00:00",
            NightClose:"2:30:00"
        },
        "AU(T+D)":{
            name:"黄金延期",
            exchange:"SGE",
            AMOpen:"9:00:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:30:00",
            NightOpen:"20:00:00",
            NightClose:"2:30:00"
        },
        "AU(T+N1)":{
            name:"黄金单月延期",
            exchange:"SGE",
            AMOpen:"9:00:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:30:00",
            NightOpen:"20:00:00",
            NightClose:"2:30:00"
        },
        "AU(T+N2)":{
            name:"黄金双月延期",
            exchange:"SGE",
            AMOpen:"9:00:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:30:00",
            NightOpen:"20:00:00",
            NightClose:"2:30:00"
        },
        IC:{
            name:"中证500",
            exchange:"CFE",
            AMOpen:"9:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:00:00"
        },
        IF:{
            name:"沪深300",
            exchange:"CFE",
            AMOpen:"9:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:00:00"
        },
        IH:{
            name:"上证50",
            exchange:"CFE",
            AMOpen:"9:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:00:00"
        },
        T:{
            name:"十债",
            exchange:"CFE",
            AMOpen:"9:15:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:15:00"
        },
        TF:{
            name:"五债",
            exchange:"CFE",
            AMOpen:"9:15:00",
            AMClose:"11:30:00",
            PMOpen:"13:00:00",
            PMClose:"15:15:00"
        },
        CF:{
            name:"郑棉",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        CY:{
            name:"棉纱",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        FG:{
            name:"玻璃",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        JR:{
            name:"粳稻",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        MA:{
            name:"甲醇",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        OI:{
            name:"郑油",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        PM:{
            name:"普麦",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        RI:{
            name:"早稻",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        RM:{
            name:"菜粕",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        RS:{
            name:"菜籽",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        SF:{
            name:"硅铁",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        SM:{
            name:"锰硅",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        SR:{
            name:"白糖",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        TA:{
            name:"PTA",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        WH:{
            name:"郑麦",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        ZC:{
            name:"郑煤",
            exchange:"CZC",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        A:{
            name:"豆一",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        B:{
            name:"豆二",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        BB:{
            name:"胶板",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        C:{
            name:"玉米",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        CS:{
            name:"淀粉",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        FB:{
            name:"纤板",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        I:{
            name:"铁矿石",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        J:{
            name:"焦炭",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        JD:{
            name:"鸡蛋",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        JM:{
            name:"焦煤",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        L:{
            name:"塑料",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        M:{
            name:"豆粕",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        P:{
            name:"棕榈",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        PP:{
            name:"丙烯",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        V:{
            name:"PVC",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00"
        },
        Y:{
            name:"豆油",
            exchange:"DCE",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        AG:{
            name:"白银",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"2:30:00"
        },
        AL:{
            name:"沪铝",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        AU:{
            name:"黄金",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"2:30:01"
        },
        BU:{
            name:"沥青",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        CU:{
            name:"沪铜",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        FU:{
            name:"燃油",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        HC:{
            name:"热卷",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        NI:{
            name:"沪镍",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        PB:{
            name:"沪铅",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        RB:{
            name:"螺纹",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        RU:{
            name:"橡胶",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"23:00:00"
        },
        SN:{
            name:"沪锡",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        },
        ZN:{
            name:"沪锌",
            exchange:"SHF",
            AMOpen:"9:00:00",
            AMBreak:"10:15:00",
            AMResume:"10:30:00",
            AMClose:"11:30:00",
            PMOpen:"13:30:00",
            PMClose:"15:00:00",
            NightOpen:"21:00:00",
            NightClose:"1:00:00"
        }
    }
};
