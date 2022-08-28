require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const Parents = require("../models/ParentsSchema");
const Tutors = require("../models/TutorsSchema");

const auth = require("../middleware/auth");
const { hash } = require("bcrypt");

//Parents REGISTRATION (done)
router.put("/registration", async (req, res) => {
  try {
    const user = await Parents.findOne({ email: req.body.email });
    if (user) {
      return res
        .status(400)
        .json({ status: "error", message: "duplicate email/username" });
    }
    const hash = await bcrypt.hash(req.body.password, 12);
    const createdParent = await Parents.create({
      email: req.body.email,
      hash,
      parentName: req.body.parentName,
      phone: req.body.phone,
      address: req.body.address,
      role: undefined,
    });
    console.log("created user", createdParent);
    res.json({ status: "ok", message: "user created" });
  } catch (error) {
    console.log("PUT /create", error);
    res.status(400).json({ status: "error", message: "an error has occurred" });
  }
});

//Parent-LOGIN (done)
router.post("/login", async (req, res) => {
  try {
    const parent = await Parents.findOne({ email: req.body.email });
    if (!parent) {
      return res
        .status(400)
        .json({ status: "error", message: "not authorised" });
    }

    const result = await bcrypt.compare(req.body.password, parent.hash);
    if (!result) {
      console.log("username or password error");
      return res.status(401).json({ status: "error", message: "login failed" });
    }

    const payload = {
      id: parent._id,
      email: parent.email,
      role: parent.role,
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

//PARENT REFRESH TOKEN (done)
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

//UPDATE (CREATE NEW ASSIGNMENT) (done)
router.patch("/create", auth, async (req, res) => {
  // console.log(req.decoded.email);
  // maybe throw in try {} catch () {}
  const createJob = await Parents.findOneAndUpdate(
    { email: req.decoded.email },
    {
      $push: {
        assignments: {
          childName: req.body.childName,
          level: req.body.level,
          subject: req.body.subject,
          duration: req.body.duration,
          frequency: req.body.frequency,
          days: req.body.days,
          rate: req.body.rate,
          parentid: req.decoded.id,
        },
      },
    },
    { new: true }
  );
  // console.log(createJob);
  res.json(createJob);
});


// For tutors: To show an array of assignment objects that have availability: true
// To show an array of assignment objects that have availability: true. Read all jobs.
router.get("/assignments", auth, async (req, res) => {
  console.log(`accessing get assignments endpoint`);
  try {
    const createdJobList = await Parents.find({
      assignments: { $elemMatch: { availability: { $eq: true } } },
    });
    console.log(createdJobList);

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
        console.log(assignments);
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

//UPDATE PERSONAL DETAILS (done)
//TUTORS WHO CLICKED APPLY
router.patch("/tutorApplied", (req, res) => {
  //jobID from Parents collection will be pushed/populate into Tutors collection appliedJobID array.
});

// READ ALL TUTORS WHO APPLIED -- Need to access Tutors collection to retrieve jobID
// router.post("/tutorsApplied/:id", auth, async (req, res) => {
// });

//UPDATE JOB ASSIGNMENT AVAILABLITY / true false, approving/rejecting application
router.patch("/availableJobs/approval", async (req, res) => {});

//DELETING JOB ASSIGNMENT
router.delete("/removeJob", auth, async (req, res) => {
  //req.body.id is the objectid from the assignment
  try {
    const testDel = await Parents.update(
      {},
      {
        $pull: {
          assignments: { _id: req.body.id },
        },
      },
      { new: true }
    );
    console.log(testDel);
    res.json({ status: "green", message: "deleted" });
  } catch (err) {
    res.status(401).json({ status: "error", message: "failed to delete" });
  }
});

//READ TUTORS WHO APPLIED
// router.get("/parent/tutorApplications", auth, async (req, res) => {
//   const tutorApps = await Tutors.find//({tutor application key});
// });

//READ FULL TUTOR PROFILE
//router.get("/parent/tutorProfileFull", ayth, async (req, res) => {
// });

//UPDATE PERSONAL DETAILS
router.patch("/registration", auth, async (req, res) => {
  try {
    const parentUser = await Parents.findOne({ email: req.decoded.email });
    if (!parentUser) {
      return res.status(400).json({ status: "error", message: "unauthorized" });
    }
    const updateParentProf = await Parents.findOneAndUpdate(
      { email: req.decoded.email },
      {
        $set: {
          email: req.body.email || parentUser.email,
          // make one for password in long term goal
          parentName: req.body.parentName || parentUser.parentName,
          phone: req.body.phone || parentUser.phone,
          address: req.body.address || parentUser.address,
        },
      },
      { new: true }
    );
    console.log("updated user", updateParentProf);
    res.json(updateParentProf);
  } catch (error) {
    console.log("PATCH /update", error);
    res
      .status(401)
      .json({ status: "error", message: "parent personal info update failed" });
  }
});

//READ JOBS CREATED BY PARENTS (done)
router.get("/created", auth, async (req, res) => {
  try {
    const assignmentList = await Parents.findOne(
      { email: req.decoded.email },
      { assignments: 1 }
    );
    console.log(assignmentList);
    res.json(assignmentList);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", message: "error has occurred" });
  }
});

//TUTORS WHO CLICKED APPLY
router.patch("/tutorApplied", (req, res) => {
  //jobID from Parents collection will be pushed/populate into Tutors collection appliedJobID array.
});

// READ ALL TUTORS WHO APPLIED -- Need to access Tutors collection to retrieve jobID
router.get("/tutorsApplied/:id", auth, async (req, res) => {
  console.log("accessing GET tutorsapplied endpoint");
  console.log(req.params.id);
  const tutorList = await Tutors.find({
    jobsApplied: req.params.id,
  });
  console.log(tutorList);
  res.json(tutorList);
});

//UPDATE JOB ASSIGNMENT AVAILABLITY / true false, approving/rejecting application
router.patch("/availableJobs/approval", async (req, res) => {
  console.log(req.body.jobID);
  res.json("ok")
  // const updateJobs = await Parents.findOneAndUpdate(
  //   { jobID: req.body.jobID },
  //   { availability: false }
  // );
  // res.json(updateJobs);
});

//DELETING JOB ASSIGNMENT
router.delete("/removeJob/:id", auth, async (req, res) => {
  //req.body.id is the objectid from the assignment
  try {
    const testDel = await Parents.update(
      {},
      {
        $pull: {
          assignments: { _id: req.params.id },
        },
      },
      { new: true }
    );
    console.log(testDel);
    res.json({ status: "green", message: "deleted" });
  } catch (err) {
    res.status(401).json({ status: "error", message: "failed to delete" });
  }
});

//READ TUTORS WHO APPLIED
// router.get("/parent/tutorApplications", auth, async (req, res) => {
//   const tutorApps = await Tutors.find//({tutor application key});
// });

//READ FULL TUTOR PROFILE
//router.get("/parent/tutorProfileFull", ayth, async (req, res) => {

// })

module.exports = router;
