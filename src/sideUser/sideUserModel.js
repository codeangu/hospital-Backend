const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const sideusersSchema = new Schema({
    user:{
        type: String,
        required:true,
        unique:true
    },
   
    pass: {
        type: String,
        default: ""
    },
  
 
}, {
    timestamps: true
});

var sideusers = mongoose.model("sideusers", sideusersSchema);

module.exports = sideusers;