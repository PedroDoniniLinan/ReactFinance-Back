import Record from '../models/record.js'

const groupByDate = {
    "$group": {
        "_id": {"date": "$createdAt"},
        "income": {"$sum": "$income"},
        "expense": {"$sum": "$expense"},
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
        let balance = 0;
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