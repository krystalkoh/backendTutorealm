// require("dotenv").config();

// const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const { v4: uuidv4 } = require("uuid");

// const router = express.Router();
// const Tutors = require("../models/TutorsSchema");
// const Parents = require("../models/ParentsSchema");

// const auth = require("../middleware/auth");
// const { hash } = require("bcrypt");

// //Tutors-REGISTRATION
// router.put("/tutor/registration", async (req, res) => {
//   try {
//     const user = await Tutors.findOne({ email: req.body.email });
//     if (user) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "duplicate email/username" });
//     }
//     const hash = await bcrypt.hash(req.body.password, 12);
//     const createdTutor = await Tutors.create({
//       email: req.body.email,
//       hash,
//       gender: req.body.gender,
//       name: req.body.name,
//       edulevel: req.body.edulevel,
//       phone: req.body.phone,
//       address: req.body.address,
//       // appliedJobId: 9
//     });
//     console.log("created user", createdTutor);
//     res.json({ status: "ok", message: "user created" });
//   } catch (error) {
//     console.log("PUT /create", error);
//     res.status(400).
//       json({ status: "error", message: "an error has occurred" });
//   }
// });

// //TUTOR LOGIN
// router.post("/tutor/login", async (req, res) => {
//   try {
//     const tutor = await Tutors.findOne({ email: req.body.email });
//     if (!tutor) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "not authorised" });
//     }

//     const result = await bcrypt.compare(req.body.password, tutor.hash);
//     if (!result) {
//       console.log("username or password error");
//       return res.status(401).json({ status: "error", message: "login failed" });
//     }

//     const payload = {
//       id: tutor._id,
//       email: tutor.email,
//       role: tutor.role,
//     };

//     const access = jwt.sign(payload, process.env.ACCESS_SECRET, {
//       expiresIn: "20m",
//       jwtid: uuidv4(),
//     });

//     const refresh = jwt.sign(payload, process.env.REFRESH_SECRET, {
//       expiresIn: "30d",
//       jwtid: uuidv4(),
//     });

//     const response = { access, refresh };

//     res.json(response);
//   } catch (error) {
//     console.log("POST /login", error);
//     res.status(400).json({ status: "error", message: "login failed" });
//   }
// });

// //TUTOR REFRESH TOKEN
// router.post("/tutor/refresh", (req, res) => {
//   try {
//     const decoded = jwt.verify(req.body.refresh, process.env.REFRESH_SECRET);
//     console.log(decoded);

//     const payload = {
//       id: decoded._id,
//       email: decoded.email,
//       role: decoded.role,
//     };

//     const access = jwt.sign(payload, process.env.ACCESS_SECRET, {
//       expiresIn: "20m",
//       jwtid: uuidv4(),
//     });

//     const response = { access };
//     res.json(response);
//   } catch (error) {
//     console.log("POST/ refresh", error);
//     res.status(401).json({
//       status: "error",
//       message: "unauthorised",
//     });
//   }
// });

// //READ AVAILABLE JOBS
// router.get("/jobs", auth, async (req, res) => {
//   try {
//     const jobs = await Parents.find({ availability: true });
//     res.json(jobs);
//   } catch (error) {
//     res.status(401).json({
//       status: "error",
//       message: "can't find jobs",
//     });
//   }
// });

// //UPDATE PROFILE
// router.patch("/tutor/registration", auth, async (req, res) => {
//   try {
//     console.log(req.decoded);
//     const user = await Tutors.findOne({ email: req.decoded.email }); //because this is mongoose

//     //findoneandupdate returns me the profile of the previous profile, to return new one, {new:true}
//     const updateProfile = await Tutors.findOneAndUpdate(
//       { email: req.decoded.email },
//       {
//         $set: {
//           email: req.body.email || user.email,
//           gender: req.body.gender || user.gender,
//           name: req.body.name || user.name,
//           edulevel: req.body.edulevel || user.edulevel,
//           contact: {
//             phone: req.body.contact.phone || user.contact.phone,
//             address: req.body.contact.address || user.contact.address,
//           },
//         },
//       },
//       { new: true }
//     );
//     res.json(updateProfile);
//   } catch (error) {
//     console.log("POST/ refresh", error);
//     res.status(401).json({
//       status: "error",
//       message: "update profile not successful",
//     });
//   }
// });

// //Job apply 
// router.put("/tutor/apply", auth, async (req, res) => {
//   const jobApply = await Tutors.aggregate(
//     {
//     $lookup: {
//       from: "Assignments",
//       localField: "name",
//       foreignField: "parentName",
//       as: "Assignment"
//     }
//   });
//   res.json(jobApply);
// });

// //UPDATE PASSWORD -- IF GOT TIME THEN DO
// // hash: bcrypt.hash(req.body.password, 12) || user.hash, //double check better to separate the password from updating the profile
// //needto double check this
// //   const hash = await bcrypt.hash(updateProfile.password, 12);
// //   const updateHash = await Tutors.updateOne(user.hash, hash || user.hash);

// // READ APPLIED JOBS
// // router.get("/tutor/applied", auth, async (req, res) => {
// //   //When the value of $exists operator is set to true, then this operator matches the document that contains the specified field(including the documents where the value of that field is null).
// //   const user = await Tutors.find();
// //   const applied = await Tutors.find({ jobCode: { $exists: true, $ne: [] } });
// //   res.json(applied);
// // });

// //DELETE APPLIED JOBS
// // router.patch("tutor/applied", auth, async (req, res) => {});

// // READ (protected)
// // router.get("/users", auth, async (req, res) => {
// //   const users = await User.find().select("username");
// //   res.json(users);
// // });

<<<<<<< HEAD
//EDITING JOB ASSIGNMENT PROPER
// router.patch("/availableJobs/edit", auth, async (req, res) => {
//   try {
//     const jobEdit = await Parents.findOne({ email: req.decoded.email });
//     const editJobs = await Parents.findOneAndUpdate(
//       { _id: "62d6532a898d27dc8df0df3f" },
//       {
//         $set: {
//           assignments: {
//             childName:
//               req.body.childName || jobEdit.assignments.childName,
=======
// module.exports = router;



//////////////////////////////
//other back up codes
//////////////////////////////

//EDITING JOB ASSIGNMENT PROPER
// router.patch("/availableJobs/edit", auth, async (req, res) => {
//     try {
//       const jobEdit = await Parents.findOne({ email: req.decoded.email });
//       const editJobs = await Parents.findOneAndUpdate(
//         { _id: "62d6532a898d27dc8df0df3f" },
//         {
//           $set: {
//             assignments: {
//               childName: req.body.childName || jobEdit.assignments.childName,
>>>>>>> 7b6775e1b7068e8292b0bac9b05c074307702e28
//               level: req.body.level || jobEdit.assignments.level,
//               subject: req.body.subject || jobEdit.assignments.subject,
//               duration: req.body.duration || jobEdit.assignments.duration,
//               frequency: req.body.frequency || jobEdit.assignments.frequency,
//               days: req.body.days || jobEdit.assignments.days,
<<<<<<< HEAD
//               rate: req.body.rate || jobEdit.assignments.rate
//           },
//         },
//       },
//       { new: true }
//     );
//     console.log("edit jobs", editJobs);
//     res.json({ status: "ok", message: "edit successful" });
//     res.json(editJobs);
//   } catch (error) {
//     console.log("PATCH /edit", error);
//     res.status(401).json({ status: "error", message: "edit unsuccessful" });
//   }
// });

// module.exports = router;
=======
//               rate: req.body.rate || jobEdit.assignments.rate,
//             },
//           },
//         },
//         { new: true }
//       );
//       console.log("edit jobs", editJobs);
//       res.json({ status: "ok", message: "edit successful" });
//       res.json(editJobs);
//     } catch (error) {
//       console.log("PATCH /edit", error);
//       res.status(401).json({ status: "error", message: "edit unsuccessful" });
//     }
//   });
>>>>>>> 7b6775e1b7068e8292b0bac9b05c074307702e28
