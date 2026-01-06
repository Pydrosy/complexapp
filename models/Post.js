const postsCollection = require('../db').db().collection("posts")
const followsCollection = require('../db').db().collection("follows")
const ObjectId = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHTML = require('sanitize-html')




let Post = function(data, userid,requestedPostId) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId

}

Post.prototype.cleanUp = function() {
    if (typeof(this.data.title) != "string") {
        this.data.title = ""
    }
    if (typeof(this.data.body) != "string") {
        this.data.body = ""
    }
    //get rid of any bogus properties

    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
        createDate: new Date(),
        author: new ObjectId(this.userid)

    }
}

Post.prototype.validate = function() {
    if (this.data.title == "") {
        this.errors.push("You must provide a title.")
    }
    if (this.data.body == "") {
        this.errors.push("You must provide post content.")
    }
    
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate() 
        if (!this.errors.length) {
            //save post into database
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.insertedId)
            }).catch(() => {
                this.errors.push("Please try again later.")
                reject(this.errors)
            })
        } else {
            reject(this.errors)
        }
    })
    }

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        try {   
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
            if (post.isVisitorOwner) {
                //actually update db
                let status = await this.actuallyUpdate()
                resolve(status)
            } else {
                reject()
            }
           
         } catch {
            reject()
            }
        })
    }



Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            await postsCollection.findOneAndUpdate(
                {_id: new ObjectId(this.requestedPostId)},
                {$set: {
                    title: this.data.title,
                    body: this.data.body
                }}
            )
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}



// Post.reusablePostQuery  = function(uniqueOperations) {

//     return new Promise(async function(resolve, reject) { 
//         let aggOperations = uniqueOperations.concat(
//             [
//         {$lookup: {
           
//             from: "users",
//             localField: "author",
//             foreignField: "_id",
//             as: "authorDocument"
//         }},
//         {$project: {
//              _id: 1,
//             title: 1,
//             body: 1,
//             createDate: 1,
//             author: {$arrayElemAt: ["$authorDocument", 0]}
           
//         }},

        
//       ]
//         ) 
//       let posts = await postsCollection.aggregate(aggOperations).toArray()
//       //clean up author property in post object
//       posts = posts.map(function(post) {
//         if (post.createDate) {
//             post.createDate = new Date(post.createDate)
//         }
//         post.author = {
//             username: post.author.username,
//             avatar: new User(post.author, true).avatar
//         }
//         return post
//     })  

//       resolve(posts)
//     })
// } 
// 

// new code 
// Post.reusablePostQuery  = function(uniqueOperations, visitorId) {
//     return new Promise(async function(resolve, reject) { 
//         let aggOperations = uniqueOperations.concat(
//             [
//                 {$lookup: {
//                     from: "users",
//                     localField: "author",
//                     foreignField: "_id",
//                     as: "authorDocument"
//                 }},
//                 {$project: {
//                     _id: 1,
//                     title: 1,
//                     body: 1,
//                     createDate: 1,
//                     authorId: "$author",
//                     author: {$arrayElemAt: ["$authorDocument", 0]}
//                 }}
//             ]
//         ) 
        
//         let posts = await postsCollection.aggregate(aggOperations).toArray()
        
//         // Clean up author property in post object
//         posts = posts.map(function(post) {
//             // FIX: Check if createDate exists, if not use a fallback
//             if (post.createDate) {
//                 post.createDate = new Date(post.createDate)
//             } else {
//                 // If createDate is undefined (old posts), set it to current date
//                 post.createDate = new Date()
//             }
            
//             // FIX: Add safety check for author
//             if (post.author && post.author.username) {
//                 post.author.isVisitorOwner = post.authorId._id.equals(visitorId)
//                 post.author = {
//                     username: post.author.username,
//                     avatar: new User(post.author, true).avatar
//                 }
//             } else {
//                 // Fallback for posts without author data
//                 post.author = {
//                     username: "Unknown",
//                     avatar: ""
//                 }
//             }
//             return post
//         })  

//         resolve(posts)
//     })
// }


// new code v2
// Post.reusablePostQuery  = function(uniqueOperations, visitorId, finalOperations = []) {
//     return new Promise(async function(resolve, reject) { 
//         let aggOperations = uniqueOperations.concat(
//             [
//                 {$lookup: {
//                     from: "users",
//                     localField: "author",
//                     foreignField: "_id",
//                     as: "authorDocument"
//                 }},
//                 {$project: {
//                     _id: 1,
//                     title: 1,
//                     body: 1,
//                     createDate: 1,
//                     authorId: "$author",
//                     author: {$arrayElemAt: ["$authorDocument", 0]}
//                 }}
//             ].concat(finalOperations)
//         ) 
        
//         try {
//             let posts = await postsCollection.aggregate(aggOperations).toArray()
            
//             // Clean up author property in post object
//             posts = posts.map(function(post) {
//                 // FIX: Check if createDate exists, if not use a fallback
//                 if (post.createDate) {
//                     post.createDate = new Date(post.createDate)
//                 } else {
//                     // If createDate is undefined (old posts), set it to current date
//                     post.createDate = new Date()
//                 }
                
//                 // FIX: Add safety check for author
//                 if (post.author && post.author.username) {
//                     // FIX: Check if authorId and visitorId exist before comparing
//                     // if (post.authorId && post.authorId._id && visitorId) {
//                     //     post.author.isVisitorOwner = post.authorId._id.equals(visitorId)
//                     // } else {
//                     //     post.author.isVisitorOwner = false
//                     // }

//                     if (post.authorId && visitorId) {
//     // FIX: isVisitorOwner should be on the post object, not author object
//     // Also, post.authorId might already be ObjectId, no need for ._id
//     post.isVisitorOwner = post.authorId.equals(visitorId)
// } else {
//     post.isVisitorOwner = false
// }
                    
//                     post.author = {
//                         username: post.author.username,
//                         avatar: new User(post.author, true).avatar
//                     }
//                 } else {
//                     // Fallback for posts without author data
//                     post.author = {
//                         username: "Unknown",
//                         avatar: ""
//                     }
//                     post.isVisitorOwner = false
//                 }
//                 return post
//             })  

//             resolve(posts)
//         } catch (error) {
//             console.error("Error in reusablePostQuery:", error)
//             reject(error)
//         }
//     })
// }


// new code version 30: 2025
Post.reusablePostQuery  = function(uniqueOperations, visitorId, finalOperations = []) {
    return new Promise(async function(resolve, reject) { 
        // Check if we're doing a text search
        const isTextSearch = uniqueOperations.some(op => 
            op.$match && op.$match.$text
        );
        
        // Create the base project stage
        const baseProject = {
            _id: 1,
            title: 1,
            body: 1,
            createDate: 1,
            authorId: "$author",
            author: {$arrayElemAt: ["$authorDocument", 0]}
        };
        
        // Add score field if doing text search
        if (isTextSearch) {
            baseProject.score = {$meta: "textScore"};
        }
        
        let aggOperations = uniqueOperations.concat(
            [
                {$lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "authorDocument"
                }},
                {$project: baseProject}
            ].concat(finalOperations)
        ) 
        
        try {
            let posts = await postsCollection.aggregate(aggOperations).toArray()
            
            // Clean up author property in post object
            posts = posts.map(function(post) {
                // FIX: Check if createDate exists, if not use a fallback
                if (post.createDate) {
                    post.createDate = new Date(post.createDate)
                } else {
                    // If createDate is undefined (old posts), set it to current date
                    post.createDate = new Date()
                }
                
                // FIX: Add safety check for author
                if (post.author && post.author.username) {
                    if (post.authorId && visitorId) {
                        post.isVisitorOwner = post.authorId.equals(visitorId)
                        post.authorId = undefined
                    } else {
                        post.isVisitorOwner = false
                    }
                    
                    post.author = {
                        username: post.author.username,
                        avatar: new User(post.author, true).avatar
                    }
                } else {
                    // Fallback for posts without author data
                    post.author = {
                        username: "Unknown",
                        avatar: ""
                    }
                    post.isVisitorOwner = false
                }
                return post
            })  

            resolve(posts)
        } catch (error) {
            console.error("Error in reusablePostQuery:", error)
            reject(error)
        }
    })
}


Post.findSingleById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectId.isValid(id)) {
            reject()
            return
        }  
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectId(id)}}
        ], visitorId)

        if (posts.length) {
            console.log(posts[0])
            resolve(posts[0])
        }
        else {
            reject()
        } 
    })
}     


Post.findByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
        {$match: {author: new ObjectId(authorId)}},
        {$sort: {createDate: -1}}
    ])
    
    
}

Post.delete = function(postIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIdToDelete, currentUserId)
            if (post.isVisitorOwner) {
                await postsCollection.deleteOne({_id: new ObjectId(postIdToDelete)})    
                resolve()
            } else {
                reject()
            }   
        } catch {
            reject()
        }
    })
}

// Post.search = function(searchTerm){
//     return new Promise(async(resolve,reject)=>{
//         if(typeof(searchTerm)=="string"){
//             let posts = await Post.reusablePostQuery([
//                 {$match:{$text:{$search: searchTerm}}}
               
//             ],undefined,[ {$sort:{score:{$meta:"textScore"}}}])
//             resolve(posts)

//         }else{
//             reject()
//         }
//     })
// }

// new post search 30 2025
Post.search = function(searchTerm){
    return new Promise(async(resolve,reject)=>{
        if(typeof(searchTerm)=="string"){
            let posts = await Post.reusablePostQuery([
                {$match:{$text:{$search: searchTerm}}}
            ],undefined,[ 
                {$sort:{score:{$meta:"textScore"}}}
            ])
            resolve(posts)
        } else {
            reject()
        }
    })
}

Post.countPostsByAuthor = function(id){
   return new Promise(async(resolve,reject)=>{
    let postCount = postsCollection.countDocuments({author: new  ObjectId(id)})
    resolve(postCount)
   })
}

 Post.getFeed = async function(id){
    //create an array of user ids that the current user follows
    let followedUsers = await followsCollection.find({authorId: new ObjectId(id) }).toArray()
    followedUsers = followedUsers.map(function(followDoc){
        return followDoc.followedId
    })
    //look for posts where the author is in the above array of followed users

        return Post.reusablePostQuery([
            {$match: {author: {$in: followedUsers } }},
            {$sort: {createDate: -1}}
        ]) 
 }

module.exports = Post