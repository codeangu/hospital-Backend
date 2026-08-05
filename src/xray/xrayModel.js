const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const xraySchema = new Schema({
   
 
 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
      },

    xrayNo:{
        type: Number,
        default: 0,
        unique: true
    },
    price:{
        type: Number,
        default: 0
    },
    detail: {
        type: String,
        default: ""
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

}, {
    timestamps: true
});

xraySchema.pre('save', async function(next) {

    if (!this.xrayNo) {
        const query = this.hospitalId ? { hospitalId: this.hospitalId } : {};
        const highestProduct = await Xray.findOne(query, {}, { sort: { 'xrayNo': -1 } });
        if (highestProduct) {
            this.xrayNo = +(highestProduct.xrayNo) + 1;
        } else {
            this.xrayNo = 1;
        }
    }
    next();
  });

var Xray = mongoose.model("Xray", xraySchema);

module.exports = Xray;
