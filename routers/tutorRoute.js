require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const Tutors = require("../models/TutorsSchema");
const Parents = require("../models/ParentsSchema");

const auth = require("../middleware/auth");
const { hash } = require("bcrypt");

//Tutors-REGISTRATION
router.put("/registration", async (req, res) => {
  console.log("accessing tutor reg endpoint");
  try {
    const user = await Tutors.findOne({ email: req.body.email });
    if (user) {
      return res
        .status(400)
        .json({ status: "error", message: "duplicate email/username" });
    }
    const hash = await bcrypt.hash(req.body.password, 12);
    const createdTutor = await Tutors.create({
      email: req.body.email,
      hash,
      gender: req.body.gender,
      name: req.body.name,
      edulevel: req.body.edulevel,
      phone: req.body.phone,
      address: req.body.address,
      // appliedJobId: 9
    });
    console.log("created user", createdTutor);
    res.json({ status: "ok", message: "user created" });
  } catch (error) {
    console.log("PUT /create", error);
    res.status(400).json({ status: "error", message: "an error has occurred" });
  }
});

//TUTOR LOGIN
router.post("/login", async (req, res) => {
  try {
    const tutor = await Tutors.findOne({ email: req.body.email });
    if (!tutor) {
      return res
        .status(400)
        .json({ status: "error", message: "not authorised" });
    }

    const result = await bcrypt.compare(req.body.password, tutor.hash);
    if (!result) {
      console.log("username or password error");
      return res.status(401).json({ status: "error", message: "login failed" });
    }

    const payload = {
      id: tutor._id,
      email: tutor.email,
      role: tutor.role,
    };

    const access = jwt.sign(payload, process.env.ACCESS_SECRET, {
      expiresIn: "20m",
      jwtid: uuidv4(),
    });

    const refresh = jwt.sign(payload, process.env.REFRESH_SECRET, {
      expiresIn: "30d",
      jwtid: uuidv4(),
    });

    const response = { access, refresh };

    res.json(response);
  } catch (error) {
    console.log("POST /login", error);
    res.status(400).json({ status: "error", message: "login failed" });
  }
});

//TUTOR REFRESH TOKEN
router.post("/refresh", (req, res) => {
  try {
    const decoded = jwt.verify(req.body.refresh, process.env.REFRESH_SECRET);
    console.log(decoded);

    const payload = {
      id: decoded._id,
      email: decoded.email,
      role: decoded.role,
    };

    const access = jwt.sign(payload, process.env.ACCESS_SECRET, {
      expiresIn: "20m",
      jwtid: uuidv4(),
    });

    const response = { access };
    res.json(response);
  } catch (error) {
    console.log("POST/ refresh", error);
    res.status(401).json({
      status: "error",
      message: "unauthorised",
    });
  }
});

//GET OLD PROFILE (JUST ADDED)
router.get("/registration", auth, async (req, res) => {
  try {
    console.log(req.decoded);
    const getProfile = await Tutors.findOne(
      { email: req.decoded.email },
      {},
      { new: true }
    );
    res.json(getProfile);
  } catch (error) {
    console.log("POST/ refresh", error);
    res.status(401).json({
      status: "error",
      message: "update profile not successful",
    });
  }
});

//UPDATE PROFILE
router.patch("/registration", auth, async (req, res) => {
  try {
    console.log(req.decoded);
    const user = await Tutors.findOne({ email: req.decoded.email }); //because this is mongoose

    //findoneandupdate returns me the profile of the previous profile, to return new one, {new:true}
    const updateProfile = await Tutors.findOneAndUpdate(
      { email: req.decoded.email },
      {
        $set: {
          gender: req.body.gender || user.gender,
          name: req.body.name || user.name,
          edulevel: req.body.edulevel || user.edulevel,
          phone: req.body.phone || user.contact.phone,
          address: req.body.address || user.contact.address,
        },
      },

      { new: true }
    );
    res.json(updateProfile);
  } catch (error) {
    console.log("POST/ refresh", error);
    res.status(401).json({
      status: "error",
      message: "update profile not successful",
    });
  }
});

// model.find('genre': {"$elemMatch": {name: "scifi", selected: true} })

//READ AVAILABLE JOBS
router.get("/assignments", auth, async (req, res) => {
  try {
    const createdJobList = await Parents.find({
      assignments: { $elemMatch: { availability: { $eq: true } } },
    });
    // console.log(createdJobList);

    if (createdJobList.length > 0) {
      // send only the assignments that are true:
      const assignments = [];
      createdJobList.forEach((element) => {
        // go to every assignment object straight away
        const assign = element.assignments;

        // for of loop to check if availability is true
        for (const item of assign) {
          // console.log(item)
          if (item.availability === true) assignments.push(item);
        }
        // console.log(assignments);
      });

      res.status(200).json({ assignments });
    } else {
      res.json({ status: "warning", message: "no data found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", message: "error has occurred" });
  }
});

// router.get("/jobs", auth, async (req, res) => {
//   try {
//     // const filter = { assignments: { $elemMatch: { availability: true } } };
//     // const jobs = await Parents.aggregate([{ $match: filter }]);
//     const jobs = await Parents.find({}, { assignments: 1, _id: 0 });
//     console.log(jobs);

//     res.json(jobs);
//   } catch (error) {
//     res.status(401).json({
//       status: "error",
//       message: "can't find jobs",
//     });
//   }
// });

//APPLY JOB
router.patch("/applied", auth, async (req, res) => {
  console.log(`accessing PATCH applied endpoint`);
  console.log(req.body.parentid);

  try {
    const jobs = await Parents.findOneAndUpdate(
      { "assignments._id": req.body.parentid },
      {
        $set: {
          "assignments.$.tutorsApplied": req.decoded.email,
        },
      },
      { new: true }
    );
    // console.log(jobs);
    // console.log(req.decoded.id);

    const addApplied = await Tutors.findOneAndUpdate(
      { email: req.decoded.email },
      { $set: { jobsApplied: req.body.parentid } },
      { new: true }
    );
    // console.log(addApplied);
    res.status(200).json({ status: "ok", message: "applied!" });
    // res.json(addApplied);
  } catch (error) {
    console.log(error);
    res.status(401).json({
      status: "error",
      message: "can't update job",
    });
  }
});

//READ APPLIED JOB ID
router.get("/applied/jobs", auth, async (req, res) => {
  console.log("accessing GET applied jobs");
  try {
    const appliedIds = await Tutors.find(
      { email: req.decoded.email },
      { jobsApplied: 1, _id: 0 }
    );
    // console.log(appliedIds);
    // const getAppliedJobs = await Tutors.findOne(
    //   { email: req.decoded.email },
    //   {},
    //   { new: true }
    // );
    res.json(appliedIds);
  } catch (error) {
    console.log("error", error);
    res.status(401).json({
      status: "error",
      message: "apply jobs not successful",
    });
  }
});
//GET APPLIED JOB ID
router.post("/applied/allJobs", auth, async (req, res) => {
  console.log(`accessing POST applied/allJobs endpoint`);
  console.log(req.body.appliedId);

  try {
    console.log(req.body.appliedId);
    const getJobs = await Parents.find(
      { id: req.body.appliedId },
      { assignments: 1 }
    );
    console.log(getJobs);
    // const getAppliedJobs = await Tutors.findOne(
    //   { email: req.decoded.email },
    //   {},
    //   { new: true }
    // );
    res.json(getJobs);
  } catch (error) {
    console.log("error", error);
    res.status(401).json({
      status: "error",
      message: "apply jobs not successful",
    });
  }
});

//DELETE APPLIED JOBS
// router.patch("tutor/applied", auth, async (req, res) => {});

module.exports = router;
