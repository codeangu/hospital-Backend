
const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../../middlewares/authenticate");
const verifyUser = authenticate.verifyUser;
const verifyAdmin = authenticate.verifyAdmin;
const patientRouter = express.Router();
const cors = require("../cors");
const Patient = require("./patientModel");

const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const { queryBuilder, queryBuilderWithBody } = require("../shared/querryBuilder");
const { getQueryLimitCap } = require("../shared/dailyLimitHelper");



patientRouter.use(bodyParser.json());
patientRouter.use(authenticate.optionalAuth);
patientRouter.use(authenticate.userScopeFilter);

patientRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    // const { bypass, cap } = getQueryLimitCap(req);
    let find = queryBuilder(req);
    try {
      console.log("find inside get patients: ", find);
      let query = Patient.find(find);
      // if (!bypass) query = query.limit(cap);
      query
        .then(
          (patients) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(patients);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    } catch (err) {
      res.json(err);
    }
  })
 //post call for to create
 .post(cors.corsWithOptions, verifyUser, (req, res, next) => {
      const { getHospitalId } = authenticate;
      const hospitalId = getHospitalId(req.user);
      const patientData = {
        ...req.body,
        user: req.user._id,
        hospitalId: hospitalId,
      };
      Patient.create(patientData)
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
                message: `Error: patients already Exist or any required field is missing. please check and try again`,
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
    res.end("PUT operation not supported on /Patient");
  });




patientRouter
.route("/detail/:productId")
.options(cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
})
.get(cors.cors, verifyUser, (req, res, next) => {
  const { getHospitalId } = authenticate;
  const hospitalId = getHospitalId(req.user);
  const filter = { _id: req.params.productId, hospitalId };
  if (req.userScope) Object.assign(filter, req.userScope);
  Patient.findOne(filter)
  .populate({
    path:'nccFeedback.user'
  })
    .then(
      (product) => {
        if (!product) {
          return res.status(404).json({ success: false, message: "Patient not found" });
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(product);
      },
      (err) => next(err)
    )
    .catch((err) => next(err));
})








patientRouter
  .route("/others/:pagesize/:id")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
    let pageSize = +req.params.pagesize;
    let lastId = req.params.id;
    let pro;

    if (lastId === "0") {
      pro = await Patient.find({ city_name: { $ne: "KHI" } }).limit(pageSize);
    } else {
      pro = await Patient.find({
        _id: { $gt: lastId },
        city_name: { $ne: "KHI" },
      }).limit(pageSize);
    }

    if (!pro) {
      res.status(500).json({ success: false });
    }
    res.send(pro);
  });



patientRouter
  .route("/:productId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    const { getHospitalId } = authenticate;
    const hospitalId = getHospitalId(req.user);
    const filter = { _id: req.params.productId, hospitalId };
    if (req.userScope) Object.assign(filter, req.userScope);
    Patient.findOne(filter)
      .then(
        (product) => {
          if (!product) {
            return res.status(404).json({ success: false, message: "Patient not found" });
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
      "POST operation not supported on /Patient/" + req.params.productId
    );
  })
  .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    const { getHospitalId } = authenticate;
    const hospitalId = getHospitalId(req.user);
    const filter = { _id: req.params.productId, hospitalId };
    if (req.userScope) Object.assign(filter, req.userScope);
    const { user: _u, hospitalId: _h, ...safeBody } = req.body;
    Patient.findOneAndUpdate(
      filter,
      { $set: safeBody },
      { new: true }
    )
      .then(
        (product) => {
          if (!product) {
            return res.status(404).json({ success: false, message: "Patient not found" });
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
    Patient.findOneAndRemove(filter)
      .then(
        (resp) => {
          if (!resp) {
            return res.status(404).json({ success: false, message: "Patient not found" });
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

  patientRouter
  .route("/range/:pagesize/:page/:ordering?")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
    //********** */ new pagination ************
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pagesize) || 10;

    let order = 1;
    if (req.params.ordering == "desc") order = -1;

    // Compute daily cap BEFORE queryBuilder deletes startDate/endDate
    const { bypass, cap } = getQueryLimitCap(req);

    let find = queryBuilder(req);

    console.log("find inside get: paginate patients", find, "| bypass:", bypass, "| cap:", cap);

    try {
      const rawTotal = await Patient.countDocuments(find);
      const effectiveTotal = bypass ? rawTotal : Math.min(rawTotal, cap);
      const totalPages = Math.ceil(effectiveTotal / pageSize);

      const skip = (page - 1) * pageSize;
      const effectiveLimit = bypass
        ? pageSize
        : Math.max(0, Math.min(pageSize, cap - skip));

      let patients = [];
      if (effectiveLimit > 0) {
        patients = await Patient.find(find)
          .sort({ createdAt: order })
          .skip(skip)
          .limit(effectiveLimit)
          .exec();
      }

      res.json({
        patients: patients,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPatients: effectiveTotal,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log("error: ", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

patientRouter
  .route("/:pagesize/:page/:ordering?")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
    // Pagination
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pagesize) || 10;

    // Sorting
    let order = 1;
    if (req.params.ordering === "desc") order = -1;

    // Query builder
    let find = queryBuilder(req);

    console.log("find inside get: paginate patients", find);

    try {
      // Count total matching records
      const totalPatients = await Patient.countDocuments(find);
      const totalPages = Math.ceil(totalPatients / pageSize);

      // Fetch paginated data
      const patients = await Patient.find(find)
        .sort({ createdAt: order })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec();

      res.json({
        patients,
        page,
        pageSize,
        totalPatients,
        totalPages,
      });
    } catch (error) {
      console.log("error: ", error);
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
    
    //old implementation
    // let order = 1;
    // if(req.params.ordering == "desc") order = -1
          
    // let find = queryBuilder(req)
    // console.log("find inside get: paginate patients", find);
    
    // try {
    //   const totalPatients = await Patient.countDocuments(find);
    //   const totalPages = Math.ceil(totalPatients / pageSize);

    //   const patients = await Patient.find(find)
    //     .sort({ createdAt: order })
    //     .skip((page - 1) * pageSize)
    //     .limit(pageSize)
    //     .exec();

    //   res.json({
    //     patients: patients,
    //     page,
    //     pageSize,
    //     totalPatients,
    //     totalPages,
    //   });
    // } catch (error) {
     
    //   res.status(500).json({ error: "Internal Server Error" });
    // }


  });

module.exports = patientRouter;
