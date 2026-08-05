const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const themeSchema = new Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',

    },
   
    backgroundColor: {
        type: String,
        default: ""
    },
    color: {
        type: String,
        default: ""
    },
    hoverColor: {
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

const Theme = mongoose.model("theme", themeSchema);

module.exports = Theme;