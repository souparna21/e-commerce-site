const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail'); 

const crypto = require('crypto');

// Register a user => /api/v1/register
exports.registerUser = catchAsyncErrors( async (req, res, next) => {

    const { name, email, password } = req.body;
    
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: 'Hellotest12356today',
            url: 'https://www.google.co.in/url?sa=i&url=https%3A%2F%2Fwww.independent.co.uk%2Fnews%2Fpeople%2F17-rich-and-famous-people-who-were-once-homeless-a7350941.html&psig=AOvVaw0xk-Tn3CYAMNsWi3ejOKBS&ust=1626205221208000&source=images&cd=vfe&ved=0CAoQjRxqFwoTCLCg4dek3vECFQAAAAAdAAAAABAD'
        }
    })

    sendToken(user, 200, res);
})

// Log in user => /api/v1/login
exports.loginUser = catchAsyncErrors( async(req, res, next) => {
    const { email, password } = req.body;

    // Checks if email and password entered by user
    if(!email || !password) {
        return next(new ErrorHandler('Please enter email & password', 400))
    }

    // Finding user in database
    const user = await User.findOne({ email }).select('+password');

    if(!user) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    // Checks if password is correct or not
    const isPasseordMatched = await user.comparePassword(password);

    if(!isPasseordMatched) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    sendToken(user, 200, res);
})

// Forgot Password => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email});

    if(!user) {
        return next(new ErrorHandler('User not found with this email', 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false});

    // Create reset Password url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested that email, then ignore it.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIt Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email send to : ${user.email}`
        })
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false}); 

        return next(new ErrorHandler(error.message, 500))
    }
})

// Reset Password => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if(!user) {
        return next(new ErrorHandler('Password reset token is invalid or has been expired', 400))
    }

    if(req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Password does not match', 400))
    }

    // SetUp new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);
})

// Get currently logged in user details => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    })
})

// logout user => /api/v1/logout
exports.logout = catchAsyncErrors( async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'Logged out'
    })
})