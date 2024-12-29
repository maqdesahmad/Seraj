import CollegeModel from "../../../DB/Model/College.Model.js";
import DepartmentModel from "../../../DB/Model/DepartmentModel.js";

export const AddCollege = async (req, res) => {
  try {
    const { collegeName } = req.body;

    const existingCollege = await CollegeModel.findOne({ collegeName });
    if (existingCollege) {
      return res.status(400).json({ message: "College already exists" });
    }
    const newCollege = new CollegeModel({
      collegeName,
      departments: [],
    });
    await newCollege.save();
    res
      .status(201)
      .json({ message: "College added successfully", college: newCollege });
  } catch (error) {
    res.status(500).json({ message: "Error adding college", error });
  }
};

export const AddDepartment = async (req, res) => {
  const { departmentName, collegeId } = req.body;

  try {
    const college = await CollegeModel.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }
    const existingDepartment = await DepartmentModel.findOne({
      departmentName,
      college: collegeId,
    });

    if (existingDepartment) {
      return res
        .status(400)
        .json({ message: "Department already exists in this college" });
    }
    const newDepartment = new DepartmentModel({
      departmentName,
      college: collegeId,
    });

    await newDepartment.save();
    college.departments.push(newDepartment._id);
    await college.save();

    res.status(201).json({
      message: "Department added successfully",
      department: newDepartment,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding department", error });
  }
};

export const getColleges = async (req, res) => {
  try {
    const colleges = await CollegeModel.find().select("collegeName");

    res.status(200).json(colleges);
  } catch (error) {
    res.status(500).json({ message: "Error fetching colleges", error });
  }
};

export const getDepartmentsByCollege = async (req, res) => {
  const { collegeId } = req.params;
  try {
    const college = await CollegeModel.findById(collegeId).populate(
      "departments"
    );

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    res.status(200).json({ departments: college });
  } catch (error) {
    res.status(500).json({ message: "Error fetching departments", error });
  }
};
