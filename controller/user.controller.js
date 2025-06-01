import { registerSchema , loginSchema } from "../model/register.model.js";
import { User } from "../model/User.model.js"
import  bcrypt from "bcrypt"
import  jwt  from "jsonwebtoken"
import dotenv from "dotenv"
import  nodemailer  from "nodemailer"
import { text } from "express";
import  { sendEmail } from "../utils/sendEmail.js"

dotenv.config();

const registerUser = async (req,res) =>{
try {
    
    //get data
    const data = registerSchema.parse(req.body);
    const {name ,email ,password } = data;

    if(!data){   return res.status(400).json({ msg : "Failed to proccess data"}) };

    //check if user already exist 
    const userExists = await User.findOne({ email });
    if(userExists) return res.status(400).json({ msg : "User already exists"});

    

    //create user if not exist
    const newUser = await User.create(data);
    console.log(newUser);
    

    //create a verification token 
    const token = await jwt.sign(
        {
            _id: newUser._id,
            email : newUser.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY || "1d"
        }
    );



    //save token in db
    newUser.verificationToken = token;
    await newUser.save();


 //send token as email to user
const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        secure: false, // true for 2525
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
});

const mailOption = {
    from: process.env.MAILTRAP_MAIL,
    to: newUser.email,
    subject: "Verify your email",
    text: `Please click to verify your Email: ${process.env.BASE_URL}/api/v1/users/verify/${token}`, // fallback for non-HTML clients
    html: `
        <p>Please click the link below to verify your email:</p>
        <a href="${process.env.BASE_URL}/api/v1/users/verify/${token}" target="_blank" style="color: blue; text-decoration: underline;">
            Verify Email
        </a>
    `
};


try {
    let info = await transporter.sendMail(mailOption);
    console.log("Email sent:", info.messageId);
} catch (err) {
    console.error("Error sending email:", err);
}



//send succes status to user
return res.status(200).json({ msg : "Account Created Succesfully"})
    
} catch (error) {
    res.status(200).json({ msg: error.message });
}

}

const userVerify = async (req,res) =>{

   try {
   
    const { token } = req.params;
    console.log(token);
    
   
    if(!token) return res.status(400).json({msg : "Invalid token recieved"})

 
    const verifyUser = await User.findOne({verificationToken : token});
    if(!verifyUser) return res.status(400).json({msg : "Token is Invalid"})

    verifyUser.isVerified = true;


    verifyUser.verificationToken = undefined;

    //save
    await verifyUser.save();
    //return response

    return res.status(200).json({msg : "User is Verified"})
    
   } catch (error) {
    return res.status(400).json({msg : error.message});
   }
}

const loginser = async(req,res) => {
try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) return res.status(404).json({ msg: "Invalid Credentials" });

    const token = jwt.sign({ id: user._id , role : user.role }, process.env.JWT_SECRET , { expiresIn : "5h"});

    res.cookie("TOKEN", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
    }});

  } catch (error) {
    res.status(200).json({ msg: error.message });
  }
}


const forgotPassword = async (req,res) => {
try {
        const { email } = req.body;
        const user = User.findOne({email});
    
        if(!user){ return res.status(404).json({msg : "User not found "})};
    
        //create a hash for user and store that in db and also set expire time
        const resetToken = await jwt.sign({id : user._id } , process.env.JWT_SECRET,{ expiresIn : "15m"});
         
        //save in db and expiry 
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        //send tokne via email 
    const resetLink = `${process.env.BASE_URL}/api/v1/users/forgotPass/${resetToken}`;

    await sendEmail({
        to:user.email,
        from : process.env.BASE_URL,
        text : `Click on this link to verify the email : ${resetLink}`
    })

    return res.status(200).json({ msg : "Reset link has been send "});


} catch (error) {
    return res.status(400).json({ msg : "error while forgetting password"})
    
}
};


const getMe = async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if(!user){ return res.status(400).json({ msg : "User Not Found"})}
    
        res.status(200).json({
            user,
            success : true
        })
    } catch (error) {
        return res.status(400).json({ msg : "User not found"})
    }

}



const logOut = async (req,res) => {
 
        res.clearCookie("token",{
            httpOnly:true,
            sameSite : "Strict"
        });

    return res.status(200).json({ message : "Logged out Succesfully"})

}


const resetPassword = async (req,res) => {

try {
        const { token } = req.params;
        const { password } = req.body;
    
        const decoded = jwt.verify( token , process.env.JWT_SECRET);
    
        const user = User.findOne({
            id : decoded.id,
            resetPasswordToken : token,
            resetPasswordExpires : { $gt:Date.now()}
        });
    
        if(!user){ return res.status(400).json({ msg : "Invalid Token"})};
    
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
    
        await user.save();
    
        return res.status(200).json({ msg : "Password has been changed "})
} catch (error) {
    return res.status(400).json({ msg : "Error Ocuured"})
    
}


}




export { registerUser , userVerify , loginser , getMe , logOut , resetPassword , forgotPassword } ;