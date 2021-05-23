import Record from '../models/record.js'

var M = new Date();
var L3M = new Date();
M.setDate(1);
M.setHours(0);
M.setMinutes(0);
M.setSeconds(0);
M.setMilliseconds(0);
M.setMonth(M.getMonth() - 1);
L3M.setDate(1);
L3M.setHours(0);
L3M.setMinutes(0);
L3M.setSeconds(0);
L3M.setMilliseconds(0);
L3M.setMonth(L3M.getMonth() - 4);
// console.log(M);
// console.log(L3M);

const matchL3M = {
    "$match": {
        "Date": {"$gte":  L3M, "$lte": M}
    }
}

const matchParents = {
    "$match": {
        "Account": {"$ne": "Parents"}
    }
}

const matchIncomeCategories = {
    "$match": {
        "income": {"$ne": 0}
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

const groupByCategory = {
    "$group": {
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

const groupSum = {
    "$group": {
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

// const addDateQuarter = {
//     "$addFields": {
//         "Date": {
//             "$cond": [
//                 { "$lte": ["$dateParts.month", 3] },
//                 "Q1",
//                 {
//                 "$cond": [
//                     { "$lte": ["$dateToParts.month", 6] },
//                     "Q2",
//                     {
//                         "$cond": [{ "$lte": ["$dateToParts.month", 9] },
//                             "Q3",
//                             "Q4"
//                         ],
//                     },
//                 ],
//             },
//             ],
//         },
//     }
// }

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
        const records = await Record.aggregate([
            matchParents,
            groupSum,
            projectHeaderSum
        ]);
        const recordsAvg = await Record.aggregate([
            matchParents,
            matchL3M,
            groupByDate,
            projectNetIncome,
            groupAvg,
            projectHeaderAvg
        ]);
        const recordsMargin = await Record.aggregate([
            matchParents,
            matchL3M,
            groupSum,
            projectHeaderMargin
        ]);

        res.status(200).json({
            balance: records[0].balance, 
            avgNetIncome: recordsAvg[0].avgNetIncome, 
            profitMargin: recordsMargin[0].profitMargin
        });
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
        let records = await Record.aggregate(pipeline)

        // let records = await Record.aggregate([
        //     matchParents,
        //     groupByCategory,
        //     matchExpensesCategories,
        //     groupByCategorySet,
        //     projectExpensesCategory,
        //     addCategoryDate,
        //     replaceRoot,
        //     sortByDate
        // ])
        
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
        let records = await Record.aggregate(pipeline)
        // let pipeline = [
        //     matchParents,
        //     groupBySubcategory,
        //     matchExpensesCategories,
        //     groupByCategorySet,
        //     projectExpensesCategory,
        //     addCategoryDate,
        //     replaceRoot,
        //     sortByDate
        // ]
        // if(req.query && req.query.categories !== undefined) {
        //     let categories = JSON.parse(req.query.categories);
        //     pipeline.splice(0, 0, matchCategory(categories));
        // }
        // let records = await Record.aggregate(pipeline)
        
        res.status(200).json(records);
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