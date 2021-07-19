const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');

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