import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import UserModel from "../../../DB/Model/User.Model.js";
import { sendEmail } from "../../Services/Email.js";
import SupervisorModel from "../../../DB/Model/Supervisor.Model.js";

export const SignUp = async (req, res) => {
  const { Name, email, password, role, college, department } = req.body;

  const User = await UserModel.findOne({ email });
  if (User) {
    return res.status(404).json({ message: "Email already exists" });
  }
  const existingSupervisor = await SupervisorModel.findOne({ email });
  if (existingSupervisor) {
    return res
      .status(404)
      .json({ message: "Supervisor with this email already exists" });
  }

  const validRoles = ["Student", "Supervisor", "Admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (role === "Student") {
    const validDomain = "@students.ptuk.edu.ps";
    if (!email.endsWith(validDomain)) {
      return res
        .status(400)
        .json({ message: `Email must end with ${validDomain}` });
    }
  }

  if (!college || !department) {
    return res
      .status(400)
      .json({ message: "College and Department are required" });
  }

  const hashedpassword = bcrypt.hashSync(
    password,
    parseInt(process.env.SALT_ROUND)
  );

  const token = jwt.sign({ email, role }, process.env.ConfirmEmailSecure);

  await sendEmail(
    email,
    "Confirm Your Email",
    `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #004d40c3; text-align: center;">Welcome to Seraj Website!</h2>
      <p>Hello,</p>
      <p>Thank you for signing up! To complete your registration, please confirm your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${req.protocol}://${req.headers.host}/auth/confirmEmail/${token}" 
           style="background-color: #004d40c3; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">
          Verify Your Email
        </a>
      </div>
      <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all;">${req.protocol}://${req.headers.host}/auth/confirmEmail/${token}</p>
      <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="text-align: center; font-size: 12px; color: #999;">
        If you didn't request this, please ignore this email. This is an automated message, please do not reply.
      </p>
    </div>
    `
  );

  if (role === "Supervisor") {
    try {
      const supervisor = await SupervisorModel.create({
        supervisorName: Name,
        status: "active",
        role: "Supervisor",
        password: hashedpassword,
        email,
        college,
        department
      });

      const populatedSupervisor = await SupervisorModel.findById(supervisor._id)
        .populate("college", "collegeName")
        .populate("department", "departmentName");

      const supervisorData = {
        id: populatedSupervisor._id,
        supervisorName: populatedSupervisor.supervisorName,
        email: populatedSupervisor.email,
        role,
        status: populatedSupervisor.status,
        college: populatedSupervisor.college?.collegeName,
        department: populatedSupervisor.department?.departmentName,
        sendCode: populatedSupervisor.sendCode,
        isConfirmed: false
      };

      return res
        .status(201)
        .json({
          message: "Supervisor created successfully",
          user: supervisorData,
        });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Failed to create supervisor record", error });
    }
  }

  try {
    const createUser = await UserModel.create({
      Name,
      email,
      role,
      status: "active",
      college,
      department,
      password: hashedpassword,
    });

    const userWithDetails = await UserModel.findById(createUser._id)
      .populate("college", "collegeName")
      .populate("department", "departmentName");

    const userData = {
      id: userWithDetails._id,
      Name: userWithDetails.Name,
      email: userWithDetails.email,
      role: userWithDetails.role,
      status: userWithDetails.status,
      sendCode: userWithDetails.sendCode,
      college: userWithDetails.college.collegeName,
      department: userWithDetails.department.departmentName,
      isConfirmed: userWithDetails.confirmpassword,
    };

    return res.status(201).json({ message: "success", user: userData });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create user", error });
  }
};

export const SignIn = async (req, res, next) => {
  const { email, password } = req.body;

  let user = await UserModel.findOne({ email });
  if (!user) {
    user = await SupervisorModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email" });
    }
  }
  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return res.status(404).json({ message: "Invalid password" });
  }
  if (
    user.role === "Supervisor" &&
    (user.status === "pending" || user.status === "rejected")
  ) {
    return res.status(403).json({
      message: "Your account is pending or rejected. Please contact the admin.",
    });
  }
  if (user.confirmEmail === false) {
    return res
      .status(403)
      .json({ message: "Please confirm your email before logging in." });
  }
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.LOGINSINGURE,
    { expiresIn: "1h" }
  );
  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.LOGINSINGURE,
    { expiresIn: 60 * 60 * 24 * 30 }
  );
  return res.status(200).json({
    message: "success",
    token,
    refreshToken,
    id: user._id,
    role: user.role,
    email: user.email
  });
};

export const ConfirmEmail = async (req, res) => {
  const token = req.params.token;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ConfirmEmailSecure);
  } catch (err) {
    return res.status(404).json({ message: "Invalid token" });
  }
  if (!decoded || !decoded.role) {
    return res.status(400).json({ message: "Role not found in token" });
  }
  if (decoded.role === "Student") {
    const user = await UserModel.findOneAndUpdate(
      { email: decoded.email, confirmEmail: false },
      { confirmEmail: true }
    );
    if (!user) {
      return res
        .status(400)
        .json({
          message: "Invalid verify your email or your email is verified",
        });
    }
    return res.status(200).json({ message: "Your email is verified" });
  }
  if (decoded.role === "Supervisor") {
    const userS = await SupervisorModel.findOneAndUpdate(
      { email: decoded.email, confirmEmail: false },
      { confirmEmail: true }
    );
    if (!userS) {
      return res
        .status(400)
        .json({
          message: "Invalid verify your email or your email is verified",
        });
    }
    return res
      .status(200)
      .json({
        message: "Your email is verified",
      });
  }
  return res.status(200).json({ message: "your email is verified" });
};

export const SendCode = async (req, res) => {
  const { email } = req.body;
  let code = customAlphabet("1234567890", 4);
  code = code();
  const User = await UserModel.findOneAndUpdate(
    { email },
    { sendCode: code },
    { new: true }
  );

  const Supervisor = await SupervisorModel.findOneAndUpdate(
    { email },
    { sendCode: code },
    { new: true }
  );
  const userOrSupervisor = User || Supervisor;

  if (!userOrSupervisor) {
    return res.status(404).json({ message: "User or Supervisor not found" });
  }
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #004d40c3; text-align: center;">Password Reset Code</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Use the code below to reset it:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #004d40c3 ; background: #f7f7f7; padding: 10px 20px; border-radius: 5px; display: inline-block;">
          ${code}
        </span>
      </div>
      <p>If you didn't request this, please ignore this email. This code will expire shortly.</p>
      <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="text-align: center; font-size: 12px; color: #999;">
        This is an automated message, please do not reply.
      </p>
    </div>
  `;
  await sendEmail(email, `Reset Password`, html);

  return res.status(200).json({ message: "Success", user: userOrSupervisor });
};

export const forgetPassword = async (req, res) => {
  const { email, code, password, confirmpassword } = req.body;
  const user = await UserModel.findOne({ email });
  const supervisor = await SupervisorModel.findOne({ email });

  const userOrSupervisor = user || supervisor;
  if (!userOrSupervisor) {
    return res.status(404).json({ message: "Email not found" });
  }

  if (userOrSupervisor.sendCode !== code) {
    return res.status(400).json({ message: "Invalid code" });
  }

  let match = await bcrypt.compare(password, userOrSupervisor.password);
  if (match) {
    return res.status(409).json({ message: "Same password" });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  userOrSupervisor.password = await bcrypt.hash(
    password,
    parseInt(process.env.SALT_ROUND)
  );
  userOrSupervisor.sendCode = null;

  await userOrSupervisor.save();
  return res.status(200).json({ message: "Success" });
};

export const Logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    const decoded = jwt.decode(refreshToken);
    if (!decoded) {
      return res.status(400).json({ message: "Invalid token" });
    }
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

export const getRoles = async (req, res) => {
  const roles = [
    { id: "1", role: "Student" },
    { id: "2", role: "Supervisor" },
  ];
  return res.status(200).json({ message: "success", roles });
};

export const getStatus = async (req, res) => {
  const Status = [
    { id: "1", status: "active" },
    { id: "2", status: "pending" },
    { id: "3", status: "rejected" },
  ];
  return res.status(200).json({ message: "success", Status });
};
