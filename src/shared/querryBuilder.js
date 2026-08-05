

const mongoose = require('mongoose');

const ROLES = require("./rolesConstant");
var moment = require("moment");
const { ObjectId } = mongoose.Types;
//take a req and return a query object for mongoose
function queryBuilder(req) {

    const user = req.user
    const find = {}


      if (
        req.query.hasOwnProperty("startDate") &&
        req.query.hasOwnProperty("endDate") && req.query.hasOwnProperty("dateFilter")
      ){
            const startDate = moment.utc(req.query.startDate).format("YYYY-MM-DD");
             const endDate = moment.utc(req.query.endDate).format("YYYY-MM-DD");
           
          find[req.query.dateFilter] = {
            $gte: startDate,
            $lte: endDate,
          };
          delete req.query.startDate;
          delete req.query.endDate;
          delete req.query.dateFilter;
      }else{
        if (
          req.query.hasOwnProperty("startDate") &&
          req.query.hasOwnProperty("endDate")
        ) {
          const endOfDay = new Date(req.query.endDate);
          endOfDay.setHours(23, 59, 59, 999); //
            find["createdAt"] = {
              $gte: new Date(req.query.startDate),
              $lte: endOfDay
            };
          delete req.query.startDate;
          delete req.query.endDate;
        }
      }
      // if (req.query.hasOwnProperty("name")) {
      //   find["name"] = {
      //     $regex: new RegExp(req.query.name, "i") // "i" for case-insensitive search
      //   };
      //   delete req.query.name;
      // }
      if(req.query.diagnoses){
        find ['diagnoses']= {
              $regex: req.query.diagnoses,
              $options: 'i' // case-insensitive
          }
        
    
      delete req.query.stockNo
      }
  
      
      if(req.query.name){
        find['name']= {
              $regex: req.query.name,
              $options: 'i' // case-insensitive
          }
          delete req.query.name
      };
      if(req.query.firstName){
        find['firstName']= {
              $regex: req.query.firstName,
              $options: 'i' // case-insensitive
          }
          delete req.query.firstName
      };
      
    
      if(req.query['services.name'] && req.query['services.status']){
       
        find['services']={
      
            $elemMatch: { name: req.query['services.name'], status: req.query['services.status'] || 'pending' }
          
          }
          delete req.query['services.name']
          delete req.query['services.status']
      };
 
      if(req.query.cnic){
        find['cnic'] ={
              $regex: req.query.cnic,
              $options: 'i' // case-insensitive
          }
          delete req.query.cnic
      };
     
      if(req.query.firstName){
        find['firstName'] ={
              $regex: req.query.firstName,
              $options: 'i' // case-insensitive
          }
          delete req.query.firstName
      };
      
      if(req.query.phone){
        find['phone'] ={
              $regex: req.query.phone,
              $options: 'i' // case-insensitive
          }
          delete req.query.phone
      };
      if(req.query.patientId){
        const productObjectId = ObjectId(req.query.patientId)
        find['patientId']= productObjectId

      delete req.query.productRef
      }
      if(req.query.stockRef){
        const productObjectId = ObjectId(req.query.stockRef)
        find['stockRef']= productObjectId

      delete req.query.stockRef
      }
  
      if(req.query.hasOwnProperty("vitals")){   
        // { vital: { $size: 0 } }
        if(req.query.vitals =='false'){
          find['vitals']= { $exists: true, $eq: [] }
        }else if(req.query.vitals =='true'){
          find['vitals'] = { $not: { $size: 0 } };
        } 
         
       delete req.query.vitals
      }

      if(req.query.hasOwnProperty("diagnoses")){   
        // { vital: { $size: 0 } }
        if(req.query.diagnoses =='false'){
          find['diagnoses']= { $exists: true, $eq: [] }
          
        }else if(req.query.diagnoses =='true'){
          find['diagnoses'] = { $not: { $size: 0 } };
        } 
         
       delete req.query.diagnoses
      }
      if(req.query.hasOwnProperty("treatments")){   
        // { vital: { $size: 0 } }
        if(req.query.treatments =='false'){
          find['treatments']= { $exists: true, $eq: [] }
        }else if(req.query.treatments =='true'){
          find['treatments'] = { $not: { $size: 0 } };
        } 
         
       delete req.query.treatments
      }
      if(req.query.hasOwnProperty("tests")){   
        // { vital: { $size: 0 } }
        if(req.query.tests =='false'){
          find['tests']= { $exists: true, $eq: [] }
        }else if(req.query.tests =='true'){
          find['tests'] = { $not: { $size: 0 } };
        } 
         
       delete req.query.tests
      }
    
    
      // Scope queries to the authenticated user's hospital
      if (req.user) {
        const hospitalId = req.user.role === 'HOSPITAL' ? req.user._id : req.user.hospitalId;
        if (hospitalId) {
          find['hospitalId'] = hospitalId;
          delete req.query.hospitalId; // prevent override from query string
        }
      }

      // Scope queries to records owned by this user / their linked staff
      if (req.userScope) {
        Object.assign(find, req.userScope);
      }

      return { ...req.query, ...find };

}



function queryBuilderWithBody(req) {
    const user = req.user
    const find = {}
  
      if (
        req.body.hasOwnProperty("startDate") &&
        req.body.hasOwnProperty("endDate") && req.body.hasOwnProperty("dateFilter")
      ){
        const startDate = moment.utc(req.body.startDate).format("YYYY-MM-DD");
             const endDate = moment.utc(req.body.endDate).format("YYYY-MM-DD");
          find[req.body.dateFilter] = {
            $gte: startDate,
            $lte: endDate,
          };
          delete req.body.startDate;
          delete req.body.endDate;
          delete req.body.dateFilter;
  
      }else{
        const endOfDay = new Date(req.body.endDate);
        endOfDay.setHours(23, 59, 59, 999); //
          find["createdAt"] = {
            $gte: new Date(req.body.startDate),
            $lte: endOfDay
          };
      }
    
      if (req.body.hasOwnProperty("name")) {
        find["name"] = {
          $regex: new RegExp(req.body.name, "i") // "i" for case-insensitive search
        };
        delete req.body.name;
      }
      if(req.body.stockNo){
        find ['stockNo']= {
              $regex: req.body.stockNo,
              $options: 'i' // case-insensitive
          }
        
    
      delete req.body.stockNo
      }
      // if(req.body.productId){
      //   find['productId']= {
      //         $regex: req.body.productId,
      //         $options: 'i' // case-insensitive
      //     }
      //     delete req.body.productId
      // };
   
 
      if(req.body.name){
        find['name']= {
              $regex: req.body.name,
              $options: 'i' // case-insensitive
          }
          delete req.body.name
      };
      
    
      if(req.body.shipingCompany){
        find['shipingCompany']={
              $regex: req.body.shipingCompany,
              $options: 'i' // case-insensitive
          }
          delete req.body.shipingCompan
      };
 
      if(req.body.cnic){
        find['cnic'] ={
              $regex: req.body.cnic,
              $options: 'i' // case-insensitive
          }
          delete req.body.cnic
      };
      if(req.body.firstName){
        find['firstName'] ={
              $regex: req.body.firstName,
              $options: 'i' // case-insensitive
          }
          delete req.body.firstName
      };
    
      
      if(req.body.phone){
        find['phone'] ={
              $regex: req.body.phone,
              $options: 'i' // case-insensitive
          }
          delete req.body.phone
      };

      if(req.body.hasOwnProperty("vitals")){   
        // { vital: { $size: 0 } }
        if(req.body.vitals =='false'){
          find['vitals']= { $exists: true, $eq: [] }
        }else if(req.body.vitals =='true'){
          find['vitals'] = { $not: { $size: 0 } };
        } 
         
       delete req.body.vitals
      }

      if(req.body.hasOwnProperty("diagnoses")){   
        // { vital: { $size: 0 } }
        if(req.body.diagnoses =='false'){
          find['diagnoses']= { $exists: true, $eq: [] }
        }else if(req.body.diagnoses =='true'){
          find['diagnoses'] = { $not: { $size: 0 } };
        } 
         
       delete req.body.diagnoses
      }
      if(req.body.hasOwnProperty("treatments")){   
        // { vital: { $size: 0 } }
        if(req.body.treatments =='false'){
          find['treatments']= { $exists: true, $eq: [] }
        }else if(req.body.treatments =='true'){
          find['treatments'] = { $not: { $size: 0 } };
        } 
         
       delete req.body.treatments
      }
      if(req.body.hasOwnProperty("tests")){   
        // { vital: { $size: 0 } }
        if(req.body.tests =='false'){
          find['tests']= { $exists: true, $eq: [] }
        }else if(req.body.tests =='true'){
          find['tests'] = { $not: { $size: 0 } };
        } 
         
       delete req.body.tests
      }
   
     
  
      return { ...req.body, ...find };
  
  }


// Export the function
module.exports = { queryBuilder, queryBuilderWithBody };