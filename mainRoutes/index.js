
const users = require('../src/users/userRouter');
const path = require('path');

const totalCountRouter = require("../src/totalCounts/totalCountRouter");
const sideUserRouter = require("../src/sideUser/sideUserRouter");
const ThemeRouter = require("../src/theme/themeRouter");

const patientRouter = require('../src/patient/patientRouter');

const visitRouter = require('../src/visit/visitRouter');
const xrayRouter = require('../src/xray/xrayRouter');
const incomeRouter = require('../src/income/incomeRouter');
const diagnosisTypeRouter = require('../src/diagnosisTypes/diagnosisTypesRouter');
const treatmentTypeRouter = require('../src/treatmentTypes/treatmentTypesRouter');
const transactionRouter = require('../src/transaction/transactionRouter');


const {apiStart} = require('../src/shared/apiStart');
const DiagnosisTemplateRouter = require('../src/diagnosisTemplate/diagnosisTemplateRouter');
const TestRouter = require('../src/tests/testRouter');

const whatsappRouter = require('../src/whatsapp-api/whatsappRouter');
const hospitalRouter = require('../src/hospital/hospitalRouter');
module.exports = (app) => {
  // app.use('/generic',  genericRouter);
 
app.use(apiStart+'/users', users);


app.use(apiStart+'/patient', patientRouter);
app.use(apiStart+'/diagnosis-template', DiagnosisTemplateRouter);
app.use(apiStart+'/test', TestRouter);
app.use(apiStart+'/income', incomeRouter);
app.use(apiStart+'/xray', xrayRouter);
app.use(apiStart+'/transaction', transactionRouter);
app.use(apiStart+'/diagnosistypes', diagnosisTypeRouter);
app.use(apiStart+'/treatmenttypes', treatmentTypeRouter);

app.use(apiStart+'/visit', visitRouter);
app.use(apiStart+'/whatsapp', whatsappRouter);
app.use(apiStart+'/hospital', hospitalRouter);
app.use(apiStart+'/count', totalCountRouter);
app.use(apiStart+"/sideusers",sideUserRouter)
app.use(apiStart+"/theme",ThemeRouter)
 
  // app.use('/users', validateAuth.checkIfAuthenticated, getData.getGeoip, users);
  app.use('*', (req, res) => {
    // res.send('Not found!@@@!!');
    console.log("re.subdomain ", req.subdomain)
   
      res.sendFile(path.join(__dirname + "/../public/index.html"))
    
   
  });
};
