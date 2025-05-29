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


export { registerUser , userVerify , loginser } ;