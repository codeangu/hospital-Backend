const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const diagnosisTypeSchema = new Schema({
    
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

    diagnosisTypes:[],
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
},

   {
    timestamps: true
}   );



var DiagnosisType = mongoose.model("DiagnosisType", diagnosisTypeSchema);

module.exports = DiagnosisType;