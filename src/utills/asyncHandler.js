const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };

  //   return async (err, req, res, next) => {
  //     try {
  //       await requestHandler(err, req, res, next);
  //     } catch (error) {
  //       res.status(err.code || 500).json({
  //         success: false,
  //         message: err.message,
  //       });
  //       console.error(`asyncHandler error : ${error}`);
  //     }
  //   };
};

export default asyncHandler;
