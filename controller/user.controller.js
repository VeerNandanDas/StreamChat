import { registerSchema } from "../model/register.model.js";
import { User } from "../model/User.model.js"
import  bcrypt from "bcrypt"
import  jwt  from "jsonwebtoken"
import dotenv from "dotenv"
import  nodemailer  from "nodemailer"

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
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
});

const mailOption = {
    from: process.env.MAILTRAP_MAIL,
    to: newUser.email,
    subject: "Verify your email",
    text: `Please click to verify the Email : ${process.env.BASE_URL}/api/v1/users/verify/${token}`, // plain‑text body

}

await transporter.sendMail(mailOption);


//send succes status to user
return res.status(200).json({ msg : "Account Created Succesfully"})
    
} catch (error) {
    res.status(200).json({ msg: error.message });
}

}

const userVerify = async (req,res) =>{

    //get token from url
    const { token } = req.params;
    console.log(token);
    
    //validate token
    if(!token) return res.status(400).json({msg : "Invalid token recieved"})

    //find user based on token
    const verifyUser = await User.findOne({verificationToken : token});
    if(!verifyUser) return res.status(400).json({msg : "Token is Invalid"})

    //set VerifiedUser feild true
    verifyUser.isVerified = true;

    //remove token
    verifyUser.verificationToken = undefined;

    //save
    await verifyUser.save();
    //return response

    return res.status(200).json({msg : "User is Verified"})
}

const loginser = async(req,res) => {
    //get data
    //compare token and check its login ability
    //
}


export { registerUser , userVerify } ;