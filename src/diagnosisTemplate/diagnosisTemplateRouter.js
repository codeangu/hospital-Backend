
const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../../middlewares/authenticate");
const verifyUser = authenticate.verifyUser;
const verifyAdmin = authenticate.verifyAdmin;
const DiagnosisTemplateRouter = express.Router();
const cors = require("../cors");
const DiagnosisTemplate = require("./diagnosisTemplate");


const { queryBuilder,  } = require("../shared/querryBuilder");



DiagnosisTemplateRouter.use(bodyParser.json());
DiagnosisTemplateRouter.use(authenticate.optionalAuth);

DiagnosisTemplateRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    let find = queryBuilder(req)
     try {
    console.log("find inside get DiagnosisTemplates: ", find);
    DiagnosisTemplate.find(find)
      .populate('patient')
      .then(
        (DiagnosisTemplate) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(DiagnosisTemplate);
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
 
      
      DiagnosisTemplate.create(req.body)
        .then(
          (data) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(data);
          },
          (err) => {
            console.log("err: ", err);
            res.statusCode = 409;

            if (err.code === 11000) {
              
              return res.json({
                success: false,
                message: `Error: DiagnosisTemplates already Exist or any required field is missing. please check and try again`,
              });
            } else{
              next(err);
            }
            

          }
        )
        .catch((err) => next(err));

})

  .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /DiagnosisTemplate");
  });






  DiagnosisTemplateRouter
  .route("/lastDiagnosisTemplate")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    let find = queryBuilder(req)
    
      // find['$or']= [
      //   { diagnosis: null },
      //   { diagnosis: { $exists: false } }
      // ]
    
    DiagnosisTemplate.findOne(find)
    .sort({ createdAt: -1 }) // Sort by createdAt in descending order
    .limit(1)
   
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



DiagnosisTemplateRouter
  .route("/:productId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    DiagnosisTemplate.findById(req.params.productId)
    
      .populate('patient')
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
      "POST operation not supported on /DiagnosisTemplate/" + req.params.productId
    );
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    // Generate the current date and time
   

    DiagnosisTemplate.findByIdAndUpdate(
      req.params.productId,
      {
        $set: req.body,
      },
      { new: true }
    )
     .populate('patient') // Add this line to populate patient data
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
    DiagnosisTemplate.findByIdAndRemove(req.params.productId)
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

DiagnosisTemplateRouter
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
    
    console.log("find inside get: paginate DiagnosisTemplates", find);
    
    try {

      // Perform aggregation to get the paginated data
      const DiagnosisTemplates = await DiagnosisTemplate.find(find)
      .populate('patient')
       const totalDiagnosisTemplates = await DiagnosisTemplate.countDocuments(find);

      const totalPages = Math.ceil(totalDiagnosisTemplates / pageSize);

      res.json({
        DiagnosisTemplates: DiagnosisTemplates,
        page:parseInt(page),
        pageSize: parseInt(pageSize),
        totalDiagnosisTemplates:totalDiagnosisTemplates,
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
    // console.log("find inside get: paginate DiagnosisTemplates", find);
    
    // try {
    //   const totalDiagnosisTemplates = await DiagnosisTemplate.countDocuments(find);
    //   const totalPages = Math.ceil(totalDiagnosisTemplates / pageSize);

    //   const DiagnosisTemplates = await DiagnosisTemplate.find(find)
    //     .sort({ createdAt: order })
    //     .skip((page - 1) * pageSize)
    //     .limit(pageSize)
    //     .exec();

    //   res.json({
    //     DiagnosisTemplates: DiagnosisTemplates,
    //     page,
    //     pageSize,
    //     totalDiagnosisTemplates,
    //     totalPages,
    //   });
    // } catch (error) {
     
    //   res.status(500).json({ error: "Internal Server Error" });
    // }


  });

module.exports = DiagnosisTemplateRouter;
