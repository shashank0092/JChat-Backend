import mongoose, { Connection } from "mongoose";

/** @type {typeof mongoose|undefined} */

export let dbInstance:Connection|undefined

const connectDB=async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}`)
        dbInstance=connectionInstance.connection
        console.log(`\n 🌳 Mongo DB Connected!DB hosted: ${connectionInstance.connection.host}`)
    }
    catch(err){
        console.log("MomgoDB connection error:->",err)
        process.exit(1)
    }
}

export default connectDB