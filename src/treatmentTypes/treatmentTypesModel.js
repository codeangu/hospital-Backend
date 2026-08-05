const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const treatmentTypeSchema = new Schema({
    
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
     title:{
        type: String,
        default: '',
     },
     category:{
      type: String,
      default: ''
     },
      description:{
        type: String,
        default: ''
      },
      prescription:{
        type:String,
        default:'',
      },
      unit:{
        type:String,
        default:''
      },
      additionalNotes:{
        type:String,
        default:''
      },
      hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },

},

   {
    timestamps: true
}   );



var TreatmentType = mongoose.model("TreatmentType", treatmentTypeSchema);

module.exports = TreatmentType;