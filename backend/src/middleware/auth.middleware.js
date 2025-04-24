import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import { db } from "../libs/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return next(new AppError("Unauthorized - no token provided", 401));
    }

    console.log("token => ", token);

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.log("Unauthorized", error);
      return next(new AppError("Unauthorized - invalid token", 401));
    }

    const user = await db.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        image: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    req.user = user;
    return next();
  } catch (error) {
    console.log("Unauthorized", error);
    return next(new AppError("Unauthorized- middleware", 500));
  }
};
