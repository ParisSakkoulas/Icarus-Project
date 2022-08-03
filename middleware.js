
const {subjectSchema,subjectAssignFromTeacher} = require("./schemas");


//middleware για να ελέγχει αν ένας χρήστης είναι συνδεδεμένος ώστε να πρωχωρήσει στις επόμενες ενέργειες
module.exports.requireLogin = (req,res,next)=>{

    
if(!req.session.user_id)
    {
        req.flash("error","Πρέπει να συνδεθείτε");
        return res.redirect("/login");

    }
    
    next();
}

//Έλεγχος αν ο χρήστης είναι admin
module.exports.isAdmin = (req,res,next)=>{

    
    if(req.session.currentUser.Role !=="Admin")
        {
            req.flash("error","Απαιτούνται δικαιώματα διαχειριστή");
            return res.redirect("/login");
    
        }
        
        next();
}

//Έλεγχος αν ο χρήστης είναι DEP_member δηλ καθηγητής
module.exports.isTeacher = (req,res,next)=>{

    
    if(req.session.currentUser.Role !=="DEP_member")
        {
            req.flash("error","Απαιτούνται δικαιώματα Καθηγητή");
            return res.redirect("/login");
    
        }
        
        next();
}

//Έλεγχος αν ο χρήστης είναι DEP_member δηλ καθηγητής
module.exports.isTeacherOrAdmin = (req,res,next)=>{

    
    if(req.session.currentUser.Role !=="DEP_member" || req.session.currentUser.Role!=="Admin")
        {
            req.flash("error","Απαιτούνται δικαιώματα Καθηγητή");
            return res.redirect("/login");
    
        }
        
        next();
}

//Έλεγχος του μαθήματος
module.exports.validateSubject = (req,res,next)=>{
    
    const {error} = subjectSchema.validate(req.body);

    if(error){

        const msg = error.details.map(el=>el.message).join(",");
        throw new ExpressError(msg,404);
    }
    else  next();
}

module.exports.validateAssignFromTeacher = (req,res,next)=>{

    const { error } = subjectAssignFromTeacher.validate(req.body);
    if(error){

        const msg = error.details.map(el=>el.message).join(",");
        throw new ExpressError(msg,404);
    }
    else  next();

}