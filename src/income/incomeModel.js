const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const incomeSchema = new Schema({
   
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
      },


      
      name:{
        type: String,
        default: ''
    },
    type:{
        type: String,
        default: ''
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

// incomeSchema.pre('save', async function(next) {

//     if (!this.patientNo) {
//         const highestProduct = await Income.findOne({}, {}, { sort: { 'patientNo': -1 } }); // Find the product with the highest ID
//         if (highestProduct) {
//        console.log("highestProduct ", typeof highestProduct.patientNo)
//           this.patientNo = highestProduct ? +(highestProduct.patientNo) + 1 : 1;
//           // Increment the highest product ID by 1
//         } else {
//             this.patientNo = 1; // If there are no existing products, start from 1
//         }
//     }
//     next();
//   });

var Income = mongoose.model("Income", incomeSchema);

module.exports = Income;
