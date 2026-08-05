const mongoose = require("mongoose");
const { format } = require('date-fns');

const complaintSchema = new mongoose.Schema({
  
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sNo: {
      type: Number,
      required: true
    },
      crmid: {
        type: String,
        required: true,
      },
      notificationNo:{
        type: String, 
        default: ''
      },
      orderNo: {
        type: String,
        required: true,
        index: true,
        unique:true
      },
      equipment: {
        type: String,
        required: true
      },

      customerName: {
        type: String,
      },
      
      contactPerson: {
        type: String,
      },
      
      telephone1: {
        type: String,
      
      },
      street: {
        type: String,
       default: ''
      },

      description:{
        type: String,
        default: ''
      },
  
      distributor: {
        type: String,
        default: ''
      },
      
      address:{
        type: String,
        default: ''
      },
     
      territory: {
        type: String,
        required: true,
        index: true
      },
     
      cityName: {
        type: String,
       
      },
      
      notificationDate: {
        type: String, 
       
      },

      receiveDate:{
        type: String,
        default: ''
      },

      uploadRemarks:{
        type: String,
        default: ''
      },
    
   
      //optional
      telephone: {
        type: String,
        default: ''
      },
      
    
      recent:{
        type:Boolean,
        default:true
      },
      uploadDate:{
        type: String,
        default: setUploadDate
       
      },
 
      
      historyDissatisfied:[
        {
          type: mongoose.Schema.Types.ObjectId,
            ref: 'ReturnHistory'
          },          
        ],
        

    //pending 
    pendingUpdated: {
      type: String,
      default: '' // Set the default value to the current date/time
    },
 
    //Resolved enteries
    
    town: {
      type: String,
      default: ''
    },
    techName: {
      type: String,
      default: ''
    },
    barCode : {
      type: String,
      default: ''
    },
    assetModel: {
      type: String,
      default: ''
    },
   
    date: {
      type: String,
      default: ''
    },
    contactPersonName:{
      type: String,
      default: ''
    },
    contactNumber: {
      type: String,
      default: ''
    },
    additionalRemarks:{
      type: String,
      default: ''
    },
  
    level: {
      type: String,
      default: ''
    },
    reportDate: {
      type: String,
      default: ''
    },
    reportTime: {
      type: String,
      default: ''
    },
    customerSatisfaction:{
      type: String,
      default: ''
    },
 
    status: {
      type: String,
      enum: ['upload','unMatched','matched','received','resolved', 'fnaAppr','nccByPass', 'nccAppr', 'nccClose', 'onHold'],
      default: 'upload',
      index: true
    },
  
   
  /////////////////
    finalBarCode: {
      type: String,
      default: ''
    },
    voltage: {
      type: String,
      default: ''
    },
    techFeedback: {
      type: String,
      default: ''
    },
    
    location: {
      type: String,
      default: ''
    },
    afterPic: {
        name: {
          type: String,
         
        },
        url:{
          type: String,
      
        },
        imageId:{ 
         
            type: String,
          
        }
    },
   
    beforePic: { 
      name: {
        type: String,
        
      },
      url:{type: String,
        },
      imageId:{ 
       type: String,
        
      }
    },
    shopPic: {
      name: {
        type: String,
        
      },
      url:{type: String,
        },
      imageId:{ 
        
          type: String,
        
      }
     },
     optionalPic:{ },

    resolvedDate: {
      type: String,
      default: '', // Set the default value to the current date/time
      index : true
    },
   
    resolvedTime: {
      type: String,
      default: '' // Set the default value to the current date/time
    },
    resolvedDuration:{
      type: String,
      default: '' // Set the default value to the current date/time
    },
    technician: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    contactPerson1: {
      type: String,
      default: ''
    },
 
    closeComplaint: {},
    compressorFault: {},
    compressorReplacement:{},
    gasLeak: {},
    extraCosmeticParts:{},
    otherPartFaults: {    },
    moreOtherPartFaults:{},
    service: {   },
  
    lat: {
      type: String,
      default: ''
    },

    long: {
      type: String,
      default: ''
    },
   
    resolved: {
      type: Boolean,
      default: false
    },
  
    equipment: {
      type: String,
      default: ''
    },
    //new Resolved headings
    assignedDate:{
      type: String,
      default: '',
    },
    issueList:{
      type: String,
      default: ''
    },
    workDone:{
      type: String,
      default: ''
    },
    servicePartsConsumed:{
      type: String,
      default: ''
    },
    totalDays:{
      type: String,
      default: ''
    },
    customerAtOutlet:{
      type: String,
      default: ''
    },
    complaintStatus:{
      type: String,
      default: ''
    },
    //resolve statuses
    recentlyResolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    masterData: {
      type: Boolean,
      default: false
    },
    //complaint feedback
    returnDissatisfied:{
      type: Boolean,
      default: false,
    },
    // feedback object////
  vendorFeedback: [{
    reason: {
      type: String,
      default:''
     },
     remarks: {
      type: String,
      default: ''
     },
     feedback: {
      type: String,
      default: ''
     },
     returnToRecentRemarks:{
      type: String,
      default: ''
    },
    returnedRecent:{
      type: Boolean,
      default: false,
    },
     user:{
       type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
     },
     date: {
      type: String,
      default: ''
     },
     time: {
      type: String,
      default: ''
     }
    
  }],
  nccUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'

  },
  nccFeedback:[{
    reason: {
      type: String,
      default:''
     },
     remarks: {
      type: String,
      default: ''
     },
     feedback: {
      type: String,
      default: ''
     },
     user:{
       type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
     },
     date: {
      type: String,
      default: ''
     },
     time: {
      type: String,
      default: ''
     }
  }],
  cciFeedback:[{
    reason: {
      type: String,
      default:''
     },
     remarks: {
      type: String,
      default: ''
     },
     feedback: {
      type: String,
      default: ''
     },
     user:{
       type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
     },
     date: {
      type: String,
      default: ''
     },
     time: {
      type: String,
      default: ''
     }
  }],
},

 { timestamps: true });


 function setUploadDate(){
  const formattedDate = format(new Date(), 'yyyy-MM-dd');;
  return formattedDate;
 }
 const Complaint = mongoose.model("Complaint", complaintSchema);
 

module.exports = Complaint
