const mongoose = require('mongoose');

const billingAddressSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: false
    },
    streetAddressLine1: {
        type: String,
        required: false
    },
    streetAddressLine2: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: false
    },
    zipCode: {
        type: String,
        required: false
    }
});

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    phone:{
        type:String,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
    },
    images:[
        {
            type:String,
            required:true
        }
    ],
    billingAddress: billingAddressSchema,
    role:{
        type: String,
        enum: ['admin', 'staff', 'user'],
        default: 'user',
    },
    isAdmin:{
        type: Boolean,
        default: false,
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    otp:{
        type:String
    },
    otpExpires:{
        type:Date
    },
    date: {
        type: Date,
        default: Date.now
    },
},{timeStamps:true})

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;
