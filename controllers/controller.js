import Record from '../models/record.js'
import Positions from '../models/positions.js'

var M = new Date();
var L3M = new Date();
var L1Y = new Date();

M.setDate(1);
M.setHours(0);
M.setMinutes(0);
M.setSeconds(0);
M.setMilliseconds(0);
M.setMonth(M.getMonth() - 0);

L3M.setDate(1);
L3M.setHours(0);
L3M.setMinutes(0);
L3M.setSeconds(0);
L3M.setMilliseconds(0);
L3M.setMonth(L3M.getMonth() - 3);

L1Y.setDate(1);
L1Y.setHours(0);
L1Y.setMinutes(0);
L1Y.setSeconds(0);
L1Y.setMilliseconds(0);
L1Y.setMonth(L1Y.getMonth() - 12);

const convertAllocationToIncome = (categories) => {
    if(categories.includes('US growth') || categories.includes('US super growth') || categories.includes('US finances') || categories.includes('BR growth') || categories.includes('Real state')) {
        categories.push('Stocks');
    }
    if(categories.includes('NFT games')) {
        categories.push('Crypto');
    }
    return categories;
}

const removeAllocationFromIncome = (categories) => {
    let remove = [];
    if(!categories.includes('US growth')) {
        remove.push('IVVB11', 'MSFT34', 'GOGL34', 'FBOK34', 'AMZO34', 'DISB34', 'MTD', 'MTF', 'UST', 'RUS', 'SXLU', 'PHPD');
    }
    if(!categories.includes('US super growth')) {
        remove.push('TSLA34');
    } 
    if(!categories.includes('US finances')) {
        remove.push('JPMC34', 'MSBR34');
    }
    if(!categories.includes('BR growth')) {
        remove.push('BRAX11', 'BBSD11');
    } 
    if(!categories.includes('Real state')) {
        remove.push('IRDM11');
    }
    if(!categories.includes('Crypto')) {
        remove.push('BTC', 'ETH', 'ADA', 'SOL', 'AVAX', 'BNB', 'DOT', 'MATIC', 'SAND', 'SHIB', 'SOL');
    }
    return remove;
}

// ------------------------------ MATCH ------------------------------ //

const matchL3M = {
    "$match": {
        "Date": {"$gte":  L3M, "$lte": M}
    }
}

const matchL1Y = {
    "$match": {
        "Date": {"$gte":  L1Y, "$lte": M}
    }
}

const matchParents = {
    "$match": {
        "Account": {"$ne": "Parents"}
    }
}

const matchInvestment = {
    "$match": {
        "$or": [
            {"Subcategory": {"$eq": "Buy tax"}}, 
            {"Subcategory": {"$eq": "AXS"}}, 
            {"Subcategory": {"$eq": "SLP"}}, 
            {"Subcategory": {"$eq": "ATLAS"}}, 
            {"Subcategory": {"$eq": "POLIS"}}, 
            {"Subcategory": {"$eq": "THC"}}, 
            {"Subcategory": {"$eq": "THG"}}, 
            {"Subcategory": {"$eq": "FINA"}}, 
            {"Category": {"$eq": "Stocks"}},
            {"Category": {"$eq": "Fixed income"}},
            {"Category": {"$eq": "Crypto"}},
            {"Category": {"$eq": "Stablecoin"}},
            {"Category": {"$eq": "Cash"}}
        ]
    }
}

const matchIncomeCategories = {
    "$match": {
        "income": {"$ne": 0}
    }
}

const matchAllocation = {
    "$match": {
        "position": {"$ne": 0}
    }
}

const matchPositionNotNull = {
    "$match": {
        "Position": {"$ne": NaN}
    }
}

const matchFlexPositionNotNull = {
    "$match": {
        "$and": [
            {"Flex position": {"$ne": NaN}},
            {"Flex position": {"$gt": 1}}
        ]
    }
}


const matchYieldNotNull = {
    "$match": {
        "Flex position": { "$ne": null}
    }
}

const matchExpensesCategories = {
    "$match": {
        "expenses": {"$ne": 0}
    }
}

const matchCategory = (c) => {
    return {
        "$match": {
            "Category": {"$in":  c}
        }
    };
}

const matchSubcategory = (c) => {
    return {
        "$match": {
            "Subcategory": {"$in":  c}
        }
    };
}

const matchNotSubcategory = (c) => {
    return {
        "$match": {
            "Subcategory": {"$nin":  c}
        }
    };
}


// ------------------------------ GROUP ------------------------------ //

const groupByCategory = {
    "$group": {
        // "_id": {"category": "$Category"},
        "_id": {"date": "$Date", "category": "$Category"},
        "income": {"$sum": "$Income"},
        "expenses": {"$sum": "$Expenses"},
    }
}

const groupBySubcategory = {
    "$group": {
        "_id": {"date": "$Date", "category": "$Subcategory"},
        "income": {"$sum": "$Income"},
        "expenses": {"$sum": "$Expenses"},
    }
}

const groupByCategorySet = {
    "$group": {
        "_id": "$_id.date",
        "income": {"$addToSet": {"name":"$_id.category", "value": {"$sum": "$income"}}},
        "expenses": {"$addToSet": {"name":"$_id.category", "value": {"$sum": "$expenses"}}}
    }
}

const groupByDate = {
    "$group": {
        "_id": {"date": "$Date"},
        "income": {"$sum": "$Income"},
        "expenses": {"$sum": "$Expenses"},
    }
}

const groupPositionByDate = {
    "$group": {
        "_id": {"date": "$Date"},
        "position": {"$sum": "$Flex position"},
        "income": {"$sum": "$Flex income"},
    }
}

const groupPositionByCategory = {
    "$group": {
        "_id": {"date": "$Date", "category": "$Category"},
        "position": {"$sum": "$Flex position"},
        "income": {"$sum": "$Flex income"},
    }
}

const groupAllocationByCategory = {
    "$group": {
        "_id": {"date": "$Date", "category": "$Category"},
        "position": {"$sum":  {"$ifNull": ["$Position", 0]}}
    }
}

const groupAllocationBySubcategory = {
    "$group": {
        "_id": {"date": "$Date", "category": "$Subcategory"},
        "position": {"$sum": "$Position"}
    }
}

const groupAllocationByCategorySet = {
    "$group": {
        "_id": "$_id.date",
        "position": {"$addToSet": {"name":"$_id.category", "value": {"$sum": "$position"}}},
    }
}

const groupYieldByCategory = {
    "$group" : {
        "_id": {"date": "$Date", "category": "$Category"},
        "yield": {
            "$accumulator": {
                init: function() {                        // Set the initial state
                    return { acc: 0 }
                },
                accumulate: function(state, y) {  // Define how to update the state
                    return {
                    acc: state.acc * y
                    }
                },
                accumulateArgs: ["$yield"],              // Argument required by the accumulate function
                merge: function(state1, state2) {         // When the operator performs a merge,
                    return {                                // add the fields from the two states
                        acc: state1.acc * state2.acc
                    }
                },
                finalize: function(state) {               // After collecting the results from all documents,
                    return (state.acc - 1)        // calculate the average
                },
                lang: "js"
            }
        }
    }
  }

const groupSum = {
    "$group": {
        // "_id": "$Date",
        "_id": "0",
        "income": {"$sum": "$Income"},
        "expenses": {"$sum": "$Expenses"},
    }
}

const groupAvg = {
    "$group": {
        "_id": "0",
        "avgNetIncome": {"$avg": "$netIncome"},
    }
}

// ------------------------------ PROJECT ------------------------------ //

const projectIncomeCategory = {
    "$project": {
        "tmp": {$arrayToObject: {$zip:{inputs:["$income.name", "$income.value"]}}},
    }
}

const projectExpensesCategory = {
    "$project": {
        "tmp": {$arrayToObject: {$zip:{inputs:["$expenses.name", "$expenses.value"]}}},
    }
}

const projectCashFlow = {
    "$project": {
        "date": "$_id.date",
        "income": {"$toDouble": "$income"},
        "expenses": {"$toDouble": "$expenses"},
        "_id": 0
    }
}

const projectNetIncome = {
    "$project": {
        "date": "$_id.date",
        "netIncome": {"$toDouble": {"$subtract": ["$income", "$expenses"]}},
        "_id": 0
    }
}

const projectHeaderSum = {
    "$project": {
        "balance": {"$toDouble": {"$subtract": ["$income", "$expenses"]}},
        "_id": 0
    }
}

const projectHeaderAvg = {
    "$project": {
        "avgNetIncome": 1,
        "_id": 0
    }
}

const projectHeaderMargin = {
    "$project": {
        "profitMargin": {"$toDouble": {"$divide": [{"$subtract": ["$income", "$expenses"]}, "$income"]}},
        "_id": 0
    }
}

const projectYieldByMonth = {
    "$project": {
        "date": "$_id.date",
        "income": "$income",
        "position": "$position",
        "yield": {"$toDouble": {"$add": [{"$divide": ["$income", "$position"]}, 1]}},
        // "yield": {"$toDouble": {"$add": [{"$cond": [ { "$eq": [ "$position", 0 ] }, 0, {"$divide": ["$income", "$position"]}]}, 1]}},
        "_id": 0
    }
}

const projectYieldByCategory = {
    "$project": {
        "date": "$_id.date",
        "category": "$_id.category",
        "yield": {"$toDouble": {"$add": [{"$divide": ["$income", "$position"]}, 1]}},
        "_id": 0
    }
}

const projectAllocationCategory = {
    "$project": {
        "tmp": {$arrayToObject: {$zip:{inputs:["$position.name", "$position.value"]}}},
    }
}

// ------------------------------ ADD ------------------------------ //

const addCategoryDate = {
    "$addFields":
        {"tmp.date":"$_id"}
     
}

const addDateParts = {
    "$addFields": {
        "dateParts": {"$dateToParts": {"date": "$Date"}}
    }
}

const addDateYear = {
    "$addFields": {
        "Date": { 
            "$dateFromParts": {
                'year': "$dateParts.year",
                'month': 1,
                'day': 1
            }
        }
    }
}

const addDateQuarter = {
    "$addFields": {
        "Date": {
            "$cond": [
                { "$lte": ["$dateParts.month", 3] },
                { 
                    "$dateFromParts": {
                        'year': "$dateParts.year",
                        'month': 1,
                        'day': 1
                    }
                },
                {
                "$cond": [
                    { "$lte": ["$dateParts.month", 6] },
                    { 
                        "$dateFromParts": {
                            'year': "$dateParts.year",
                            'month': 4,
                            'day': 1
                        }
                    },
                    {
                        "$cond": [{ "$lte": ["$dateParts.month", 9] },
                            { 
                                "$dateFromParts": {
                                    'year': "$dateParts.year",
                                    'month': 7,
                                    'day': 1
                                }
                            },
                            { 
                                "$dateFromParts": {
                                    'year': "$dateParts.year",
                                    'month': 10,
                                    'day': 1
                                }
                            }
                        ],
                    },
                ],
            },
            ],
        },
    }
}

// ------------------------------ OTHER ------------------------------ //

const replaceRoot = {"$replaceRoot":{"newRoot":"$tmp"}}

const sortByDate = {"$sort": {"date": 1}}


export const getRecords = async (req, res) => {
    try {
        const records = await Record.find();

        res.status(200).json(records);
        // console.log(res);
        console.log("get");
        
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getHeader = async (req, res) => {
    try {

        let matchDate = matchL1Y;
        if(req.query && req.query.dateRange === "Year") {
            matchDate = matchL1Y;
        } else if(req.query && req.query.dateRange === "Quarter") {
            matchDate = matchL3M;
        } else {
            matchDate = matchParents;
        } 

        const records = await Record.aggregate([
            groupSum,
            projectHeaderSum
        ]);
        const recordsAvg = await Record.aggregate([
            matchDate,
            // matchL3M,
            groupByDate,
            projectNetIncome,
            groupAvg,
            projectHeaderAvg
        ]);
        const recordsMargin = await Record.aggregate([
            matchDate,
            // matchL3M,
            groupSum,
            projectHeaderMargin
        ]);

        res.status(200).json([
            records[0].balance, 
            recordsAvg[0].avgNetIncome, 
            recordsMargin[0].profitMargin
        ]);
        // res.status(200).json(
        //     recordsMargin
        // );
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getNetIncome = async (req, res) => {
    try {
        const records = await Record.aggregate([
            matchParents,
            groupByDate,
            projectNetIncome,
            sortByDate
        ]);

        res.status(200).json(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getBalance = async (req, res) => {
    try {
        let balance = 0;
        let records = await Record.aggregate([
            matchParents,
            groupByDate,
            projectNetIncome,
            sortByDate
        ])
        records = records.map(d => {
            balance += d.netIncome;
            d.balance = balance;
            return d;
        });
        
        res.status(200).json(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getCashFlow = async (req, res) => {
    try {
        let records = await Record.aggregate([
            matchParents,
            groupByDate,
            projectCashFlow,
            sortByDate
        ])
        
        res.status(200).json(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getIncomeCategory = async (req, res) => {
    try {  
        let match = [
            matchParents,
        ]
        let mainPipeline = [
            groupByCategory,
            matchIncomeCategories,
            groupByCategorySet,
            projectIncomeCategory,
            addCategoryDate,
            replaceRoot,
            sortByDate
        ]
        let yearTrunc = [
            addDateParts,
            addDateYear
        ]  
        let quarterTrunc = [
            addDateParts,
            addDateQuarter
        ]  
        let pipeline;
        if(req.query && req.query.aggregation === "quaterly") {
            pipeline = [...match, ...quarterTrunc, ...mainPipeline] 
        } else if(req.query && req.query.aggregation === "yearly") {
            pipeline = [...match, ...yearTrunc, ...mainPipeline] 
        } else {
            pipeline = [...match, ...mainPipeline] 
        }
        let records = await Record.aggregate(pipeline)
        
        res.status(200).json(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getExpensesCategory = async (req, res) => {
    try {
        let match = [
            matchParents,
        ]
        let mainPipeline = [
            groupByCategory,
            matchExpensesCategories,
            groupByCategorySet,
            projectExpensesCategory,
            addCategoryDate,
            replaceRoot,
            sortByDate
        ]
        let yearTrunc = [
            addDateParts,
            addDateYear
        ]  
        let quarterTrunc = [
            addDateParts,
            addDateQuarter
        ]  
        let pipeline;
        if(req.query && req.query.aggregation === "quaterly") {
            pipeline = [...match, ...quarterTrunc, ...mainPipeline] 
        } else if(req.query && req.query.aggregation === "yearly") {
            pipeline = [...match, ...yearTrunc, ...mainPipeline] 
        } else {
            pipeline = [...match, ...mainPipeline] 
        }
        let records = await Record.aggregate(pipeline);
        
        res.status(200).json(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getIncomeSubcategory = async (req, res) => {
    try {
        let match = [
            matchParents,
        ]
        let mainPipeline = [
            groupBySubcategory,
            matchIncomeCategories,
            groupByCategorySet,
            projectIncomeCategory,
            addCategoryDate,
            replaceRoot,
            sortByDate
        ]
        let yearTrunc = [
            addDateParts,
            addDateYear
        ]  
        let quarterTrunc = [
            addDateParts,
            addDateQuarter
        ]  
        let pipeline;
        if(req.query && req.query.aggregation === "quaterly") {
            pipeline = [...match, ...quarterTrunc, ...mainPipeline] 
        } else if(req.query && req.query.aggregation === "yearly") {
            pipeline = [...match, ...yearTrunc, ...mainPipeline] 
        } else {
            pipeline = [...match, ...mainPipeline] 
        }
        if(req.query && req.query.categories !== undefined) {
            let categories = JSON.parse(req.query.categories);
            pipeline.splice(0, 0, matchCategory(categories));
        }
        let records = await Record.aggregate(pipeline)

        res.status(200).json(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getExpensesSubcategory = async (req, res) => {
    try {
        let match = [
            matchParents,
        ]
        let mainPipeline = [
            groupBySubcategory,
            matchExpensesCategories,
            groupByCategorySet,
            projectExpensesCategory,
            addCategoryDate,
            replaceRoot,
            sortByDate
        ]
        let yearTrunc = [
            addDateParts,
            addDateYear
        ]  
        let quarterTrunc = [
            addDateParts,
            addDateQuarter
        ]  
        let pipeline;
        if(req.query && req.query.aggregation === "quaterly") {
            pipeline = [...match, ...quarterTrunc, ...mainPipeline] 
        } else if(req.query && req.query.aggregation === "yearly") {
            pipeline = [...match, ...yearTrunc, ...mainPipeline] 
        } else {
            pipeline = [...match, ...mainPipeline] 
        }
        if(req.query && req.query.categories !== undefined) {
            let categories = JSON.parse(req.query.categories);
            pipeline.splice(0, 0, matchCategory(categories));
        }
        let records = await Record.aggregate(pipeline);
        res.status(200).json(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getPortfolioHeader = async (req, res) => {
    try {
        
        console.log('getPortfolioHeader controller')
        console.log(req.query)
        console.log(JSON.parse(req.query.categories))
        console.log(convertAllocationToIncome(JSON.parse(req.query.categories)))
        let dateDict = {Year: matchL1Y, Quarter: matchL3M, All: matchParents}
        let matchDate = req.query && req.query.dateRange ? dateDict[req.query.dateRange] : matchL1Y;
        let matchIncomeCategories = req.query && req.query.categories ? matchCategory(convertAllocationToIncome(JSON.parse(req.query.categories))) : matchDate;
        let matchNotIncomeSubcategories = req.query && req.query.categories ? matchNotSubcategory(removeAllocationFromIncome(JSON.parse(req.query.categories))) : matchDate;
        let matchCategories = req.query && req.query.categories ? matchCategory(JSON.parse(req.query.categories)) : matchDate;
        // let matchSubcategories = req.query && req.query.subcategory ? matchSubcategory(JSON.parse(req.query.subcategory)) : matchDate;
        
        const totalIncome = await Record.aggregate([
            matchDate,
            matchIncomeCategories,
            matchNotIncomeSubcategories,
            // matchSubcategories,
            matchInvestment,
            groupSum,
            projectHeaderSum
        ]);
        const incomeAvg = await Record.aggregate([
            matchDate,
            matchIncomeCategories,
            matchNotIncomeSubcategories,
            // matchSubcategories,
            matchInvestment,
            groupByDate,
            projectNetIncome,
            groupAvg,
            projectHeaderAvg
        ]);
        const yearYield = await Positions.aggregate([
            matchDate,
            matchCategories,
            // matchSubcategories,
            matchFlexPositionNotNull,
            groupPositionByDate,
            projectYieldByMonth,
        ]);

        const totalYield = yearYield.reduce((prev, curr) => prev * curr.yield, 1);


        const debug = await Positions.aggregate([
            matchDate,
            matchCategories,
            // matchSubcategories,
            matchFlexPositionNotNull,
            groupPositionByDate,
            projectYieldByMonth,
        ]);
        console.log('debug')
        console.log(debug)

        // res.status(200).json(
        //     totalIncome
        //     // yearYield
        // );

        res.status(200).json([
            totalIncome[0].balance, 
            incomeAvg[0].avgNetIncome, 
            totalYield - 1
        ]);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getAllocation = async (req, res) => {
    try {
        // let groupCategory = [groupAllocationByCategory];
        let groupCategory = [matchPositionNotNull, groupAllocationByCategory];
        let groupSubcategory = [matchPositionNotNull, groupAllocationBySubcategory];

        let mainPipeline = [
            matchAllocation,
            groupAllocationByCategorySet,
            projectAllocationCategory,
            addCategoryDate,
            replaceRoot,
            sortByDate
        ]

        let pipeline;
        if(req.query && req.query.breakdown === "category") {
            pipeline = [...groupCategory, ...mainPipeline] 
        } else {
            pipeline = [...groupSubcategory, ...mainPipeline] 
        } 
        if(req.query && req.query.categories !== undefined) {
            let categories = JSON.parse(req.query.categories);
            pipeline.splice(0, 0, matchCategory(categories));
    }
        const positions = await Positions.aggregate(pipeline);
        // console.log(positions)

        res.status(200).json(positions);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

// export const createTest =  async (req, res) => {
//     const post = req.body;
//     const newTest = new Test(post);

//     try {
//         await newTest.save();

//         res.status(201).json(newTest);
//     } catch (error) {
//         res.status(409).json({ message: error.message });
//     }
// }