import connectDb from "./DB/Connection.js"
import AuthRouter from './src/Modules/Auth/Auth.Router.js'
import NotificationsRouter from './src/Modules/AuthNotifications/AuthNotifications.Router.js'
import ProjectsRouter from './src/Modules/Projects/Project.Router.js'
import SuggestedProjectsRouter from './src/Modules/Suggestedprojects/Suggestedprojects.Router.js'
import CollegeRouter from './src/Modules/College/College.Router.js'
import StatisticsRouter from './src/Modules/Statistics/Statistics.Router.js'
import TrelloRouter from './src/Modules/Trello/Trello.Router.js'
import SupervisorRouter from './src/Modules/Supervisor/Supervisor.Router.js'

const initApp =(app, express)=>{
    connectDb()
    app.use(express.json())
    app.get("/", (req, res) =>{
        return res.status(200).json({message:"welcome"})
    })

    app.use("/uploads", express.static('uploads'))
    app.use("/auth", AuthRouter)
    app.use("/Notifications", NotificationsRouter)
    app.use("/Projects", ProjectsRouter)
    app.use("/SuggestedProjects", SuggestedProjectsRouter)
    app.use("/College", CollegeRouter)
    app.use("/Supervisor", SupervisorRouter)
    app.use("/Statistics", StatisticsRouter)
    app.use("/Trello", TrelloRouter)

    app.get("*", (req, res) =>{
        return res.status(500).json({message:"page not found"})
    })
    

}
export default initApp 

