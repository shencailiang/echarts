var data = [
    [
        "企业",
        "个人政府征订",
        "11",
        0.008,
        134
    ],
    [
        "企业",
        "个人政府征订",
        "3",
        0.017,
        903
    ],
    [
        "企业",
        "个人政府征订",
        "7",
        0.017,
        6500
    ],
    [
        "企业",
        "自发",
        "1",
        0.02,
        300
    ],
    [
        "企业",
        "自发",
        "5",
        0.007,
        800
    ],
    [
        "企业",
        "自发",
        "9",
        0.007,
        200
    ],
    [
        "普通客户",
        "个人政府征订",
        "3",
        0.008,
        134
    ],
    [
        "普通客户",
        "个人政府征订",
        "7",
        0.009,
        903
    ],
    [
        "普通客户",
        "自发",
        "1",
        0.013,
        903
    ],
    [
        "普通客户",
        "自发",
        "5",
        0.019,
        1250
    ]
];
var dimension = [
    {
        "key":"cust_type",      
        "alias":"cust_type",
        "continuity":"00",
        "colType":"string"
    },
    {
        "key":"channel",     
        "alias":"channel",
        "continuity":"00",
        "colType":"string"
    },
    {
        "key":"y_month",    
        "alias":"y_month",
        "continuity":"11",
        "colType":"int"
    }
];
var measure =      
[
    {
        "key":"tong_bi",
        "alias":"总和_tong_bi",
        "prop":"sum",
        "continuity":"11",
        "colType":"double",
        "state":"bar"
    },
    {
        "key":"faxing_sum",      
        "alias":"总和_faxing_sum",
        "prop":"sum",
        "continuity":"11",
        "colType":"float",
        "state":"auto"
    }
];