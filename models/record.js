import mongoose from 'mongoose';

const recordSchema = mongoose.Schema({
    value: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: new Date()
    }
});

const Record = mongoose.model('Record', recordSchema, 'record');

export default Record;