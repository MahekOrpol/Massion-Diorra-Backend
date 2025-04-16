const mongoose = require('mongoose');
const { toJSON } = require('./plugins');


const notificationSchema = mongoose.Schema(
    {
        createdBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Admin'
        },
        title:{
            type:String,
        },
        description:{
            type:String,
        },
        deletedBy:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Admin'
        }]
    },
    {
        timestamps:true,
    }
);

notificationSchema.plugin(toJSON);

/**
 * @typedef Notification
 */

const Notification = mongoose.model('Notification',notificationSchema);
module.exports = Notification;