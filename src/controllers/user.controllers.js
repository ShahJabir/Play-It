import asyncHandler from "./../utills/asyncHandler.js";
import ApiError from "./../utills/ApiError";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "./../utills/Cloudinary";
import ApiRes from "../utills/ApiRes.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user data from frontend
  const { fullname, email, username, password } = req.body;
  const data = {
    fullname: `${fullname}`,
    username: `${username}`,
    email: `${email}`,
    password: `${password}`,
  };
  console.log(
    `fullname: ${fullname}, username: ${username}, email: ${email}, password: ${password}`
  );

  // Data Validation

  if (
    [fullname, email, username, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, `field is required`);
  }

  // Check User already exists: username, email

  const exitedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (exitedUser) {
    throw new ApiError(409, "User already exited");
  }

  // Check avatar image and cover image

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export default registerUser;
