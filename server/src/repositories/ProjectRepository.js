import Project from "../models/Project.js";

class ProjectRepository {
    async findById(id) {
        return Project.findById(id).populate("customer");
    }

    async create(projectData) {
        return Project.create(projectData);
    }

    async update(id, updateData) {
        return Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate("customer");
    }

    async delete(id) {
        return Project.findByIdAndDelete(id);
    }

    async findAll(query = {}) {
        return Project.find(query).populate("customer").sort({ createdAt: -1 });
    }

    async count(query) {
        return Project.countDocuments(query);
    }

    async aggregate(pipeline) {
        return Project.aggregate(pipeline);
    }
}

export default new ProjectRepository();
