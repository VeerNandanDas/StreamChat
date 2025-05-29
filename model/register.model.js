import {z} from 'zod'

const registerSchema = z.object({
    name : z.string().min(1,"Username must be there"),
    email : z.string().email("invalid email"),
    password : z.string().min(8 , "Password must be of 8 characters"),

})

export { registerSchema } ;