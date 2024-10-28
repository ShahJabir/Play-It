import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    try {
      app.listen(process.env.PORT || 8080, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
      });
    } catch (error) {
      app.on("Error:", error);
      throw error;
    }
  })
  .catch((err) => {
    console.log(err);
  });
