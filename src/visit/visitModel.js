const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require("../shared/counterModel");


const visitSchema = new Schema({
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
      checkupStatus:{
          type: String,
        default:'PENDING' //// pending, completed, cancelled
      },
      description:
      {
        type: String,
        default:''
      },
      bill:{
        type: String,
        default:''
      },
      payment:{
        type: String,
        default:''
      },
      services:[{name:String, //'X-ray', 'Ultrasound', 'Checkup', 'Test'
        price:Number,
        description:String,
        appointmentTime:String,
        status:{
          type: String,
          default:'PENDING'
        }
      }],
   
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
        default: "" // pending, completed, cancelled
       },
      appointmentTime:{
        type: String,
        default:''
      },
     appointmentDate: {
      type: Date,
      default: Date.now
    },
      visitNo:{
        type:String,
        unique:true,
        sparse:true
      },
      diagnoses:[],

      vitals:[],
      treatments:[],
      tests:[],
      testsSuggested: [],
      nextDate:{
        type: Date,
        default:''  
      },
      riskFactors: {

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

// visitSchema.pre('save', async function(next) {
//   if (!this.visitNo) {
//     const User = mongoose.model('User');
//     const counterKey = `visit_${this.hospitalId || 'global'}`;

//     let prefix = 'V';
//     if (this.hospitalId) {
//       const hospital = await User.findById(this.hospitalId).select('code').lean();
//       if (hospital?.code) prefix = hospital.code.toUpperCase();
//     }

//     const seq = await Counter.nextSeq(counterKey);
//     this.visitNo = `${prefix}-${seq}`;
//   }
//   next();
// });

visitSchema.pre('save', async function(next) {
  // Only generate on NEW documents
  if (this.isNew && !this.visitNo) {
    try {
      const counterKey = `visit_${this.hospitalId || 'global'}`;

      let prefix = 'V';
      if (this.hospitalId) {
        const User = mongoose.model('User');
        const hospital = await User
          .findById(this.hospitalId)
          .select('code')
          .lean();

        if (hospital?.code) {
          prefix = hospital.code.toUpperCase();
        }
      }

      const seq = await Counter.nextSeq(counterKey);
      this.visitNo = `${prefix}-${String(seq).padStart(5, '0')}`; // e.g. V-00001

      next();
    } catch (err) {
      next(err); // pass error to caller instead of crashing
    }
  } else {
    next();
  }
});

var Visit = mongoose.model("Visit", visitSchema);

module.exports = Visit;