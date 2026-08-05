
const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../../middlewares/authenticate");
const verifyUser = authenticate.verifyUser;
const verifyAdmin = authenticate.verifyAdmin;
const transactionRouter = express.Router();
const cors = require("../cors");
const Transaction = require("./transactionModel");

const mongoose  = require("mongoose");
const { queryBuilder } = require("../shared/querryBuilder");

transactionRouter.use(bodyParser.json());
transactionRouter.use(authenticate.optionalAuth);

transactionRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    const find = queryBuilder(req);
     try {
    console.log("find inside get transactions: ", find);
    // Transaction.aggregate([
    //   {
    //     $match: {
    //       customerId: mongoose.Types.ObjectId(customerId) // Match transactions for the specific customer
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       totalDebit: { $sum: "$debit" } // Sum up all debit amounts
    //     }
    //   }
    // ])
    
    Transaction.find(find)
    // .populate({
    //   path: 'paymentMethod',
    // })
      
      .then(
        (Transaction) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(Transaction);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
    }
    catch(err){
        res.json(err);
    }
  })
 //post call for to create
 .post(cors.corsWithOptions, (req, res, next) => {
  
  Transaction.create(req.body)
    .then(
      (data) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(data);
      },
      (err) => {
      
          next(err);            

      }
    )
    .catch((err) => next(err));
})

  .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /Transaction");
  });

  transactionRouter
  .route("/summary")
  .options(cors.corsWithOptions, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
  
    try {
   
    
      const find = queryBuilder(req);
      // Build match condition based on provided parameters
      if(req.query.entityType == 'All'){
        delete req.query.entityType
      }else{
        if (req.query.entityId) {
          find.entityId = new mongoose.Types.ObjectId(req.query.entityId);
          delete req.query.entityId
        }
        if (req.query.entityType) {
          find.entityType = req.query.entityType;
          delete req.query.entityType
        }
      }
      console.log("find inside get transaction summary: ", find);
    
       // If neither parameter is provided, return error
       if (!find.entityId && !find.entityType) {
        return res.status(400).json({
            success: false,
            message: 'Please provide either entityId or entityType'
        });
    }
    
     

      const summary = await Transaction.aggregate([
          // Match documents based on provided criteria
          { $match: find },
          
          // Group and calculate totals
          {
              $group: {
                  _id: null,
                  totalDebit: { $sum: '$debit' },
                  totalCredit: { $sum: '$credit' },
                  // transactions: { $push: '$$ROOT' }
              }
          },
          
          // Calculate balance and format response
          {
              $project: {
                  _id: 0,
                  totalDebit: 1,
                  totalCredit: 1,
                  balance: { $subtract: ['$totalDebit', '$totalCredit'] },
                  // transactions: 1
              }
          }
      ]);

      // Handle case when no transactions are found
      if (!summary.length) {
          return res.status(200).json({
              success: true,
              data: {
                  totalDebit: 0,
                  totalCredit: 0,
                  balance: 0,
                  // transactions: []
              }
          });
      }

      res.status(200).json({
          success: true,
          data: summary[0]
      });

  } catch (error) {
      console.error('Error in getTransactionSummary:', error);
      res.status(500).json({
          success: false,
          message: 'Error calculating transaction summary',
          error: error.message
      });
  }
  });

  

transactionRouter
  .route("/:pagesize/:page/:ordering?")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions,verifyUser, async (req, res, next) => {
    //********** */ new pagination ************
    const page = parseInt(req.params.page) || 1;
const pageSize = parseInt(req.params.pagesize) || 10;
let find = req.query;

let order = 1;

console.log("find.inside transaction ", find);
// const nestedBuilder =   new newQueryBuilder(req.query, req)
//   .buildNestedFilters()
 
// const nestedFind = nestedBuilder.build();
try {
  const results = await Transaction.aggregate([
    // Match stage (your filter conditions)
    { $match: find },
    
    // Facet to perform multiple aggregations in parallel
    
    
  ]);


  res.json({
    data: results,
    page,
    pageSize,
    totalItems,
    totalPages,
    
  });

} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: "Internal Server Error" });
}

  })

module.exports = transactionRouter;
