import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import transpoter from "../config/nodemailer.js";
import mongoose from "mongoose";


export const register = async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ sucess: false, message: "missing details" })
    }

    try {
        console.log("Mongoose connection readyState:", mongoose.connection.readyState)
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.json({ success: false, message: "user alredy exist" })
        }
        const hashedpassword = await bcrypt.hash(password, 8)

        const user = new userModel({ name, email, password: hashedpassword })
        await user.save()  // save in database

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'welcome to I 💗PDF',
            text: `welcome to I 💗 PDF website your account has been created with email id : ${email}`
        }

        await transpoter.sendMail(mailOptions)

        res.json({ success: true, message: "User registered successfully" });

    } catch (error) {
        res.json({ sucess: false, message: error.message })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email and password are required' })
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Invalid email" })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid password' })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.json({ success: true, message: "User login successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookies('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })

        return res.json({ success: true, message: "Logged Out" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const sendVerifyOtp = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("userId from token:", userId);

        const user = await userModel.findById(new mongoose.Types.ObjectId(userId));
        console.log("Fetched user:", user);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account is already verified" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account verification OTP",
            text: `Your OTP is ${otp}. Verify your account using this OTP.`,
        };

        await transpoter.sendMail(mailOption);
        res.json({ success: true, message: "Verification OTP sent to your email" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        return res.json({ success: false, message: 'Missing Details' })
    }
    try {
        const user = await userModel.findById(userId)
        if (!user) {
            return res.json({ success: false, message: 'user not found' })
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' })
        }
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired ' })
        }
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: 'Email verified successfully' })


    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//send password reset otp 
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.json({ success: false, message: 'Email is required' })
    }
    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: 'user not found' })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password reset OTP",
            text: `Your OTP for resetting your password is ${otp}. use this OTP to proceed with resetting your password.`,
        }
        await transpoter.sendMail(mailOption)
        return res.json({ success: true, message: "otp send to your email" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

// Reset user password
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: 'Email, OTP and new password are required' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'user not found' })
        }
        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' })
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired' })
        }

        const hashedpassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedpassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: 'password has been reset successfully' })


    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

