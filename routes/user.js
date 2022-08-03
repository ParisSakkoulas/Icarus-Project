const express = require("express");
const mysql = require("mysql2");
const router  = express.Router();
const bcrypt = require("bcrypt")
const catchAsync = require("../utils/catchAsync");
const session = require("express-session");
const {userSchema} = require("../schemas");
const ExpressError = require("../utils/ExpressError");
const {requireLogin}= require("../middleware");

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

//route για την εμφάνιση της φόρμας για εγγραφή ενός χρήστη στο σύστημα
router.get("/register",(req,res)=>{

    
    res.render("users/register");
});

//route για την εγγραφή ενός χρήστη στο σύστημα
router.post("/register",catchAsync(async (req,res)=>{

    const promisePool = connection.promise();

    const Username = req.body.Username;
    const hashedPassword = await bcrypt.hash(req.body.Password,10);

    //έλεγχος για τον ρόλο του χρήστη
    const Role = req.body.Role;

    //Δημιουργία του δικού μας admin
    //const hashedPassword2 = await bcrypt.hash("adminadmin",10);
   // connection.query("INSERT INTO User(Username,Password,Role) VALUES(?,?,?)",["adminadmin",hashedPassword2,"Admin"]);

   //Εύρεση χρηστών με ίδιο όνομα
   const [sameUser,cossdl] = await promisePool.query("SELECT * FROM User WHERE Username = ?",[Username]);

   //αν βρεθεί χρήστης με το ίδιο όνομα χρήστη κάνουμε ανακατεύθυνση στην σελίδα για εγγραφή στο σύστημα
    if (sameUser[0] && sameUser[0].Username === Username)
    {
        req.flash("error","Το όνομα χρήστη χρησιμοποιείται");
        res.redirect("/register");
    }

    //αλλιώς προχώρησε κανονικά στην εγγραφή του
    else
    {

    connection.query("INSERT INTO User(Username,Password,Role) VALUES(?,?,?)",[Username,hashedPassword,Role],(err,us)=>{

        
        if(err) throw err;

        //query για την ευρεση του χρήστη ώστε να γίνει η συσχέτιση με τον φοιτητή μέσω του id
     connection.query("SELECT * FROM User WHERE Username = ?",[Username],(err,useR)=>{

            if(err) throw err;

            //παίρνουμε το ιδ του χρήστη για να γίνιε η συσχέτιση
             const id = useR[0].Id;

             //καταχώρηση του τωρινού χρήστη στο session cookie
             req.session.currentUser = useR[0];
             

            // αν είναι φοιτητής θα γίνεται εγγραφή
             if(Role === "University_Student")
             {
                
                 var AM = Math.floor(10000000 + Math.random() * 90000000);
                 const Student_Name = req.body.Student_Name;
                 const Student_Surname = req.body.Student_Surname;
                 const Import_Year = req.body.Import_Year;


                 connection.query("INSERT INTO University_Student(AM,Student_Name,Student_Surname,Import_Year,User_id,StatementStatus) VALUES(?,?,?,?,?,?)",[AM,Student_Name,Student_Surname,Import_Year,id,"not"],(err,student)=>{
                 

                    if(err) 
                    {
                        //Είτε θα εμφανίζεται το μήνυματα ανεπιτυχούς εγγραφής είτε το erro μήνυμα
                        req.flash("error","Ανεπιτυχής Εγγραφή, Προσπαθήστε ξανά");
                        res.redirect("/register");
                    }

                    else
                    {

                        req.flash("success","Επιτυχής εγγραφή στο σύστημα!");

                        connection.query("SELECT * FROM University_Student WHERE User_id = ?",[id],(err,std)=>{

                            if(err) throw err;
                            req.session.user_id = id;
                            req.session.currentStudent = std[0];
                            res.redirect("/subjects");
                        })


                        
                    }
                    
                    
                 });        
             }
            

             // αν είναι καθηγητής θα γίνεται redirect σε μια ακόμη φόρμα για τα υπόλοιπα στοιχεία
              if(Role === "DEP_member")
             {

                
                 const Teacher_Name = req.body.Teacher_Name;
                 const Teacher_Surname = req.body.Teacher_Surname;
                 const Grade = req.body.Grade; 

                 console.log(Teacher_Name);


                 connection.query("INSERT INTO DEP_member(Teacher_Name,Teacher_Surname,Grade,User_id) VALUES(?,?,?,?)",[Teacher_Name,Teacher_Surname,Grade,id],(err,teach)=>{
                 
                    if(err) throw err;
                    req.flash("success","Επιτυχής εγγραφή στο σύστημα!");

                    connection.query("SELECT * FROM DEP_member WHERE User_id",[id],(err,teacher)=>{
                        req.session.user_id = id;
                        req.session.user = teacher[0];
                        req.session.TeacherName = teacher[0].Teacher_Name;
                        req.session.currentTeacher = teacher[0];
                        res.redirect("/subjects");

                    })
                    



                 }); 
             }            
        });
        
    });
}

}));

//router για την εμφάνιση της φόρμας που θα γίνεται η σύνδεση ενός χρήστη
router.get("/login",(req,res)=>{
    res.render("users/login");
});

//router για την την εγγραφή ενός χρήστη στο σύστημα
router.post("/login",  (req,res)=>{

    const Username = req.body.Username;
    const Password = req.body.Password;

    
    connection.query("SELECT * FROM User WHERE Username = ?",[Username],async(er,user)=>{
       
        if(er) throw er;

        //σε περίπτωση που δεν βρεθεί ο χρήστης
        if(user.length <=0 )
        {
            req.flash("error","Παρακαλούμε εισάγεται σωστό κωδικό και όνομα χρήστη");
            res.redirect("/login");
        }

        else 
        {

            //σύγκριση του εισαγώμενου κωδικού με αυτόν που είχαμε αποθηκεύσει σαν hashed κατα την εγγραφή
            const validPassword = await bcrypt.compare(Password,user[0].Password);//boolean value 
            
            //αν επιστρέψει true δλδ ο κωδικό είναι ίδιος τότε εμφανίζει αντίστοιχο μήνυμα και ανακατευθύνει τον χρήστη σε άλλη σελίδα
            if(validPassword)
            {

                
                req.flash("success","Καλώς ήρθατε!");
                req.session.user_id = user[0].Id;
                req.session.currentUser = user[0];

            
                if(user[0].Role === "DEP_member")
                connection.query("SELECT * FROM DEP_Member WHERE User_id = ?",[user[0].Id],(err,teacher)=>{

                    //if(er) throw er;
                    req.session.TeacherName = teacher[0].Teacher_Name;
                    req.session.currentTeacher = teacher[0];
                    res.redirect("/subjects");
                   
                })

                else if(user[0].Role === "University_Student")
                {
                    connection.query("SELECT * FROM University_Student WHERE User_id = ?",[user[0].Id],(err,student)=>{
                        if(er) throw er;
                        req.session.currentStudent = student[0];
                        res.redirect("/subjects");
                    })

                }

                else
                {
                    res.redirect("/subjects");
                }
                
                
            }

            //αλλιώς επιστρέφει μήνυμα λάθους για να ξανα γίνει η προσπάθεια σύνδεσης του χρήστη
            else 
            {               
                req.flash("error","Ανεπιτυχής σύνδεση προσπαθήστε ξανά");
                res.redirect("/login");                
            }           
        }
    })
});



//router για αποσύνδεση ενός χρήστη απο το σύστημα
router.post("/logout",(req,res)=>{
    
    req.session.destroy();
    req.flash("success","Καλή Συνέχεια!");
    res.redirect("/login");

});

//router για αποσύνδεση ενός χρήστη απο το σύστημα
router.get("/logout",(req,res)=>{
       
    req.flash("success","Καλή Συνέχεια!");
    req.session.destroy();
    res.redirect("/login");
    
});

//router για αποσύνδεση ενός χρήστη απο το σύστημα
router.get("/profile",requireLogin,(req,res)=>{
       
    const user = req.session.currentUser;


    if(user.Role === "DEP_member")
    {
        const teacher = req.session.currentTeacher;
        res.render("users/profile",{user,teacher});
    }

    else if (user.Role === "University_Student")
    {
        const student =  req.session.currentStudent;
        res.render("users/profile",{user,student});
    }

    else 
    {
        res.render("users/profile",{user});
    }


    
    
});


//router για επεξεργασία στοιχείων ενός χρήστη
router.get("/profile/edit",requireLogin,(req,res)=>{
    
    //τρέχων χρήστης
    const user = req.session.currentUser;
    
    
    if(user.Role === "DEP_member")
    {
        const teacher = req.session.currentTeacher;
        res.render("users/editProfile",{user,teacher});
    }

    else if (user.Role === "University_Student")
    {
        const student =  req.session.currentStudent;
        res.render("users/editProfile",{user,student});
    }

    else 
    {
        res.render("users/editProfile",{user});
    }


    
});

//εδώ γίνεται η ανανέωση των στοιχείων του προφίλ ενός χρήστης
// στην ουσία αυτό το route εκτελείται αφού ο χρήστης πατήσει το κουμπί Ανανέωση στοιχείων
router.put("/profile/:Id",requireLogin,async(req,res)=>{

    const promisePool = connection.promise();

    //Εύρεση χρηστών με ίδιο όνομα
    Username = req.body.Username;
   const [sameUser,row] = await promisePool.query("SELECT * FROM User WHERE Username = ?",[Username]);

   //Σε περίπτωση που υπάρχει ο χρήστης εμφανίζεται μήνυα ότι χρησιμοποιείται ήδη το όνομα χρήστη
   if(sameUser[0] && sameUser[0].Id!=req.params.Id)
   {

    req.flash("error","Το όνομα χρήστη χρησιμοποιείται ήδη");
    res.redirect("/profile");

   }

   //αλλιώς προχωράμε κανονικά στις αλλαγές
   else
   {


    

    //Εύρεση τρέχοντος χρήστη 
    const [currentUser,cossdl] = await promisePool.query("SELECT * FROM User WHERE Id = ?",[req.params.Id]);


    Username = req.body.Username;
    //ανανέωση στοιχείων χρήστη
    const [userR,cosssdl] = await promisePool.query("UPDATE User SET Username = ? WHERE Id = ?",[Username,req.params.Id]);





    console.log(userR[0]);

    if(currentUser[0].Role === "DEP_member")
    {
        Teacher_Name = req.body.Teacher_Name;
        Teacher_Surname = req.body.Teacher_Surname;
        Grade = req.body.Grade;

        //ανανέωση στοιχείων φοιτητή
        const [studentR,cosssdl] = await promisePool.query("UPDATE DEP_member SET Teacher_Name = ?, Teacher_Surname = ?, Grade = ?  WHERE User_id = ?",[Teacher_Name,Teacher_Surname,Grade,req.params.Id]);
        
        //Εύρεση τρέχοντος χρήστη 
        const [currentUser,cossdl] = await promisePool.query("SELECT * FROM User WHERE Id = ?",[req.params.Id]);

        //Εύρεση τρέχοντος καθηγητή 
        const [currentTeacher,csdl] = await promisePool.query("SELECT * FROM DEP_member WHERE User_id = ?",[req.params.Id]);

        //αρχικοποίηση χρήστη και φοιτητή
        const user = currentUser[0];
        const teacher = currentTeacher[0];

        //req.flash("success","Επιτυχής ενημέρωση στοιχείων");
        res.render("users/profile",{user,teacher});
    }

    else if (currentUser[0].Role === "University_Student")
    {
        
        Student_Name = req.body.Student_Name;
        Student_Surname = req.body.Student_Surname;
        Import_Year = req.body.Import_Year;

        //ανανέωση στοιχείων φοιτητή
        const [studentR,cosssdl] = await promisePool.query("UPDATE University_Student SET Student_Name = ?, Student_Surname = ?, Import_Year = ?  WHERE User_id = ?",[Student_Name,Student_Surname,Import_Year,req.params.Id]);

        //Εύρεση τρέχοντος χρήστη 
        const [currentUser,cossdl] = await promisePool.query("SELECT * FROM User WHERE Id = ?",[req.params.Id]);
        //Εύρεση τρέχοντος φοιτητή 
        const [currentStudnet,csdl] = await promisePool.query("SELECT * FROM University_Student WHERE User_id = ?",[req.params.Id]);

        //αρχικοποίηση χρήστη και φοιτητή
        const user = currentUser[0];
        const student = currentStudnet[0];

        //req.flash("success","Επιτυχής ενημέρωση στοιχείων");
        res.render("users/profile",{user,student});
    }

    else 
    {

        //Εύρεση τρέχοντος χρήστη 
        const [currentUser,cossdl] = await promisePool.query("SELECT * FROM User WHERE Id = ?",[req.params.Id]);

        //αρχικοποίηση χρήστη 
        const user = currentUser[0];

        res.render("users/profile",{user});
        
       
    }
    


}

  

});


//router για επεξεργασία στοιχείων ενός χρήστη
router.get("/profile/editPassword",requireLogin,(req,res)=>{
    
 
    //τρέχων χρήστης
    const user = req.session.currentUser;
    
    res.render("users/editPassword",{user});

    
});

//router για επεξεργασία στοιχείων ενός χρήστη
router.put("/profile/editPassword/:Id",requireLogin, async(req,res)=>{
    
    const promisePool = connection.promise();

    //Εύρεση τρέχοντος χρήστη 
    const [currentUser,cossdl] = await promisePool.query("SELECT * FROM User WHERE Id = ?",[req.params.Id]);
 
    const currentPassword =  req.body.currentPassword;
    const newHashedPassword = await bcrypt.hash(req.body.newPassword,10);


    //σύγκριση του εισαγώμενου κωδικού με αυτόν που είχαμε αποθηκεύσει σαν hashed κατα την εγγραφή
    const validPassword = await bcrypt.compare(currentPassword,currentUser[0].Password);//boolean value 


    //Σε περίπτωση που ο χρήστης εισάγει σωστά τον παλιό κωδικό του γίνεται επιτυχής προσθήκη 
    if(validPassword)
    {
        //ανανέωση στοιχείων χρήστη
        const [userR,cosssdl] = await promisePool.query("UPDATE User SET Password = ? WHERE Id = ?",[newHashedPassword,req.params.Id]);

        req.flash("success","Επιτυχής αλλαγή κωδικού!");
        res.redirect("/profile");
    }

    //αλλίως ανακατευθύνει τον χρήστη και του εμφανίζει το αντίστοιχο μήνυμα
    else 
    {
        req.flash("error","Εισάγεται τον τελευταίο έγγυρο κωδικό πρόσβασης");
        res.redirect("/profile/editPassword");
    }
    
});

router.get("/main",(req,res)=>{

    res.render("users/main");


});
module.exports = router;