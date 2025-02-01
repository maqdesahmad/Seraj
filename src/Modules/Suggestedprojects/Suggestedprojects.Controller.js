import SuggestedprojectModel from "../../../DB/Model/Suggestedprojects.Model.js";
import SupervisorModel from "../../../DB/Model/Supervisor.Model.js";
import UserModel from "../../../DB/Model/User.Model.js";
import { sendEmail } from "../../Services/Email.js";
import BoardModel from '../../../DB/Model/Board.Model.js';
import ListModel from '../../../DB/Model/List.Model.js'; 
import mongoose from "mongoose";

export const AddSuggestedProjects = async (req, res) => {
  try {
    const { projectName, supervisor, college, department, projectIdea } = req.body;

    const supervisorId = new mongoose.Types.ObjectId(supervisor);

    const supervisorExists = await SupervisorModel.findById(supervisorId);
    if (!supervisorExists) {
      return res.status(400).json({ message: "Supervisor does not exist" });
    }

    const existingProject = await SuggestedprojectModel.findOne({projectName});

    if (existingProject) {
      return res
        .status(400)
        .json({ message: "Suggested Project with this name already exists" });
    }

    let projectFile = null;
    if (req.file) {
      const filePath = req.file.path;
      projectFile = `http://localhost:4000/${filePath}`; 
    }

    const newProject = new SuggestedprojectModel({
      projectName,
      supervisor: supervisorId,
      college,
      department,
      projectIdea,
      projectFile: req.file?.path,
    });

    await newProject.save();
    res.status(201).json({message: "Suggested Project added successfully", project: newProject});
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding project", error });
  }
};

export const ReserveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { teamMembers } = req.body;
    const userId = req.user._id;

    const emails = teamMembers.map((member) => member.email);
 
    const missingMembers = [];
    await Promise.all(
      teamMembers.map(async (member) => {
        const userExists = await UserModel.findOne({ email: member.email });
        if (!userExists) {
          missingMembers.push(member.email);
        }
      })
    );

    if (missingMembers.length > 0) {
      return res.status(400).json({
        message: "The following team members do not exist in the database.",
        missingMembers,
      });
    }
    const existingEmails = await SuggestedprojectModel.findOne({
      "reservation.teamMembers.email": { $in: emails },
      "reservation.approved": { $ne: false },  
    });

    if (existingEmails) {
      return res.status(400).json({
        message: "One or more team members' emails are already associated with another reservation.",
        existingEmails,
      });
    }

    const project = await SuggestedprojectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (
      project.reservation && 
      (project.reservation.approved === true || 
       (project.reservation.approved === null && project.reservation.teamMembers?.length > 0))
    ) {
      return res.status(400).json({ message: "Project is already reserved or pending approval" });
    }    

    project.reservation = {
      reservedBy: userId,
      teamMembers: teamMembers.map((member) => ({
        email: member.email,
        name: member.name,
        registrationNumber: member.registrationNumber,
      })),
      approved: null,
    };
    
    await project.save();
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const emailSubject = "Project Reservation Confirmation";
    const emailContent = `
      <html>
        <body>
          <p>Dear ${user.Name},</p>
          <p>Congratulations! You have successfully reserved the project "${project.projectName}".</p>
          <p>Your reservation is now pending approval by the project supervisor.</p>
        </body>
      </html>
    `;

    await sendEmail(user.email, emailSubject, emailContent);

    res.status(200).json({
      message: "Project reserved successfully and email sent",
      project,
    });
  } catch (error) {
    console.error("Error reserving project:", error);
    res.status(500).json({ message: "Error reserving project", error });
  }
};

export const approveOrRejectReservation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { approved } = req.body;
    const supervisorId = req.user._id;

    if (!supervisorId) {
      return res.status(400).json({ message: "Supervisor ID is missing in the token" });
    }

    const project = await SuggestedprojectModel.findById(projectId)
      .populate("supervisor", "Name email")
      .populate("reservation.reservedBy", "Name email")

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.reservation) {
      return res.status(400).json({ message: "Reservation not found" });
    }

    if (project.supervisor._id.toString() !== supervisorId.toString()) {
      return res.status(403).json({
        message: "Only the supervisor who suggested the project can approve it",
      });
    }

    project.reservation.approved = approved;

    await project.save();

    const reservedBy = project.reservation.reservedBy?.Name || "User";
    const reservedByEmail = project.reservation.reservedBy?.email;

    const statusMessage = approved
      ? `Your reservation for "${project.projectName}" has been approved! 🎉`
      : `Your reservation for "${project.projectName}" has been rejected.`;
    const emailSubject = approved
      ? `Project Reservation Approved!`
      : `Project Reservation Rejected`;
    const emailText = `
      <html>
        <body>
          <p>Dear ${reservedBy},</p>
          <p>${statusMessage}</p>
        </body>
      </html>`;

    if (reservedByEmail) {
      await sendEmail(reservedByEmail, emailSubject, emailText);
    }

    await project.save();
    if (approved) {
      const board = new BoardModel({
        name: `Board for project ${project.projectName}`,
        project: projectId,
      });

      await board.save();

      const toDoList = new ListModel({ name: "To Do", board: board._id });
      const inProgressList = new ListModel({ name: "In Progress", board: board._id });
      const completedList = new ListModel({ name: "Completed", board: board._id });

      await toDoList.save();
      await inProgressList.save();
      await completedList.save();

      board.lists = [toDoList._id, inProgressList._id, completedList._id];
      project.board = board._id;
      await project.save();
    }

    res.status(200).json({
      message: `Reservation ${statusMessage}`,
      project,
    });
  } catch (error) {
    console.error("Error approving/rejecting reservation:", error);
    res.status(500).json({ message: "Error approving/rejecting reservation", error });
  }
};

export const getSuggestedProjects = async (req, res) => {
  try {
    const projects = await SuggestedprojectModel.find()
      .populate("supervisor", "supervisorName")
      .populate("college", "collegeName")
      .populate("department", "departmentName");

    res.status(200).json({ message: "Projects", projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error });
  }
};

export const deleteSuggestedProjects = async (req, res) => {
  try {
    const { id } = req.params;
    await SuggestedprojectModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Suggested Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error });
  }
};

// export const getUnreservedProjects = async (req, res) => {
//   try {
//     const unreservedProjects = await SuggestedprojectModel.find({
//       $or: [
//         { reservation: { $exists: false } },
//         { "reservation.reservedBy": { $exists: false } },
//         { "reservation.approved": false },
//       ],
//     })
//       .populate("supervisor", "supervisorName")
//       .populate("college", "collegeName")
//       .populate("department", "departmentName");

//     res.status(200).json({ message: "Unreserved Projects", projects: unreservedProjects });
//   } catch (error) {
//     console.error("Error fetching unreserved projects:", error);
//     res.status(500).json({ message: "Error fetching unreserved projects", error });
//   }
// };
export const getUnreservedProjects = async (req, res) => {
  try {
    const unreservedProjects = await SuggestedprojectModel.find({
      "reservation.approved": false,
      supervisor: req.user._id
    })
      .populate("supervisor", "supervisorName") // Populate supervisorName
      .populate("college", "collegeName") // Populate collegeName
      .populate("department", "departmentName"); // Populate departmentName

    res.status(200).json({ message: "Projects where approved is false", projects: unreservedProjects });
  } catch (error) {
    console.error("Error fetching unreserved projects:", error);
    res.status(500).json({ message: "Error fetching unreserved projects", error });
  }
};
export const getUnreservedProject = async (req, res) => {
  try {
    const {id} = req.params;
    const unreservedProjects = await SuggestedprojectModel.find({
      "reservation.approved": false,
      _id: id
    })
      .populate("supervisor", "supervisorName") // Populate supervisorName
      .populate("college", "collegeName") // Populate collegeName
      .populate("department", "departmentName"); // Populate departmentName

    res.status(200).json({ message: "Projects where approved is false", projects: unreservedProjects });
  } catch (error) {
    console.error("Error fetching unreserved projects:", error);
    res.status(500).json({ message: "Error fetching unreserved projects", error });
  }
};
export const getAllUnreservedProjects = async (req, res) => {
  try {
    const unreservedProjects = await SuggestedprojectModel.find({
      "reservation.approved": false,
    })
      .populate("supervisor", "supervisorName") // Populate supervisorName
      .populate("college", "collegeName") // Populate collegeName
      .populate("department", "departmentName"); // Populate departmentName

    res.status(200).json({ message: "Projects where approved is false", projects: unreservedProjects });
  } catch (error) {
    console.error("Error fetching unreserved projects:", error);
    res.status(500).json({ message: "Error fetching unreserved projects", error });
  }
};

export const getPendingProjects = async (req, res) => {
  try {
    const reservedProjects = await SuggestedprojectModel.find({
      $and: [
        { "reservation.reservedBy": { $exists: true } }, 
        { "reservation.approved": null },
        { "reservation.teamMembers": { $exists: true, $ne: [] } },
      ],
    })
      .populate("supervisor", "supervisorName")
      .populate("college", "collegeName")
      .populate("department", "departmentName");

    res.status(200).json({ message: "Reserved Projects with Team Members", projects: reservedProjects });
  } catch (error) {
    console.error("Error fetching reserved projects with team members:", error);
    res.status(500).json({ message: "Error fetching reserved projects with team members", error });
  }
};

export const getAcceptProjects = async (req, res) => {
  try {
    const reservedProjects = await SuggestedprojectModel.find({
      $and: [
        { "reservation.reservedBy": { $exists: true } }, 
        { "reservation.approved": true },
        { "reservation.teamMembers": { $exists: true, $ne: [] } },
      ],
    })
      .populate("supervisor", "supervisorName")
      .populate("college", "collegeName")
      .populate("department", "departmentName");

    res.status(200).json({ message: "Reserved Projects with Team Members", projects: reservedProjects });
  } catch (error) {
    console.error("Error fetching reserved projects with team members:", error);
    res.status(500).json({ message: "Error fetching reserved projects with team members", error });
  }
};
