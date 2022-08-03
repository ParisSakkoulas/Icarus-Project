
const Joi = require("joi");

module.exports.subjectSchema = Joi.object({
        Name : Joi.string().required(),
        Description : Joi.string().allow(""),
        Prerequisite_Subj : Joi.string().allow(""),

});


module.exports.subjectAssignFromTeacher = Joi.object({
        Theory_Weight : Joi.number(),
        Lab_Weight : Joi.number(),
        Theory_Restriction : Joi.string().allow(""),
        Lab_Restriction : Joi.string().allow("")

});


