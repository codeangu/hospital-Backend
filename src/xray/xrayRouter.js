
const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../../middlewares/authenticate");
const verifyUser = authenticate.verifyUser;
const verifyAdmin = authenticate.verifyAdmin;
const xrayRouter = express.Router();
const cors = require("../cors");
const Xray = require("./xrayModel");
const Visit = require("../visit/visitModel");
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const { queryBuilder, queryBuilderWithBody } = require("../shared/querryBuilder");



xrayRouter.use(bodyParser.json());
xrayRouter.use(authenticate.optionalAuth);

xrayRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    let find = queryBuilder(req)
     try {
    console.log("find inside get patients: ", find);
    Xray.find(find)

      .then(
        (Xray) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(Xray);
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
 
      
      Xray.create(req.body)
        .then(
          (data) => {
            Visit.create({
              patient: data.patient,
              xray: data._id
            })
            .then(visitCreated => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(visitCreated);
            })
            .catch((err) => next(err));
          },
          
        )
        .catch((err) => next(err));
   
  

})

  .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /Xray");
  });




xrayRouter
.route("/detail/:productId")
.options(cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
})
.get(cors.cors, verifyUser, (req, res, next) => {
  Xray.findById(req.params.productId)
  .populate({
    path:'nccFeedback.user'
  })
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








xrayRouter
  .route("/others/:pagesize/:id")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
    let pageSize = +req.params.pagesize;
    let lastId = req.params.id;
    let pro;

    if (lastId === "0") {
      pro = await Xray.find({ city_name: { $ne: "KHI" } }).limit(pageSize);
    } else {
      pro = await Xray.find({
        _id: { $gt: lastId },
        city_name: { $ne: "KHI" },
      }).limit(pageSize);
    }

    if (!pro) {
      res.status(500).json({ success: false });
    }
    res.send(pro);
  });



xrayRouter
  .route("/:productId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    Xray.findById(req.params.productId)

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
      "POST operation not supported on /Xray/" + req.params.productId
    );
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    // Generate the current date and time
   

    Xray.findByIdAndUpdate(
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
    Xray.findByIdAndRemove(req.params.productId)
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

xrayRouter
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
      const patients = await Xray.find(find)
  
       const totalXrays = await Xray.countDocuments(find);

  
      const totalPages = Math.ceil(totalXrays / pageSize);
  
      

      res.json({
        patients: patients,
        page:parseInt(page),
        pageSize: parseInt(pageSize),
        totalXrays:totalXrays,
        totalPages:totalPages,
      });
    } catch (error) {
     console.log("error: ", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
    
    //old implementation
    // let order = 1;
    // if(req.params.ordering == "desc") order = -1
          
    // let find = queryBuilder(req)
    // console.log("find inside get: paginate patients", find);
    
    // try {
    //   const totalXrays = await Xray.countDocuments(find);
    //   const totalPages = Math.ceil(totalXrays / pageSize);

    //   const patients = await Xray.find(find)
    //     .sort({ createdAt: order })
    //     .skip((page - 1) * pageSize)
    //     .limit(pageSize)
    //     .exec();

    //   res.json({
    //     patients: patients,
    //     page,
    //     pageSize,
    //     totalXrays,
    //     totalPages,
    //   });
    // } catch (error) {
     
    //   res.status(500).json({ error: "Internal Server Error" });
    // }


  });

module.exports = xrayRouter;
