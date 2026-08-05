const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const patientSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
     
    firstName: {
        type: String,
        default: ""
    },
    lastName: {
        type: String,
        default: ""
    },
    title: {
        type: String,
        default: ""
    },
    cnic: {
        type: String,
        default: "",
        
        },
    patientNo:{
        type: Number,
        default: 0
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
   
    phone: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    age: {
        type: String,
        default: ""
    },
    year: {
        type: String,
        default: ""
    },
    month: {
        type: String,
        default: ""
    },
    day: {
        type: String,
        default: ""
    },
    hour: {
        type: String,
        default: ""
    },
    sex: {
        type: String,
        default: ""
    },
   
    panel: {
        type: String,
        default: ""
    },
    mrNo:{
        type: Number,
        default: 0,
    },
    title:{
        type: String,
        default: ""
    },
    referredBy: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    appointmentTime:{
        type: String,
        default: ""
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // visits: [
    //     {
    //       visitDate: { type: Date, default: Date.now },
    //       diagnoses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Diagnosis' }],
    //       vitals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vital' }],
    //       notes: String
    //     }
    //   ],

}, {
    timestamps: true
});

patientSchema.pre('save', async function(next) {

    if (!this.patientNo) {
        const query = this.hospitalId ? { hospitalId: this.hospitalId } : {};
        const highestProduct = await Patient.findOne(query, {}, { sort: { 'patientNo': -1 } });
        if (highestProduct) {
            this.patientNo = +(highestProduct.patientNo) + 1;
        } else {
            this.patientNo = 1;
        }
    }
    next();
  });

var Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
