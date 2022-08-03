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

module.exports.getFormForScoresSubject = async (req,res)=>{

    const promisePool = connection.promise();

    //ευρεση της διδασκαλίας που έχουν οριστεί με το συγκεκριμένο μάθημα
    const [teaching,cossdl] = await promisePool.query("SELECT * FROM Teaching WHERE Teaching_id = ?",[req.params.id]);

    //ευρεση του μαθήματος που έχουν οριστεί με το συγκεκριμένο μάθημα
    const [subject,fiel] = await promisePool.query("SELECT * FROM Subject WHERE Subject_id = ?",[teaching[0].Subject_id]);

    //ευρεση όλων των δηλώσεων που έχουν οριστεί με το συγκεκριμένο μάθημα
    const [statements,cosl] = await promisePool.query("SELECT * FROM Statement WHERE Teaching_id = ?",[req.params.id]);

    //αποθήκευση των ΑΜ των φοιτητών που έχουν δηλώσει το μάθημα
    let studIds=[];
    for(let i=0; i<statements.length; i++)
    {
        studIds[i] = statements[i].AM;
        
    }


    //ευρεση των φοιτητών που δήλωσαν το μάθημα
    const [students,cossl] = await promisePool.query("SELECT * FROM University_Student WHERE AM IN(?)",[studIds]);

    console.log(statements);
    
    //πηγαίνει στην σελίδα με την φόρμα για την εισαγωγή των βαθμολογιων
    res.render("teachings/formForScores",{students,statements,subject:subject[0]});

}

module.exports.addNewScores = async (req,res)=>{

    const promisePool = connection.promise();


    let theory_grades =[];

    //εισαγωγή της κάθε βαθμολογίας για κάθε φοιτητή που έχει γίνει εισαγωγή στην φόρμα
    for(let i=0; i<req.body.Theory_Grade.length; i++)
    {
        theory_grades[i] = req.body.Theory_Grade[i]
        const [grad,cosl] = await promisePool.query("UPDATE Statement SET Theory_Grade = ?, Lab_Grade=?,Final_Grade=?   WHERE AM = ?",[req.body.Theory_Grade[i],req.body.Lab_Grade[i],req.body.Final_Grade[i],req.body.studentAM[i]]);
        
    }

    req.flash("success","Επιτυχής Καταχώρηση Βαθμολογιών")
    res.redirect("/subjects");
    
    console.log(theory_grades);
}

module.exports.getFormForScoresSubjectAdmin = async (req,res)=>{

  
    const promisePool = connection.promise();

    //ευρεση της διδασκαλίας που έχουν οριστεί με το συγκεκριμένο μάθημα
    const [teaching,cossdl] = await promisePool.query("SELECT * FROM Teaching WHERE Teaching_id = ?",[req.params.id]);

    //ευρεση του μαθήματος που έχουν οριστεί με το συγκεκριμένο μάθημα
    const [subject,fiel] = await promisePool.query("SELECT * FROM Subject WHERE Subject_id = ?",[teaching[0].Subject_id]);

    //ευρεση όλων των δηλώσεων που έχουν οριστεί με το συγκεκριμένο μάθημα
    const [statements,cosl] = await promisePool.query("SELECT * FROM Statement WHERE Teaching_id = ?",[req.params.id]);

    //αποθήκευση των ΑΜ των φοιτητών που έχουν δηλώσει το μάθημα
    let studIds=[];
    for(let i=0; i<statements.length; i++)
    {
        studIds[i] = statements[i].AM;
        
    }


    //ευρεση των φοιτητών που δήλωσαν το μάθημα
    const [students,cossl] = await promisePool.query("SELECT * FROM University_Student WHERE AM IN(?)",[studIds]);

    console.log(statements);
    
    //πηγαίνει στην σελίδα με την φόρμα για την εισαγωγή των βαθμολογιων
    res.render("teachings/formForScoresAdmin",{students,statements,subject:subject[0]});

}


module.exports.addNewScoresAdmin = async (req,res)=>{

    const promisePool = connection.promise();


    let theory_grades =[];

    //εισαγωγή της κάθε βαθμολογίας για κάθε φοιτητή που έχει γίνει εισαγωγή στην φόρμα
    for(let i=0; i<req.body.Theory_Grade.length; i++)
    {
        theory_grades[i] = req.body.Theory_Grade[i]
        const [grad,cosl] = await promisePool.query("UPDATE Statement SET Theory_Grade = ?, Lab_Grade=?,Final_Grade=?   WHERE AM = ?",[req.body.Theory_Grade[i],req.body.Lab_Grade[i],req.body.Final_Grade[i],req.body.studentAM[i]]);
        
    }

    req.flash("success","Επιτυχής Καταχώρηση Βαθμολογιών")
    res.redirect("/subjects");
    
    console.log(theory_grades);
}
