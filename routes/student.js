
const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const catchAsync = require ("../utils/catchAsync");
const {requireLogin,isAdmin,validateSubject,isTeacher,validateAssignFromTeacher} = require("../middleware");
const subject = require("../controllers/subject");
const { func } = require("joi");
const bluebird = require('bluebird');



const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'new_icarus_db',
    multipleStatements:true,
    Promise:bluebird
});

const pool = mysql.createPool({host:'localhost', user: 'root', database: 'new_icarus_db'});



connection.connect(function(err){

    if(err) 
        throw err;
});


//route για την εμφάνιση της φόρμας για την δήλωση μαθημάτων απο τον χρήστη - φοιτητή
router.get("/formStatement",async(req,res)=>{
    const promisePool = connection.promise();
    //Εύρεση των διδασκαλιών που για τα μαθήματα που έχει δηλώσει ο χρήστης
    const [teachings,fiels] = await promisePool.query("SELECT * FROM Teaching");
    
        connection.query("SELECT * FROM Subject",(err,subjects)=>{


            if(err) throw err;
            res.render("students/statement",{subjects,teachings});

        })

        


})

//route για την δημιουργία νές δήλωσης μαθημάτων
// το συγκεκριμένο ρουτε εκτελείται μόλις ο φοιτητής επιλέξει το κουμπί δήλωση μαθημάτων
router.post("/createNewStatement",async(req,res)=>{


    //let subj = [...new Set(req.body.subj)];
    const AM = req.session.currentStudent.AM;

       
        let uniqueIds = req.body.Subject_id;


        //δήλωση ενός μαθήματος
        if(uniqueIds.length === 36)
        {
           
            const promisePool = connection.promise();
            //εδώ θα γίνει η αποθήκευση της δήλωσης που θα δημιουργηθεί σε λίγο


             //Εύρεση των διδασκαλιών που για τα μαθήματα που έχει δηλώσει ο χρήστης
             const [teachings,fiels] = await promisePool.query("SELECT * FROM Teaching WHERE Subject_id IN (?)",[uniqueIds]);
            
             //ευρεση των μαθημάτων που δήλωσε ο χρήστης 
             const [subject,fields] = await promisePool.query("SELECT * FROM Subject WHERE Subject_id IN (?)",[uniqueIds]);

             //εισαγωγή της δήλωσης που δημιουργησε ο χρήστης στην Β.Δ.
             let [state,fi] = await promisePool.query("INSERT INTO Statement(Teaching_id,AM) VALUES(?,?)",[teachings[0].Teaching_id,AM]);

             //Εύρεση της δήλωσης για την εμφάνιση της στο χρήστη
             const [states,fiel] = await promisePool.query("SELECT * FROM Statement WHERE AM = ?",[AM]);

             //ανανέωση της κατάστασης της δήλωσης του φοιτητή
            const [stud,cosl] = await promisePool.query("UPDATE University_Student SET StatementStatus = ? WHERE AM = ?",["partially",AM]);
            req.session.currentStudent.StatementStatus = "partially";
            //ευρεση του χρήστη και αποθήκευση του cookie για ανανέωση της καινούργιας κατάστασης
            const [stude,r]=await promisePool.query("SELECT * FROM  University_Student WHERE AM = ?",[AM]);
            req.session.currentStudent = stude[0];
     


             //πηγαίνει στον χρήστη στα μαθήματα που έχει δηλώσει
             res.render("students/subjectsStatement",{subject,states,teachings});
             

           

            


        }

        else
        {
            const promisePool = connection.promise();
            const [subject,fields] = await promisePool.query("SELECT * FROM Subject WHERE Subject_id IN (?)",[uniqueIds]);

           

            //Προσθήκη των κλειδιών των μαθημάτων σε έναν πίνακα για να γίνει μετά η αντίστοιχη αναζήτηση στην β.δ.
            let subIds=[];
            for(let i=0; i<subject.length; i++)
            {
                subIds[i] = subject[i].Subject_id;
            }

            //Εύρεση των διδασκαλιών που για τα μαθήματα που έχει δηλώσει ο χρήστης
            const [teachings,fiels] = await promisePool.query("SELECT * FROM Teaching WHERE Subject_id IN (?)",[subIds]);

            //Προσθήκη των κλειδιών των διδασκαλιών σε έναν πίνακα για να γίνει μετά η αντίστοιχη προσθήκη στην δήλωση στην β.δ.
            let teachingIds =[];
            for(let i=0; i<teachings.length; i++)
            {
                teachingIds[i] = teachings[i].Teaching_id;
            }

            let [statement,fiedls] =["",""];
            for(let i=0; i< teachingIds.length; i++)
            {

                 [statement,fiedls] = await promisePool.query("INSERT INTO Statement(Teaching_id,AM) VALUES(?,?)",[teachingIds[i],AM]);

            }

             //Εύρεση των δήλωσης που για τα μαθήματα που έχει δηλώσει ο χρήστης
             const [states,col] = await promisePool.query("SELECT * FROM Statement WHERE AM = ?",[AM]);

            //ανανέωση της κατάστασης της δήλωσης του φοιτητή
            const [stud,cosl] = await promisePool.query("UPDATE University_Student SET StatementStatus = ? WHERE AM = ?",["partially",AM]);
            req.session.currentStudent.StatementStatus = "partially";
            //ευρεση του χρήστη και αποθήκευση του cookie για ανανέωση της καινούργιας κατάστασης
            const [stude,r]=await promisePool.query("SELECT * FROM  University_Student WHERE AM = ?",[AM]);
            req.session.currentStudent = stude[0];


            //πηγαίνει στον χρήστη στα μαθήματα που έχει δηλώσει
            res.render("students/subjectsStatement",{subject,states,teachings});


        }

        


      
  









  
})



//route για μια συγκεκριμένη δήλωση του φοιτητή
// εκτελείται είτε αφού ο χρήσστης δηλώσει επιτυχώς κάποιο/α μαθήματα είτε αφού τα έχει δηλώσει και θέλει να τα δεί
router.get("/subjectsStatement",async(req,res)=>{
    
    //τρέχον φοιτητής
    const AM = req.session.currentStudent.AM;
    const student =req.session.currentStudent;
    const promisePool = connection.promise();

    //Εύρεση των δήλωσης που για τα μαθήματα που έχει δηλώσει ο χρήστης
    const [states,col] = await promisePool.query("SELECT * FROM Statement WHERE AM = ?",[student.AM]);


    console.log(states);
    //Προσθήκη των κλειδιών των διδασκαλιών σε έναν πίνακα για να γίνει μετά η αντίστοιχη προσθήκη στην δήλωση στην β.δ.
    let teachingIds =[];
    for(let i=0; i<states.length; i++)
    {
        teachingIds[i] = states[i].Teaching_id;
    }

    console.log(teachingIds);

    //Εύρεση των διδασκαλιών που για τα μαθήματα που έχει δηλώσει ο χρήστης
    const [teachings,fiels] = await promisePool.query("SELECT * FROM Teaching WHERE Teaching_id IN (?)",[teachingIds]);
    

    //Προσθήκη των κλειδιών των μαθημάτων σε έναν πίνακα για να γίνει μετά η αντίστοιχη προσθήκη στην δήλωση στην β.δ.
    let subjectIds =[];
    for(let i=0; i<teachings.length; i++)
    {
        subjectIds[i] = teachings[i].Subject_id;
    }

    //Εύρεση των μαθημάτων που για τα μαθήματα που έχει δηλώσει ο χρήστης
    const [subject,colum] = await promisePool.query("SELECT * FROM Subject WHERE Subject_id IN (?)",[subjectIds]);
    
    //πηγαίνει στον χρήστη στα μαθήματα που έχει δηλώσει
    res.render("students/subjectsStatement",{subject,states,teachings});

})

//εμφάνιση της φόρμας για την δημιουργία νέας φόρμας και αντικατάστασης με την παλιά
router.get("/getEditStatementForm",async(req,res)=>{

    //τρέχον φοιτητής
    const student = req.session.currentStudent;
    const promisePool = connection.promise();

    //Εύρεση των δήλωσης που για τα μαθήματα που έχει δηλώσει ο χρήστης
    const [states,cosl] = await promisePool.query("SELECT * FROM Statement WHERE AM = ?",[student.AM]);

    //Εύρεση όλων των διδασκαλιών 
    const [teachings,fiels] = await promisePool.query("SELECT * FROM Teaching ");

    //Εύρεση όλων των μαθημάτων 
    const [subjects,fields] = await promisePool.query("SELECT * FROM Subject ");

    //Εύρεση των δήλωσης που για τα μαθήματα που έχει δηλώσει ο χρήστης
    const [studentStates,col] = await promisePool.query("SELECT * FROM Statement WHERE AM = ?",[student.AM]);

    //Προσθήκη των κλειδιών των διδασκαλιών σε έναν πίνακα για να γίνει μετά η αντίστοιχη προσθήκη στην δήλωση στην β.δ.
    let teachingIds =[];
    for(let i=0; i<studentStates.length; i++)
    {
        teachingIds[i] = studentStates[i].Teaching_id;
    }

    //Εύρεση των διδασκαλιών που για τα μαθήματα που έχει δηλώσει ο χρήστης
    const [studentTeachings,fielss] = await promisePool.query("SELECT * FROM Teaching WHERE Teaching_id IN (?)",[teachingIds]);

    //Προσθήκη των κλειδιών των μαθημάτων σε έναν πίνακα για να γίνει μετά η αντίστοιχη προσθήκη στην δήλωση στην β.δ.
    let subjectIds =[];
    for(let i=0; i<studentTeachings.length; i++)
    {
        subjectIds[i] = studentTeachings[i].Subject_id;
    }

    //Εύρεση των μαθημάτων που για τα μαθήματα που έχει δηλώσει ο χρήστης
    const [studentSubjects,colum] = await promisePool.query("SELECT * FROM Subject WHERE Subject_id IN (?)",[subjectIds]);
    

    //μας πηγαίνει στην φόρμα για την τροποποίηση μιας δήλωσης
    res.render("students/statementEditForm",{subjects,teachings,studentTeachings});
})


//route ποθ θα εκτελείται μόλις ένας φοιτητής επιλέξει να κάνει ανανέωση της δήλωσης του με το κουμπί ενημέρωση
router.post("/editNewStatement",async(req,res)=>{

    //τρέχον φοιτητής
    const student = req.session.currentStudent;

    const promisePool = connection.promise();

    connection.query("DELETE FROM Statement WHERE AM = ?",[student.AM]);

    //ανανέωση της κατάστασης της δήλωσης του φοιτητή
    connection.query("UPDATE University_Student SET StatementStatus = ? WHERE AM = ?",[null,student.AM]);

    let uniqueIds = req.body.Subject_id;


    //δήλωση ενός μαθήματος
    if(uniqueIds.length === 36)
    {
       
        const promisePool = connection.promise();
        //εδώ θα γίνει η αποθήκευση της δήλωσης που θα δημιουργηθεί σε λίγο


         //Εύρεση των διδασκαλιών που για τα μαθήματα που έχει δηλώσει ο χρήστης
         const [teachings,fiels] = await promisePool.query("SELECT * FROM Teaching WHERE Subject_id IN (?)",[uniqueIds]);
        
         //ευρεση των μαθημάτων που δήλωσε ο χρήστης 
         const [subject,fields] = await promisePool.query("SELECT * FROM Subject WHERE Subject_id IN (?)",[uniqueIds]);

         //εισαγωγή της δήλωσης που δημιουργησε ο χρήστης στην Β.Δ.
         let [state,fi] = await promisePool.query("INSERT INTO Statement(Teaching_id,AM) VALUES(?,?)",[teachings[0].Teaching_id,student.AM]);

         //Εύρεση της δήλωσης για την εμφάνιση της στο χρήστη
         const [states,fiel] = await promisePool.query("SELECT * FROM Statement WHERE AM = ?",[student.AM]);

         //ανανέωση της κατάστασης της δήλωσης του φοιτητή
         const [stud,cosl] = await promisePool.query("UPDATE University_Student SET StatementStatus = ? WHERE AM = ?",["partially",student.AM]);
         req.session.currentStudent.StatementStatus = "partially";
         //ευρεση του χρήστη και αποθήκευση του cookie για ανανέωση της καινούργιας κατάστασης
         const [stude,r]=await promisePool.query("SELECT * FROM  University_Student WHERE AM = ?",[student.AM]);
         req.session.currentStudent = stude[0];

         //πηγαίνει στον χρήστη στα μαθήματα που έχει δηλώσει
         res.render("students/subjectsStatement",{subject,states,teachings});

       

        


    }

    else
    {
        const promisePool = connection.promise();
        const [subject,fields] = await promisePool.query("SELECT * FROM Subject WHERE Subject_id IN (?)",[uniqueIds]);

       

        //Προσθήκη των κλειδιών των μαθημάτων σε έναν πίνακα για να γίνει μετά η αντίστοιχη αναζήτηση στην β.δ.
        let subIds=[];
        for(let i=0; i<subject.length; i++)
        {
            subIds[i] = subject[i].Subject_id;
        }

        //Εύρεση των διδασκαλιών που για τα μαθήματα που έχει δηλώσει ο χρήστης
        const [teachings,fiels] = await promisePool.query("SELECT * FROM Teaching WHERE Subject_id IN (?)",[subIds]);

        //Προσθήκη των κλειδιών των διδασκαλιών σε έναν πίνακα για να γίνει μετά η αντίστοιχη προσθήκη στην δήλωση στην β.δ.
        let teachingIds =[];
        for(let i=0; i<teachings.length; i++)
        {
            teachingIds[i] = teachings[i].Teaching_id;
        }

        let [statement,fiedls] =["",""];
        for(let i=0; i< teachingIds.length; i++)
        {

             [statement,fiedls] = await promisePool.query("INSERT INTO Statement(Teaching_id,AM) VALUES(?,?)",[teachingIds[i],student.AM]);

        }

         //Εύρεση των δήλωσης που για τα μαθήματα που έχει δηλώσει ο χρήστης
         const [states,col] = await promisePool.query("SELECT * FROM Statement WHERE AM = ?",[student.AM]);

         //ανανέωση της κατάστασης της δήλωσης του φοιτητή
         const [stud,cosl] = await promisePool.query("UPDATE University_Student SET StatementStatus = ? WHERE AM = ?",["partially",student.AM]);
         req.session.currentStudent.StatementStatus = "partially";
         //ευρεση του χρήστη και αποθήκευση του cookie για ανανέωση της καινούργιας κατάστασης
         const [stude,r]=await promisePool.query("SELECT * FROM  University_Student WHERE AM = ?",[student.AM]);
         req.session.currentStudent = stude[0];


        //πηγαίνει στον χρήστη στα μαθήματα που έχει δηλώσει
        res.render("students/subjectsStatement",{subject,states,teachings});


    }




    
})

//ρουτε για την οριστική υποβολή δήλωσης μαθημάτων μετά το πέρας της οποίας δεν γίνεται καποιυ είδους τροποποίηση η αλλαγή- δημιουργία νέας
router.get("/statemenFinalization",async(req,res)=>{

    //τρέχον φοιτητής
    const student = req.session.currentStudent;

    const promisePool = connection.promise();

    //ανανέωση της κατάστασης της δήλωσης του φοιτητή
    connection.query("UPDATE University_Student SET StatementStatus = ? WHERE AM = ?",["finalization",student.AM]);

    //ανανέωση της κατάστασης της δήλωσης του φοιτητή
    const [stud,cosl] = await promisePool.query("UPDATE University_Student SET StatementStatus = ? WHERE AM = ?",["finalization",student.AM]);
    req.session.currentStudent.StatementStatus = "finalization";
    //ευρεση του χρήστη και αποθήκευση του cookie για ανανέωση της καινούργιας κατάστασης
    const [stude,r]=await promisePool.query("SELECT * FROM  University_Student WHERE AM = ?",[student.AM]);
    req.session.currentStudent = stude[0];

    req.flash("success","Οριστική υποβολή δήλωσης!");
    res.redirect("/subjects");

})

module.exports = router;
