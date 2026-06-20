const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const User = require('../models/User');

const signToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '7d',
    }
  );

exports.register = async (
  req,
  res
) => {

  try {

    const errors =
      validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });

    }

    const {
      username,
      email,
      password,
      preferredLanguage,
    } = req.body;

    const exists =
      await User.findOne({
        $or: [
          { email },
          { username },
        ],
      });

    if (exists) {

      return res.status(409).json({
        success: false,
        message:
          'User already exists',
      });

    }

    // NORMAL VISITOR
    // NO CUSTOMER ID

    const user =
      await User.create({
        username,
        email,
        password,
        preferredLanguage,
      });

    const token =
      signToken(user._id);

    res.status(201).json({

      success: true,

      token,

      user: {

        id: user._id,

        username:
          user.username,

        email:
          user.email,

        preferredLanguage:
          user.preferredLanguage,

      },

    });

  } catch (err) {

    res.status(500).json({

      success: false,

      message: err.message,

    });

  }
};

exports.login = async (
  req,
  res
) => {

  try {

    const errors =
      validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });

    }

    const {
      email,
      password,
    } = req.body;

    const user =
      await User.findOne({
        email,
      }).select('+password');

    if (
      !user ||
      !(await user.comparePassword(password))
    ) {

      return res.status(401).json({

        success: false,

        message:
          'Invalid credentials',

      });

    }

    const token =
      signToken(user._id);

    // ONLY SEND customerId
    // IF USER IS PREMIUM CUSTOMER

    const responseUser = {

      id: user._id,

      username:
        user.username,

      email:
        user.email,

      preferredLanguage:
        user.preferredLanguage,

    };

    // ONLY ADD customerId
    // WHEN EXISTS

    if (user.customerId) {

      responseUser.customerId =
        user.customerId;

    }

    res.json({

      success: true,

      token,

      user: responseUser,

    });

  } catch (err) {

    res.status(500).json({

      success: false,

      message: err.message,

    });

  }
};

exports.me = async (
  req,
  res
) => {

  res.json({
    success: true,
    user: req.user,
  });

};

exports.updateSettings =
  async (
    req,
    res
  ) => {

    try {

      const {
        preferredLanguage,
      } = req.body;

      const user =
        await User.findByIdAndUpdate(
          req.user._id,
          { preferredLanguage },
          { new: true }
        );

      res.json({
        success: true,
        user,
      });

    } catch (err) {

      res.status(500).json({

        success: false,

        message: err.message,

      });

    }

  };