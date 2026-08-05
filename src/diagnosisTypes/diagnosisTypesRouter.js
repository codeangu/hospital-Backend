
const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../../middlewares/authenticate");
const verifyUser = authenticate.verifyUser;
const verifyAdmin = authenticate.verifyAdmin;
const diagnosisTypeRouter = express.Router();
const cors = require("../cors");
const DiagnosisType = require("./diagnosisTypesModel");
const Visit = require("../visit/visitModel");
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const { queryBuilder, queryBuilderWithBody } = require("../shared/querryBuilder");



diagnosisTypeRouter.use(bodyParser.json());
diagnosisTypeRouter.use(authenticate.optionalAuth);

diagnosisTypeRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    let find = queryBuilder(req)
     try {
    console.log("find inside get patients: ", find);
    DiagnosisType.find(find)
      .populate('user')
      .then(
        (DiagnosisType) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(DiagnosisType);
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

      DiagnosisType.create(req.body)
        .then(
          (data) => {
         
         
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(data);
           
           
          },
          (err) => next(err)
        )
        .catch((err) => next(err));

})

  .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /DiagnosisType");
  });





diagnosisTypeRouter
  .route("/:productId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    DiagnosisType.findById(req.params.productId)
    .populate('user')
      .then(
        (product) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(product);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      "POST operation not supported on /DiagnosisType/" + req.params.productId
    );
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    // Generate the current date and time
   

    DiagnosisType.findByIdAndUpdate(
      req.params.productId,
      {
        $set: req.body,
      },
      { new: true }
    )
      .then(
        (product) => {
    
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(product);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    DiagnosisType.findByIdAndRemove(req.params.productId)
      .then(
        (resp) => {
       
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

diagnosisTypeRouter
  .route("/:pagesize/:page/:ordering?")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
    //********** */ new pagination ************
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pagesize) || 10;
    
    let order = 1;
    if(req.params.ordering == "desc") order = -1
          
    let find = queryBuilder(req)
    
    console.log("find inside get: paginate patients", find);
    
    try {

     
  
      // Perform aggregation to get the paginated data
      const patients = await DiagnosisType.find(find)
      .populate('user')
       const totalPatients = await DiagnosisType.countDocuments(find);

  
      const totalPages = Math.ceil(totalPatients / pageSize);

      res.json({
        patients: patients,
        page:parseInt(page),
        pageSize: parseInt(pageSize),
        totalPatients:totalPatients,
        totalPages:totalPages,
      });
    } catch (error) {
     console.log("error: ", error);
      res.status(500).json({ error: "Internal Server Error" });
    }



  });

module.exports = diagnosisTypeRouter;
