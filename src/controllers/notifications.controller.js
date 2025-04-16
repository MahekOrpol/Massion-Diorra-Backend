const Joi = require("joi");
const { Notification } = require("../models");
const httpStatus = require("http-status");

const createNotification = {
    validation: {
        body: Joi.object().keys({
            title: Joi.string().required(),
            description: Joi.string().required()
        }),
    },

    handler: async (req, res) => {

        const body = {
            ...req.body,
            createdBy: req.user._id
        }
        const notification = await new Notification(body).save();
        return res.status(httpStatus.CREATED).send(notification);
    }
};

const updateNotiication = {
    validation: {
        body: Joi.object().keys({
            title: Joi.string(),
            description: Joi.string(),
        }),
    },
    handler: async (req, res) => {

        const notification = await Notification.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });
        return res.send(notification);
    }
}

const deleteNotification = {
    handler: async (req, res) => {

        await Notification.findOneAndUpdate({_id: req.params.id}, {$addToSet : {deletedBy : req.user._id }})
        return res.status(httpStatus.OK).send({
            message: "Delete Successfully"
        });
    }
}

const getNotification = {
    handler: async (req, res) => {

        if(req.user?.role == 'User'){
            const notification = await Notification.aggregate(
                [
                    {
                        $lookup: {
                            from: 'admins',
                            localField: 'createdBy',
                            foreignField: '_id',
                            as: 'createdBy'
                        }
                    },
                    {
                        $unwind: {
                            path: '$createdBy',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $match: {
                            'createdBy.year': req.user.year,
                            'createdBy.role': 'Teacher',
                            deletedBy: {
                                $nin: [req.user._id]
                            }
    
                        }
                    }
                ],
            );
            return res.status(httpStatus.OK).send(notification);
        }


        if(req.user?.role == 'Teacher'){
            const notification = await Notification.aggregate(
                [
                    {
                        $lookup: {
                            from: 'admins',
                            localField: 'createdBy',
                            foreignField: '_id',
                            as: 'createdBy'
                        }
                    },
                    {
                        $unwind: {
                            path: '$createdBy',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $match: {
                            'createdBy.year': req.user.year,
                            'createdBy.role': 'User',
                            deletedBy: {
                                $nin: [req.user._id]
                            }
    
                        }
                    }
                ],
            );
            return res.status(httpStatus.OK).send(notification);
        }
      
      
      
    }
}

module.exports = {
    createNotification,
    updateNotiication,
    deleteNotification,
    getNotification
}