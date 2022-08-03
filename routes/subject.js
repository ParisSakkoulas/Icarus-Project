
const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const catchAsync = require ("../utils/catchAsync");
const {requireLogin,isAdmin,validateSubject,isTeacher,validateAssignFromTeacher} = require("../middleware");
const subject = require("../controllers/subject");


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

//\\\\\\\\\\\\\\\\\\ΚΥΡΙΩΣ ΤΑ ΣΥΓΚΕΚΡΙΜΕΝΑ ROUTES ΑΦΟΡΟΥΝ ΤΟ ΧΡΗΣΤΗ ADMIN \\\\\\\\\\\




//Μας πηγαίνει στην σελίδα που βρίσκονται όλα τα μαθήματα
// την λειτουργία την αναλμβάνει η συνάρτηση middleware getAllSubject
router.get("/",subject.getAllSubjects);

//Μας πηγαίνει στην φόρμα για την προσθήκη νέου μαθήματος
// Η form σαν action οδηγεί στο route /subjects το οποίο παίρνοντας(req.body.subject) τις παραμέτρους απο το url
// της αποθηκεύει στην Βάση
// την λειτουργία την αναλμβάνει η συνάρτηση middleware getNewForm
router.get("/new",requireLogin,isAdmin,subject.getNewForm);

//Αφού γίνει η προσθήκη των κατάληλων πεδίων στην φόρμα εκτελείται το συγκεκριμένο route 
// στο οποίο γίνεται η αποθήκευση του μαθήματος και η ανακατεύθυνση του χρήστη στη σελίδα για την προβολή ενός μαθήματος μόνο
// την λειτουργία την αναλμβάνει η συνάρτηση middleware createNewSubject
router.post("/",requireLogin,isAdmin,validateSubject,catchAsync(subject.createNewSubject));

//Μας πηγαίνει στην σελίδα οπου περιέχεται η φόρμα για την επεξεργασίας ενός μαθήματος
// την λειτουργία την αναλμβάνει η συνάρτηση middleware getEditForm
router.get("/:Id/edit",requireLogin,isAdmin,catchAsync(subject.getEditForm));

//Το παρακάτω route εκτελείται όταν ο  χρήστης επιλέξει το κουμπί επεξεργασίας τότε το λινκ που βρίσκεται 
// θα τον ανακατευθύνει στο συγκεκριμένο route το οποίο παίρνει το id και βρήσκει το μάθημα
// έπειτα ανακατευθύνει σε μια νες σελίδα όπου θα είναι η φόρμα για να γίνει η επεξεργασία του μαθήματος
// την λειτουργία την αναλμβάνει η συνάρτηση middleware editSubject
router.put("/:Subject_id",requireLogin,isAdmin,validateSubject,catchAsync(subject.editSubject));

//Μας πηγαίνει στην σελίδα που βρίσκεται ένα συγκεκριμένο μάθημα με βάση το id του
// την λειτουργία την αναλμβάνει η συνάρτηση middleware getSingleSubject
router.get("/:Subject_id",catchAsync(subject.getSingleSubject));

//Το παρακάτω route εκτελείται όταν ο χρήστης επιλέξει να διαγράψει ένα μάθημα(κουμπί) τότε η φόρμα που
// είναι γύρω απο το κουμπί διαγραφή κάνει ώς action το συγκεκριμένο route και εν συνεχεία το παρόν route
// μέσω του req.params παίρνει το id προς διαγραφεί το ψάχνει στην βάση και ανακατευθύνει τον χρήστη στη λίστα όλων των μαθημάτων
// την λειτουργία την αναλμβάνει η συνάρτηση middleware deleteSubject
router.get("/delete/:Subject_id",requireLogin,isAdmin,catchAsync(subject.deleteSubject));

//Το παρακάτω route μας εκτελείται όταν ο χρήστης επιλέξει το κουμπί ανάθεσης μαθήματος σε κάποιον διδάσκοντα
// μας εμφανίζει μια φόρμα για την ανάθεση μαθήματος
router.get("/:Id/assignSubject",requireLogin,isAdmin,catchAsync(subject.getFormassignSubject));


//Το παρακάτω route ενεργοποιείται αφού ο χρήστης συμπληρώσει όλα τα πεδία της φόρμας που αφορά την ανάθεση ενός μαθήματος
// την λειτουργία την αναλαμβάνει η συνάρτηση middleware assignSubject
router.post("/assignSubject",requireLogin,isAdmin,catchAsync(subject.assignSubject));


//Το παρακάτω route θα εκτελείται όταν ο χρήστη επιλέξη υποβολή τρόπου βαθμολόγησης και θα μας εμφανίζει την φόρμα για τα βάρη και τους περιορισμούς
router.get("/:Id/assignWeight",requireLogin,isTeacher,subject.getFormassignWeigthSubject);

//Το παρακάτω route ενεργοποιείται αφού ο χρήστης συμπληρώσει όλα τα πεδία της φόρμας που αφορά τον τρόπο βαθμολόγησης
//Στην ουσία το συγκεκριμένο route είναι ένας είδος post - put request εφόσον ο καθηγητής μπορεί να τροποποιήση ένα μάθημα μόνο αν του έχει ανατεθεί
router.put("/assignSubject/:Id",requireLogin,isTeacher,catchAsync(subject.assignWeight));

// Το παρακάτω route εκτελείται όταν ο admin απο την σελίδα για ένα ξεχωριστό μάθημα επιλέξει ανανέωση τρόπου βαθμολόγησης
// στην ουσία μας παρέχει τη φόρμα για την ανανέωση του τρόπου βαθμολόγησης ενός μαθήματος
router.get("/:Id/assignWeightAdmin",requireLogin,isAdmin,catchAsync(subject.getFormassignWeigthSubjectAdmin));

// Το παρακάτω route εκτελείται όταν ο admin απο την σελίδα για ένα ξεχωριστό μάθημα επιλέξει ανανέωση τρόπου βαθμολόγησης
// στην ουσία μας παρέχει τη φόρμα για την ανανέωση του τρόπου βαθμολόγησης ενός μαθήματος
router.put("/assignWeightAdmin/:Id",requireLogin,isAdmin,catchAsync(subject.updateWeigthSubjectAdmin));

// Το παρακάτω route εκτελείται όταν ο καθηγητής απο την σελίδα για ένα ξεχωριστό μάθημα επιλέξει ανανέωση τρόπου βαθμολόγησης και στην συνέχεια πατήσει οριστική υποβολή
// μετά την εκτέλεση του συγκεκριμένου royte δεν μπορεί να υπάρξει τροποποίηση όσων αφορά την διαχείριση μιας διδασκαλίας
router.get("/updateFinalWeigthSubject/:Id",requireLogin,isTeacher,catchAsync(subject.updateFinalWeigthSubject));


// Το παρακάτω route εκτελείται όταν ο καθηγητής απο την σελίδα για ένα ξεχωριστό μάθημα επιλέξει ανανέωση τρόπου βαθμολόγησης και στην συνέχεια πατήσει οριστική υποβολή
// μετά την εκτέλεση του συγκεκριμένου royte δεν μπορεί να υπάρξει τροποποίηση όσων αφορά την διαχείριση μιας διδασκαλίας
router.get("/updateFinalWeigthSubjectAdmin/:Id",requireLogin,isAdmin,catchAsync(subject.updateFinalWeigthSubjectAdmin));

module.exports = router;

