const express = require('express');
const validate = require('../../middlewares/validate');
const blogsController = require('../../controllers/blogs.controller');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.post('/create', validate(blogsController.createBlogs.validation), catchAsync(blogsController.createBlogs.handler));
router.put('/update/:id', validate(blogsController.updateBlogs.validation),catchAsync(blogsController.updateBlogs.handler));
router.delete('/delete/:id',catchAsync(blogsController.deleteBlogs.handler));
router.get('/get',catchAsync(blogsController.getBlogs.handler));
router.get('/get/:id',catchAsync(blogsController.getBlogById.handler));

module.exports = router;

