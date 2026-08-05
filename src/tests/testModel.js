const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const testSchema = new Schema({
    
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
     fee:{
      type: Number,
      default: 0
     },
      description:{
        type: String,
        default: ''
      },
      name:{
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



const Test = mongoose.model("test", testSchema);

module.exports = Test;