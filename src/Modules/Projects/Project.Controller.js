import CollegeModel from "../../../DB/Model/College.Model.js";
import ProjectModel from "../../../DB/Model/Project.Model.js";
import mongoose from "mongoose";
import SupervisorModel from "../../../DB/Model/Supervisor.Model.js";

export const AddProjects = async (req, res) => {
  try {
    const { projectName, supervisor, college, department, projectIdea } = req.body;
    if (!mongoose.Types.ObjectId.isValid(college)) {
      return res.status(400).json({ message: "Invalid college ID format" });
    }

    const collegeObjectId = new mongoose.Types.ObjectId(college);
    const collegeData = await CollegeModel.findById(collegeObjectId);

    if (!collegeData) {
      return res.status(400).json({ message: "College not found" });
    }
    if (!collegeData.departments.includes(department)) {
      return res.status(400).json({ message: "Department does not belong to this college" });
    }

    const existingProject = await ProjectModel.findOne({ projectName });
    if (existingProject) {
      return res.status(400).json({ message: "Project with this name already exists" });
    }

    const supervisorId = new mongoose.Types.ObjectId(supervisor);

    const supervisorExists = await SupervisorModel.findById(supervisorId);
    if (!supervisorExists) {
      return res.status(400).json({ message: "Supervisor does not exist" });
    }

    let projectFile = null;
    if (req.file) {
      const filePath = req.file.path;
      projectFile = `http://localhost:4000/${filePath}`; 
    }

    const newProject = new ProjectModel({
      projectName,
      supervisor,
      college: collegeObjectId,
      department,
      projectIdea,
      projectFile: req.file?.path
    });

    await newProject.save();
    const populatedProject = await ProjectModel.findById(newProject._id)
      .populate("college", "collegeName")
      .populate("department", "departmentName")
      .populate("supervisor", "supervisorName");

    res.status(201).json({message: "Project added successfully", project: populatedProject,
    });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({message: "Error adding project", error: error.message || error,
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find()
      .populate("supervisor", "supervisorName")
      .populate("college", "collegeName")
      .populate("department", "departmentName");

    res.status(200).json({ message: "Projects", projects });
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error });
  }
};
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await ProjectModel.findById(id)
      .populate("supervisor", "supervisorName")
      .populate("college", "collegeName")
      .populate("department", "departmentName");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project found", project });
  } catch (error) {
    res.status(500).json({ message: "Error fetching project", error });
  }
};

export const getProjectsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!departmentId) {
      return res.status(400).json({ message: "Department ID is required" });
    }

    const projects = await ProjectModel.find({ department: departmentId })
      .populate("supervisor", "supervisorName")
      .populate("college", "collegeName")
      .populate("department", "departmentName");

    if (!projects.length) {
      return res.status(404).json({ message: "No projects found for this department" });
    }

    res.status(200).json({ message: "Projects", projects });
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error });
  }
};

export const deleteProjects = async (req, res) => {
  try {
    const { id } = req.params;
    await ProjectModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error });
  }
};
