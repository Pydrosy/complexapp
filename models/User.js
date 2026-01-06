const bcrypt = require('bcryptjs');
const e = require('connect-flash');
const usersCollection = require('../db').db().collection("users");
const validator = require('validator');
const md5 = require('md5');
 
 
let User = function(data,getAvatar){
 this.data = data;
 this.errors = [];
    if(getAvatar == undefined){getAvatar = false}
    if(getAvatar){this.getAvatar()}
}

User.prototype.cleanUp = function(){
    if(typeof(this.data.username) != "string"){
        this.data.username = "";
    }
    if(typeof(this.data.email) != "string"){
        this.data.email = "";
    }
    if(typeof(this.data.password) != "string"){
        this.data.password = "";
    }
    //get rid of any bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    } 
}

//   User.prototype.validate = function(){
//     return new Promise(async (resolve, reject) => {
//      if(this.data.username == ""){
//         this.errors.push("You must provide a username.");   
//      } 
//      if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){
//         this.errors.push("Username can only contain letters and numbers.");   
//      }
//     if(!validator.isEmail(this.data.email)){
//         this.errors.push("You must provide a Valid email address.");   
//      }
//     if(this.data.password == ""){
//         this.errors.push("You must provide a password.");
//     }
//     if(this.data.password.length > 0 && this.data.password.length < 12){
//         this.errors.push("Password must be at least 12 characters.");
//     }
//     if(this.data.password.length > 50){
//         this.errors.push("Password cannot exceed 50 characters.");
//     }
//     if(this.data.username.length > 0 && this.data.username.length < 3){
//         this.errors.push("Username must be at least 3 characters.");
//     }
//     if(this.data.username.length > 30){
//         this.errors.push("Username cannot exceed 30 characters.");
//      }
//      //Only if username is valid then check to see if it's already taken
//      if(this.data.username.length >=3 && this.data.username.length <=30 && validator.isAlphanumeric(this.data.username)){
//         let usernameExists = usersCollection.findOne({username: this.data.username});
//         if(usernameExists){
//             this.errors.push("That username is already taken.");
//         } 
//      }
//         //Only if email is valid then check to see if it's already taken
//         if(validator.isEmail(this.data.email)){
//             let emailExists = await usersCollection.findOne({email: this.data.email});
//             if(emailExists){
//                 this.errors.push("That email is already being used.");
//             }
//             resolve();
//     }
//     }
//     )}   

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        // Clear any previous errors
        this.errors = [];
        
        if (this.data.username == "") {
            this.errors.push("You must provide a username.");
        }
        
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
            this.errors.push("Username can only contain letters and numbers.");
        }
        
        if (!validator.isEmail(this.data.email)) {
            this.errors.push("You must provide a Valid email address.");
        }
        
        if (this.data.password == "") {
            this.errors.push("You must provide a password.");
        }
        
        if (this.data.password.length > 0 && this.data.password.length < 12) {
            this.errors.push("Password must be at least 12 characters.");
        }
        
        if (this.data.password.length > 50) {
            this.errors.push("Password cannot exceed 50 characters.");
        }
        
        if (this.data.username.length > 0 && this.data.username.length < 3) {
            this.errors.push("Username must be at least 3 characters.");
        }
        
        if (this.data.username.length > 30) {
            this.errors.push("Username cannot exceed 30 characters.");
        }
        
        // Only if username is valid then check to see if it's already taken
        if (this.data.username.length >= 3 && 
            this.data.username.length <= 30 && 
            validator.isAlphanumeric(this.data.username)) {
            try {
                let usernameExists = await usersCollection.findOne({ username: this.data.username });
                if (usernameExists) {
                    this.errors.push("That username is already taken.");
                }
            } catch (error) {
                reject(error);
                return;
            }
        }
        
        // Only if email is valid then check to see if it's already taken
        if (validator.isEmail(this.data.email)) {
            try {
                let emailExists = await usersCollection.findOne({ email: this.data.email });
                if (emailExists) {
                    this.errors.push("That email is already being used.");
                }
            } catch (error) {
                reject(error);
                return;
            }
        }
        
        // Always resolve, regardless of validation results
        resolve();
    });
}




    User.prototype.login =  function(){
       return new Promise(async (resolve, reject) => {
         this.cleanUp();
        const attemptedUser = await usersCollection.findOne({username: this.data.username});
        if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
            this.data = attemptedUser;
            this.getAvatar();
         resolve("Congrats! You are logged in.");
        } else {
            reject("Invalid username / password.");
        }
       })
  }


User.prototype.register = function(){
   return new Promise(async (resolve, reject) => {
    //Step #1: Validate user data}
    this.cleanUp();
    await this.validate();
    //Step #2: Only if there are no validation errors then save the user data into a database

    if(!this.errors.length){
//hash user password
        let salt = bcrypt.genSaltSync(10);
        this.data.password = bcrypt.hashSync(this.data.password, salt);

        //save user data into a database
       await usersCollection.insertOne(this.data);
         this.getAvatar();
resolve();
    }
    else {
        reject(this.errors);
    }


    //then save the user data into a database
}
    )}

User.prototype.getAvatar = function(){
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
}




User.findByUsername = function(username){
    return new Promise(function(resolve, reject){
        if(typeof(username) != "string"){   
            reject();
            return;
        }
        usersCollection.findOne({username: username}).then(function(userDoc){
            if(userDoc){
                userDoc = new User(userDoc, true);
                userDoc ={
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }

                resolve(userDoc);
            } else {
                reject();
            }
            resolve(userDoc);
        }).catch(function(){
            reject();
        })
    })
}
 
User.doesEmailExist = function(email){
return new Promise(async function(resolve,reject) {
   if(typeof(email) != "string"){
        resolve(false)
        return
   } 
   let user = await usersCollection.findOne({email: email.toLowerCase().trim()})
   if(user){
        resolve(true)
   }else{
        resolve(false)
   }
})
}


module.exports = User