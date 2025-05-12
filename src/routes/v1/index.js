const express = require("express");
const userRoute = require("./user.route");
const adminRoute = require("./admin.route");
const aboutUsRoute = require("./aboutUs.route");
const notificationRoute = require("./notification.route");
const registerRoute = require("./register.route");
const productRoute=require('./products.route')
const wishlistRoute=require('./wishlist.route')
const categoryRoute=require('./category.route')
const orderDetailsRoute=require('./orderDetails.route')
const orderRoute=require('./order.route')
const paymentRoute=require('./payment.route')
const contactRoutes = require('./contactUs.route')
const router = express.Router();
const priceFilterRoute=require('./priceFilter.route');
const customJewelsRoute = require("./customJewels.route");
const giftingGuideRoute = require("./giftingGuide.route");
const newArrivalsRoute = require("./newArrivals.route");

const defaultRoutes = [
 
  {
    path: "/admin",
    route: adminRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
 
  {
    path: "/notification",
    route: notificationRoute,
  },
 
  {
    path: "/register",
    route: registerRoute,
  },
  {
    path: '/product',
    route: productRoute,
  },
  {
    path: '/category',
    route: categoryRoute,
  },
  {
    path: '/wishlist',
    route: wishlistRoute,
  },
  {
    path: '/contact-us',
    route: contactRoutes,
  },
  {
    path: '/order-details',
    route: orderDetailsRoute,
  },
  {
    path: '/order',
    route: orderRoute,
  },
  {
    path: '/payment',
    route: paymentRoute,
  },
  {
    path:'/price-filter',
    route: priceFilterRoute,
  },
  {
    path:'/custom-jewels',
    route: customJewelsRoute,
  },
  {
    path:'/gifting-guide',
    route: giftingGuideRoute,
  },
  {
    path:'/new-arrivals',
    route: newArrivalsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
