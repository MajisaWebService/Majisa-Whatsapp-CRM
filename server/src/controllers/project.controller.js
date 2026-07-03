import Project from "../models/Project.js";

export const getAllProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) query.status = req.query.status;

        const projects = await Project.find(query)
            .populate("customer", "name company phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Project.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: projects,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate("customer", "name company phone");
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found." });
        }
        return res.status(200).json({ success: true, data: project });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createProject = async (req, res) => {
    try {
        const project = await Project.create(req.body);
        return res.status(201).json({ success: true, data: project });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found." });
        }
        return res.status(200).json({ success: true, data: project });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found." });
        }
        return res.status(200).json({ success: true, message: "Project deleted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
