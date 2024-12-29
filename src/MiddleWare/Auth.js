import jwt from "jsonwebtoken";
import userModel from "../../DB/Model/User.Model.js";
import SupervisorModel from "../../DB/Model/Supervisor.Model.js";

export const roles = {
  Admin: "Admin",
  User: "Student",
  Manager: "Supervisor",
};

export const auth = (accessRole = []) => {
  return async (req, res, next) => {
    try {
      const { authorization } = req.headers;
      if (!authorization?.startsWith(process.env.BEARERKEY)) {
        return res.status(400).json({ message: "Invalid authorization" });
      }

      const token = authorization.split(process.env.BEARERKEY)[1];
      const decoded = jwt.verify(token, process.env.LOGINSINGURE);
      if (!decoded) {
        return res.status(400).json({ message: "Invalid authorization" });
      }
      let user = await userModel.findById(decoded.id).select("userName role email");
      if (!user) {
        const supervisor = await SupervisorModel.findById(decoded.id).select(
          "Name role email"
        );
        if (!supervisor) {
          return res
            .status(403)
            .json({ message: "User not found in both User and Supervisor tables" });
        }
        user = supervisor;
      }

      if (!accessRole.includes(user.role)) {
        return res.status(403).json({ message: "Not authorized user" });
      }

      req.user = user;
      req.user.email = decoded.email; 
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Authorization failed", error });
    }
  };
};
