import mongoose from 'mongoose';

const recordSchema = mongoose.Schema({
    Income: {
        type: Number,
        default: 0
    },
    Expense: {
        type: Number,
        default: 0
    },
    Date: {
        type: Date,
        default: new Date()
    }
});

const Record = mongoose.model('Record', recordSchema, 'test');

export default Record;