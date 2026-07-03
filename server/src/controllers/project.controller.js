import ProjectService from "../services/ProjectService.js";

export const getAllProjects = async (req, res, next) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;

        const projects = await ProjectService.getAllProjects(query);
        return res.status(200).json({
            success: true,
            data: projects
        });
    } catch (error) {
        next(error);
    }
};

export const getProjectById = async (req, res, next) => {
    try {
        const project = await ProjectService.getProjectById(req.params.id);
        return res.status(200).json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
};

export const createProject = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const project = await ProjectService.createProject(req.body, adminId, ipAddress);
        return res.status(201).json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
};

export const updateProject = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const project = await ProjectService.updateProject(req.params.id, req.body, adminId, ipAddress);
        return res.status(200).json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
};

export const deleteProject = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        await ProjectService.deleteProject(req.params.id, adminId, ipAddress);
        return res.status(200).json({ success: true, message: "Project deleted successfully." });
    } catch (error) {
        next(error);
    }
};
