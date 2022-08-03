const express = require("express");
const mysql = require("mysql2");
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");

const subjectRoutes = require("./routes/subject");
const userRoutes = require("./routes/user");
const studentRoutes = require("./routes/student");
const teachingRoutes = require("./routes/teaching");

const ExpressError = require("./utils/ExpressError");

const session = require("express-session");
const flash = require("connect-flash");



//Σύνδεση με την Β.Δ.
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'new_icarus_db'
});

connection.connect(function(err){

    if(err) 
        throw err;
        
    console.log("Connected!");
});



const app = express();

app.engine("ejs",ejsMate);

// σεταρισμα ejs για τον σερβερ και τα paths
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

//express parse the body
app.use(express.urlencoded({extended:true}));

//Χρήση της method override
app.use(methodOverride("_method"));

//για την εξυπηρέτηση του public dir απο τον σερβερ
app.use(express.static(path.join(__dirname,"public")));

//δημιουργία του secret
const sessionConfig ={
    secret:"thisisthesecrete",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

//για χρήση των session cookies και flash messages
app.use(session(sessionConfig));
app.use(flash());

//Χρήση middleware για την εμφάνιση μηνυμάτων με την βοήθεια του flash, ισχύει για κάθε request
app.use((req,res,next) =>{

    res.locals.TeacherName = req.session.TeacherName;//για να εμφανίζει το κουμπί για εισαγωγή τρόπου βαθμολόγησης μόνο στον καθηγητή
    res.locals.currentTeacher = req.session.currentTeacher; //για τον τρέχον καθηγητή
    res.locals.currentUser = req.session.currentUser;// για τον τρέχον χρήστη
    res.locals.currentStudent = req.session.currentStudent; // για τον τρέχον φοιτητή
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});


app.get("/",(req,res)=>{
    res.render("home");
});

app.use("/",userRoutes);

//το συγκεκριμένο αφορά όλα τα route που ξεκινούν με /subjects
app.use("/subjects",subjectRoutes);

//το συγκεκριμένο αφορά όλα τα route για τον φοιτητή
app.use("/",studentRoutes);

//το συγκεκριμένο αφορά όλα τα route για τον φοιτητή
app.use("/teachings",teachingRoutes);

//Σε περίπτωση που πάει σε σελίδα που δεν υπάρχει
app.all("*",(req,res,next)=>{
    next(new ExpressError("Page not found",404));
});

//Χειρισμός για τα βασικά λάθη
app.use((err,req,res,next)=>{
    const {statusCode=500} = err;

    if(!err.message) err.message ="Something went wrong";

    res.status(statusCode).render("error",{err});
});

//server listening on port
app.listen(3000,()=>{
    console.log("Listening on port...");
});