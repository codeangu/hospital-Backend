
const express = require("express");
const bodyParser = require("body-parser");
const verifyUser = require("../../middlewares/authenticate").verifyUser;
const verifyAdmin = require("../../middlewares/authenticate").verifyAdmin;
const complaintRouter = express.Router();
const cors = require("../cors");
const Complaint = require("./complaintModel");
const HistoryLog = require("../historyLog/historyLogModel");
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const { queryBuilder, queryBuilderWithBody } = require("../shared/querryBuilder");
const {feedbackSetup,historyObjSetup} = require("../shared/feedbackSetup");
const ROLES = require("../shared/rolesConstant");
const {ExcelHeadingObj, ResolveHeadingsObj} = require("../shared/excelHeadings")
var moment = require("moment");
const { Transform } = require('stream');
const CSVTransformStream = require('./CSVTransformStream'); // Adjust the path to your CSVTransformStream class

complaintRouter.use(bodyParser.json( ));

complaintRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
     const find = queryBuilder(req);
     try {
    console.log("find inside get complaints: ", find);
    Complaint.find(find)
      .populate({
        path: "technician",
      })
      .then(
        (Complaint) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(Complaint);
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
  Complaint.find(
    { orderNo: { $in: req.body.map((obj) => obj["orderNo"]) } },
    (err, foundObjects) => {
      if (err) {
        // Handle error
        res.json(`failed to check for duplicates ${err}`);
      }

      if (foundObjects.length > 0) {
        // Handle objects that already exist
        const foundOrderNumbers = foundObjects.map((obj) => obj["orderNo"]);
        res.statusCode = 409;
        return res.json({
          success: false,
          message: `Error: The following orderNo numbers already exist: ${foundOrderNumbers.join(
            ", "
          )}, please check and try again`,
        });
      }
      // const batchSize = 150; // Maximum batch size
      const documents = req.body; // Array of documents to insert
      
      // for (let i = 0; i < documents.length; i += batchSize) {
      //   const batch = documents.slice(i, i + batchSize);
      
      
      Complaint.insertMany(documents)
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
                message: `Error: complaints already Exist or any required field is missing. please check and try again`,
              });
            } else{
              next(err);
            }
            

          }
        )
        .catch((err) => next(err));
    }
  // }
  );
})

  .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /Complaint");
  });




// complaintRouter
//   .route("/itemsalecount")
//   .options(cors.corsWithOptions, async (req, res) => {
//     res.sendStatus(200);
//   })
//   .get(cors.cors, verifyUser, async (req, res) => {
//     const itemsalecount = await Complaint.countDocuments();

//     if (!itemsalecount && itemsalecount != 0) {
//       res.status(500).json({ success: false });
//     }
//     res.json({
//       itemsalecount: itemsalecount,
//     });
//   });

  complaintRouter
  .route("/returnrecent")
  .options(cors.corsWithOptions, async (req, res) => {
    res.sendStatus(200);
  })

  .put(cors.corsWithOptions, verifyUser,async (req, res) => {

    
      try {
        const orderNumbers = req.body.orderNumbers;
        const updateData = { status: "upload", recent: true };
    
        // Update batch orders based on order numbers
        const result = await Complaint.updateMany(
          { orderNo: { $in: orderNumbers } },
          { $set: updateData }
        );

        res.json({ updatedCount: result.nModified });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

  complaintRouter
  .route("/feedback/:complaintId")
  .options(cors.corsWithOptions, async (req, res) => {
    res.sendStatus(200);
  })

  .put(cors.corsWithOptions, verifyUser,async (req, res) => {

    // let find = queryBuilderWithBody(req)

    let resetFeedBack;
    // resetFeedBack = feedbackSetup(req)
    const complaintFound = await Complaint.findById( req.params.complaintId)
    if(complaintFound){
      req.body.complaint = complaintFound;
      resetFeedBack = feedbackSetup(req)
      updateComplaint()
    }
    //   console.log("updateComplaint: 0", resetFeedBack);
    // if(req.body.feedback ==='unSatisfied' && (req.user.role===ROLES.vendor || req.user.role===ROLES.vendorAdmin)){
    //   let historyObj = historyObjSetup(req)
    //   try {
    //   const historyComplaint = await HistoryLog.create(historyObj)
   
    //   resetFeedBack.historyDissatisfied.push(historyComplaint._id)
    //   if(historyComplaint){
    //     console.log("updateComplaint: 1", resetFeedBack);
    //     updateComplaint()
    //   }
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: 'Internal Server Error', error });
    //   }
    //       // send to hitory
    // }else 
    // {
    //  console.log("inside else ", resetFeedBack)
    
  //  }
  // }

//function need to cunstruct
   function updateComplaint(){
    console.log("updateComplaint: 2 ", resetFeedBack);
      try {
        // Update batch orders based on order numbers
        Complaint.findByIdAndUpdate(
          req.params.complaintId,
          {
            $set: resetFeedBack
          },
          { new: true }
        ).then(
          (complaint) => {
         
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(complaint);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  
    });
  
//detail

complaintRouter
.route("/detail/:productId")
.options(cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
})
.get(cors.cors, verifyUser, (req, res, next) => {
  Complaint.findById(req.params.productId)
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
complaintRouter
.route("/download/:ordering?")
.options(cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
})
.post(cors.corsWithOptions, verifyUser, async (req, res, next) => {
      const page = parseInt(req.params.page) || 1;
      const pageSize = parseInt(req.params.pagesize) || 20000;
      const recentlyResolvedDownload = req.body.recentlyResolvedDownload || false;
      delete req.body.recentlyResolvedDownload;
      let order = 1;
      let allHeadingsObj = {...ExcelHeadingObj,...ResolveHeadingsObj}
      let allHeadings={};
      if(req.body.headingsObj){
        let downloadExcelHeadingsArr = [...req.body.headingsObj.downloadExcelHeadings, ...req.body.headingsObj.downloadResolveHeadings]
        for( let property in allHeadingsObj){
          if(downloadExcelHeadingsArr.indexOf(property) != -1){
            allHeadings[property]= allHeadingsObj[property]

          }
        }
        if(Object.keys(allHeadings).length==0){
          allHeadings = allHeadingsObj
        }
        console.log("allHeadings", allHeadings);
        delete req.body.headingsObj
       

      }
      if(req.params?.ordering == "desc") order = -1
      let find = queryBuilderWithBody(req);
      if(find.hasOwnProperty("withoutNCCUser")){
        delete find.withoutNCCUser
      }
  
      console.log("find in download ", find);
    try {
      const pipeline = [
        // Match documents that meet your criteria, if any
        {
          $match: find
        },
        // Add a new field nccRemarks with the last remarks from nccFeedback array
        {
          $addFields: {
            nccRemarks: { $arrayElemAt: [ "$nccFeedback.remarks", -1 ] },
            nccFeedback: { $arrayElemAt: [ "$nccFeedback.feedback", -1 ] },
            nccReason: { $arrayElemAt: [ "$nccFeedback.reason", -1 ] },
            cciRemarks: { $arrayElemAt: [ "$cciFeedback.remarks", -1 ] },
            nccDate:  { $arrayElemAt: [ "$nccFeedback.date", -1 ] },
            nccFeedbackCount: { $size: "$nccFeedback.feedback" },
            vendorRemarks: { $arrayElemAt: [ "$vendorFeedback.remarks", -1 ] },
           vendorDate:  { $arrayElemAt: [ "$vendorFeedback.date", -1 ] },
           uploadDate: {
            $dateToString: {
              format: "%Y-%m-%d", // Specify the desired date format
              date: "$createdAt" // Convert the createdAt field to a string in the specified format
            }
          }
          }
        },
        {
          $project: {
         // Exclude the nccFeedback field from the document
            vendorFeedback: 0,
            cciFeedback: 0,
            closeComplaint: 0,
            compressorFault: 0,
            compressorReplacement:0,
            gasLeak: 0,
            extraCosmeticParts:0,
            otherPartFaults:0,
            moreOtherPartFaults:0,
            service: 0,
          }
        },
        // { $sort: {createdAt: order} },
        // Pagination: Skip documents based on the page and pageSize
        { $skip: (page - 1) * pageSize },
        // Limit the number of documents per page
        { $limit: parseInt(pageSize) },
        // Additional pipeline stages if needed
      ];



      const cursor = Complaint.aggregate(pipeline).cursor();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=output.csv');
  
      const transformStream = new CSVTransformStream(allHeadings,recentlyResolvedDownload);
      cursor.pipe(transformStream).pipe(res);
  
      transformStream.on('end', () => {
    
      });
  
    } catch (error) {
      console.error('Error generating CSV:', error);
      res.status(500).send('Error generating CSV');
    }









      // const cursor = Complaint.aggregate(pipeline).cursor();

      // // Set response headers
      // res.setHeader('Content-Type', 'text/csv');
      // res.setHeader('Content-Disposition', 'attachment; filename=output.csv');
  
      // // Create and pipe the CSVTransformStream
      // const transformStream = new CSVTransformStream(allHeadings);
      // cursor.pipe(transformStream).pipe(res);

    // Pipe the cursor stream through the Transform stream to the response
    // cursor.pipe(transformStream).pipe(res);
      // const transformedData = complaints.map(document => {
      //   const row = [];
      //   // Map each custom heading to its corresponding database key
      //   Object.keys(allHeadings).forEach(heading => {
      //     const dbKey = allHeadings[heading];
      //     let value = ''; 
      //       if(dbKey === 'beforePic' || dbKey === 'afterPic' || dbKey === 'shopPic' || dbKey === 'optionalPic'){
      //         value = document.hasOwnProperty(dbKey) ? document[dbKey].url : ''
      //       }else{
      //         value = document.hasOwnProperty(dbKey) ? document[dbKey] : ''
      //       }
      //    // Check if the document has the property
      //     row.push(value); // Check if the document has the property
      //   });
      //   return row;
      // });
 
    //   console.log("transformedData. ", complaints.length);
    // //  console.log("transformedData. ", transformedData[0]);
    //   // Insert headings as the first element in the transformed data array
    //   transformedData.unshift(Object.keys(allHeadings));

    //   // Create a worksheet from the transformed data
    //   const worksheet = xlsx.utils.aoa_to_sheet(transformedData);

    //   // Create a workbook and append the worksheet
    //   const workbook = xlsx.utils.book_new();
    //   xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    //   // Set the response headers for Excel file
    //   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    //   res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');

    //   // Convert the workbook to a binary stream and send it to the client
    //   const excelData = xlsx.write(workbook, { type: 'binary', bookType: 'xlsx' });
    //   res.write(excelData, 'binary');
    //   res.end(null, 'binary');


        // Send Excel file to client
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.setHeader('Content-Disposition', 'attachment; filename="data.xlsx"');
        // await workbook.xlsx.write(res);
        // res.end();
     

  

});
//MC
complaintRouter
  .route("/mc/:pagesize?/:page?")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .post(cors.corsWithOptions, verifyUser, async (req, res, next) => {
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pagesize) || 10;
    let download = false
    if(req.body?.download){
      download= req.body.download;
    }
    

    let find = queryBuilderWithBody(req)
    console.log("find. ", find);
try {


  //old implementation
  const totalComplaints = await Complaint.countDocuments(find);
  const totalPages = Math.ceil(totalComplaints / pageSize);

  const complaints = await Complaint.find(find).populate({
    path: "technician",
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .exec();

  res.json({
    complaints: complaints,
    page,
    pageSize,
    totalComplaints,
    totalPages,
  });
} catch (error) {
 
  res.status(500).json({ error: "Internal Server Error" });
}
  
  });

//export
complaintRouter
  .route("/export/:pagesize?/:page?")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .post(cors.corsWithOptions, verifyUser, async (req, res, next) => {
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pagesize) || 10;
    let download = false
    if(req.body?.download){
      download= req.body.download;
    }
    

    let find = queryBuilderWithBody(req)
    console.log("find in export ", find);
 
try {


  const pipeline = [
    // Match documents that meet your criteria, if any
    {
      $match: find
    },
    // Add a new field nccRemarks with the last remarks from nccFeedback array
    {
      $addFields: {
        nccRemarks: { $arrayElemAt: [ "$nccFeedback.remarks", -1 ] },
        nccFeedback: { $arrayElemAt: [ "$nccFeedback.feedback", -1 ] },
        nccReason: { $arrayElemAt: [ "$nccFeedback.reason", -1 ] },
        cciRemarks: { $arrayElemAt: [ "$cciFeedback.remarks", -1 ] },
        nccDate:  { $arrayElemAt: [ "$nccFeedback.date", -1 ] },
        nccFeedbackCount: { $size: "$nccFeedback.feedback" },
       vendorRemarks: { $arrayElemAt: [ "$vendorFeedback.remarks", -1 ] },
       vendorDate:  { $arrayElemAt: [ "$vendorFeedback.date", -1 ] },
       uploadDate: {
        $dateToString: {
          format: "%Y-%m-%d", // Specify the desired date format
          date: "$createdAt" // Convert the createdAt field to a string in the specified format
        }
      }
      }
    },
    {
      $project: {
     // Exclude the nccFeedback field from the document
        vendorFeedback: 0,
        cciFeedback: 0,
        closeComplaint: 0,
        compressorFault: 0,
        compressorReplacement:0,
        gasLeak: 0,
        extraCosmeticParts:0,
        otherPartFaults:0,
        moreOtherPartFaults:0,
        service: 0,
      }
    },
    // { $sort: {createdAt: order} },
    // Pagination: Skip documents based on the page and pageSize
    { $skip: (page - 1) * pageSize },
    // Limit the number of documents per page
    { $limit: parseInt(pageSize) },
    // Additional pipeline stages if needed
  ];
  const complaints = await Complaint.aggregate(pipeline);
   const totalComplaints = await Complaint.countDocuments(find);
  
  
  const totalPages = Math.ceil(totalComplaints / pageSize);
  
  
  res.json({
    complaints: complaints,
    page:parseInt(page),
    pageSize: parseInt(pageSize),
    totalComplaints:totalComplaints,
    totalPages:totalPages,
  });
  
  //old implementation
//   const totalComplaints = await Complaint.countDocuments(find);
//   const totalPages = Math.ceil(totalComplaints / pageSize);

//   const complaints = await Complaint.find(find).populate({
//     path: "technician",
//   })
//     .sort({ createdAt: -1 })
//     .skip((page - 1) * pageSize)
//     .limit(pageSize)
//     .exec();

//   res.json({
//     complaints: complaints,
//     page,
//     pageSize,
//     totalComplaints,
//     totalPages,
//   });
} catch (error) {
 
  res.status(500).json({ error: "Internal Server Error" });
}
  
  });




complaintRouter
  .route("/others")
  .options(cors.corsWithOptions, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Complaint.find({ ...req.query, city_name: { $ne: "KHI" } })
      .populate({
        path: "resolved",
      })
      .then(
        (Complaint) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(Complaint);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

complaintRouter
  .route("/others/:pagesize/:id")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
    let pageSize = +req.params.pagesize;
    let lastId = req.params.id;
    let pro;

    if (lastId === "0") {
      pro = await Complaint.find({ city_name: { $ne: "KHI" } }).limit(pageSize);
    } else {
      pro = await Complaint.find({
        _id: { $gt: lastId },
        city_name: { $ne: "KHI" },
      }).limit(pageSize);
    }

    if (!pro) {
      res.status(500).json({ success: false });
    }
    res.send(pro);
  });



  complaintRouter
  .route("/resolve/:complaintId")
    .options(cors.corsWithOptions, (req, res) => {
      res.sendStatus(200);
    })
  .put(cors.corsWithOptions, verifyUser,(req, res, next) => {
    if(req.body.complaintCreated !=null){
    const createdAtDate = moment(req.body.complaintCreated, 'YYYY-MM-DD');
    const currentDate = moment();
   if(req.body.status == "resolved") {
      req.body.resolvedDate = currentDate.format("YYYY-MM-DD");
      req.body.resolvedTime = currentDate.format('HH:mm:ss');
     const resolvedDuration = currentDate.diff(createdAtDate, 'days');
     
     if(resolvedDuration > 1){
      req.body.resolvedDuration = resolvedDuration + ' days';
     }else if (resolvedDuration<2){
      req.body.resolvedDuration = resolvedDuration + ' day';;
     }

    }
    console.log("req.body: ", req.body);
  }
    Complaint.findByIdAndUpdate(
      req.params.complaintId,
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



complaintRouter
  .route("/:productId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, verifyUser, (req, res, next) => {
    Complaint.findById(req.params.productId)

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
      "POST operation not supported on /Complaint/" + req.params.productId
    );
  })
  .put(cors.corsWithOptions,verifyUser, (req, res, next) => {
    // Generate the current date and time
    const currentDate = moment();
    if (
      req.body.status == "matched" ||
      req.body.status == "unMatched" ||
      req.body.status == "received"
    ) {
      // Format the date as a string
      req.body.pendingUpdated = currentDate.format("YYYY-MM-DD HH:mm:ss");
    }

    Complaint.findByIdAndUpdate(
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
  .delete(cors.corsWithOptions, verifyUser, (req, res, next) => {
    Complaint.findByIdAndRemove(req.params.productId)
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

complaintRouter
  .route("/:pagesize/:page/:ordering?")
  .options(cors.corsWithOptions, verifyUser, async (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions,verifyUser, async (req, res, next) => {
    //********** */ new pagination ************
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pagesize) || 10;
    
    let order = 1;
    if(req.params.ordering == "desc") order = -1
          
    let find = queryBuilder(req)
    
    console.log("find inside get: paginate complaints", find);
    
    try {

      const pipeline = [
        // Match documents that meet your criteria, if any
        {
          $match: find
        },
        {
          $lookup: {
            from: 'users', // Replace 'User' with your actual user collection name
            localField: 'nccUser', // Field in your document that references the user
            foreignField: '_id', // Field in the User collection that holds the user ID
            as: 'nccUser' // Alias for the populated user data
          }
        },
        // Add a new field nccRemarks with the last remarks from nccFeedback array
        {
          $addFields: {
            nccRemarks: { $arrayElemAt: [ "$nccFeedback.remarks", -1 ] },
            nccFeedback: { $arrayElemAt: [ "$nccFeedback.feedback", -1 ] },
            nccReason: { $arrayElemAt: [ "$nccFeedback.reason", -1 ] },
            cciRemarks: { $arrayElemAt: [ "$cciFeedback.remarks", -1 ] },
            nccFeedbackCount: { $size: "$nccFeedback.feedback" },
            nccDate:  { $arrayElemAt: [ "$nccFeedback.date", -1 ] },
           vendorRemarks: { $arrayElemAt: [ "$vendorFeedback.remarks", -1 ] },
           vendorDate:  { $arrayElemAt: [ "$vendorFeedback.date", -1 ] },
           uploadDate: {
            $dateToString: {
              format: "%Y-%m-%d", // Specify the desired date format
              date: "$createdAt" // Convert the createdAt field to a string in the specified format
            }
          }
          }
        },
        {
          $project: {
         // Exclude the nccFeedback field from the document
            vendorFeedback: 0,
            cciFeedback: 0,
            closeComplaint: 0,
            compressorFault: 0,
            compressorReplacement:0,
            gasLeak: 0,
            extraCosmeticParts:0,
            otherPartFaults:0,
            moreOtherPartFaults:0,
            service: 0,
          }
        },
        { $sort: {createdAt: order} },
        // Pagination: Skip documents based on the page and pageSize
        { $skip: (page - 1) * pageSize },
        // Limit the number of documents per page
        { $limit: parseInt(pageSize) },
        // Additional pipeline stages if needed
      ];
  
      // Perform aggregation to get the paginated data
      const complaints = await Complaint.aggregate(pipeline);
       const totalComplaints = await Complaint.countDocuments(find);

  
      const totalPages = Math.ceil(totalComplaints / pageSize);
  
      

      res.json({
        complaints: complaints,
        page:parseInt(page),
        pageSize: parseInt(pageSize),
        totalComplaints:totalComplaints,
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
    // console.log("find inside get: paginate complaints", find);
    
    // try {
    //   const totalComplaints = await Complaint.countDocuments(find);
    //   const totalPages = Math.ceil(totalComplaints / pageSize);

    //   const complaints = await Complaint.find(find)
    //     .sort({ createdAt: order })
    //     .skip((page - 1) * pageSize)
    //     .limit(pageSize)
    //     .exec();

    //   res.json({
    //     complaints: complaints,
    //     page,
    //     pageSize,
    //     totalComplaints,
    //     totalPages,
    //   });
    // } catch (error) {
     
    //   res.status(500).json({ error: "Internal Server Error" });
    // }


  });

module.exports = complaintRouter;
