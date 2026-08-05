const express = require("express");
const bodyParser = require("body-parser");

const verifyUser = require("../../middlewares/authenticate").verifyUser;
const verifyAdmin = require("../../middlewares/authenticate").verifyAdmin;
const totalCount = express.Router();
const Complaint = require("../complaint/complaintModel");

const cors = require("../cors");

const { verify } = require("jsonwebtoken");
const ROLES = require("../shared/rolesConstant");
const User = require("../users/userModel");

const { queryBuilder, queryBuilderWithBody } = require("../shared/querryBuilder");

totalCount.use(bodyParser.json());



//calculate total pending, complaints etc
totalCount
  .route("/totalComplaints")
      .options(cors.corsWithOptions, (req, res) => {
          res.sendStatus(200);
      })
  .get(cors.corsWithOptions, verifyUser, async (req, res) => {
    let find=queryBuilder(req);
   
    try {
      
      const result = await Complaint.aggregate([
        {
          $match: find,  
          
        },
        {
          $group: {
            _id: null,
            totalReceived: {
              $sum: {
                $cond: [{ $eq: ["$status", "received"] }, 1, 0]
              }
            },
            totalMatched: {
              $sum: {
                $cond: [{ $eq: ["$status", "matched"] }, 1, 0]
              }
            },
            totalNotMatched: {
              $sum: {
                $cond: [{ $eq: ["$status", "unMatched"] }, 1, 0]
              }
            },
            totalJHENotApproved: {
              $sum: {
                $cond: [{ $eq: ["$status", "resolved"] }, 1, 0]
              }
            },
            totalNCCNotApproved: {
              $sum: {
                $cond: [{ $in: ["$status", ["fnaAppr","onHold"]] }, 1, 0]
              }
            },
            totalApproved: {
              $sum: {
                $cond: [{ $in:['$status',  ['nccAppr','nccBypass']] }, 1, 0]
              }
            },
          
            totalDissatisfied: {
              $sum: {
                $cond: [{ $eq: ["$returnDissatisfied", true] }, 1, 0]
              }
            },
            
            totalNotApproved: {
              $sum: {
                $cond: [{ $in:['$status',  ['resolved','fnaAppr','onHold']] }, 1, 0]
              }
            },
            // totalNotApproved: {
            //   $sum: {
            //     $cond: [
            //       {
            //         $and: [
            //           { $eq: ['$approved', false] },
            //           { $eq: ['$status', 'resolved'] },
            //         ],
            //       },
            //       1,
            //       0,
            //     ],
            //   },
            // },
           
            totalRecent: {
              $sum: {
                $cond: [{ $eq: ["$status", 'upload'] }, 1, 0]
              }
            },
            totalComplaints: {
              $sum: {
                $cond: ["$orderNo", 1, 0]
              }
            },
          }
        },
        // Stage to unwind the array of resolved dates
        //     {
        //     $addFields: {
        //         resolvedDate: { $toDate: "$resolvedDates" } // Convert resolvedDate to date type
        //     }
        // },
        //     // Stage to group complaints by resolved date
        //     {
        //         $group: {
        //             _id: { $dateToString: { format: "%Y-%m-%d", date: "$resolvedDate" } }, // Format resolved date
        //             count: { $sum: 1 }
        //         }
        //     }

      ]);

      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });



  //ncc totals
  totalCount
  .route("/ncccount")
      .options(cors.corsWithOptions, (req, res) => {
          res.sendStatus(200);
      })
  .get(cors.corsWithOptions, verifyUser, async (req, res) => {
    let find=queryBuilder(req);
   
    try {
      
      const result = await Complaint.aggregate([
        {
          $match: find,  
          
        },
        {
          $group: {
            _id: null,
       
            totalNCCNotApproved: {
              $sum: {
                $cond: [{ $in: ["$status", ["fnaAppr", "onHold"]] }, 1, 0]
              }
            },
            totalApproved: {
              $sum: {
                $cond: [{ $in:['$status',  ['nccAppr','nccClose']] }, 1, 0]
              }
            },
        
            totalComplaints: {
              $sum: {
                $cond: [{ $in:['$status',  ['nccAppr','nccClose',"fnaAppr","onHold"]] }, 1, 0]
              }
            },
          }
        },
    

      ]);

      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  //top distributor
  totalCount
  .route("/topdistributor")
    .options(cors.corsWithOptions, (req, res) => {
      res.sendStatus(200);
    })
  .get(cors.corsWithOptions, verifyUser,async (req, res, next) => {
    let find=queryBuilder(req);
     
  console.log("find: inside topdistributor", find);
        // Pipeline to aggregate complaints by day within the specified range
      
      try {
        Complaint.aggregate([
          {
            $match: find,  
            
          },
          {
              $group: {
                  _id: "$distributor",
                  totalResolved: { $sum: {
                    $cond: [{ $in:['$status',  ['nccAppr','nccByPass']] }, 1, 0]
                  } } // Summing up the sold values for each distributor
              }
          },
          {
              $sort: { totalResolved: -1 } // Sorting in descending order based on total sold value
          },
          {
              $limit: 5 // Limiting the result to 5 documents
          }
      ])
      .then(topDistributors => {
        res.json( topDistributors );
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  
      }
      catch (error) {
        res.status(500).json({ error: error.message });
      }
   
  })

  totalCount
  .route("/satisfactory")
    .options(cors.corsWithOptions, (req, res) => {
      res.sendStatus(200);
    })
  .get(cors.corsWithOptions, verifyUser,async (req, res, next) => {
    let find=queryBuilder(req);
     
  // console.log("find: inside topdistributor", find);
        // Pipeline to aggregate complaints by day within the specified range
      
      try {
        Complaint.aggregate([
          {
            $match: find,  
            
          },
          {
            $project: {
              lastFeedbackStatus: {
                $cond: [
                  { $gt: [{ $size: "$nccFeedback" }, 0] },
                  { $arrayElemAt: ["$nccFeedback.feedback", -1] },
                  "No Feedback"
                ]
              }
            }
          },
          {
            $group: {
              _id: "$lastFeedbackStatus",
              count: { $sum: 1 }
            }
          }
        ])
        // .exec((err, result) => {
        //   if (err) {
        //     console.error("Error aggregating feedback:", err);
        //     return;
        //   }
        //   console.log("Feedback aggregation result:", result);
        // });
        
      .then(topDistributors => {
        console.log(" feeback result", topDistributors);
        res.json( topDistributors );
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  
      }
      catch (error) {
        res.status(500).json({ error: error.message });
      }
   
  })

  totalCount
  .route("/breakdown")
    .options(cors.corsWithOptions, (req, res) => {
      res.sendStatus(200);
    })
  .get(cors.corsWithOptions, verifyUser,async (req, res, next) => {
    let find=queryBuilder(req);
       // Calculate the date range based on the provided range parameter
        // let startDate, endDate;

        const pipeline = [
          {
            $match: {
              ...find
            }
          },
          {
            $addFields: {
              resolvedDate: { $toDate: "$resolvedDate" }, // Convert resolvedDate to date type
              vendorFeedbackDate: {
                $toDate: {
                  $arrayElemAt: ["$vendorFeedback.date", -1] // Get the date of the last feedback
                }
              },
              nccFeedbackDate: {
                $toDate: {
                  $arrayElemAt: ["$nccFeedback.date", -1] // Get the date of the last feedback
                }
              }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$resolvedDate" } },
              resolvedCount: { $sum: 1 },
              vendorFeedbackCount: {
                $sum: {
                  $cond: [{ $ne: ["$vendorFeedbackDate", null] }, 1, 0]
                }
              },
              nccFeedbackCount: {
                $sum: {
                  $cond: [{ $ne: ["$nccFeedbackDate", null] }, 1, 0]
                }
              }
            }
          },
          {
            $sort: { "_id": 1 }
          }
        ];
        
      //   const pipeline = [
      //     {
      //         $match: {
      //           ...find
      //         }
      //     },
      //     {
      //       $addFields: {
      //           resolvedDate: { $toDate: "$resolvedDate" } // Convert resolvedDate to date type
      //       }
      //   },
      //     {
      //         $group: {
      //             _id: { $dateToString: { format: "%Y-%m-%d", date: "$resolvedDate" } },
      //             count: { $sum: 1 }
      //         }
      //     },
      //     {
      //         $sort: { "_id": 1 }
      //     }
      // ];
      try {

      // Execute aggregation pipeline
      const result = await Complaint.aggregate(pipeline);
      // Function to convert date strings to days of the week
      // convertDatesToDays(result)
      res.json( result );
      }
      catch (error) {
        res.status(500).json({ error: error.message });
      }
      function convertDatesToDays(complaints) {
        complaints.forEach(complaint => {
          const dayOfWeek = moment(complaint._id).format('dddd');
          complaint._id = dayOfWeek;
        });
      }
  })





  totalCount
  .route("/timebreakdown")
    .options(cors.corsWithOptions, (req, res) => {
      res.sendStatus(200);
    })
  .get(cors.corsWithOptions, verifyUser,async (req, res, next) => {
    let find=queryBuilder(req);
     
 console.log("find: inside breakdown", find);
        // Pipeline to aggregate complaints by day within the specified range
        const pipeline = [
          {
            $match: {
              ...find
            }
          },
          {
            $addFields: {
              resolvedDate: { $cond: [{ $eq: ["$resolvedDate", ""] }, null, { $toDate: "$resolvedDate" }] },
              createdAt: { $cond: [{ $eq: ["$createdAt", ""] }, null, { $toDate: "$createdAt" }] }
            }
          },
          {
            $addFields: {
              resolutionDuration: {
                $cond: [
                  { $and: [{ $ne: ["$resolvedDate", null] }, { $ne: ["$createdAt", null] }] },
                  {
                    $divide: [
                      { $subtract: ["$resolvedDate", "$createdAt"] },
                      1000 * 60 * 60 // Convert milliseconds to hours
                    ]
                  },
                  null
                ]
              }
            }
          },
          {
            $match: {
              resolvedDate: { $ne: null } // Filter out documents where resolvedDate is null
            }
          },
          {
            $group: {
              _id: {
                $switch: {
                  branches: [
                    { case: { $lt: ["$resolutionDuration", 48] }, then: "Resolved in 1 Day" },
                    { case: { $lt: ["$resolutionDuration", 60] }, then: "Resolved in 2 Days" },
                    { case: { $gte: ["$resolutionDuration", 72] }, then: "Resolved in More than 3 Days" } // 72 hours or more
                  ],
                  default: "Resolved in 1 Day" // Default to "Resolved in 1 Day" for any other cases
                }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { "_id": 1 }
          }
        ];
        
        
        
        
      try {

      // Execute aggregation pipeline
      const result = await Complaint.aggregate(pipeline);
      // Function to convert date strings to days of the week
      // convertDatesToDays(result)
      res.json( result );
      }
      catch (error) {
        res.status(500).json({ error: error.message });
      }
      function convertDatesToDays(complaints) {
        complaints.forEach(complaint => {
          const dayOfWeek = moment(complaint._id).format('dddd');
          complaint._id = dayOfWeek;
        });
      }
  })
//calculate total users
totalCount
  .route("/totalusers")
      .options(cors.corsWithOptions, (req, res) => {
          res.sendStatus(200);
      })
  .get(cors.corsWithOptions, verifyUser, async (req, res) => {
    let find=queryBuilder(req);

    try {
      
      const result = await User.aggregate([
        {
          $match: find,  
        },
        {
          $group: {
            _id: null,
            totalActiveTechnician: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$role',  ROLES.technician] },
                      { $eq: ['$active', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalJheAccounts: {
              $sum: {
                $cond: [
                  {
                    $and: [
                   
                      { $eq: ['$role', ROLES.jh] },
                      { $eq: ['$active', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalCCIAccounts: {
              $sum: {
                $cond: [
                  {
                    $and: [
                   
                      { $eq: ['$role',  ROLES.cci] },
                      { $eq: ['$active', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalFreezAccounts: {
              $sum: {
                $cond: [{ $eq: ['$active', false] }, 1, 0]
              }
            },
            totalAccounts: {
              $sum: {
                $cond: ["$username", 1, 0]
              }
            },
          }
        }
      ]);

      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


totalCount
.route("/:type")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.corsWithOptions, verifyUser, async(req, res, next) => {
        if(req.params.type=="complaint"){
          let find=queryBuilder(req);
    
            const totalCount = await Complaint.countDocuments(find)
            if (totalCount!=0 && !totalCount) {
                res.status(500).json({ success: false })
            }
            res.send({
                totalCount: totalCount
            });
    }else  if(req.params.type=="users"){

      let find=queryBuilder(req)
        const totalCount = await User.countDocuments(find)

        if (totalCount!=0 && !totalCount) {
            res.status(500).json({ success: false })
        }
        res.send({
            totalCount: totalCount
        });
    }else   if(req.params.type=="history"){
        let find=queryBuilder(req)
        const totalCount = await HistoryLog.countDocuments(find)

        if (totalCount!=0 && !totalCount) {
          res.status(500).json({ success: false })
      }
      res.send({
          totalCount: totalCount
      });
    }else if(req.params.type=="material"){
      let find=queryBuilder(req)

      const totalCount = await Complaint.aggregate([
     
        {
          $match: find
        },
        {
          $group: {
            _id: null,
            "Compressor": { $sum: { $cond: [{ $and: [ { $ifNull: [ "$compressorFault", false ] }, { $ne: [ "$compressorFault", "" ] } ] }, 1, 0 ] } },
            "GasLeak": { $sum: { $cond: [{ $and: [ { $ifNull: [ "$gasLeak", false ] }, { $ne: [ "$gasLeak", "" ] } ] }, 1, 0 ] } },
            "Other Part": { $sum: { $cond: [{ $and: [ { $ifNull: [ "$otherPartFaults", false ] }, { $ne: [ "$otherPartFaults", "" ] } ] }, 1, 0 ] } },
            Service: { $sum: { $cond: [{ $and: [ { $ifNull: [ "$service", false ] }, { $ne: [ "$service", "" ] } ] }, 1, 0 ] } },
          },
        },

        ]).exec((err, result) => {
        if (err) {
          res.status(500).json({ success: false })
          return;
        }
       
        res.json(result);
      });

  }
     else{
        res.status(500).json({ success: false })
    }
    })




.delete(
    cors.corsWithOptions,
    (req, res, next) => {
   
        OrderItem.remove({})
            .then(
                resp => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(resp);
                },
                err => next(err)
            )
            .catch(err => next(err));
    }
);





module.exports = totalCount;