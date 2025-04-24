const sendResponse = (
  res,
  { statusCode = 200, success = true, message = "", data = null }
) => {
  res.status(statusCode).json({
    success,
    message,
    ...(data && { data }),
  });
};

export default sendResponse;
