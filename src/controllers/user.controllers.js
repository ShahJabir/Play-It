import asyncHandler from "./../utills/asyncHandler.js";
import ApiError from "./../utills/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "./../utills/Cloudinary.js";
import ApiRes from "../utills/ApiRes.js";

const generateAccessandRefressToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const refressToken = user.generateRefressToken();
    const accessToken = user.generateAccessToken();
    user.refressToken = refressToken;
    await user.save({ validateBeforeSave: false });
    return { refressToken, accessToken };
  } catch (error) {
    throw new ApiError(400, "Token Generate Failed");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user data from frontend
  const { fullName, email, username, password } = req.body;
  const data = {
    fullName: `${fullName}`,
    username: `${username}`,
    email: `${email}`,
    password: `${password}`,
  };
  console.log(
    `fullName: ${fullName}, username: ${username}, email: ${email}, password: ${password}`
  );

  // Data Validation

  if (
    [fullName, email, username, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, `field is required`);
  }

  // Check User already exists: username, email

  const exitedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (exitedUser) {
    throw new ApiError(409, "User already exited");
  }

  // Check avatar image and cover image

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(409, "Avatar file is required");
  }

  // Upload avatar image and cover image in Couldinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(409, "Avatar Image have issue to upload in Server");
  }

  // create user object in DB

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // DB create validation
  if (!createdUser) {
    throw new ApiError(500, "Server Error to registering Data");
  }

  // return responce
  return res
    .status(201)
    .json(new ApiRes(200, createdUser, "User Registration Successful"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Get and verify Login Data From Frontend
  const [username, email, password] = req.body();
  if (!username || !email) {
    throw new ApiError(400, "Username or Email and Password required");
  }
  if (!password) {
    throw new ApiError(400, "Password required");
  }
  // find the user or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(
      400,
      "User not Found, Plz make sure you already have a account"
    );
  }
  // check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Password is not valid");
  }
  // generate access token and refresh token
  const { refressToken, accessToken } = await generateAccessandRefressToken(
    user._id
  );
  // send cookie
  const loggedInUser = [
    user._id,
    user.fullName,
    user.username,
    user.email,
    user.accessToken,
  ];

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refressToken", refressToken, options)
    .json(
      new ApiRes(
        200,
        {
          user: loggedInUser,
          accessToken,
          refressToken,
        },
        "User Logged In Successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export { registerUser, loginUser, logoutUser };
