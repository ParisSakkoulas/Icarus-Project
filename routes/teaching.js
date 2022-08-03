const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const catchAsync = require ("../utils/catchAsync");
const {requireLogin,isAdmin,isTeacherOrAdmin,isTeacher,validateAssignFromTeacher} = require("../middleware");
const teaching = require("../controllers/teachings");



const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'new_icarus_db'
});

connection.connect(function(err){

    if(err) 
        throw err;
});

//route για την εισαγωγή βαθμολογιών απο τον καθηγητή ενός μαθήματος για φοιτητές που έχουν δηλώσει το μάθημα
router.get("/getFormForScoresSubject/:id",requireLogin,isTeacher,teaching.getFormForScoresSubject);

//route για την εισαγωγή βαθμολογιών απο τον καθηγητή ενός μαθήματος για φοιτητές που έχουν δηλώσει το μάθημα
router.post("/addNewScores",requireLogin,isTeacher,teaching.addNewScores);


//route για την εισαγωγή βαθμολογιών απο τον ADMIN ενός μαθήματος για φοιτητές που έχουν δηλώσει το μάθημα
router.get("/getFormForScoresSubjectAdmin/:id",requireLogin,isAdmin,teaching.getFormForScoresSubjectAdmin);

//route για την εισαγωγή βαθμολογιών απο τον ADMIN ενός μαθήματος για φοιτητές που έχουν δηλώσει το μάθημα
router.post("/addNewScoresAdmin",requireLogin,isAdmin,teaching.addNewScoresAdmin);
module.exports = router;
