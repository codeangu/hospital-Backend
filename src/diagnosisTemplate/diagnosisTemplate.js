const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const diagnosisTemplateSchema = new Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
      },
      price:{
        type:Number,
        default:0,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
     
      diagnoses:{
        type: String,
        default:''
      },
     
      description:
      {
        type: String,
        default:''
      },
     
   
      clinicalNotes: {
        type: String,
        default: ''

      },
      investigation:{
        type: String,
        default:''
      },
      advice:{
        type: String,
        default:''
      },
      doctor:{
        type: String,
        default:''
      },
      status: {
        type: String,
        default: "" // active, inactive, blocked
       },
 
     

      vitals:[],
      treatments:[],
      tests:[],
      testsSuggested: [],
      hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },

},
   {
    timestamps: true
}   );



const DiagnosisTemplate = mongoose.model("DiagnosisTemplate", diagnosisTemplateSchema);

module.exports = DiagnosisTemplate;