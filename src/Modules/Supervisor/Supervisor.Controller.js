import CollegeModel from "../../../DB/Model/College.Model.js";
import DepartmentModel from "../../../DB/Model/DepartmentModel.js";
import SupervisorModel from "../../../DB/Model/Supervisor.Model.js";
import bcrypt from "bcrypt";
import UserModel from "../../../DB/Model/User.Model.js";
import { sendEmail } from "../../Services/Email.js";

export const AddSupervisor = async (req, res) => {
    const {
      supervisorName,
      collegeId,
      departmentId,
      email,
      password,
      maxGroups,
    } = req.body;
  
    try {
      const college = await CollegeModel.findById(collegeId);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }
      const department = await DepartmentModel.findOne({
        _id: departmentId,
        college: collegeId,
      });
      if (!department) {
        return res
          .status(404)
          .json({ message: "Department not found in the specified college" });
      }
      const existingSupervisor = await SupervisorModel.findOne({ email });
      const existingUser = await UserModel.findOne({ email });
  
      if (existingSupervisor || existingUser) {
        return res
          .status(400)
          .json({ message: "Email already exists in the system" });
      }
      const hashedpassword = bcrypt.hashSync(
        password,
        parseInt(process.env.SALT_ROUND)
      );
      const newSupervisor = new SupervisorModel({
        supervisorName,
        college: collegeId,
        department: departmentId,
        email,
        password: hashedpassword,
        status: "active",
        maxGroups,
      });
  
      await newSupervisor.save();
  
      res.status(201).json({
        message: "Supervisor added successfully",
        supervisor: newSupervisor,
      });
    } catch (error) {
      res.status(500).json({ message: "Error adding supervisor", error });
    }
  };
  
  export const GetSupervisors = async (req, res) => {
    try {
      const { departmentId } = req.params;
  
      if (!departmentId) {
        return res.status(400).json({ message: "Department ID is required" });
      }
  
      const supervisors = await SupervisorModel.find({ department: departmentId })
        .populate("college", "collegeName")
        .populate("department", "departmentName");
  
      if (!supervisors || supervisors.length === 0) {
        return res.status(404).json({ message: "No supervisors found" });
      }
  
      res.status(200).json({
        message: "Supervisors retrieved successfully",
        supervisors,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching supervisors", error });
    }
  };
  
  export const GetActiveSupervisors = async (req, res) => {
    try {
      const supervisors = await SupervisorModel.find({
        status: "active",
      })
        .populate("college", "collegeName")
        .populate("department", "departmentName");
  
      if (!supervisors || supervisors.length === 0) {
        return res.status(404).json({ message: "No active supervisors found" });
      }
  
      res.status(200).json({
        message: "Active supervisors retrieved successfully",
        supervisors,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching supervisors", error });
    }
  };
  
  export const GetPendingSupervisors = async (req, res) => {
    try {
      const supervisors = await SupervisorModel.find({
        status: "pending",
      })
        .populate("college", "collegeName")
        .populate("department", "departmentName");
  
      if (!supervisors || supervisors.length === 0) {
        return res.status(404).json({ message: "No pending supervisors found" });
      }
  
      res.status(200).json({
        message: "pending supervisors retrieved successfully",
        supervisors,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching supervisors", error });
    }
  };
  
  export const DeleteSupervisor = async (req, res) => {
    const { supervisorId } = req.params;
    try {
      const supervisor = await SupervisorModel.findById(supervisorId);
      if (!supervisor) {
        return res.status(404).json({ message: "Supervisor not found" });
      }
      await SupervisorModel.findByIdAndDelete(supervisorId);
  
      res.status(200).json({ message: "Supervisor deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting supervisor", error });
    }
  };
  
  export const ReserveSupervisor = async (req, res) => {
    try {
      const { supervisorId } = req.params;
      const { teamName, teamMembers } = req.body;
      const userId = req.user._id;
  
      const supervisor = await SupervisorModel.findById(supervisorId);
      if (!supervisor) {
        return res.status(404).json({ message: "Supervisor not found" });
      }
  
      const teamExists = supervisor.reservation.teams.some(team => team.teamName === teamName);
      if (teamExists) {
        return res.status(400).json({ message: `The team name "${teamName}" has already been reserved.` });
      }
  
      if (!supervisor.reservation || !Array.isArray(supervisor.reservation.teams)) {
        supervisor.reservation = { teams: [] };
      }
  
      const reservedTeamsCount = supervisor.reservation.teams.filter(
        (team) => team.approved !== false
      ).length;
  
      if (reservedTeamsCount >= supervisor.maxGroups) {
        return res.status(400).json({
          message: `The supervisor can only accommodate ${supervisor.maxGroups} teams. Currently, there are ${reservedTeamsCount} reserved teams (approved or pending).`,
        });
      }
  
      const missingMembers = [];
      const alreadyReservedMembers = [];
      await Promise.all(
        teamMembers.map(async (member) => {
          const userExists = await UserModel.findOne({ email: member.email });
          if (!userExists) {
            missingMembers.push(member.email);
          } else {
            const isReserved = await SupervisorModel.findOne({
              $or: [
                { "reservation.teams.approved": null },
                { "reservation.teams.approved": true }
              ]
            });
            if (isReserved) {
              alreadyReservedMembers.push(member.email);
            }
          }
        })
      );
  
      if (missingMembers.length > 0) {
        return res.status(400).json({
          message: "The following team members do not exist in the database.",
          missingMembers,
        });
      }
  
      if (alreadyReservedMembers.length > 0) {
        return res.status(400).json({
          message: "The following team members have already reserved a supervisor.",
          alreadyReservedMembers,
        });
      }
  
      supervisor.reservation.teams.push({
        teamName,
        approved: null,
        reservedBy: userId,
        members: teamMembers,
      });
  
      await supervisor.save();
  
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const emailSubject = "Supervisor Reservation Confirmation";
      const emailContent = `
        <html>
          <body>
            <p>Dear ${user.Name},</p>
            <p>Congratulations! You have successfully reserved a supervisor for your team: ${teamName}.</p>
            <p>Your reservation is now pending approval by the supervisor.</p>
          </body>
        </html>
      `;
  
      await sendEmail(user.email, emailSubject, emailContent);
  
      res.status(200).json({
        message: "Team reserved successfully and email sent",
      });
    } catch (error) {
      console.error("Error reserving team:", error);
      res.status(500).json({ message: "Error reserving team", error });
    }
  };
  
  export const approveOrRejectReservation = async (req, res) => {
    try {
      const { supervisorId } = req.params;
      const { teamName, approved, teamMemberId } = req.body;
      const userId = req.user._id;
  
      const supervisor = await SupervisorModel.findById(supervisorId);
      if (!supervisor) {
        return res.status(404).json({ message: "Supervisor not found" });
      }
  
      if (supervisor._id.toString() !== userId.toString()) {
        return res.status(403).json({
          message: "Only the supervisor who owns this reservation can approve or reject it",
        });
      }
  
      if (!supervisor.reservation || !supervisor.reservation.teams) {
        return res.status(400).json({
          message: "Reservation data or teams are missing for this supervisor",
        });
      }
  
      let reservedBy;
      let teamMemberFound = false;
  
      const team = supervisor.reservation.teams.find(
        (team) => team.teamName === teamName
      );
  
      if (!team) {
        return res.status(404).json({ message: `Team ${teamName} not found in reservation.` });
      }
      const member = team.members.find(
        (member) => team.reservedBy.toString() === teamMemberId.toString()
      );
  
      if (!member) {
        return res.status(404).json({ message: "Team member not found in this group" });
      }
  
      team.approved = approved;
      reservedBy = team.reservedBy;  
  
      await supervisor.save();
  
      const user = await UserModel.findById(reservedBy);
      if (!user || !user.email) {
        return res.status(400).json({ message: "User details are missing for this reservation" });
      }
  
      const statusMessage = approved
        ? `Your reservation for supervisor ${supervisor.supervisorName} has been approved! 🎉`
        : `Your reservation for supervisor "${supervisor.supervisorName}" has been rejected.`;
  
      const emailSubject = approved
        ? `Supervisor Reservation Approved!`
        : `Supervisor Reservation Rejected`;
  
      const emailText = `
        <html>
          <body>
            <p>Dear ${user.Name},</p>
            <p>${statusMessage}</p>
          </body>
        </html>`;
  
      await sendEmail(user.email, emailSubject, emailText);
  
      res.status(200).json({
        message: `Reservation ${approved ? "approved" : "rejected"} for the team member`,
      });
    } catch (error) {
      console.error("Error approving/rejecting reservation:", error);
      res.status(500).json({ message: "Error approving/rejecting reservation", error });
    }
  };
  
  export const GetSupervisorGroups = async (req, res) => {
    try {
      const { supervisorId } = req.params;
      const supervisor = await SupervisorModel.findById(supervisorId);
  
      if (!supervisor) {
        return res.status(404).json({ message: "Supervisor not found" });
      }
  
      const teams = supervisor.reservation?.teams || [];
  
      res.status(200).json({
        message: "Teams retrieved successfully",
        teams, 
      });
    } catch (error) {
      console.error("Error retrieving teams:", error);
      res.status(500).json({ message: "Error retrieving teams", error });
    }
  };