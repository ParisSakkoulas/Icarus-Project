const mysql = require("mysql2");
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




//όλα τα μαθήματα
module.exports.getAllSubjects =   (req,res)=>{

    connection.query("SELECT * FROM Subject",(err,subjects)=>{

        if(err) throw err;

        res.render("subjects/index",{subjects});

    });
   

};

//φόρμα για την δημιουργία νέου μαθήματος
module.exports.getNewForm = (req,res)=>{

    res.render("subjects/new");
}

//δημιουργία ενός νέου μαθήματος
module.exports.createNewSubject = async(req,res)=>{

    const {Name,Description,Prerequisite_Subj} = req.body;

    //Συνάρτηση για παραγωγή ενός τυχαίου κωδικού για κάθε φορά που γίνεται εισαγωγή ενός νέου μαθήματος
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      const Subject_id =  uuid();

    connection.query("INSERT INTO Subject(Subject_id,Name,Description,Prerequisite_Subj,Αssignment) VALUES(?,?,?,?,?)",[Subject_id,Name,Description,Prerequisite_Subj,0],(err,subjects)=>{

        if(err) throw err;

        req.flash("success","Επιτυχής καταχώρηση του μαθήματος!");

        connection.query("SELECT * FROM Subject WHERE Name = ?",[Name],(err,subj)=>{

            if(err) throw err;

            const subject = subj;
            res.redirect(`subjects/${subject[0].Subject_id}`);
        });


    });


};

//φόρμα για τροποποίηση ενός μαθήματος
module.exports.getEditForm = async (req,res)=>{

    const selectedId = req.params.Id;


     connection.query(`SELECT * FROM Subject WHERE Subject_id = ?`,[selectedId],(err,subject)=>{

        res.render("subjects/edit",{subject:subject[0]});

    });
};

//τροποποίηση ενός συγκεκριμένου μαθήματος
module.exports.editSubject = async(req,res)=>{

    const selectedId = req.params.Subject_id;

    const Name = req.body.Name;
    const Description = req.body.Description;
    const Prerequisite_Subj = req.body.Prerequisite_Subj;

    connection.query(`UPDATE Subject SET Name = ?, Description = ?, Prerequisite_Subj = ? WHERE Subject_id = ?`,[Name,Description,Prerequisite_Subj,selectedId],(err,subject)=>{

        req.flash("success","Επιτυχής ενημέρωση μαθήματος!");
        res.redirect(`/subjects/${selectedId}`);

    });

};

//εμφάνιση ενός συγκεκριμένου μαθήματος
module.exports.getSingleSubject = async (req,res)=>{

    const selectedId = req.params.Subject_id;

    //αρχικά βρίσκουμε το συγκεκριμένο μάθημα με βάση τον κωδικό του
     connection.query(`SELECT * FROM Subject WHERE Subject_id = ?`,[selectedId],(err,subject)=>{

        if(err) throw err;

        //Ευρεση της αντίστοιχης διδασκαλίας για να εμφανιστή μαζί με το αντίστοιχο μάθημα σε περίπτωση που έχει οριστεί
        connection.query("SELECT * FROM Teaching WHERE Subject_id = ?",[selectedId],(err,teaching)=>{
            
            if(err) throw err;
            res.render("subjects/show",{subject:subject[0],teaching:teaching[0]});

        })

    });

};

//διαγραφή μαθήματος 
module.exports.deleteSubject = async (req,res)=>{

    const selectedId = req.params.Subject_id;

    connection.query(`DELETE FROM Subject WHERE Subject_id = ?`,[selectedId],(err,result)=>{


        

        if(err) throw err;
        req.flash("success","Επιτυχής διαγραφή μαθήματος!");
        res.redirect("/subjects");
             

    });


};

//φόρμα για ανάθεση διδασκαλίας
module.exports.getFormassignSubject = async (req,res)=>{

    const subjectId = req.params.Id;
    connection.query(`SELECT * FROM Subject WHERE Subject_id = ?`,[subjectId],(err,subj)=>{

        connection.query("SELECT * FROM DEP_member",(err,teachers)=>{

            if(err) throw err;
            res.render("subjects/assign",{subject:subj[0],teachers});

        })

        
    });
    
}

//ανάθεση διδασκαλίας
module.exports.assignSubject = async (req,res)=>{

    const {Subject_id,Year,Semester,Professor,Theory_Weight,Lab_Weight,Theory_Restriction,Lab_Restriction,Restriction} = req.body;

    //Ευρεση του καθηγητή με το αντίστοιχο όνομα ώστε έπειτα να γίνει στη συνέχεια η συσχέτιση
    connection.query("SELECT * FROM DEP_member WHERE Teacher_Name = ? ",[Professor],(err,teacher)=>{

        
        if(err) throw err;


        if(Restriction==="theory_lab")
        {
            //ευρεση της διδασκαλίας
            connection.query("INSERT INTO Teaching(Subject_id,Year,Semester,Professor,Theory_Weight,Lab_Weight,Theory_Restriction,Lab_Restriction,Restriction,Teaching_state) VALUES(?,?,?,?,?,?,?,?,?,?)",[Subject_id,Year,Semester,Professor,Theory_Weight,Lab_Weight,Theory_Restriction,Lab_Restriction,Restriction,"not"],(err,teaching)=>{

            
            if(err) throw err;
            


            connection.query("UPDATE Subject SET Αssignment = ? WHERE Subject_id = ?",[1,Subject_id],(err,result)=>{
                req.flash("success","Επιτυχής καταχώρηση διδασκαλίας για το μάθημα!");
                res.redirect(`/subjects/${Subject_id}`);

            })
            
            
        })

        }

        if(Restriction==="theory")
        {
            
            connection.query("INSERT INTO Teaching(Subject_id,Year,Semester,Professor,Theory_Weight,Theory_Restriction,Lab_Restriction,Restriction,Teaching_state) VALUES(?,?,?,?,?,?,?,?,?)",[Subject_id,Year,Semester,Professor,Theory_Weight,Theory_Restriction,Lab_Restriction,Restriction,"not"],(err,teaching)=>{

            
            if(err) throw err;
            


            connection.query("UPDATE Subject SET Αssignment = ? WHERE Subject_id = ?",[1,Subject_id],(err,result)=>{
                req.flash("success","Επιτυχής καταχώρηση διδασκαλίας για το μάθημα!");
                res.redirect(`/subjects/${Subject_id}`);

            })
            
            
        })

            

        }

        
        
    })
    
};

//φόρμα για τα βάρη ενός μαθήματος - τρόπος βαθμολόγησης
module.exports.getFormassignWeigthSubject = async (req,res)=>{

    const subjectId = req.params.Id;

    connection.query("SELECT * FROM Subject WHERE Subject_id = ?",[subjectId],(err,subj)=>{

        connection.query("SELECT * FROM Teaching WHERE Subject_id = ?",[subjectId],(err,teaching)=>{

            res.render("subjects/weight",{subject:subj[0], teaching:teaching[0]});
        })
        
    })
            

    
}

//εισαγωγή τρόπου βαθμολόγησης απο καθηγητή
module.exports.assignWeight = async (req,res)=>{

    const Teaching_id = req.params.Id;



    const {Theory_Weight,Lab_Weight,Theory_Restriction,Lab_Restriction,Restriction} = req.body;

    console.log(Restriction);

    if(Restriction === "theory_lab")
    {
        connection.query("UPDATE Teaching SET Theory_Weight = ?, Lab_Weight = ?, Theory_Restriction = ?, Lab_Restriction = ?,Restriction = ? WHERE Teaching_id = ?",[Theory_Weight,Lab_Weight,Theory_Restriction,Lab_Restriction,Restriction,Teaching_id],(err,teaching)=>{

            if(err) throw err;
            req.flash("success","Επιτυχής ενημέρωση τρόπου βαθμολόγησης μαθήματος!");
            res.redirect(`/subjects`);
        })

    }

    if(Restriction === "theory")
    {
        connection.query("UPDATE Teaching SET Theory_Weight = ?, Theory_Restriction = ?, Lab_Restriction = ?,Restriction = ? WHERE Teaching_id = ?",[Theory_Weight,Theory_Restriction,Lab_Restriction,Restriction,Teaching_id],(err,teaching)=>{

            if(err) throw err;
            req.flash("success","Επιτυχής ενημέρωση τρόπου βαθμολόγησης μαθήματος!");
            res.redirect(`/subjects`);
        })
    }


    



}

//φόρμα για την ανανέωσ του τρόπου βαθμολόγησης ενός μαθήματος ADMIN
module.exports.getFormassignWeigthSubjectAdmin = async (req,res)=>{

    const subjectId = req.params.Id;

    connection.query("SELECT * FROM Subject WHERE Subject_id = ?",[subjectId],(err,subj)=>{

        connection.query("SELECT * FROM Teaching WHERE Subject_id = ?",[subjectId],(err,teaching)=>{

            res.render("subjects/updateWeight",{subject:subj[0], teaching:teaching[0]});
        })
        
    })
    
}

//ανανέωση του τρόπου βαθμολόγησης ενός μαθήματος ADMIN
module.exports.updateWeigthSubjectAdmin = async (req,res)=>{

    const Teaching_id = req.params.Id;

    const Theory_W = req.body.Theory_Weight;
    const Lab_W= req.body.Lab_Weight;
    const Theory_R = req.body.Theory_Restriction;
    const Lab_R = req.body.Lab_Restriction;


    connection.query("UPDATE Teaching SET Theory_Weight = ?, Lab_Weight = ?, Theory_Restriction = ?, Lab_Restriction = ? WHERE Teaching_id = ?",[Theory_W,Lab_W,Theory_R,Lab_R,Teaching_id],(err,teaching)=>{

        if(err) throw err;
        req.flash("success","Επιτυχής ενημέρωση τρόπου βαθμολόγησης μαθήματος!");
        res.redirect(`/subjects`);
    })
    
}

//Οριστιική υποβολή τρόπου βαθμολόγησης ενός μαθήματος από καθηγητή
module.exports.updateFinalWeigthSubject = async (req,res)=>{

    const Teaching_id = req.params.Id;

    const Theory_W = req.body.Theory_Weight;
    const Lab_W= req.body.Lab_Weight;
    const Theory_R = req.body.Theory_Restriction;
    const Lab_R = req.body.Lab_Restriction;


    connection.query("UPDATE Teaching SET Theory_Weight = ?, Lab_Weight = ?, Theory_Restriction = ?, Lab_Restriction = ?, Teaching_state = ? WHERE Teaching_id = ?",[Theory_W,Lab_W,Theory_R,Lab_R,"final",Teaching_id],(err,teaching)=>{

        if(err) throw err;
        req.flash("success","Επιτυχής οριστικοποίηση τρόπου βαθμολόγησης μαθήματος!");
        res.redirect(`/subjects`);
    })
    
}

//Οριστιική υποβολή τρόπου βαθμολόγησης ενός μαθήματος από admin
module.exports.updateFinalWeigthSubjectAdmin = async (req,res)=>{

    const Teaching_id = req.params.Id;

    const Theory_W = req.body.Theory_Weight;
    const Lab_W= req.body.Lab_Weight;
    const Theory_R = req.body.Theory_Restriction;
    const Lab_R = req.body.Lab_Restriction;


    connection.query("UPDATE Teaching SET Theory_Weight = ?, Lab_Weight = ?, Theory_Restriction = ?, Lab_Restriction = ?, Teaching_state = ? WHERE Teaching_id = ?",[Theory_W,Lab_W,Theory_R,Lab_R,"final",Teaching_id],(err,teaching)=>{

        if(err) throw err;
        req.flash("success","Επιτυχής οριστικοποίηση τρόπου βαθμολόγησης μαθήματος!");
        res.redirect(`/subjects`);
    })
    
}


            

    



