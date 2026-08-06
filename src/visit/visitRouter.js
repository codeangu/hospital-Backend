
const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../../middlewares/authenticate");
const verifyUser = authenticate.verifyUser;
const verifyAdmin = authenticate.verifyAdmin;
const visitRouter = express.Router();
const cors = require("../cors");
const Visit = require("./visitModel");

const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const { queryBuilder, queryBuilderWithBody } = require("../shared/querryBuilder");
const { getQueryLimitCap } = require("../shared/dailyLimitHelper");



visitRouter.use(bodyParser.json());
visitRouter.use(authenticate.optionalAuth);
visitRouter.use(authenticate.userScopeFilter);

visitRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    const { bypass, cap } = getQueryLimitCap(req);
    // Lab staff only need to see visits sent to their own lab for testing,
    // not the visits/patients they personally created (they create none).
    if (req.user && req.user.role === 'LAB') {
      req.userScope = null;
    }
    let find = queryBuilder(req);
    if (req.user && req.user.role === 'LAB') {
      find.checkupStatus = 'AWAITING_TEST';
      find['testsSuggested.category'] = req.user.name;
    }
    try {
      console.log("find inside get visits: ", find);
      let query = Visit.find(find).populate('patient');
      if (!bypass) query = query.limit(cap);
      query
        .then(
          (visits) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(visits);
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
      const visitData = {
        ...req.body,
        user: req.user._id,
        hospitalId: hospitalId,
      };
      Visit.create(visitData)
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
                message: `Error: visits already Exist or any required field is missing. please check and try again`,
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
    res.end("PUT operation not supported on /Visit");
  });






  visitRouter
  .route("/lastvisit")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, async (req, res, next) => {
  try {
    let find = queryBuilder(req);
console.log("find inside get last visit: ", find);
    const docs = await Visit.find(find)
      .sort({ updatedAt: -1 }) // most recent first
      .limit(2);

    if (docs?.length === 0 || !docs) {
      return res.status(404).json({ message: "No documents found" });
    }

    // Merge the two docs into one (customize merging logic as needed)
   let mergedDoc;
   console.log("docs: ",  docs[0], docs[1]);
     
        if (docs.length === 1) {
          mergedDoc = docs[0].toObject();
        } else {
          const recent = docs[0].toObject();  // most recent
          const previous = docs[1].toObject(); // second most recent

          mergedDoc = { ...previous }; // start with older

          Object.keys(recent).forEach((key) => {
            const val = recent[key];

            if (Array.isArray(val)) {
              if (val.length > 0) {
                mergedDoc[key] = val; // take recent array if not empty
              }
            } else if (val !== null && val !== undefined && val !== "") {
              mergedDoc[key] = val; // take recent value if exists
            }
          });
        }



    res.status(200).json(mergedDoc);
  } catch (err) {
    next(err);
  }
});

// Lab staff submit/edit their result/notes for the test(s) sent to their lab on a visit.
// Scoped strictly: only LAB role, only their own hospital, only visits where a
// test for their lab was sent, and only touches labResults (no other visit fields).
// Not restricted to checkupStatus AWAITING_TEST, since a lab must still be able to
// edit their result after the doctor has resumed/completed the checkup.
visitRouter
  .route("/:productId/lab-result")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .put(cors.corsWithOptions, verifyUser, async (req, res, next) => {
    if (req.user.role !== 'LAB') {
      return res.status(403).json({ success: false, message: "Only lab accounts can submit test results" });
    }
    const { getHospitalId } = authenticate;
    const hospitalId = getHospitalId(req.user);
    const filter = {
      _id: req.params.productId,
      hospitalId,
      'testsSuggested.category': req.user.name
    };
    try {
      const visit = await Visit.findOne(filter);
      if (!visit) {
        return res.status(404).json({ success: false, message: "Test request not found" });
      }
      const existing = (visit.labResults || []).find(r => r.category === req.user.name);
      if (existing) {
        existing.result = req.body.result || '';
        existing.submittedBy = req.user._id;
        existing.submittedAt = new Date();
      } else {
        visit.labResults = visit.labResults || [];
        visit.labResults.push({ category: req.user.name, result: req.body.result || '', submittedBy: req.user._id, submittedAt: new Date() });
      }
      await visit.save();
      await visit.populate('patient');
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(visit);
    } catch (err) {
      next(err);
    }
  });




visitRouter
  .route("/:productId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    const { getHospitalId } = authenticate;
    const hospitalId = getHospitalId(req.user);
    const filter = { _id: req.params.productId, hospitalId };
    if (req.userScope) Object.assign(filter, req.userScope);
    Visit.findOne(filter)
      .populate('patient')
      .then(
        (product) => {
          if (!product) {
            return res.status(404).json({ success: false, message: "Visit not found" });
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
      "POST operation not supported on /Visit/" + req.params.productId
    );
  })
  .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    const { getHospitalId } = authenticate;
    const hospitalId = getHospitalId(req.user);
    const filter = { _id: req.params.productId, hospitalId };
    if (req.userScope) Object.assign(filter, req.userScope);
    const { user: _u, hospitalId: _h, ...safeBody } = req.body;
    Visit.findOneAndUpdate(
      filter,
      { $set: safeBody },
      { new: true }
    )
      .populate('patient')
      .then(
        (product) => {
          if (!product) {
            return res.status(404).json({ success: false, message: "Visit not found" });
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
    Visit.findOneAndRemove(filter)
      .then(
        (resp) => {
          if (!resp) {
            return res.status(404).json({ success: false, message: "Visit not found" });
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });


  visitRouter
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

    console.log("find inside get: paginate visits", find, "| bypass:", bypass, "| cap:", cap);

    try {
      const rawTotal = await Visit.countDocuments(find);
      const effectiveTotal = bypass ? rawTotal : Math.min(rawTotal, cap);
      const totalPages = Math.ceil(effectiveTotal / pageSize);

      const skip = (page - 1) * pageSize;
      const effectiveLimit = bypass
        ? pageSize
        : Math.max(0, Math.min(pageSize, cap - skip));

      let visits = [];
      if (effectiveLimit > 0) {
        visits = await Visit.find(find)
          .populate('patient')
          .sort({ createdAt: order })
          .skip(skip)
          .limit(effectiveLimit)
          .exec();
      }

      res.json({
        visits: visits,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalVisits: effectiveTotal,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log("error: ", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
   });

visitRouter
  .route("/:pagesize/:page/:ordering?")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
    // Pagination

     console.log("find inside get: paginate visits", req.query);
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pagesize) || 10;
 
    // Sorting
    let order = 1;
    if (req.params.ordering === "desc") order = -1;

    // Query builder
    let find = queryBuilder(req);
    console.log("find inside get: paginate visits", find);

    try {
      // Total records
      const totalVisits = await Visit.countDocuments(find);
      const totalPages = Math.ceil(totalVisits / pageSize);

      // Pagination skip
      const skip = (page - 1) * pageSize;

      // Fetch paginated data
      const visits = await Visit.find(find)
        .populate("patient")
        .sort({ createdAt: order })
        .skip(skip)
        .limit(pageSize)
        .exec();

      res.json({
        visits,
        page,
        pageSize,
        totalVisits,
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
    // console.log("find inside get: paginate visits", find);
    
    // try {
    //   const totalVisits = await Visit.countDocuments(find);
    //   const totalPages = Math.ceil(totalVisits / pageSize);

    //   const visits = await Visit.find(find)
    //     .sort({ createdAt: order })
    //     .skip((page - 1) * pageSize)
    //     .limit(pageSize)
    //     .exec();

    //   res.json({
    //     visits: visits,
    //     page,
    //     pageSize,
    //     totalVisits,
    //     totalPages,
    //   });
    // } catch (error) {
     
    //   res.status(500).json({ error: "Internal Server Error" });
    // }


  });

module.exports = visitRouter;
