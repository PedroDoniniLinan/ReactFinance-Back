import mongoose from 'mongoose';

const recordSchema = mongoose.Schema({
    Date: {
        type: Date,
        default: new Date()
    }
});

const Positions = mongoose.model('Positions', recordSchema, 'positions');

export default Positions;