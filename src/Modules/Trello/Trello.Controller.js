import ListModel from "../../../DB/Model/List.Model.js";
import CardModel from "../../../DB/Model/Card.Model.js";
import SuggestedprojectModel from "../../../DB/Model/Suggestedprojects.Model.js";
import BoardModel from "../../../DB/Model/Board.Model.js";
import jwt from "jsonwebtoken";

export const addCardToList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, description, Checklist } = req.body;
    const UserEmail = req.user.email; 
    
    const list = await ListModel.findById(listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const board = await BoardModel.findById(list.board);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const project = await SuggestedprojectModel.findById(board.project)
      .populate("reservation.teamMembers"); 
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isTeamMember = project.reservation.teamMembers.some(
      (member) => member.email === UserEmail 
    );

    if (!isTeamMember) {
      return res
        .status(403)
        .json({ message: "You are not authorized to add cards to this project" });
    }

    const newCard = new CardModel({
      name,
      description,
      list: listId,
      Checklist,
    });

    await newCard.save();

    res.status(201).json({ message: "Card added successfully", card: newCard });
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ message: "Error adding card", error });
  }
};

export const addCommentToCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { comment } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Seraj__")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    let decodedToken;
    try {
      const token = authHeader.split("Seraj__")[1];
      if (!token) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No valid token provided" });
      }
      decodedToken = jwt.verify(token, process.env.LOGINSINGURE);
    } catch (err) {
      return res.status(404).json({ message: "Invalid token" });
    }
    const supervisorId = decodedToken.id;

    const card = await CardModel.findById(cardId).populate({
      path: "list",
      populate: {
        path: "board",
        populate: {
          path: "project",
          populate: {
            path: "supervisor",
            select: "_id name",
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const project = card.list.board.project;

    if (!project || !project.supervisor) {
      return res
        .status(404)
        .json({ message: "Project or supervisor not found" });
    }

    if (!project.supervisor._id || !supervisorId) {
      console.log("Supervisor ID:", project.supervisor._id);
      console.log("supervisor ID:", supervisorId);
      return res
        .status(400)
        .json({ message: "Invalid supervisor or supervisor ID" });
    }

    if (!project.supervisor._id.equals(supervisorId)) {
      return res
        .status(403)
        .json({ message: "Only the supervisor can add comments" });
    }

    card.comments.push({ supervisor: supervisorId, comment });
    await card.save();

    res.status(201).json({ message: "Comment added successfully", card });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment", error });
  }
};

export const updateCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { name, description, comments, Checklist } = req.body;
    const UserEmail = req.user.email;

    const card = await CardModel.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const list = await ListModel.findById(card.list);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const board = await BoardModel.findById(list.board);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const project = await SuggestedprojectModel.findById(board.project)
    .populate("reservation.teamMembers"); 
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const isTeamMember = project.reservation.teamMembers.some(
    (member) => member.email === UserEmail 
  );

  if (!isTeamMember) {
    return res
      .status(403)
      .json({ message: "You are not authorized to add cards to this project" });
  }

    card.name = name || card.name;
    card.description = description || card.description;
    card.comments = comments || card.comments;
    card.Checklist = Checklist || card.Checklist;

    await card.save();

    res.status(200).json({ message: "Card updated successfully", card });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ message: "Error updating card", error });
  }
};

export const getAllBoardsForSupervisor = async (req, res) => {
  try {
    const supervisorId = req.user._id; 
    const projects = await SuggestedprojectModel.find({ supervisor: supervisorId });

    if (!projects || projects.length === 0) {
      return res.status(404).json({ message: "No projects found for this supervisor" });
    }

    const projectIds = projects.map((project) => project._id);
    const boards = await BoardModel.find({ project: { $in: projectIds } }).populate("project");

    if (!boards || boards.length === 0) {
      return res.status(404).json({ message: "No boards found for the supervisor's projects" });
    }

    res.status(200).json({ message: "Boards found", boards });
  } catch (error) {
    console.error("Error fetching boards for supervisor:", error);
    res.status(500).json({ message: "Error fetching boards", error });
  }
};

export const getCardById = async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email; 

    const card = await CardModel.findById(cardId).populate("list");

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const list = card.list;
    const board = await BoardModel.findById(list.board).populate("project");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const project = board.project;

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isSupervisor = project.supervisor.toString() === userId.toString();

    const isStudent = project.reservation.teamMembers.some(
      (member) => member.email === userEmail
    );

    if (!isSupervisor && !isStudent) {
      return res.status(403).json({ message: "Access denied to this board" });
    }

    res.status(200).json({ message: "Card found", card });
  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ message: "Error fetching card", error });
  }
};

export const getBoardById = async (req, res) => {
  try {
    const { boardId } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email;

    console.log(userEmail)
    const board = await BoardModel.findById(boardId).populate("project");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const project = board.project;

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const isSupervisor = project.supervisor.toString() === userId.toString();

    const isStudent = project.reservation.teamMembers.some(
      (member) => member.email === userEmail
    );
    if (!isSupervisor && !isStudent) {
      return res.status(403).json({ message: "Access denied to this board" });
    }

    res.status(200).json({ message: "Board found", board });
  } catch (error) {
    console.error("Error fetching board:", error);
    res.status(500).json({ message: "Error fetching board", error });
  }
};

export const deleteCardById = async (req, res) => {
  try {
    const { cardId } = req.params;
    const userEmail = req.user.email; 

    const card = await CardModel.findById(cardId).populate("list");

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const list = card.list;
    const board = await BoardModel.findById(list.board).populate("project");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const project = board.project;

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isStudent = project.reservation.teamMembers.some(
      (member) => member.email === userEmail
    );

    if (!isStudent) {
      return res.status(403).json({ message: "You are not authorized to delete this card" });
    }

    await CardModel.findByIdAndDelete(cardId);

    res.status(200).json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ message: "Error deleting card", error });
  }
};
