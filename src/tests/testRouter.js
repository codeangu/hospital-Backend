
const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../../middlewares/authenticate");
const verifyUser = authenticate.verifyUser;
const verifyAdmin = authenticate.verifyAdmin;
const TestRouter = express.Router();
const cors = require("../cors");
const Test = require("./testModel");

const { queryBuilder, queryBuilderWithBody } = require("../shared/querryBuilder");



TestRouter.use(bodyParser.json());
TestRouter.use(authenticate.optionalAuth);
TestRouter.use(authenticate.userScopeFilter);

TestRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    // Lab staff need visibility into all of their hospital's tests (to filter by their own lab name),
    // not just tests they personally created.
    if (req.user && req.user.role === 'LAB') {
      req.userScope = null;
    }
    let find = queryBuilder(req)
     try {
    console.log("find inside get patients: ", find);
    Test.find(find)

      .then(
        (Test) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(Test);
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
 .post(cors.corsWithOptions, verifyUser, (req, res, next) => {
      const { getHospitalId } = authenticate;
      const hospitalId = getHospitalId(req.user);
      const testData = {
        ...req.body,
        user: req.user._id,
        hospitalId: hospitalId,
      };
      Test.create(testData)
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
    res.end("PUT operation not supported on /Test");
  });





TestRouter
  .route("/:productId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    const { getHospitalId } = authenticate;
    const hospitalId = getHospitalId(req.user);
    const filter = { _id: req.params.productId, hospitalId };
    if (req.userScope) Object.assign(filter, req.userScope);
    Test.findOne(filter)
      .then(
        (product) => {
          if (!product) {
            return res.status(404).json({ success: false, message: "Test not found" });
          }
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
      "POST operation not supported on /Test/" + req.params.productId
    );
  })
  .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    const { getHospitalId } = authenticate;
    const hospitalId = getHospitalId(req.user);
    const filter = { _id: req.params.productId, hospitalId };
    // Lab staff can update any test in their hospital (not just ones they personally created).
    if (req.userScope && req.user.role !== 'LAB') Object.assign(filter, req.userScope);
    const { user: _u, hospitalId: _h, ...safeBody } = req.body;
    Test.findOneAndUpdate(
      filter,
      { $set: safeBody },
      { new: true }
    )
      .then(
        (product) => {
          if (!product) {
            return res.status(404).json({ success: false, message: "Test not found" });
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(product);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, verifyUser, (req, res, next) => {
    const { getHospitalId } = authenticate;
    const hospitalId = getHospitalId(req.user);
    const filter = { _id: req.params.productId, hospitalId };
    if (req.userScope) Object.assign(filter, req.userScope);
    Test.findOneAndRemove(filter)
      .then(
        (resp) => {
          if (!resp) {
            return res.status(404).json({ success: false, message: "Test not found" });
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

TestRouter
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
      const patients = await Test.find(find)
    
       const totalPatients = await Test.countDocuments(find);

  
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

module.exports = TestRouter;
