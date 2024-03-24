import Mailgen from "mailgen";
import nodemailer from "nodemailer"
import {Content} from "mailgen"


interface options{
    email:string,
    subject:string,
    mailgenContent:Content
}



const sendEmail=async(options:options)=>{

   const mailGenerator=new Mailgen(
    {
        theme:"default",
        product:{
            name:"JChat",
            link:"www.jchat.com"
        }
    }
   )

   const emailTextual=mailGenerator.generatePlaintext(options.mailgenContent)
   const emailHtml=mailGenerator.generate(options.mailgenContent)
   const trnspoter=nodemailer.createTransport(
    {
        service:"Gmail",
        host:"smtp.gmail.com",
        port:465,
        secure:true,
        auth:{
            user:"shashank0865@gmail.com",
            pass:"ykth fnjz haoy aebw"
        }
    }
   )

   const mail={
    from:"shashank0865@gmail.com",
    to:options.email,
    subject:options.subject,
    text:emailTextual,
    html:emailHtml
   }

   try{
    await trnspoter.sendMail(mail)
   }
   catch(err){
    console.log(err,"Error Occuered while genrating mail")
   }
}

const emailVerificationMailgenContent=(username:string|undefined,verificationUrl:string)=>{
    return{
        body:{
            name:username,
            intro:"Welcome to our app! We're very excited to have you on board.",
            action:{
                instructions:"To verify your email please click on the following button:",
                button:{
                    color:"#22BC66",
                    text:"Verfiy your email",
                    link:verificationUrl
                }
            },
            outro:"Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

const forgotPasswordMailgenContent=(username:string,passwordResetUrl:string)=>{
    return{
        body:{
            name:username,
            intro:"We got a request to reset the password of our account",
            action:{
                instructions:
                "To reset your password click on the following button or link:",
              button: {
                color: "#22BC66", // Optional action button color
                text: "Reset password",
                link: passwordResetUrl,
              },
            },
            outro:"Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

export{
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent
}