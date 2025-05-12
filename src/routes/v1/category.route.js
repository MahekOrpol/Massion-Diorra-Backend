const express = require("express");
const validate = require("../../middlewares/validate");
const catchAsync = require("../../utils/catchAsync");
const { categoryController } = require("../../controllers");

const router = express.Router();

router.post(
  "/create",
  validate(categoryController.createCategory.validation),
  catchAsync(categoryController.createCategory.handler)
);
router.get(
  "/get",
  validate(categoryController.getCategory.validation),
  catchAsync(categoryController.getCategory.handler)
);
router.put(
  "/update/:_id",
  catchAsync(categoryController.updateCategory.handler)
);
router.delete(
  "/delete/:_id",
  catchAsync(categoryController.deleteCategory.handler)
);

// Subcategory routes
router.post(
  "/create/:id",
  catchAsync(categoryController.addSubcategory.handler)
);

router.get(
  "/getsub/:id",
  catchAsync(categoryController.getSubcategories.handler)
);

router.put(
  "/:id/subcategory/:subcategoryId",
  catchAsync(categoryController.updateSubcategory.handler)
);

router.delete(
  "/:id/subcategory/:subcategoryId",
  catchAsync(categoryController.deleteSubcategory.handler)
);

module.exports = router;
