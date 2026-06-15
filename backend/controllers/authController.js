const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// Helper to generate access and refresh tokens, and send response
const sendTokenResponse = async (user, statusCode, req, res) => {
  // Generate Access Token (short-lived: 15 minutes)
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Generate Refresh Token (long-lived: 7 days)
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'emahu_super_secret_refresh_key_2026';
  const refreshTokenString = jwt.sign(
    { id: user._id },
    refreshSecret,
    { expiresIn: '7d' }
  );

  // Set expiry date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Get user-agent and IP address details
  const device = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';

  // Store refresh token in database
  await RefreshToken.create({
    user: user._id,
    token: refreshTokenString,
    expiresAt,
    device,
    ipAddress
  });

  // HTTP-Only Cookie options for top-tier security
  const cookieOptions = {
    httpOnly: true,
    expires: expiresAt,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies only on HTTPS in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
  };

  // Return Response
  return res
    .status(statusCode)
    .cookie('refreshToken', refreshTokenString, cookieOptions)
    .json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Simple validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter name, email, and password'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'buyer',
      phone,
      address
    });

    // Send JWT and store refresh session
    await sendTokenResponse(user, 201, req, res);
  } catch (error) {
    console.error('Registration Error:', error);

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages[0]
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server Error during registration'
    });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Check if user exists (include password)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Send JWT and store refresh session
    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error during login'
    });
  }
};

// @desc    Authenticate user via Google (OAuth Simulation / JWT parsing)
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { email, name, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid Google email'
      });
    }

    // Find if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create user if not exists (Sign up)
      console.log(`Google user not found. Creating new user with email ${email} and role ${role || 'buyer'}`);
      
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: `google_${Math.random().toString(36).substring(2, 12)}`, // randomized dummy password
        role: role || 'buyer',
        phone: '+91 99999 99999',
        address: 'Google Account Address'
      });
    } else {
      console.log(`Google user found: ${user.name} (${user.email})`);
    }

    // Send JWT and store refresh session
    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error during Google authentication'
    });
  }
};

// @desc    Refresh session and get a new access token (Refresh Token Rotation)
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: No refresh session cookie found'
      });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'emahu_super_secret_refresh_key_2026';

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      // Clear invalid cookie
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: Invalid or expired session'
      });
    }

    // Find token in database
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      // Reuse detection or revoked session: clear cookie
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: Session has been logged out or revoked'
      });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: User no longer exists'
      });
    }

    // Delete the old refresh token (Rotation!)
    await storedToken.deleteOne();

    // Send new access token and rotated refresh token
    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    console.error('Refresh Session Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error during token refresh'
    });
  }
};

// @desc    Logout user & invalidate session
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Remove refresh token from database so it is revoked permanently
      await RefreshToken.findOneAndDelete({ token: refreshToken });
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out and session revoked'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error during logout'
    });
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error getting user profile'
    });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/update-details
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name || req.user.name,
      phone: req.body.phone !== undefined ? req.body.phone : req.user.phone,
      address: req.body.address !== undefined ? req.body.address : req.user.address
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Profile details updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Update Details Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error during profile update'
    });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current and new passwords'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    // Get user from DB with password included
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Set and save new password (pre-save hook will encrypt it automatically)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update Password Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error during password update'
    });
  }
};
