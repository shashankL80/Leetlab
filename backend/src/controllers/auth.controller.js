import bcrypt from "bcryptjs";
import { db } from "../libs/db.js";
import AppError from "../utils/appError.js";
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import sendResponse from "../utils/sendResponse.js";

export const register = async (req, res, next) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return next(new AppError("User already exists", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name,
        role: UserRole.USER,
      },
    });

    const token = jwt.sign(
      {
        id: newUser.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User created successfully",
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          image: newUser.image,
        },
      },
    });
  } catch (error) {
    console.log("Error creating user : ", error);
    next(new AppError("Error creating user", 500));
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      next(new AppError("No user found", 401));
    }

    const isMatchPassword = await bcrypt.compare(password, user.password);

    if (!isMatchPassword) {
      next(new AppError("Invalid credentials", 401));
    }

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User logged in successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        },
      },
    });
  } catch (error) {
    console.log("Error logging user", error);
    next(new AppError("Error logging user", 500));
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User logout successfully",
    });
  } catch (error) {
    console.log("Error logout user", error);
    next(new AppError("Error logout user", 500));
  }
};

export const check = async (req, res, next) => {
  try {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User authenticated successfully",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.log("Unauthorized", error);
    next(new AppError("Unauthorized", 500));
  }
};
