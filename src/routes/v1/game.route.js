const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const gameController = require('../../controllers/game.controller');
const catchAsync = require('../../utils/catchAsync');


const router = express.Router();

router.post('/create', validate(gameController.createGame.validation), catchAsync(gameController.createGame.handler));
router.get('/get', catchAsync(gameController.getAllGame.handler));
router.put('/update/:_id', catchAsync(gameController.updateGame.handler));
router.delete('/delete/:_id', catchAsync(gameController.deleteGame.handler));

module.exports = router;
