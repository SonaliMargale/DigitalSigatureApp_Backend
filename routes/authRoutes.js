
import express from 'express';
import {login, logout,register,sendVerifyOtp,verifyEmail,isAuthenticated,sendResetOtp,resetPassword} from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

//authRouter = /api/auth/
const authRouter = express.Router()

authRouter.post('/register',register)
authRouter.post('/login',login);
authRouter.post('/logout',logout);
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp)
authRouter.post('/verify-account',userAuth, verifyEmail)
authRouter.post('/is-auth', userAuth, isAuthenticated)
authRouter.post('/send-reset-otp',sendResetOtp);
authRouter.post('/reset-password',resetPassword)

export default authRouter