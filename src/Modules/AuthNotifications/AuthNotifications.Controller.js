import SupervisorModel from "../../../DB/Model/Supervisor.Model.js";
import { sendEmail } from "../../Services/Email.js";

export const getpendingSupervisors = async (req, res) => {
  try {
    const pendingSupervisors = await SupervisorModel.find({
      status: "pending",
    })
      .populate("college", "collegeName")
      .populate("department", "departmentName");

    return res
      .status(200)
      .json({ message: "Success", Supervisors: pendingSupervisors });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch pending supervisors",
      error,
    });
  }
};

export const updateSupervisorStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const allowedStatuses = ["active", "pending", "rejected"];
  if (!allowedStatuses.includes(status)) {
    return res
      .status(400)
      .json({
        message:
          "Invalid status. Choose one of the following: active, pending, rejected",
      });
  }

  const Supervisor = await SupervisorModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!Supervisor) {
    return res.status(404).json({ message: "Supervisor not found" });
  }

  await notifySupervisor(Supervisor.email, status);
  return res
    .status(200)
    .json({ message: "Supervisor status updated", Supervisor });
};

export const notifySupervisor = async (email, status) => {
  const subject =
    status === "active" ? "🎉 Congratulations! Your Account Has Been Approved" : "❗ Important: Your Account Request";

  const html =
    status === "active"
      ? `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #004d40c3;">Account Approved</h2>
          <p>We are delighted to inform you that your account has been successfully approved. You can now log in and start using our platform. We look forward to seeing you onboard!</p>
          <br />
          <p>Best regards,</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #E74C3C;">Account Rejected</h2>
          <p>Thank you for your interest in joining our platform. Unfortunately, after careful review, we were unable to approve your account at this time.</p>
          <p>If you have any questions or believe this decision was made in error, please don’t hesitate to <a href="mailto:maqdes.ahmad@gmail.com" style="color: #E74C3C;">contact Admin</a> for assistance.</p>
          <br />
          <p>Best regards,</p>
        </div>
      `;

  await sendEmail(email, subject, html);
};
