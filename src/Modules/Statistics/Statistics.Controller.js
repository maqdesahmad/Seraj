import CollegeModel from "../../../DB/Model/College.Model.js";
import SuggestedprojectModel from "../../../DB/Model/Suggestedprojects.Model.js";
import ProjectModel from "../../../DB/Model/Project.Model.js";
import SupervisorModel from "../../../DB/Model/Supervisor.Model.js";

export const getStatistics = async (req, res) => {
    try {
      const [collegeCount, SuggestedprojectCount, projectCount, SupervisorCount] = await Promise.all([
        CollegeModel.countDocuments(), 
        SuggestedprojectModel.countDocuments(), 
        ProjectModel.countDocuments(),
        SupervisorModel.countDocuments(), 
      ]);

      res.status(200).json({
        message: "Success",
        data: {
          totalColleges: collegeCount,
          totalSuggestedProjects: SuggestedprojectCount,
          totalProjects: projectCount,
          totalSupervisors: SupervisorCount,
        },
      });      
    } catch (error) {
      res.status(500).json({ message: "Error fetching statistics", error });
    }
  };
  