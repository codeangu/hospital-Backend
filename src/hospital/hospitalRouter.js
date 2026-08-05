const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const cors = require("../cors");
const User = require("../users/userModel");
const authenticate = require("../../middlewares/authenticate");
const { getHospitalId } = authenticate;

router.use(bodyParser.json());

router.options("*", cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
});

// Get hospital profile and its staff
router.get("/me", cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  const hospitalId = getHospitalId(req.user);
  if (!hospitalId) {
    return res.status(400).json({ success: false, message: "No hospital associated with this account" });
  }
  User.findById(hospitalId)
    .then(hospital => res.json(hospital))
    .catch(err => next(err));
});

// Get all staff for the authenticated hospital
router.get("/staff", cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  const hospitalId = getHospitalId(req.user);
  if (!hospitalId) {
    return res.status(400).json({ success: false, message: "No hospital associated with this account" });
  }
  User.find({ hospitalId: hospitalId })
    .select("-hash -salt")
    .then(staff => res.json(staff))
    .catch(err => next(err));
});

// Create staff member (doctor/reception) under the authenticated hospital
router.post("/staff", cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  const hospitalId = getHospitalId(req.user);
  if (!hospitalId) {
    return res.status(403).json({ success: false, message: "Only hospital accounts can create staff" });
  }

  User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
    if (err) {
      return res.status(500).json({ err });
    }
    if (req.body.name) user.name = req.body.name;
    if (req.body.role) user.role = req.body.role;
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.doctorIds) user.doctorIds = req.body.doctorIds;
    user.hospitalId = hospitalId;
    user.createdBy = req.user._id.toString();

    user.save((err, savedUser) => {
      if (err) {
        return res.status(500).json({ err });
      }
      res.status(200).json({ success: true, user: savedUser });
    });
  });
});

// Delete staff member (only hospital admin can do this)
router.delete("/staff/:userId", cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
  const hospitalId = getHospitalId(req.user);
  if (!hospitalId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }
  try {
    const staffMember = await User.findOne({ _id: req.params.userId, hospitalId: hospitalId });
    if (!staffMember) {
      return res.status(404).json({ success: false, message: "Staff member not found in your hospital" });
    }
    await User.findByIdAndRemove(req.params.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
