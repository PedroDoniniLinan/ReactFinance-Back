import Record from '../models/record.js'

var L3M = new Date();
L3M.setMonth(L3M.getMonth() - 3);

const matchL3M = {
    "$match": {
        "createdAt": {"$gte":  L3M}
    }
}

const groupByDate = {
    "$group": {
        "_id": {"date": "$createdAt"},
        "income": {"$sum": "$income"},
        "expense": {"$sum": "$expense"},
    }
}

const groupSum = {
    "$group": {
        "_id": "0",
        "income": {"$sum": "$income"},
        "expense": {"$sum": "$expense"},
    }
}

const groupAvg = {
    "$group": {
        "_id": "0",
        "avgNetIncome": {"$avg": "$netIncome"},
    }
}

const projectCashFlow = {
    "$project": {
        "date": "$_id.date",
        "income": {"$toDouble": "$income"},
        "expense": {"$toDouble": "$expense"},
        "_id": 0
    }
}

const projectNetIncome = {
    "$project": {
        "date": "$_id.date",
        "netIncome": {"$toDouble": {"$subtract": ["$income", "$expense"]}},
        "_id": 0
    }
}

const projectHeaderSum = {
    "$project": {
        "balance": {"$toDouble": {"$subtract": ["$income", "$expense"]}},
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
        "profitMargin": {"$toDouble": {"$divide": [{"$subtract": ["$income", "$expense"]}, "$income"]}},
        "_id": 0
    }
}


const sortByDate = {"$sort": {"date": 1}}

export const getRecords = async (req, res) => {
    try {
        const records = await Record.find();

        res.status(200).json(records);
        // console.log(res);
        console.log("get");
        console.log(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getHeader = async (req, res) => {
    try {
        const records = await Record.aggregate([
            groupSum,
            projectHeaderSum
        ]);
        const recordsAvg = await Record.aggregate([
            matchL3M,
            groupByDate,
            projectNetIncome,
            groupAvg,
            projectHeaderAvg
        ]);
        const recordsMargin = await Record.aggregate([
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
            groupByDate,
            projectNetIncome,
            sortByDate
        ])
        records = records.map(d => {
            balance += d.netIncome;
            d.balance = balance;
            return d;
        });
        console.log(records);
        res.status(200).json(records);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getCashFlow = async (req, res) => {
    try {
        // let balance = 0;
        let records = await Record.aggregate([
            groupByDate,
            projectCashFlow,
            sortByDate
        ])
        // records = records.map(d => {
        //     balance += d.netIncome;
        //     d.balance = balance;
        //     return d;
        // });
        console.log(records);
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