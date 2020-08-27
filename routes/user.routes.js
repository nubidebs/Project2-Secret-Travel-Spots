const express = require("express");
const router = express.Router();
const { isLoggedMiddleware } = require("../middlewares/middlewares");

const User = require("../models/User.model");
const Spot = require("../models/Spot.model");

// .Controller to render one spot
const getOneSpot = (req, res) => {
  console.log(req.params);
  const { spotId } = req.params;
  Spot.findById(spotId)
    .populate("comments author")
    .populate({
      path: "comments",
      populate: {
        path: "author",
        model: "User",
      },
    })
    .then((singleSpot) => {
      console.log(`one spot is showing ${singleSpot}`);
      res.render("spot-details", singleSpot);
    })
    .catch((err) =>
      console.log(`an error occurred while showing a spot ${err}`)
    );
};

//.SHOW ALL user's spots
router.get("/user-spots", isLoggedMiddleware, (req, res, next) => {
  Spot.find({ author: req.session.currentUser._id })
    // ({author: req.session.currentUser._id})
    .populate("author")
    .then((spotsFromDb) => {
      console.log(`spots ${JSON.stringify(spotsFromDb, null, 4)} here`);
      res.render("user/user-spots", { spots: spotsFromDb });
    })
    .catch((err) =>
      console.log(`something happened while getting movies ${err}`)
    );
});

//.Show CREATE new spot page
router.get("/create-spot", isLoggedMiddleware, (req, res) => {
  res.render("user/create-spot");
});

//.CREATE a new spot
router.post("/create-spot", isLoggedMiddleware, (req, res) => {
  const { name, description, location, category } = req.body;
  Spot.create({
    name,
    description,
    location,
    category,
    author: req.session.currentUser._id,
  })
    .then(res.redirect("/user-profile"))
    .catch((err) => console.log(`error while creating a new spot ${err}`));
});

//.Show a SINGLE SPOT from user spots
router.get("/user-spots/:spotId", getOneSpot);

//.Show EDIT or DELETE a spot
router.get("/user-spots/:spotId/edit", isLoggedMiddleware, (req, res) => {
  const { spotId } = req.params;
  Spot.findById(spotId)
    .then((spotToEdit) => {
      console.log(spotToEdit);
      res.render("user/edit-spot", spotToEdit);
    })
    .catch((err) =>
      console.log(`error while displaying spot edit page ${err}`)
    );
});

//.EDIT a spot
router.post("/user-spots/:spotId/edit", isLoggedMiddleware, (req, res) => {
  const { spotId } = req.params;
  const { name, description, location, category } = req.body;
  Spot.findByIdAndUpdate(
    spotId,
    { name, description, location, category },
    { new: true }
  )
    .then(() => res.redirect("/user-profile/user-spots/"))
    .catch((err) => console.log(`error while editing a spot ${err}`));
});

//.DELETE a spot
router.post(
  "/user-spots/:spotId/edit/delete",
  isLoggedMiddleware,
  (req, res) => {
    const { spotId } = req.params;
    Spot.findByIdAndDelete(spotId)
      .then(() => res.redirect("/user-profile/user-spots"))
      .catch((err) => console.log(`error while deleting a spot ${err}`));
  }
);

//.Show EDIT PROFILE
router.get("/edit-profile", isLoggedMiddleware, (req, res) => {
  const userId = req.session.currentUser._id;
  User.findById(userId)
    .then((userToEdit) => {
      res.render("user/edit-profile", { user: userToEdit });
    })
    .catch((err) =>
      console.log(`error while displaying edit profile page ${err}`)
    );
});

//.EDIT user's profile
router.post("/edit-profile", isLoggedMiddleware, (req, res) => {
  const userId = req.session.currentUser._id;
  // console.log("body post", JSON.stringify(req.body, null, 4));
  // console.log("session", req.session.currentUser._id);

  //validation for empty fields:
  //.1 No empty fields allowed
  // if (!username || !email) {
  //   res.render("/edit-profile", {
  //     errorMessage:
  //       "All fields are mandatory. Please provide your username, email and password.",
  //   });
  // }

  //.2 Do not update empty blanks (easy)
  // const data = {};
  // if (username) {
  //   data.username = username;
  // }
  // if (email) {
  //   data.email = email;
  // }

  //.3 Do not update empty blanks (hard-core)
  const data2 = Object.entries(req.body)
    .filter((element) => element[1])
    .reduce((acc, val) => ({ ...acc, [val[0]]: val[1] }), {});

  User.findByIdAndUpdate(userId, data2, { new: true })
    .then((response) => {
      req.session.currentUser = response;
      res.redirect("/user-profile");
    })
    .catch((err) => console.log(`error while editing user's profile ${err}`));
});

//.DELETE user's profile
router.post("/:userID/edit-profile/delete", isLoggedMiddleware, (req, res) => {
  const userId = req.session.currentUser._id;

  User.findByIdAndDelete(userId)
    .then((response) => {
      // alert(response.data);
      req.session.destroy();
      res.redirect("/signup");
    })
    .catch((err) => console.log(`error while deleting user ${err}`));
  // const toDelete = confirm("Are you sure you want to delete?");
  // if (toDelete) {

  // }
});

// function getAllSpots(req, res) {
//   Spot.find()
//     .populate("author")
//     .then((spots) => {
//       res.render("spot-details", spots);
//     })
//     .catch((err) =>
//       console.log(`error while getting the spot details page ${err}`)
//     );
// }

// router.get("/explore", getAllSpots);

module.exports = router;
